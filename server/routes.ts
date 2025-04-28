import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTrainingEntrySchema, insertHealthReportSchema, insertFitnessMetricsSchema, insertCoachFeedbackSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
