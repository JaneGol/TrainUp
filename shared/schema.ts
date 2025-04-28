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

export type InsertFitnessMetrics = z.infer<typeof insertFitnessMetricsSchema>;
export type FitnessMetrics = typeof fitnessMetrics.$inferSelect;

export type InsertHealthReport = z.infer<typeof insertHealthReportSchema>;
export type HealthReport = typeof healthReports.$inferSelect;

export type InsertCoachFeedback = z.infer<typeof insertCoachFeedbackSchema>;
export type CoachFeedback = typeof coachFeedback.$inferSelect;
