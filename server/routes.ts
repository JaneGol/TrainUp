import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertTrainingEntrySchema, 
  insertHealthReportSchema, 
  insertFitnessMetricsSchema, 
  insertCoachFeedbackSchema,
  insertMorningDiarySchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Athlete Routes
  app.post("/api/training-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertTrainingEntrySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const entry = await storage.createTrainingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
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
      const validatedData = insertMorningDiarySchema.parse(req.body);
      
      // Calculate readiness score based on form values
      // This function should match the logic in the frontend component
      const calculateReadinessScore = (data: any) => {
        let score = 0;
        const maxScore = 10;
        
        // Sleep quality
        if (data.sleepQuality === "good") score += 1;
        else if (data.sleepQuality === "okay") score += 0.5;
        
        // Restedness
        if (data.restedness === "very") score += 1;
        else if (data.restedness === "somewhat") score += 0.5;
        
        // Mood
        if (data.mood === "happy") score += 1;
        else if (data.mood === "neutral") score += 0.75;
        
        // Motivation
        if (data.motivation === "yes") score += 1;
        else if (data.motivation === "somewhat") score += 0.5;
        
        // Body feeling
        if (data.bodyFeeling === "fresh") score += 1;
        else if (data.bodyFeeling === "a little sore") score += 0.5;
        
        // Pain/injury
        if (data.pain === "no") score += 1;
        else if (data.pain === "slight") score += 0.5;
        
        // Stress level
        if (data.stressLevel === "low") score += 1;
        else if (data.stressLevel === "medium") score += 0.5;
        
        // Recovery
        if (data.recovery === "yes") score += 1;
        else if (data.recovery === "somewhat") score += 0.5;
        
        // Focus
        if (data.focus === "yes") score += 1;
        else if (data.focus === "not fully") score += 0.5;
        
        // Readiness
        if (data.readiness === "yes") score += 1;
        else if (data.readiness === "almost") score += 0.5;
        
        // Convert to percentage
        return Math.round((score / maxScore) * 100);
      };
      
      const readinessScore = calculateReadinessScore(validatedData);
      
      const diary = await storage.createMorningDiary(
        validatedData, 
        req.user!.id, 
        readinessScore
      );
      
      res.status(201).json(diary);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
