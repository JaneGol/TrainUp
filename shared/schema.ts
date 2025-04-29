import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["athlete", "coach"] }).notNull(),
  profileImage: text("profile_image"),
  teamPosition: text("team_position"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  profileImage: true,
});

export const trainingEntries = pgTable("training_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  trainingType: text("training_type").notNull(),
  date: timestamp("date").notNull(),
  effortLevel: integer("effort_level").notNull(),
  mood: text("mood").notNull(),
  notes: text("notes"),
  coachReviewed: boolean("coach_reviewed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrainingEntrySchema = createInsertSchema(trainingEntries).omit({
  id: true,
  coachReviewed: true,
  createdAt: true,
});

export const morningDiary = pgTable("morning_diary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  // Step 1: Sleep & Emotional State
  sleepQuality: text("sleep_quality", { enum: ["good", "average", "poor"] }).notNull(),
  sleepHours: text("sleep_hours").notNull(),
  stressLevel: text("stress_level", { enum: ["low", "medium", "high"] }).notNull(),
  mood: text("mood", { enum: ["positive", "neutral", "negative"] }).notNull(),
  
  // Step 2: Recovery & Health
  recoveryLevel: text("recovery_level", { enum: ["good", "moderate", "poor"] }).notNull(),
  symptoms: json("symptoms").notNull(), // Array of symptoms: ["runny_nose", "sore_throat", etc] or empty array
  motivationLevel: text("motivation_level", { enum: ["high", "moderate", "low"] }).notNull(),
  
  // Step 3: Muscle Soreness & Injury
  sorenessMap: json("soreness_map").notNull(), // Object with body parts and soreness levels
  hasInjury: boolean("has_injury").notNull(),
  painLevel: integer("pain_level"), // Scale 0-10, null if hasInjury is false
  injuryImproving: text("injury_improving", { enum: ["yes", "no", "unchanged"] }),
  injuryNotes: text("injury_notes"),
  
  // General
  readinessScore: integer("readiness_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMorningDiarySchema = createInsertSchema(morningDiary).omit({
  id: true,
  date: true,
  readinessScore: true,
  createdAt: true,
});

export const fitnessMetrics = pgTable("fitness_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  metricType: text("metric_type").notNull(),
  value: integer("value").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
});

export const insertFitnessMetricsSchema = createInsertSchema(fitnessMetrics).omit({
  id: true,
});

export const healthReports = pgTable("health_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symptom: text("symptom").notNull(),
  severity: integer("severity").notNull(),
  bodyPart: text("body_part"),
  notes: text("notes"),
  status: text("status", { enum: ["new", "reviewed", "addressed"] }).default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHealthReportSchema = createInsertSchema(healthReports).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const coachFeedback = pgTable("coach_feedback", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().references(() => users.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  entryId: integer("entry_id").references(() => trainingEntries.id),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCoachFeedbackSchema = createInsertSchema(coachFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrainingEntry = z.infer<typeof insertTrainingEntrySchema>;
export type TrainingEntry = typeof trainingEntries.$inferSelect;

export type InsertMorningDiary = z.infer<typeof insertMorningDiarySchema>;
export type MorningDiary = typeof morningDiary.$inferSelect;

export type InsertFitnessMetrics = z.infer<typeof insertFitnessMetricsSchema>;
export type FitnessMetrics = typeof fitnessMetrics.$inferSelect;

export type InsertHealthReport = z.infer<typeof insertHealthReportSchema>;
export type HealthReport = typeof healthReports.$inferSelect;

export type InsertCoachFeedback = z.infer<typeof insertCoachFeedbackSchema>;
export type CoachFeedback = typeof coachFeedback.$inferSelect;
