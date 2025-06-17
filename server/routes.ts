import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { trainingSessions } from "@shared/schema";
import { and, gte, lte } from "drizzle-orm";
import { setupPasswordResetRoutes } from "./password-reset-routes";
import { setupCsvExportRoutes } from "./csv-export-routes";
import { HealthRecommendationService } from "./ai-health";
import { TrainingRecommendationService } from "./training-recommendations";
import { 
  insertTrainingEntrySchema, 
  insertHealthReportSchema, 
  insertFitnessMetricsSchema, 
  insertCoachFeedbackSchema,
  insertMorningDiarySchema 
} from "@shared/schema";
import { z } from "zod";
// Import for password hashing and comparison
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Set up password reset routes
  setupPasswordResetRoutes(app);

  // Set up CSV export routes (replacing Google Sheets)
  setupCsvExportRoutes(app);

  // Manual export trigger endpoint
  app.post("/api/export/google-sheets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { runDailySheetExport } = await import("./scheduled-exports");
      await runDailySheetExport();
      res.json({ message: "Export completed successfully" });
    } catch (error) {
      console.error("Manual export error:", error);
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Initialize health recommendation service
  const healthRecommendationService = new HealthRecommendationService(storage);

  // Initialize training recommendation service
  const trainingRecommendationService = new TrainingRecommendationService(storage);

  // AI Health Recommendations API
  app.get("/api/health-recommendations/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
      const recommendations = await healthRecommendationService.generateRecommendationsForAthlete(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating health recommendations:", error);
      res.status(500).json({ error: "Failed to generate health recommendations" });
    }
  });

  // Get health recommendations for the current user
  app.get("/api/health-recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const recommendations = await healthRecommendationService.generateRecommendationsForAthlete(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating health recommendations:", error);
      res.status(500).json({ error: "Failed to generate health recommendations" });
    }
  });

  // Training Recommendations API
  app.get("/api/training-recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const teamId = req.user!.role === "coach" ? req.user!.teamId : undefined;
      console.log(`Training recommendations requested for user ${req.user!.username} (role: ${req.user!.role}, teamId: ${teamId})`);
      
      const teamRecommendations = await trainingRecommendationService.generateTeamRecommendations(teamId);
      console.log(`Generated team recommendations:`, JSON.stringify(teamRecommendations, null, 2));
      
      res.json(teamRecommendations);
    } catch (error) {
      console.error("Error generating training recommendations:", error);
      res.status(500).json({ error: "Failed to generate training recommendations" });
    }
  });

  // Individual athlete training recommendation
  app.get("/api/training-recommendations/:athleteId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const athleteId = parseInt(req.params.athleteId);
    if (isNaN(athleteId)) {
      return res.status(400).json({ error: "Invalid athlete ID" });
    }

    try {
      const recommendation = await trainingRecommendationService.generateAthleteRecommendation(athleteId);
      if (!recommendation) {
        return res.status(404).json({ error: "Athlete not found or no data available" });
      }
      res.json(recommendation);
    } catch (error) {
      console.error("Error generating athlete recommendation:", error);
      res.status(500).json({ error: "Failed to generate athlete recommendation" });
    }
  });

  // Change password route for logged-in users
  app.post("/api/user/change-password", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify current password
    comparePasswords(currentPassword, req.user.password)
      .then(async (isMatch) => {
        if (!isMatch) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }

        try {
          // Hash the new password
          const hashedPassword = await hashPassword(newPassword);

          // Update the user's password
          req.user.password = hashedPassword;

          console.log(`Password changed for user ${req.user.id} (${req.user.username})`);

          res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
          console.error("Error changing password:", error);
          res.status(500).json({ error: "Failed to change password" });
        }
      })
      .catch((error) => {
        console.error("Error verifying password:", error);
        res.status(500).json({ error: "Failed to verify password" });
      });
  });

  // Athlete Routes
  app.post("/api/training-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log("Received training entry data:", req.body);

      // Validate the incoming data
      const validatedData = insertTrainingEntrySchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      // Calculate the average of RPE and Emotional Load
      const rpe = validatedData.effortLevel || 0;
      const emotionalLoad = validatedData.emotionalLoad || 0;

      // Create a new entry with the calculated data
      const entry = await storage.createTrainingEntry({
        ...validatedData,
        // Store the individual values but also calculate and log the average
        // The average is logged but not stored separately as it can always be derived
        effortLevel: rpe
      });

      // Calculate average for response
      const averageLoad = (rpe + emotionalLoad) / 2;

      // Return the entry with the calculated average
      res.status(201).json({
        ...entry,
        averageLoad
      });

      console.log(`Entry created with RPE: ${rpe}, Emotional Load: ${emotionalLoad}, Average: ${averageLoad}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      console.error("Server error:", error);
      res.status(500).json({ error: "Failed to create training entry" });
    }
  });

  app.get("/api/training-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const entries = await storage.getTrainingEntriesByUserId(userId);
    res.json(entries);
  });

  app.post("/api/health-reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertHealthReportSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      const report = await storage.createHealthReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create health report" });
    }
  });

  app.get("/api/health-reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const reports = await storage.getHealthReportsByUserId(userId);
    res.json(reports);
  });

  app.post("/api/fitness-metrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertFitnessMetricsSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      const metrics = await storage.createFitnessMetrics(validatedData);
      res.status(201).json(metrics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create fitness metrics" });
    }
  });

  app.get("/api/fitness-metrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const metrics = await storage.getFitnessMetricsByUserId(userId);
    res.json(metrics);
  });

  // Morning Diary Routes
  app.post("/api/morning-diary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Ensure data has the required fields with default values before validation
      const dataToValidate = {
        ...req.body,
        userId: req.user!.id,
        symptoms: Array.isArray(req.body.symptoms) && req.body.symptoms.length > 0 
          ? req.body.symptoms 
          : ["no_symptoms"],
        sorenessMap: req.body.sorenessMap && Object.keys(req.body.sorenessMap).length > 0 
          ? req.body.sorenessMap 
          : { "_no_soreness": true }
      };

      console.log("Validating morning diary data:", dataToValidate);

      // Custom validation schema to match the updated form structure
      const morningDiaryValidationSchema = z.object({
        userId: z.number(),
        sleepQuality: z.enum(["good", "average", "poor"]),
        sleepHours: z.number(),
        stressLevel: z.enum(["low", "medium", "high"]),
        mood: z.enum(["low", "high"]),
        recoveryLevel: z.enum(["good", "moderate", "poor"]),
        symptoms: z.array(z.string()),
        sorenessMap: z.any(),
        sorenessNotes: z.string().optional(),
        sorenessIntensity: z.number().optional(), // Separate field for muscle soreness intensity
        hasInjury: z.boolean(),
        painLevel: z.number().optional(), // This is for injury pain only
        injuryImproving: z.enum(["yes", "no", "unchanged"]).optional(),
        injuryNotes: z.string().optional(),
        readinessScore: z.number()
      });

      const validatedData = morningDiaryValidationSchema.parse(dataToValidate);

      // Map frontend mood values to database mood values  
      const moodMapping: Record<string, "positive" | "neutral" | "negative"> = {
        "low": "negative", 
        "high": "positive"
      };

      // Map frontend mood values to motivation_level values
      const motivationMapping: Record<string, "high" | "moderate" | "low"> = {
        "low": "low",
        "high": "high"
      };

      // Add motivationLevel for database compatibility (map from mood)
      const dataForDatabase = {
        ...validatedData,
        mood: moodMapping[validatedData.mood] || "neutral" as "positive" | "neutral" | "negative",
        motivationLevel: motivationMapping[validatedData.mood] || "moderate" as "high" | "moderate" | "low"
      };

      console.log("Data being sent to database:", dataForDatabase);

      // Use the readiness score from the frontend if provided
      let readinessScore = req.body.readinessScore;

      // If not provided, calculate readiness score based on the multi-step form values
      if (!readinessScore) {
        // Calculate readiness score based on new form values
        const calculateReadinessScore = (data: any) => {
          let score = 0;
          const maxScore = 10;

          // Step 1: Sleep & Emotional State
          // Sleep quality (max 1 point)
          if (data.sleepQuality === "good") score += 1;
          else if (data.sleepQuality === "average") score += 0.5;

          // Sleep hours (max 1 point)
          const sleepHours = parseFloat(data.sleepHours);
          if (sleepHours >= 8) score += 1;
          else if (sleepHours >= 6) score += 0.5;

          // Stress level (max 1 point)
          if (data.stressLevel === "low") score += 1;
          else if (data.stressLevel === "medium") score += 0.5;

          // Mood (max 1 point)
          if (data.mood === "positive") score += 1;
          else if (data.mood === "neutral") score += 0.5;

          // Step 2: Recovery & Health
          // Recovery level (max 1 point)
          if (data.recoveryLevel === "good") score += 1;
          else if (data.recoveryLevel === "moderate") score += 0.5;

          // Symptoms (max 1 point)
          if (data.symptoms.includes("no_symptoms")) score += 1;
          else if (data.symptoms.length <= 1) score += 0.5;

          // Motivation (max 1 point)
          if (data.motivationLevel === "high") score += 1;
          else if (data.motivationLevel === "moderate") score += 0.5;

          // Step 3: Muscle Soreness & Injury
          // Soreness (max 1 point)
          const sorenessMap = data.sorenessMap as Record<string, boolean>;
          const sorenessCount = Object.keys(sorenessMap).filter(key => key !== '_no_soreness').length;
          if (sorenessCount === 0 || sorenessMap._no_soreness) score += 1;
          else if (sorenessCount <= 3) score += 0.5;

          // Injury (max 1 point)
          if (!data.hasInjury) score += 1;

          // Injury improving (max 1 point, only if hasInjury)
          if (data.hasInjury) {
            if (data.injuryImproving === "yes") score += 0.5;
          } else {
            score += 1; // If no injury, full points
          }

          // Convert to percentage
          return Math.round((score / maxScore) * 100);
        };

        readinessScore = calculateReadinessScore(validatedData);
      }

      const diary = await storage.createMorningDiary(
        dataForDatabase, 
        req.user!.id, 
        readinessScore
      );

      res.status(201).json(diary);
    } catch (error) {
      console.error("Morning diary validation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create morning diary entry" });
    }
  });

  app.get("/api/morning-diary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const diaries = await storage.getMorningDiariesByUserId(userId);
    res.json(diaries);
  });

  app.get("/api/morning-diary/latest", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const diary = await storage.getLatestMorningDiary(userId);

    if (!diary) {
      return res.status(404).json({ error: "No morning diary entries found" });
    }

    res.json(diary);
  });

  // Get today's RPE submissions for the current athlete
  app.get("/api/rpe/today", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    try {
      const todaysSubmissions = await storage.getTodaysRpeSubmissions(userId, today);
      res.json(todaysSubmissions);
    } catch (error) {
      console.error("Error fetching today's RPE submissions:", error);
      res.status(500).json({ error: "Failed to fetch today's RPE submissions" });
    }
  });

  app.delete("/api/morning-diary/latest", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;

    try {
      const success = await storage.deleteLatestMorningDiary(userId);

      if (success) {
        return res.status(200).json({ message: "Latest diary entry deleted successfully" });
      } else {
        return res.status(404).json({ error: "No diary entry found to delete" });
      }
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      res.status(500).json({ error: "Failed to delete diary entry" });
    }
  });

  // Coach Routes - Morning Diary
  app.get("/api/athletes/:id/morning-diary", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const athleteId = parseInt(req.params.id);
    const diaries = await storage.getMorningDiariesByUserId(athleteId);
    res.json(diaries);
  });

  // Coach Routes
  app.get("/api/athletes", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    // Only return athletes from the coach's team
    const athletes = await storage.getTeamAthletes(req.user!.teamId);
    res.json(athletes);
  });

  app.get("/api/athletes/:id/training-entries", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const athleteId = parseInt(req.params.id);

    // Verify the athlete belongs to the coach's team
    const teamAthletes = await storage.getTeamAthletes(req.user!.teamId);
    const athlete = teamAthletes.find(a => a.id === athleteId);
    if (!athlete) {
      return res.sendStatus(403); // Forbidden - athlete not in coach's team
    }

    const entries = await storage.getTrainingEntriesByUserId(athleteId);
    res.json(entries);
  });

  app.get("/api/athletes/:id/health-reports", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const athleteId = parseInt(req.params.id);

    // Verify the athlete belongs to the coach's team
    const teamAthletes = await storage.getTeamAthletes(req.user!.teamId);
    const athlete = teamAthletes.find(a => a.id === athleteId);
    if (!athlete) {
      return res.sendStatus(403); // Forbidden - athlete not in coach's team
    }

    const reports = await storage.getHealthReportsByUserId(athleteId);
    res.json(reports);
  });

  // Get training sessions based on RPE submissions (automated detection)
  app.get("/api/training-sessions", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    // Disable caching to ensure fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    try {
      const { getSimpleTrainingSessions } = await import('./simple-sessions');
      const sessions: import('@shared/types/api').TrainingSessionResponse[] = await getSimpleTrainingSessions(req.user!.teamId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching training sessions:", error);
      res.status(500).json({ error: "Failed to fetch training sessions" });
    }
  });

  // Update session duration
  app.patch("/api/training-sessions/:sessionId", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const { sessionId } = req.params;
    const { duration } = req.body;

    console.log(`Updating session ${sessionId} to duration ${duration} minutes`);

    // Validate duration with proper bounds
    if (!duration || typeof duration !== 'number' || duration < 15 || duration > 240) {
      return res.status(400).json({ error: "Duration must be between 15 and 240 minutes" });
    }

    try {
      const result = await storage.updateSessionDuration(sessionId, duration);
      console.log(`Successfully updated session duration: ${JSON.stringify(result)}`);
      res.json({ success: true, session: result });
    } catch (error) {
      console.error("Error updating session duration:", error);
      res.status(500).json({ error: "Failed to update session duration" });
    }
  });

  app.get("/api/athletes/:id/fitness-metrics", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const athleteId = parseInt(req.params.id);
    const metrics = await storage.getFitnessMetricsByUserId(athleteId);
    res.json(metrics);
  });

  app.post("/api/coach-feedback", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    try {
      const validatedData = insertCoachFeedbackSchema.parse({
        ...req.body,
        coachId: req.user!.id
      });

      const feedback = await storage.createCoachFeedback(validatedData);

      // Mark the training entry as reviewed if provided
      if (validatedData.entryId) {
        await storage.markTrainingEntryAsReviewed(validatedData.entryId);
      }

      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create coach feedback" });
    }
  });

  app.get("/api/coach-feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const feedback = req.user!.role === "coach"
      ? await storage.getCoachFeedbackByCoachId(userId)
      : await storage.getCoachFeedbackByAthleteId(userId);

    res.json(feedback);
  });

  app.get("/api/team-readiness", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const readiness = await storage.getTeamReadiness(req.user!.teamId);
    res.json(readiness);
  });

  // Enhanced Coach Analytics Routes

  // Get training load by RPE - UNIFIED DATA SOURCE
  app.get("/api/analytics/training-load", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    // Aggressive cache busting
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Last-Modified', new Date().toUTCString());
    res.set('ETag', `"${Date.now()}"`);

    console.log("=== ANALYTICS TRAINING-LOAD: Using unified coach session summary ===");

    // Use the same unified data source as the Training Log
    const { getSimpleTrainingSessions } = await import("./simple-sessions");
    const sessions = await getSimpleTrainingSessions();
    console.log(`ANALYTICS: Found ${sessions.length} sessions from unified data source`);

    // Transform to match the expected format for analytics charts
    const loadData = sessions.map((session: any) => {
      const sessionDate = new Date(session.date);
      const dateStr = sessionDate.toISOString().split('T')[0];

      console.log(`ANALYTICS: ${session.id} = ${session.rpe} RPE, ${session.load} AU (${session.participantCount} athletes)`);

      return {
        date: dateStr,
        Field: session.trainingType === 'Field' ? session.load : 0,
        Gym: session.trainingType === 'Gym' ? session.load : 0,
        Match: session.trainingType === 'Match' ? session.load : 0,
        total: session.load,
        load: session.load,
        acwr: 1.0 // Default ACWR value
      };
    });

    // Group by date and sum the loads
    const groupedData: { [date: string]: any } = {};
    loadData.forEach(entry => {
      if (!groupedData[entry.date]) {
        groupedData[entry.date] = {
          date: entry.date,
          Field: 0,
          Gym: 0,
          Match: 0,
          total: 0,
          load: 0,
          acwr: 1.0
        };
      }

      groupedData[entry.date].Field += entry.Field;
      groupedData[entry.date].Gym += entry.Gym;
      groupedData[entry.date].Match += entry.Match;
      groupedData[entry.date].total += entry.total;
      groupedData[entry.date].load += entry.load;
    });

    const result = Object.values(groupedData).sort((a: any, b: any) => a.date.localeCompare(b.date));
    console.log(`ANALYTICS: Returning ${result.length} days of grouped data`);

    res.json(result);
  });

  // Get acute vs chronic load ratio
  app.get("/api/analytics/acwr", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    // Force cache refresh with proper headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Last-Modified', new Date().toUTCString());
    res.set('ETag', `"${Date.now()}"`);

    console.log("=== ACWR ANALYTICS: Using corrected calculation method ===");

    // Parse athleteId from query parameter
    let athleteId: number | undefined = undefined;
    if (req.query.athleteId && typeof req.query.athleteId === 'string') {
      const parsedId = parseInt(req.query.athleteId);
      if (!isNaN(parsedId)) {
        athleteId = parsedId;
      }
    }

    // For individual athletes, return predictable sample data
    if (athleteId) {
      // Generate sample ACWR data for this athlete
      const sampleData = [];

      // Generate last 14 days of ACWR data
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Create a pattern where the ratio gradually changes
        let trend = 0;
        if (i > 10) trend = 0.85;
        else if (i > 7) trend = 0.95;
        else if (i > 4) trend = 1.15;
        else trend = 1.05;

        // Add some variation based on athlete ID
        const variation = ((athleteId % 5) * 0.05) + ((Math.random() * 0.2) - 0.1);
        const ratio = parseFloat((trend + variation).toFixed(2));

        // Calculate acute and chronic
        const chronic = 300 + Math.floor(Math.random() * 100);
        const acute = Math.round(chronic * ratio);

        // Determine risk zone
        let riskZone = "optimal";
        if (ratio < 0.8) {
          riskZone = "undertraining";
        } else if (ratio <= 1.3) {
          riskZone = "optimal";
        } else {
          riskZone = "injury_risk";
        }

        sampleData.push({
          date: dateString,
          acute,
          chronic,
          ratio,
          riskZone,
          athleteId
        });
      }

      return res.json(sampleData);
    }

    // For team-level view, calculate fresh ACWR using corrected formula
    try {
      // Get authentic training session data for ACWR calculation
      const { getSimpleTrainingSessions } = await import("./simple-sessions");
      const sessions = await getSimpleTrainingSessions();
      console.log(`ACWR ANALYTICS: Found ${sessions.length} authentic sessions for calculation`);

      // Group sessions by date and sum daily loads
      const dailyLoads: { [date: string]: number } = {};
      sessions.forEach(session => {
        const dateStr = session.date;
        dailyLoads[dateStr] = (dailyLoads[dateStr] || 0) + session.load;
      });

      // Get sorted dates for the last 42 days (need 6 weeks for ACWR calculation)
      const sortedDates = Object.keys(dailyLoads).sort();
      const result = [];

      // Calculate ACWR for last 14 days using corrected formula
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Calculate 7-day acute load (sum of last 7 days ÷ 7)
        let acuteSum = 0;
        for (let j = 0; j < 7; j++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(currentDate.getDate() - j);
          const checkDateStr = checkDate.toISOString().split('T')[0];
          acuteSum += dailyLoads[checkDateStr] || 0;
        }
        const acuteAvg = acuteSum / 7;

        // Calculate 28-day chronic load (sum of last 28 days ÷ 28)
        let chronicSum = 0;
        for (let j = 0; j < 28; j++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(currentDate.getDate() - i);
          const checkDateStr = checkDate.toISOString().split('T')[0];
          chronicSum += dailyLoads[checkDateStr] || 0;
        }
        const chronicAvg = chronicSum / 28;

        // Calculate ACWR (7-day average ÷ 28-day average)
        const ratio = chronicAvg > 0 ? parseFloat((acuteAvg / chronicAvg).toFixed(2)) : 0;

        console.log(`CORRECTED ACWR for ${dateStr}: acute=${acuteSum} (avg: ${acuteAvg.toFixed(1)}), chronic=${chronicAvg.toFixed(1)}, ratio=${ratio}`);

        result.push({
          date: dateStr,
          acute: Math.round(acuteSum),
          chronic: Math.round(chronicSum),
          ratio: ratio
        });
      }

      console.log(`ACWR ANALYTICS: Returning ${result.length} days with corrected ACWR calculations`);
      res.json(result);

    } catch (error) {
      console.error("Error calculating fresh ACWR data:", error);
      // Fallback to storage data if calculation fails
      const acwrData = await storage.getAcuteChronicLoadRatio();
      res.json(acwrData);
    }
  });

  // Get ACWR status with proper zone classification
  app.get("/api/analytics/acwr-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const athleteId = req.query.athleteId ? parseInt(req.query.athleteId as string) : undefined;
    
    try {
      const { computeACWR, classifyACWR, getACWRZones } = await import("./acwr-utils");
      const { getSimpleTrainingSessions } = await import("./simple-sessions");
      
      // Helper function to get ISO week number
      const getWeekNumber = (date: Date): number => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      };
      
      // Get last 10 weeks of training data
      const sessions = await getSimpleTrainingSessions();
      
      // Group sessions by week and calculate weekly totals
      const weeklyLoads: { week: string; load: number }[] = [];
      const weeklyData: { [week: string]: number } = {};
      
      sessions.forEach(session => {
        const sessionDate = new Date(session.date);
        const year = sessionDate.getFullYear();
        const week = getWeekNumber(sessionDate);
        const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
        
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + session.load;
      });
      
      // Convert to array and sort by most recent first
      Object.entries(weeklyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 10)
        .forEach(([week, load]) => {
          weeklyLoads.push({ week, load });
        });
      
      // Calculate ACWR and classify
      const acwr = computeACWR(weeklyLoads);
      const classification = classifyACWR(acwr);
      const zones = getACWRZones();
      
      res.json({
        ...classification,
        zones,
        weeklyLoads: weeklyLoads.slice(0, 4) // Return recent 4 weeks for context
      });
      
    } catch (error) {
      console.error("Error calculating ACWR status:", error);
      res.status(500).json({ error: "Failed to calculate ACWR status" });
    }
  });

  // Get weekly training load (last 10 weeks)
  app.get("/api/analytics/weekly-load", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    try {
      console.log("=== WEEKLY LOAD: Using unified session_metrics_from_entries view ===");

      // Use the same unified data source as other endpoints for consistency
      const { getSimpleTrainingSessions } = await import("./simple-sessions");
      const allSessions = await getSimpleTrainingSessions();
      console.log(`WEEKLY LOAD: Found ${allSessions.length} sessions from unified data source`);

      // Get all sessions from last 10 weeks (70 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 70);

      // Filter and convert sessions to entries for weekly grouping
      const entries: any[] = [];
      allSessions.forEach((session: any) => {
        const sessionDate = new Date(session.date);
        if (sessionDate >= startDate && sessionDate <= endDate) {
          entries.push({
            date: session.date,
            type: session.trainingType, // 'Field', 'Gym', or 'Match'
            load: Math.round(session.load || 0)
          });
        }
      });

      console.log(`WEEKLY LOAD: Processed ${entries.length} sessions for weekly grouping`);

      // Helper function to get ISO week number
      const getISOWeek = (date: Date): number => {
        const tempDate = new Date(date.valueOf());
        const dayNum = (date.getDay() + 6) % 7;
        tempDate.setDate(tempDate.getDate() - dayNum + 3);
        const firstThursday = tempDate.valueOf();
        tempDate.setMonth(0, 1);
        if (tempDate.getDay() !== 4) {
          tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000);
      };

      // Group by ISO week and calculate weekly totals
      const weeklyData = new Map<string, {
        week: string;
        field: number;
        gym: number;
        match: number;
        total: number;
      }>();

      entries.forEach((entry: any) => {
        const date = new Date(entry.date);
        const year = date.getFullYear();
        const week = getISOWeek(date);
        const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            week: weekKey,
            field: 0,
            gym: 0,
            match: 0,
            total: 0
          });
        }

        const weekData = weeklyData.get(weekKey)!;
        const load = entry.load || 0;

        // Use actual session_load from database (already calculated)
        if (entry.type === 'Field' || entry.type === 'Field Training') {
          weekData.field += load;
        } else if (entry.type === 'Gym' || entry.type === 'Gym Training') {
          weekData.gym += load;
        } else if (entry.type === 'Match' || entry.type === 'Match/Game') {
          weekData.match += load;
        }

        weekData.total += load;
      });

      // Convert to array and sort by week
      const weeks = Array.from(weeklyData.values())
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-10); // Last 10 weeks

      // Ensure we always have exactly 10 weeks (pad missing weeks with zeros)
      const paddedWeeks: any[] = [];
      const today = new Date();

      for (let i = 9; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - (i * 7));
        const year = targetDate.getFullYear();
        const weekNum = getISOWeek(targetDate);
        const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;

        const existingWeek = weeks.find(w => w.week === weekKey);
        if (existingWeek) {
          paddedWeeks.push(existingWeek);
        } else {
          paddedWeeks.push({
            week: weekKey,
            field: 0,
            gym: 0,
            match: 0,
            total: 0
          });
        }
      }

      // Calculate ACWR for each week
      const result = paddedWeeks.map((week, index) => {
        // Only calculate ACWR if we have at least 4 weeks of data (index >= 3)
        let chronic = 0;
        let acwr = null;
        
        if (index >= 3) {
          // Calculate chronic load (average of previous 4 weeks)
          const startIndex = Math.max(0, index - 3);
          const chronicWeeks = paddedWeeks.slice(startIndex, index + 1);
          chronic = chronicWeeks.length > 0 
            ? chronicWeeks.reduce((sum, w) => sum + w.total, 0) / chronicWeeks.length 
            : 0;

          const acute = week.total;
          acwr = chronic > 0 ? acute / chronic : null;
        }

        // Create week label (W21)
        const weekNumber = week.week.split('-W')[1];

        return {
          ...week,
          weekLabel: `W${weekNumber}`,
          chronic: chronic > 0 ? Math.round(chronic * 100) / 100 : 0,
          acwr: acwr !== null ? Math.round(acwr * 100) / 100 : null
        };
      });

      res.json(result);
    } catch (error) {
      console.error('Weekly load analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch weekly load data' });
    }
  });

  // Get team wellness trends (for 7-day chart)
  app.get("/api/analytics/team-wellness-trends", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    try {
      // Get wellness trends filtered by coach's team
      const wellnessTrends = await storage.getTeamWellnessTrends(req.user!.teamId);
      res.json(wellnessTrends);
    } catch (error) {
      console.error('Error generating team wellness trends:', error);
      res.status(500).json({ error: 'Failed to generate team wellness trends' });
    }
  });

  // Get athlete recovery readiness dashboard
  app.get("/api/analytics/athlete-recovery-readiness", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const recoveryReadiness = await storage.getAthleteRecoveryReadiness(req.user!.teamId);
    res.json(recoveryReadiness);
  });

  // Get injury risk factors
  app.get("/api/analytics/injury-risk-factors", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    const riskFactors = await storage.getInjuryRiskFactors(req.user!.teamId);
    res.json(riskFactors);
  });

  // Get today's alerts for coaches
  app.get("/api/alerts/today", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    try {
      // Add cache-busting headers to force recalculation with new date filtering
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const alerts = await storage.getTodaysAlerts(req.user!.teamId);
      console.log(`Alerts API: Found ${alerts.length} alerts for today`);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching today's alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Get weekly load data for Load Insights page
  app.get("/api/load/week", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    try {
      const { ath, weekStart } = req.query;

      if (!weekStart) {
        return res.status(400).json({ error: "weekStart parameter required" });
      }

      console.log(`Getting coach weekly load data for week ${weekStart}`);

      // Get training entries for athletes in the coach's team only
      const teamAthletes = await storage.getTeamAthletes(req.user!.teamId);
      let allEntries: any[] = [];

      for (const athlete of teamAthletes) {
        const athleteEntries = await storage.getTrainingEntriesByUserId(athlete.id);
        allEntries.push(...athleteEntries);
      }

      // Calculate week date range
      const startDate = new Date(weekStart as string);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      // Filter entries for this week
      const weekEntries = allEntries.filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });

      console.log(`Found ${weekEntries.length} training entries for week ${weekStart}`);

      // Initialize 7 days with zero values
      const dailyData: { [key: string]: { date: string; Field: number; Gym: number; Match: number; total: number; sessionCount: number; acwr: number } } = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { 
          date: dateStr, 
          Field: 0, 
          Gym: 0, 
          Match: 0, 
          total: 0,
          sessionCount: 0,
          acwr: 0
        };
      }

      console.log("=== WEEKLY LOAD: Using unified coach session summary ===");

      // Use the same unified data source as the Training Log
      const { getSimpleTrainingSessions } = await import("./simple-sessions");
      const allSessions = await getSimpleTrainingSessions();
      console.log(`WEEKLY LOAD: Found ${allSessions.length} sessions from unified data source`);

      // Filter sessions for this week and aggregate by date and type
      allSessions.forEach((session: any) => {
        const sessionDate = new Date(session.date);
        const dateStr = sessionDate.toISOString().split('T')[0];

        // Check if this session falls within the week range
        if (sessionDate >= startDate && sessionDate <= endDate && dailyData[dateStr]) {
          const sessionLoad = Math.round(session.load || 0);
          const rawTrainingType = session.trainingType; // e.g., "Field Training", "Gym Training"
          
          // Map training types to chart categories
          let sessionType = 'Field'; // default
          if (rawTrainingType.includes('Gym')) {
            sessionType = 'Gym';
          } else if (rawTrainingType.includes('Match') || rawTrainingType.includes('Game')) {
            sessionType = 'Match';
          } else if (rawTrainingType.includes('Field')) {
            sessionType = 'Field';
          }

          console.log(`WEEKLY LOAD: Adding ${sessionLoad} AU for ${sessionType} Training on ${dateStr}`);

          dailyData[dateStr][sessionType as 'Field' | 'Gym' | 'Match'] += sessionLoad;
          dailyData[dateStr].total += sessionLoad;
          dailyData[dateStr].sessionCount += 1;
        }
      });

      const result = Object.values(dailyData);
      console.log(`Returning ${result.length} days of coach weekly load data`);
      res.json(result);
    } catch (error) {
      console.error("Error fetching weekly load data:", error);
      res.status(500).json({ error: "Failed to fetch weekly load data" });
    }
  });

  // Get athlete 14-day weekly load data for Fitness Progress redesign
  app.get("/api/athlete/weekly-load", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      console.log(`Getting 14-day load data for athlete ${userId}`);

      // Get athlete's training entries directly using existing working method
      const entries = await storage.getTrainingEntriesByUserId(userId);

      // Filter to last 14 days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 13);

      const recentEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });

      console.log(`Found ${recentEntries.length} entries for athlete in last 14 days`);
      console.log('Recent entries:', recentEntries.map(e => `${e.id}: ${e.trainingType} - ${e.trainingLoad} AU on ${e.date.toISOString().split('T')[0]}`));

      // Initialize 14 days with zero values
      const dailyData: { [key: string]: { date: string; Field: number; Gym: number; Match: number; total: number; acwr: number } } = {};
      for (let i = 0; i < 14; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { 
          date: dateStr, 
          Field: 0, 
          Gym: 0, 
          Match: 0, 
          total: 0, 
          acwr: 0 
        };
      }

      // Sum training loads by date and type
      recentEntries.forEach(entry => {
        const dateStr = new Date(entry.date).toISOString().split('T')[0];
        const load = Math.round(entry.trainingLoad || 0);

        if (dailyData[dateStr]) {
          if (entry.trainingType === 'Field Training') {
            dailyData[dateStr].Field += load;
          } else if (entry.trainingType === 'Gym Training') {
            dailyData[dateStr].Gym += load;
          } else if (entry.trainingType === 'Match/Game') {
            dailyData[dateStr].Match += load;
          }
          dailyData[dateStr].total += load;
        }
      });

      // Get all training entries for proper ACWR calculation (need 28+ days)
      const allEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const cutoffDate = new Date(endDate);
        cutoffDate.setDate(endDate.getDate() - 42); // Get 6 weeks for proper calculation
        return entryDate >= cutoffDate && entryDate <= endDate;
      });

      // Build historical daily totals for ACWR calculation
      const historicalData: { [key: string]: number } = {};
      allEntries.forEach(entry => {
        const dateStr = new Date(entry.date).toISOString().split('T')[0];
        const load = entry.trainingLoad || 0;
        historicalData[dateStr] = (historicalData[dateStr] || 0) + load;
        console.log(`Historical entry: ${dateStr} = ${load} AU (total now: ${historicalData[dateStr]})`);
      });

      // Calculate ACWR for each day with proper rolling windows
      const result = Object.values(dailyData).map((day) => {
        const currentDate = new Date(day.date);

        // Calculate 7-day acute load (sum of last 7 days including current)
        let acuteSum = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(currentDate.getDate() - i);
          const checkDateStr = checkDate.toISOString().split('T')[0];
          acuteSum += historicalData[checkDateStr] || 0;
        }

        // Calculate 28-day chronic load (average of 4 weeks)
        let chronicSum = 0;
        for (let i = 0; i < 28; i++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(currentDate.getDate() - i);
          const checkDateStr = checkDate.toISOString().split('T')[0];
          chronicSum += historicalData[checkDateStr] || 0;
        }
        const chronicAvg = chronicSum / 28;

        // Calculate ACWR ratio - compare averages, not sum vs average
        const acuteAvg = acuteSum / 7; // Average daily load for 7 days
        let acwr = null;
        if (chronicAvg > 0) {
          acwr = parseFloat((acuteAvg / chronicAvg).toFixed(2));
        }

        console.log(`ACWR for ${day.date}: acute=${acuteSum.toFixed(1)} (avg: ${acuteAvg.toFixed(1)}), chronic=${chronicAvg.toFixed(1)}, ratio=${acwr}`);

        return {
          ...day,
          acwr: acwr
        };
      });

      console.log(`Returning ${result.length} days of data for athlete ${userId}`);
      res.json(result);
    } catch (error) {
      console.error("Error fetching athlete weekly load:", error);
      res.status(500).json({ error: "Failed to fetch weekly load data" });
    }
  });

  // Get athlete fitness progress metrics
  app.get("/api/athlete/fitness-progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const entries = await storage.getTrainingEntriesByUserId(userId);

      // Calculate current date and dates for lookback periods
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);

      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(now.getDate() - 28);

      // Filter entries for different time periods
      const acuteEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= oneWeekAgo;
      });

      const chronicEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= fourWeeksAgo;
      });

      // Calculate daily loads (RPE * session duration, estimated at 70 min default)
      const defaultDuration = 70; // minutes

      // Calculate acute load (7-day sum)
      const acuteSum = acuteEntries.reduce((sum, entry) => {
        // Use average of physical and emotional load
        const avgLoad = (entry.effortLevel + entry.emotionalLoad) / 2;
        return sum + (avgLoad * defaultDuration / 60); // Convert to hours
      }, 0);

      // Calculate chronic load (28-day sum)
      const chronicSum = chronicEntries.length > 0 ? 
        chronicEntries.reduce((sum, entry) => {
          const avgLoad = (entry.effortLevel + entry.emotionalLoad) / 2;
          return sum + (avgLoad * defaultDuration / 60);
        }, 0) : 0;

      // Calculate ACWR (7-day average vs 28-day average)
      const acuteLoad = acuteSum / 7; // Average per day over 7 days
      const chronicLoad = chronicSum / 28; // Average per day over 28 days
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

      console.log(`FITNESS PROGRESS ACWR for user ${userId}:`);
      console.log(`  Acute entries: ${acuteEntries.length}, Chronic entries: ${chronicEntries.length}`);
      console.log(`  Acute sum: ${acuteSum.toFixed(1)}, Acute avg: ${acuteLoad.toFixed(1)}`);
      console.log(`  Chronic sum: ${chronicSum.toFixed(1)}, Chronic avg: ${chronicLoad.toFixed(1)}`);
      console.log(`  ACWR: ${acwr.toFixed(2)}`);

      // Calculate average weekly physical and emotional RPE
      const avgPhysicalRPE = acuteEntries.length > 0 ? 
        acuteEntries.reduce((sum, entry) => sum + entry.effortLevel, 0) / acuteEntries.length : 
        0;

      const avgEmotionalRPE = acuteEntries.length > 0 ? 
        acuteEntries.reduce((sum, entry) => sum + entry.emotionalLoad, 0) / acuteEntries.length : 
        0;

      // Format all chronic/acute entries for the chart
      const loadTrendData = chronicEntries.map(entry => {
        const entryDate = new Date(entry.date);
        const dateStr = entryDate.toISOString().split('T')[0];

        // Calculate the load for this entry
        const avgLoad = (entry.effortLevel + entry.emotionalLoad) / 2;
        const load = avgLoad * defaultDuration / 60;

        return {
          date: dateStr,
          physicalRPE: entry.effortLevel,
          emotionalRPE: entry.emotionalLoad,
          load,
          trainingType: entry.trainingType,
          notes: entry.notes || '',
        };
      });

      // Determine risk level based on ACWR
      let riskLevel = "medium";
      let riskMessage = "You are in a moderate load range.";

      if (acwr < 0.8) {
        riskLevel = "low";
        riskMessage = "Your training load is lower than optimal. Consider gradually increasing intensity.";
      } else if (acwr >= 0.8 && acwr <= 1.3) {
        riskLevel = "optimal";
        riskMessage = "You are in the optimal training load range. Keep up the good work!";
      } else if (acwr > 1.3) {
        riskLevel = "high";
        riskMessage = "Your acute load is significantly higher than your chronic load. This increases injury risk. Consider reducing intensity temporarily.";
      }

      // Response object with all metrics
      res.json({
        summary: {
          acuteLoad: parseFloat(acuteLoad.toFixed(1)),
          chronicLoad: parseFloat(chronicLoad.toFixed(1)),
          acwr: parseFloat(acwr.toFixed(2)),
          avgPhysicalRPE: parseFloat(avgPhysicalRPE.toFixed(1)),
          avgEmotionalRPE: parseFloat(avgEmotionalRPE.toFixed(1)),
          riskLevel,
          riskMessage
        },
        trendData: loadTrendData,
        recentEntries: acuteEntries.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 5)
      });

    } catch (error) {
      console.error("Error retrieving fitness metrics:", error);
      res.status(500).json({ error: "Failed to calculate fitness metrics" });
    }
  });

  // Update training session duration
  app.patch("/api/training-sessions/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }

    try {
      const sessionId = req.params.id;
      const { duration_minutes } = req.body;

      if (!duration_minutes || duration_minutes < 10) {
        return res.status(400).json({ error: "Duration must be at least 10 minutes" });
      }

      const updatedSession = await storage.updateTrainingSessionDuration(sessionId, duration_minutes);

      if (!updatedSession) {
        return res.status(404).json({ error: "Training session not found" });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating training session duration:", error);
      res.status(500).json({ error: "Failed to update training session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}