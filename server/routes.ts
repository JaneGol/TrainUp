import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { setupPasswordResetRoutes } from "./password-reset-routes";
import { HealthRecommendationService } from "./ai-health";
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
  
  // Initialize health recommendation service
  const healthRecommendationService = new HealthRecommendationService(storage);
  
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
      
      const validatedData = insertMorningDiarySchema.parse(dataToValidate);
      
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
        validatedData, 
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
    
    const athletes = await storage.getAthletes();
    res.json(athletes);
  });

  app.get("/api/athletes/:id/training-entries", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    const athleteId = parseInt(req.params.id);
    const entries = await storage.getTrainingEntriesByUserId(athleteId);
    res.json(entries);
  });

  app.get("/api/athletes/:id/health-reports", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    const athleteId = parseInt(req.params.id);
    const reports = await storage.getHealthReportsByUserId(athleteId);
    res.json(reports);
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
    
    const readiness = await storage.getTeamReadiness();
    res.json(readiness);
  });
  
  // Enhanced Coach Analytics Routes
  
  // Get training load by RPE
  app.get("/api/analytics/training-load", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    const athleteId = req.query.athleteId ? parseInt(req.query.athleteId as string) : undefined;
    const loadData = await storage.getTrainingLoadByRPE(athleteId);
    res.json(loadData);
  });
  
  // Get acute vs chronic load ratio
  app.get("/api/analytics/acwr", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    const athleteId = req.query.athleteId ? parseInt(req.query.athleteId as string) : undefined;
    const acwrData = await storage.getAcuteChronicLoadRatio(athleteId);
    res.json(acwrData);
  });
  
  // Get team wellness trends (for 7-day chart)
  app.get("/api/analytics/team-wellness-trends", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    try {
      // Get all morning diaries for the past 7 days
      const athletes = await storage.getAthletes();
      const athleteIds = athletes.map(athlete => athlete.id);
      
      // Get all diaries
      const allDiaries: any[] = [];
      
      for (const athleteId of athleteIds) {
        const diaries = await storage.getMorningDiariesByUserId(athleteId);
        if (diaries && diaries.length > 0) {
          allDiaries.push(...diaries);
        }
      }
      
      // Calculate daily average metrics
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      // Filter diaries from the past 7 days
      const recentDiaries = allDiaries.filter(diary => {
        const diaryDate = new Date(diary.date);
        return diaryDate >= sevenDaysAgo && diaryDate <= now;
      });
      
      // Group diaries by date
      const diariesByDate = new Map<string, any[]>();
      
      for (const diary of recentDiaries) {
        const date = new Date(diary.date).toISOString().split('T')[0];
        if (!diariesByDate.has(date)) {
          diariesByDate.set(date, []);
        }
        diariesByDate.get(date)!.push(diary);
      }
      
      // Create metrics for each day
      const wellnessTrends: { date: string; value: number; category: string }[] = [];
      
      // If we have no real data, use generated test data
      if (diariesByDate.size === 0) {
        const testData = await storage.getTeamWellnessTrends();
        res.json(testData);
        return;
      }
      
      // Process each date
      // Convert Map entries to array before iteration to fix type error
      for (const [date, diaries] of Array.from(diariesByDate.entries())) {
        // Calculate average sleep quality
        let sleepQualitySum = 0;
        for (const diary of diaries) {
          // Type guard to avoid implicit any type
          if (typeof diary === 'object' && diary && 'sleepQuality' in diary) {
            if (diary.sleepQuality === 'good') sleepQualitySum += 1;
            else if (diary.sleepQuality === 'average') sleepQualitySum += 0.5;
            // 'poor' = 0
          }
        }
        const avgSleepQuality = diaries.length > 0 ? sleepQualitySum / diaries.length : 0;
        
        // Calculate average recovery
        let recoverySum = 0;
        for (const diary of diaries) {
          if (diary.recoveryLevel === 'good') recoverySum += 1;
          else if (diary.recoveryLevel === 'moderate') recoverySum += 0.5;
          // 'poor' = 0
        }
        const avgRecovery = diaries.length > 0 ? recoverySum / diaries.length : 0;
        
        // Calculate sick/injured count
        const sickInjuredCount = diaries.filter(diary => 
          (Array.isArray(diary.symptoms) && diary.symptoms.length > 0 && diary.symptoms[0] !== 'no_symptoms') || 
          diary.hasInjury
        ).length;
        
        // Normalize sick/injured to percentage of total athletes
        const sickInjuredPercentage = athletes.length > 0 ? sickInjuredCount / athletes.length : 0;
        
        // Add to wellness trends
        wellnessTrends.push({ date, category: 'Sleep', value: avgSleepQuality });
        wellnessTrends.push({ date, category: 'Recovery', value: avgRecovery });
        wellnessTrends.push({ date, category: 'Sick/Injured', value: sickInjuredPercentage });
      }
      
      res.json(wellnessTrends);
    } catch (error) {
      console.error('Error generating team wellness trends:', error);
      
      // Fallback to sample data
      const wellnessTrends = await storage.getTeamWellnessTrends();
      res.json(wellnessTrends);
    }
  });
  
  // Get athlete recovery readiness dashboard
  app.get("/api/analytics/athlete-recovery-readiness", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    const recoveryReadiness = await storage.getAthleteRecoveryReadiness();
    res.json(recoveryReadiness);
  });
  
  // Get injury risk factors
  app.get("/api/analytics/injury-risk-factors", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "coach") {
      return res.sendStatus(401);
    }
    
    const riskFactors = await storage.getInjuryRiskFactors();
    res.json(riskFactors);
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
      const acuteLoad = acuteEntries.reduce((sum, entry) => {
        // Use average of physical and emotional load
        const avgLoad = (entry.effortLevel + entry.emotionalLoad) / 2;
        return sum + (avgLoad * defaultDuration / 60); // Convert to hours
      }, 0);
      
      // Calculate chronic load (28-day average)
      const chronicLoad = chronicEntries.length > 0 ? 
        chronicEntries.reduce((sum, entry) => {
          const avgLoad = (entry.effortLevel + entry.emotionalLoad) / 2;
          return sum + (avgLoad * defaultDuration / 60);
        }, 0) / 4 : 0; // Divide by 4 weeks
      
      // Calculate ACWR (Acute:Chronic Workload Ratio)
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
      
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

  const httpServer = createServer(app);
  return httpServer;
}
