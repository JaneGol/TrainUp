import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  pinCode: text("pin_code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  teamId: integer("team_id").notNull().references(() => teams.id),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  profileImage: true,
  teamId: true,
}).extend({
  teamName: z.string().min(1, "Team name is required"),
  teamPin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must contain only numbers"),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const trainingEntries = pgTable("training_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  trainingType: text("training_type", { enum: ["Field Training", "Gym Training", "Match/Game"] }).notNull(),
  sessionNumber: integer("session_number").default(1),
  date: timestamp("date").notNull(),
  effortLevel: integer("effort_level").notNull(),
  emotionalLoad: integer("emotional_load").notNull(),
  trainingLoad: real("training_load").notNull(), // Calculated: RPE × Duration × Emotional Factor
  sessionDuration: integer("session_duration").default(60), // Default 60 minutes
  mood: text("mood"),
  notes: text("notes"),
  coachReviewed: boolean("coach_reviewed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create a completely custom schema for form validation (excludes calculated fields)
export const insertTrainingEntrySchema = z.object({
  userId: z.number().optional(), // Added by backend
  trainingType: z.enum(["Field Training", "Gym Training", "Match/Game"]),
  sessionNumber: z.coerce.number().min(1).max(2).default(1).optional(),
  effortLevel: z.number().min(1).max(10),
  emotionalLoad: z.number().min(1).max(5),
  sessionDuration: z.number().min(15).max(240).default(60).optional(),
  mood: z.string().default("neutral").optional(), // Make mood optional
  notes: z.string().optional(),
  date: z.string().or(z.date()).transform((val) => {
    if (val instanceof Date) return val;
    return new Date(val);
  }),
});

export const morningDiary = pgTable("morning_diary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  // Step 1: Sleep & Emotional State
  sleepQuality: text("sleep_quality", { enum: ["good", "average", "poor"] }).notNull(),
  sleepHours: real("sleep_hours").notNull(),
  stressLevel: text("stress_level", { enum: ["low", "medium", "high"] }).notNull(),
  mood: text("mood", { enum: ["positive", "neutral", "negative"] }).notNull(),
  
  // Step 2: Recovery & Health
  recoveryLevel: text("recovery_level", { enum: ["good", "moderate", "poor"] }).notNull(),
  symptoms: json("symptoms").notNull(), // Array of symptoms: ["runny_nose", "sore_throat", etc] or empty array
  motivationLevel: text("motivation_level", { enum: ["low", "high"] }).notNull(),

  
  // Step 3: Muscle Soreness & Injury
  sorenessMap: json("soreness_map").notNull(), // Object with selected muscle groups e.g., { "shoulders": true, "back": true }
  hasInjury: boolean("has_injury").notNull(),
  painLevel: integer("pain_level"), // Scale 1-5, null if hasInjury is false
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

// Training Sessions table - stores calculated session load
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  sessionDate: timestamp("session_date").notNull(),
  type: text("type", { enum: ["Field", "Gym", "Match"] }).notNull(),
  sessionNumber: integer("session_number").default(1),
  durationMinutes: integer("duration_minutes").default(60),
  sessionLoad: real("session_load").default(0), // Calculated AU value
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  sessionLoad: true, // Calculated by trigger
  createdAt: true,
  updatedAt: true,
});

// RPE submissions table - links athletes to training sessions
export const rpeSubmissions = pgTable("rpe_submissions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => trainingSessions.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  rpe: integer("rpe").notNull(),
  emotionalLoad: real("emotional_load").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRpeSubmissionSchema = createInsertSchema(rpeSubmissions).omit({
  id: true,
  createdAt: true,
});



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

export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;

export type InsertRpeSubmission = z.infer<typeof insertRpeSubmissionSchema>;
export type RpeSubmission = typeof rpeSubmissions.$inferSelect;

// Password reset schemas
export const requestResetSchema = z.object({
  email: z.string().email(),
});

export const verifyResetTokenSchema = z.object({
  token: z.string(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(100),
});

export const securityQuestionSchema = z.object({
  username: z.string(),
});

export const securityAnswerSchema = z.object({
  username: z.string(),
  answer: z.string(),
  newPassword: z.string().min(8).max(100),
});

export const setupSecurityQuestionSchema = z.object({
  userId: z.number(),
  question: z.string(),
  answer: z.string(),
});
