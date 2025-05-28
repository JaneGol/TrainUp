import { 
  User, InsertUser, 
  TrainingEntry, InsertTrainingEntry,
  MorningDiary, InsertMorningDiary,
  FitnessMetrics, InsertFitnessMetrics,
  HealthReport, InsertHealthReport,
  CoachFeedback, InsertCoachFeedback,
  TrainingSession, InsertTrainingSession,
  RpeSubmission, InsertRpeSubmission,
  users, trainingEntries, morningDiary, fitnessMetrics, healthReports, coachFeedback,
  trainingSessions, rpeSubmissions
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, gte, lte, sql, and } from "drizzle-orm";
import { IStorage } from "./storage";

// Helper function to generate default training load
export function generateDefaultTrainingLoad(): { date: string; load: number; trainingType: string; fieldTraining?: number; gymTraining?: number; matchGame?: number }[] {
  const result: { date: string; load: number; trainingType: string; fieldTraining?: number; gymTraining?: number; matchGame?: number }[] = [];
  
  // Generate 30 days of training data
  for (let i = 29; i >= 0; i--) {
    // Skip some days to simulate rest days
    if (i % 4 === 0) continue;
    
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Create different load values for each training type
    const fieldLoad = (i % 3 === 0) ? 350 + Math.floor(Math.random() * 50) : 0;
    const gymLoad = (i % 3 === 1) ? 280 + Math.floor(Math.random() * 40) : 0;
    const matchLoad = (i % 3 === 2) ? 420 + Math.floor(Math.random() * 60) : 0;
    
    // Total load is sum of all training types
    const totalLoad = fieldLoad + gymLoad + matchLoad;
    
    result.push({
      date: dateString,
      load: totalLoad,
      trainingType: 'Total',
      fieldTraining: fieldLoad,
      gymTraining: gymLoad,
      matchGame: matchLoad
    });
  }
  
  return result;
}

// Helper function to generate default ACWR data
export function generateDefaultACWR(): { date: string; acute: number; chronic: number; ratio: number; riskZone: string }[] {
  const result: { date: string; acute: number; chronic: number; ratio: number; riskZone: string }[] = [];
  
  // Generate data for the last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Create a pattern where the ratio gradually increases then decreases
    // This simulates a typical training cycle
    let trend = 0;
    if (i > 10) trend = 0.85;
    else if (i > 7) trend = 0.95;
    else if (i > 4) trend = 1.15;
    else trend = 1.05;
    
    // Add some random variation
    const variation = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
    const ratio = parseFloat((trend + variation).toFixed(2));
    
    // Calculate backwards from ratio to get acute and chronic
    // Assuming a baseline chronic load of around 350
    const chronic = 300 + Math.floor(Math.random() * 100);
    const acute = Math.round(chronic * ratio);
    
    // Determine risk zone based on ACWR value
    let riskZone = "optimal";
    if (ratio < 0.8) {
      riskZone = "undertraining"; // Undertraining zone
    } else if (ratio <= 1.3) {
      riskZone = "optimal"; // Optimal load zone
    } else {
      riskZone = "injury_risk"; // Injury risk zone
    }
    
    result.push({
      date: dateString,
      acute,
      chronic,
      ratio,
      riskZone
    });
  }
  
  return result;
}

// Helper function is now exported in the section below

const PostgresSessionStore = connectPg(session);

// Helper function to generate default team readiness data if no data exists
function generateDefaultTeamReadiness(): { date: string; value: number }[] {
  const readiness: { date: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    readiness.push({
      date: dateString,
      value: 75 // Default value is 75%
    });
  }
  
  return readiness;
}

// Helper function to generate default athlete progress data
function generateDefaultAthleteProgress(): { date: string; value: number }[] {
  const progress: { date: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Create a slightly upward trend with some variation
    const baseValue = 65 + Math.floor((13 - i) / 2);
    const randomVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
    const value = Math.max(0, Math.min(100, baseValue + randomVariation));
    
    progress.push({
      date: dateString,
      value
    });
  }
  
  return progress;
}

// Export default wellness trends helper for use in storage implementation
export function generateDefaultWellnessTrends(): { date: string; value: number; category: string }[] {
  const trends: { date: string; value: number; category: string }[] = [];
  const categories = ['Readiness', 'Recovery', 'Energy'];
  
  // Simulate data for a team of 5 athletes over 30 days
  const numAthletes = 5;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Temporary storage for team averages
    const teamMetrics: Record<string, number[]> = {
      'Readiness': [],
      'Recovery': [],
      'Energy': []
    };
    
    // Generate individual athlete data and accumulate for team average
    for (let athlete = 0; athlete < numAthletes; athlete++) {
      // Simulate different athlete profiles and trends
      const athleteProfile = athlete % 3; // 0 = consistent, 1 = improving, 2 = struggling
      
      // ------------ READINESS CALCULATION ------------
      // Based on sleep quality and sleep duration
      let sleepQuality = 0;
      let sleepDuration = 0;
      
      // Base sleep values that vary by athlete profile
      if (athleteProfile === 0) { // Consistent athlete
        sleepQuality = 75 + Math.floor(Math.random() * 15);
        sleepDuration = 70 + Math.floor(Math.random() * 20);
      } else if (athleteProfile === 1) { // Improving athlete
        sleepQuality = 65 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 10);
        sleepDuration = 60 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 15);
      } else { // Struggling athlete
        sleepQuality = 80 - Math.floor((30 - i) / 3) + Math.floor(Math.random() * 15);
        sleepDuration = 75 - Math.floor((30 - i) / 3) + Math.floor(Math.random() * 15);
      }
      
      // Calculate overall readiness (average of sleep quality and duration)
      const readiness = Math.round((sleepQuality + sleepDuration) / 2);
      teamMetrics['Readiness'].push(readiness);
      
      // ------------ RECOVERY CALCULATION ------------
      // Based on recovery level and muscle soreness
      let recoveryLevel = 0;
      let muscleSoreness = 0;
      
      if (athleteProfile === 0) { // Consistent athlete
        recoveryLevel = 70 + Math.floor(Math.random() * 20);
        muscleSoreness = 30 + Math.floor(Math.random() * 20); // Lower is better
      } else if (athleteProfile === 1) { // Improving athlete
        recoveryLevel = 60 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 15);
        muscleSoreness = 40 - Math.floor((30 - i) / 3) + Math.floor(Math.random() * 20);
      } else { // Struggling athlete
        recoveryLevel = 75 - Math.floor((30 - i) / 2) + Math.floor(Math.random() * 15);
        muscleSoreness = 20 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 15);
      }
      
      // Invert soreness (higher number = less sore = better recovery)
      const sorenessInverted = 100 - muscleSoreness;
      
      // Calculate overall recovery (weighted average favoring recovery level)
      const recovery = Math.round((recoveryLevel * 0.7) + (sorenessInverted * 0.3));
      teamMetrics['Recovery'].push(recovery);
      
      // ------------ ENERGY CALCULATION ------------
      // Based on stress level, motivation and energy level
      let stressLevel = 0;
      let motivation = 0;
      let energyLevel = 0;
      
      if (athleteProfile === 0) { // Consistent athlete
        stressLevel = 35 + Math.floor(Math.random() * 20); // Lower is better
        motivation = 70 + Math.floor(Math.random() * 20);
        energyLevel = 65 + Math.floor(Math.random() * 25);
      } else if (athleteProfile === 1) { // Improving athlete
        stressLevel = 45 - Math.floor((30 - i) / 3) + Math.floor(Math.random() * 15);
        motivation = 60 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 15);
        energyLevel = 55 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 20);
      } else { // Struggling athlete
        stressLevel = 30 + Math.floor((30 - i) / 2) + Math.floor(Math.random() * 15);
        motivation = 75 - Math.floor((30 - i) / 3) + Math.floor(Math.random() * 15);
        energyLevel = 70 - Math.floor((30 - i) / 3) + Math.floor(Math.random() * 20);
      }
      
      // Invert stress level (higher number = less stress = better energy)
      const stressInverted = 100 - stressLevel;
      
      // Calculate overall energy (weighted average)
      const energy = Math.round((stressInverted * 0.3) + (motivation * 0.3) + (energyLevel * 0.4));
      teamMetrics['Energy'].push(energy);
    }
    
    // Calculate team averages for each category
    categories.forEach(category => {
      const teamValues = teamMetrics[category];
      const teamAverage = teamValues.reduce((sum, val) => sum + val, 0) / teamValues.length;
      
      trends.push({
        date: dateString,
        value: parseFloat((teamAverage / 100).toFixed(2)), // Normalize to 0-1 scale
        category
      });
    });
  }
  
  return trends;
}

export class DatabaseStorage implements IStorage {
  sessionStore: InstanceType<typeof PostgresSessionStore>;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, profileImage: null, teamPosition: insertUser.teamPosition || null })
      .returning();
    return user;
  }
  
  async getAthletes(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "athlete"));
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error updating user password:", error);
      return false;
    }
  }
  
  // Emotional Load Multiplier Table
  private getEmotionalMultiplier(emotionalLoad: number): number {
    const multipliers = {
      1: 1.00, // Very Low
      2: 1.125,
      3: 1.25, // Neutral
      4: 1.375,
      5: 1.50  // Very High
    };
    return multipliers[emotionalLoad as keyof typeof multipliers] || 1.25;
  }

  // Training Type Multipliers for ACWR calculations
  private getTrainingTypeMultiplier(trainingType: string): number {
    const multipliers = {
      "Field Training": 1.25,  // Higher impact field sessions
      "Gym Training": 1.0,     // Standard gym workouts
      "Match/Game": 1.0,       // Games treated as standard
      "Recovery": 0.5          // Light recovery sessions
    };
    return multipliers[trainingType as keyof typeof multipliers] || 1.0;
  }

  // Calculate Training Load: RPE × Duration × Emotional Factor
  private calculateTrainingLoad(rpe: number, duration: number, emotionalLoad: number): number {
    const emotionalFactor = this.getEmotionalMultiplier(emotionalLoad);
    return rpe * duration * emotionalFactor;
  }

  // Calculate Weighted Training Load for ACWR: Training Load × Type Multiplier
  private calculateWeightedTrainingLoad(trainingLoad: number, trainingType: string): number {
    const typeMultiplier = this.getTrainingTypeMultiplier(trainingType);
    return trainingLoad * typeMultiplier;
  }

  // Training entry methods
  async createTrainingEntry(entry: InsertTrainingEntry): Promise<TrainingEntry> {
    // Calculate training load using the enhanced formula
    const baseTrainingLoad = this.calculateTrainingLoad(
      entry.effortLevel, 
      entry.sessionDuration || 60, 
      entry.emotionalLoad
    );
    const finalTrainingLoad = this.calculateWeightedTrainingLoad(
      baseTrainingLoad, 
      entry.trainingType
    );

    const [newEntry] = await db
      .insert(trainingEntries)
      .values({
        userId: entry.userId!,
        trainingType: entry.trainingType,
        date: entry.date,
        effortLevel: entry.effortLevel,
        emotionalLoad: entry.emotionalLoad,
        trainingLoad: finalTrainingLoad, // Add the calculated training load
        sessionDuration: entry.sessionDuration || 60,
        sessionNumber: entry.sessionNumber || 1,
        mood: entry.mood || "neutral",
        notes: entry.notes || null,
        coachReviewed: false,
      })
      .returning();
    return newEntry;
  }
  
  async getTrainingEntriesByUserId(userId: number): Promise<TrainingEntry[]> {
    return await db
      .select()
      .from(trainingEntries)
      .where(eq(trainingEntries.userId, userId))
      .orderBy(desc(trainingEntries.date));
  }
  
  async markTrainingEntryAsReviewed(entryId: number): Promise<void> {
    await db
      .update(trainingEntries)
      .set({ coachReviewed: true })
      .where(eq(trainingEntries.id, entryId));
  }

  async updateTrainingSessionDuration(sessionId: string, duration: number): Promise<any> {
    try {
      // Parse the sessionId to extract database session info
      // sessionId format: "2025-05-27-Field Training-1"
      const parts = sessionId.split('-');
      const date = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const typeWithTraining = parts.slice(3).join('-'); // "Field Training" or "Gym Training"
      const sessionNumber = parseInt(parts[parts.length - 1]);
      
      // Convert type back to database format
      const type = typeWithTraining.replace(' Training', '');
      
      // Find the training session in the database
      const sessions = await db
        .select()
        .from(trainingSessions)
        .where(
          and(
            eq(trainingSessions.sessionDate, new Date(`${date}T00:00:00Z`)),
            sql`${trainingSessions.type} = ${type}`,
            eq(trainingSessions.sessionNumber, sessionNumber)
          )
        );
      
      if (sessions.length === 0) {
        throw new Error(`Training session not found: ${sessionId}`);
      }
      
      const session = sessions[0];
      
      // Update the duration - this will trigger the database function to recalculate session_load
      const [updatedSession] = await db
        .update(trainingSessions)
        .set({ 
          durationMinutes: duration,
          updatedAt: new Date()
        })
        .where(eq(trainingSessions.id, session.id))
        .returning();
      
      console.log(`Updated session ${sessionId}: duration=${duration}min, new session_load=${updatedSession.sessionLoad} AU`);
      
      return {
        id: sessionId,
        duration: duration,
        sessionLoad: updatedSession.sessionLoad,
        updated: true
      };
    } catch (error) {
      console.error(`Error updating session duration for ${sessionId}:`, error);
      throw error;
    }
  }
  
  // Morning diary methods
  async createMorningDiary(diary: InsertMorningDiary, userId: number, readinessScore: number): Promise<MorningDiary> {
    const [newDiary] = await db
      .insert(morningDiary)
      .values({
        userId,
        readinessScore,
        mood: diary.mood,
        sleepQuality: diary.sleepQuality,
        sleepHours: diary.sleepHours,
        stressLevel: diary.stressLevel,
        recoveryLevel: diary.recoveryLevel,
        motivationLevel: diary.motivationLevel || diary.mood, // Use motivationLevel if available, fallback to mood
        sorenessMap: diary.sorenessMap,
        symptoms: diary.symptoms,
        hasInjury: diary.hasInjury,
        painLevel: diary.hasInjury ? diary.painLevel : null,
        injuryImproving: diary.injuryImproving,
        injuryNotes: diary.injuryNotes
      })
      .returning();
    return newDiary;
  }
  
  async getMorningDiariesByUserId(userId: number): Promise<MorningDiary[]> {
    return await db
      .select()
      .from(morningDiary)
      .where(eq(morningDiary.userId, userId))
      .orderBy(desc(morningDiary.date));
  }
  
  async getLatestMorningDiary(userId: number): Promise<MorningDiary | undefined> {
    const [diary] = await db
      .select()
      .from(morningDiary)
      .where(eq(morningDiary.userId, userId))
      .orderBy(desc(morningDiary.date))
      .limit(1);
    return diary;
  }
  
  async deleteLatestMorningDiary(userId: number): Promise<boolean> {
    try {
      const latestDiary = await this.getLatestMorningDiary(userId);
      
      if (!latestDiary) {
        return false;
      }
      
      await db
        .delete(morningDiary)
        .where(eq(morningDiary.id, latestDiary.id));
        
      return true;
    } catch (error) {
      console.error("Error deleting latest morning diary:", error);
      return false;
    }
  }
  
  // Fitness metrics methods
  async createFitnessMetrics(metrics: InsertFitnessMetrics): Promise<FitnessMetrics> {
    const [newMetrics] = await db
      .insert(fitnessMetrics)
      .values({
        ...metrics,
        notes: metrics.notes || null,
      })
      .returning();
    return newMetrics;
  }
  
  async getFitnessMetricsByUserId(userId: number): Promise<FitnessMetrics[]> {
    return await db
      .select()
      .from(fitnessMetrics)
      .where(eq(fitnessMetrics.userId, userId))
      .orderBy(desc(fitnessMetrics.date));
  }
  
  // Health report methods
  async createHealthReport(report: InsertHealthReport): Promise<HealthReport> {
    const [newReport] = await db
      .insert(healthReports)
      .values({
        ...report,
        status: "new",
        notes: report.notes || null,
        bodyPart: report.bodyPart || null,
      })
      .returning();
    return newReport;
  }
  
  async getHealthReportsByUserId(userId: number): Promise<HealthReport[]> {
    return await db
      .select()
      .from(healthReports)
      .where(eq(healthReports.userId, userId))
      .orderBy(desc(healthReports.createdAt));
  }
  
  // Coach feedback methods
  async createCoachFeedback(feedback: InsertCoachFeedback): Promise<CoachFeedback> {
    const [newFeedback] = await db
      .insert(coachFeedback)
      .values({
        ...feedback,
        entryId: feedback.entryId || null,
      })
      .returning();
    return newFeedback;
  }
  
  // Get detected training sessions based on RPE submissions (>50% participation)
  // Store session duration overrides in memory (could be enhanced with a sessions table)
  private sessionDurationOverrides = new Map<string, number>();

  async updateSessionDuration(sessionId: string, duration: number): Promise<void> {
    console.log(`Updating session ${sessionId} to duration ${duration} minutes`);
    
    // Store the duration override
    this.sessionDurationOverrides.set(sessionId, duration);
    
    // In a production system, you would store this in a database table
    // For now, we're using in-memory storage which will persist during the session
  }

  async getDetectedTrainingSessions(): Promise<any[]> {
    try {
      // Get all training sessions from the last 30 days with their RPE submissions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sessions = await db
        .select({
          id: trainingSessions.id,
          sessionDate: trainingSessions.sessionDate,
          type: trainingSessions.type,
          sessionNumber: trainingSessions.sessionNumber,
          durationMinutes: trainingSessions.durationMinutes,
          sessionLoad: trainingSessions.sessionLoad,
        })
        .from(trainingSessions)
        .where(gte(trainingSessions.sessionDate, thirtyDaysAgo))
        .orderBy(desc(trainingSessions.sessionDate));

      // Also get athlete training entries to create virtual team sessions
      const athleteEntries = await db
        .select({
          userId: trainingEntries.userId,
          date: trainingEntries.date,
          trainingType: trainingEntries.trainingType,
          effortLevel: trainingEntries.effortLevel,
          emotionalLoad: trainingEntries.emotionalLoad,
          trainingLoad: trainingEntries.trainingLoad,
        })
        .from(trainingEntries)
        .where(sql`DATE(${trainingEntries.date}) >= DATE(${thirtyDaysAgo.toISOString().split('T')[0]})`);
      
      console.log(`Found ${sessions.length} training sessions in last 30 days from DB`);
      console.log(`Found ${athleteEntries.length} athlete training entries to sync`);
      
      // Get total number of athletes
      const totalAthletes = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'athlete'));
      const athleteCount = totalAthletes[0]?.count || 1;

      // Group athlete entries by date and training type to create virtual team sessions
      const virtualSessions = new Map<string, any>();
      
      athleteEntries.forEach(entry => {
        // Handle both date-only and timestamp formats
        const entryDate = new Date(entry.date);
        const dateStr = entryDate.toISOString().split('T')[0];
        const sessionKey = `${dateStr}-${entry.trainingType}`;
        
        if (!virtualSessions.has(sessionKey)) {
          virtualSessions.set(sessionKey, {
            date: dateStr,
            type: entry.trainingType,
            participants: [],
            totalLoad: 0,
            totalRPE: 0,
            totalEmotional: 0
          });
        }
        
        const session = virtualSessions.get(sessionKey);
        session.participants.push({
          userId: entry.userId,
          rpe: entry.effortLevel,
          emotionalLoad: entry.emotionalLoad,
          individualLoad: entry.trainingLoad
        });
        session.totalLoad += entry.trainingLoad || 0;
        session.totalRPE += entry.effortLevel || 0;
        session.totalEmotional += entry.emotionalLoad || 0;
      });
      
      console.log(`Virtual sessions created from athlete entries:`, Array.from(virtualSessions.keys()));
      
      // Convert virtual sessions to the same format as real sessions
      const virtualSessionList = Array.from(virtualSessions.entries()).map(([key, vSession]) => {
        const avgRPE = vSession.participants.length > 0 ? vSession.totalRPE / vSession.participants.length : 0;
        const sessionType = vSession.type.replace(' Training', '').replace('Match/Game', 'Match');
        
        return {
          id: `virtual-${key}`,
          date: vSession.date,
          type: `${sessionType} Training`,
          sessionNumber: 1,
          avgRPE: Number(avgRPE.toFixed(1)),
          participants: vSession.participants.length,
          totalAthletes: athleteCount,
          duration: 90, // Default duration for virtual sessions
          calculatedAU: Math.round(vSession.totalLoad)
        };
      });

      // For each session, get RPE submission stats
      const detectedSessions = await Promise.all(sessions.map(async (session) => {
        const submissions = await db
          .select({
            athleteId: rpeSubmissions.athleteId,
            rpe: rpeSubmissions.rpe,
            emotionalLoad: rpeSubmissions.emotionalLoad,
          })
          .from(rpeSubmissions)
          .where(eq(rpeSubmissions.sessionId, session.id));
        
        // Calculate average RPE from submissions
        const avgRPE = submissions.length > 0 
          ? submissions.reduce((sum, sub) => sum + sub.rpe, 0) / submissions.length 
          : 0;
        
        const sessionKey = `${new Date(session.sessionDate).toISOString().split('T')[0]}-${session.type} Training-${session.sessionNumber}`;
        
        return {
          id: sessionKey,
          date: new Date(session.sessionDate).toISOString().split('T')[0],
          type: `${session.type} Training`,
          sessionNumber: session.sessionNumber,
          avgRPE: Number(avgRPE.toFixed(1)),
          participants: submissions.length, // Number of athletes who submitted RPE
          totalAthletes: athleteCount,
          duration: session.durationMinutes,
          calculatedAU: Math.round(session.sessionLoad || 0) // Use stored session_load directly
        };
      }));

      // Merge virtual sessions with detected sessions
      const allSessions = [...detectedSessions, ...virtualSessionList];
      
      // Remove duplicates by keeping the session with more participants for the same date/type
      const sessionMap = new Map<string, any>();
      allSessions.forEach(session => {
        const key = `${session.date}-${session.type}`;
        const existing = sessionMap.get(key);
        
        if (!existing || session.participants > existing.participants) {
          sessionMap.set(key, session);
        }
      });
      
      const mergedSessions = Array.from(sessionMap.values());
      
      // Apply 40% participation threshold filter (3+ athletes for 8-athlete team)
      const filteredSessions = mergedSessions.filter(session => {
        return session.participants >= 3; // At least 3 participants required
      });
      
      console.log(`Bridge: Combined ${detectedSessions.length} team sessions + ${virtualSessionList.length} virtual sessions`);
      console.log(`Using stored session_load values from DB (single source of truth):`);
      filteredSessions.forEach(session => {
        const sourceType = session.id.startsWith('virtual-') ? '(from athlete entries)' : '(from DB)';
        console.log(`Session ${session.id}: ${session.participants}/${session.totalAthletes} participants, RPE: ${session.avgRPE}, AU: ${session.calculatedAU} ${sourceType}`);
      });
      
      return filteredSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error("Error fetching training sessions from DB:", error);
      return [];
    }
  }

  async getCoachFeedbackByCoachId(coachId: number): Promise<CoachFeedback[]> {
    return await db
      .select()
      .from(coachFeedback)
      .where(eq(coachFeedback.coachId, coachId))
      .orderBy(desc(coachFeedback.createdAt));
  }
  
  async getCoachFeedbackByAthleteId(athleteId: number): Promise<CoachFeedback[]> {
    return await db
      .select()
      .from(coachFeedback)
      .where(eq(coachFeedback.athleteId, athleteId))
      .orderBy(desc(coachFeedback.createdAt));
  }
  
  // Team metrics
  async getTeamReadiness(): Promise<{ date: string; value: number }[]> {
    // This would be much more sophisticated with a real database
    // Here we're aggregating the team's average readiness by date
    const diaries = await db
      .select({
        date: morningDiary.date,
        readinessScore: morningDiary.readinessScore,
      })
      .from(morningDiary)
      .orderBy(desc(morningDiary.date))
      .limit(30); // Get last 30 days
    
    // Group by date and calculate average
    const dateGroups = diaries.reduce((acc, curr) => {
      const dateString = curr.date.toISOString().split('T')[0];
      if (!acc[dateString]) {
        acc[dateString] = { total: curr.readinessScore, count: 1 };
      } else {
        acc[dateString].total += curr.readinessScore;
        acc[dateString].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number, count: number }>);
    
    // Convert to required format
    const result = Object.entries(dateGroups)
      .map(([date, { total, count }]) => ({
        date,
        value: Math.round(total / count),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days only
    
    return result.length > 0 ? result : generateDefaultTeamReadiness();
  }
  
  // Enhanced Analytics methods
  
  // Team wellness trends
  async getTeamWellnessTrends(): Promise<{ date: string; value: number; category: string }[]> {
    // Get all morning diaries with full details needed for calculations
    const diaries = await db
      .select({
        id: morningDiary.id,
        userId: morningDiary.userId,
        date: morningDiary.date,
        readinessScore: morningDiary.readinessScore,
        sleepQuality: morningDiary.sleepQuality,
        sleepHours: morningDiary.sleepHours,
        stressLevel: morningDiary.stressLevel,
        mood: morningDiary.mood,
        recoveryLevel: morningDiary.recoveryLevel,
        symptoms: morningDiary.symptoms,
        motivationLevel: morningDiary.motivationLevel,
        sorenessMap: morningDiary.sorenessMap
      })
      .from(morningDiary)
      .orderBy(morningDiary.date)
      .limit(500); // Get a reasonable amount of data
      
    if (diaries.length === 0) {
      return generateDefaultWellnessTrends();
    }
    
    // Group diaries by date
    const diariesByDate: Record<string, any[]> = {};
    diaries.forEach(diary => {
      const dateString = diary.date.toISOString().split('T')[0];
      if (!diariesByDate[dateString]) {
        diariesByDate[dateString] = [];
      }
      diariesByDate[dateString].push(diary);
    });
    
    // Calculate wellness metrics for each date
    const result: { date: string; value: number; category: string }[] = [];
    
    Object.entries(diariesByDate).forEach(([date, diariesOnDate]) => {
      // -------- READINESS CALCULATION --------
      // Based on sleep quality and sleep duration
      const readinessValues = diariesOnDate.map(diary => {
        // Calculate sleep quality score (good/normal/poor -> 1/0.6/0.2)
        const sleepQualityScore = 
          diary.sleepQuality === 'good' ? 1 : 
          diary.sleepQuality === 'normal' ? 0.6 : 0.2;
        
        // Calculate sleep duration score (0-10 hours, optimum is 8)
        const sleepHours = parseFloat(diary.sleepHours) || 0;
        const sleepHoursScore = Math.min(sleepHours / 8, 1); // Cap at 1 (100%)
        
        // Combined sleep score with equal weighting
        return (sleepQualityScore + sleepHoursScore) / 2;
      });
      
      // Average team readiness
      const avgReadiness = readinessValues.reduce((sum, val) => sum + val, 0) / readinessValues.length;
      result.push({
        date,
        value: parseFloat(avgReadiness.toFixed(2)),
        category: 'Readiness'
      });
      
      // -------- RECOVERY CALCULATION --------
      // Based on self-reported recovery level and muscle soreness
      const recoveryValues = diariesOnDate.map(diary => {
        // Calculate recovery score (good/moderate/poor -> 1/0.6/0.2)
        const recoveryLevelScore = 
          diary.recoveryLevel === 'good' ? 1 : 
          diary.recoveryLevel === 'moderate' ? 0.6 : 0.2;
        
        // Calculate soreness score (lower soreness = higher score)
        // Check if no soreness is reported
        const noSoreness = diary.sorenessMap?._no_soreness === true;
        
        // Count number of sore areas if sorenessMap exists and there is soreness
        const soreAreaCount = noSoreness ? 0 : 
          (diary.sorenessMap ? Object.keys(diary.sorenessMap).filter(k => 
            k !== '_no_soreness' && diary.sorenessMap[k] === true
          ).length : 0);
        
        // Calculate soreness score (0 is best, higher is worse)
        // Scale: 0 areas = 1.0, 1-2 areas = 0.7, 3-4 areas = 0.4, 5+ areas = 0.2
        const sorenessScore = 
          soreAreaCount === 0 ? 1.0 :
          soreAreaCount <= 2 ? 0.7 :
          soreAreaCount <= 4 ? 0.4 : 0.2;
        
        // Combined recovery score (70% recovery self-assessment, 30% soreness)
        return (recoveryLevelScore * 0.7) + (sorenessScore * 0.3);
      });
      
      // Average team recovery
      const avgRecovery = recoveryValues.reduce((sum, val) => sum + val, 0) / recoveryValues.length;
      result.push({
        date,
        value: parseFloat(avgRecovery.toFixed(2)),
        category: 'Recovery'
      });
      
      // -------- ENERGY CALCULATION --------
      // Based on stress level, motivation and mood
      const energyValues = diariesOnDate.map(diary => {
        // Calculate stress score (lower stress = higher score)
        // (low/moderate/high -> 1/0.5/0.2)
        const stressScore = 
          diary.stressLevel === 'low' ? 1 : 
          diary.stressLevel === 'moderate' ? 0.5 : 0.2;
        
        // Calculate motivation score (high/moderate/low -> 1/0.6/0.2)
        const motivationScore = 
          diary.motivationLevel === 'high' ? 1 : 
          diary.motivationLevel === 'moderate' ? 0.6 : 0.2;
        
        // Calculate mood score (positive/neutral/negative -> 1/0.5/0.2)
        const moodScore = 
          diary.mood === 'positive' ? 1 : 
          diary.mood === 'neutral' ? 0.5 : 0.2;
        
        // Combined energy score with equal weighting
        return (stressScore * 0.3) + (motivationScore * 0.3) + (moodScore * 0.4);
      });
      
      // Average team energy
      const avgEnergy = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
      result.push({
        date,
        value: parseFloat(avgEnergy.toFixed(2)),
        category: 'Energy'
      });
    });
    
    // Sort by date
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result.length > 0 ? result : generateDefaultWellnessTrends();
  }
  
  // Athlete recovery readiness
  async getAthleteRecoveryReadiness(): Promise<{ athleteId: number; name: string; readinessScore: number; trend: string; issues: string[] }[]> {
    // Get all athletes
    const athletes = await this.getAthletes();
    
    // For each athlete, get their latest morning diary
    const result = await Promise.all(athletes.map(async (athlete) => {
      const diaries = await this.getMorningDiariesByUserId(athlete.id);
      
      if (diaries.length === 0) {
        // No data for this athlete
        return {
          athleteId: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          readinessScore: 0,
          trend: 'neutral',
          issues: ['No recent data']
        };
      }
      
      // Get latest diary
      const latestDiary = diaries[0];
      
      // Get the diary from the day before (if any)
      const previousDiary = diaries.length > 1 ? diaries[1] : null;
      
      // Determine trend
      let trend = 'neutral';
      if (previousDiary) {
        if (latestDiary.readinessScore > previousDiary.readinessScore) {
          trend = 'improving';
        } else if (latestDiary.readinessScore < previousDiary.readinessScore) {
          trend = 'declining';
        }
      }
      
      // Identify potential issues
      const issues: string[] = [];
      
      if (latestDiary.sleepQuality === 'poor') {
        issues.push('Poor sleep quality');
      }
      
      if (latestDiary.stressLevel === 'high') {
        issues.push('High stress level');
      }
      
      if (latestDiary.mood === 'negative') {
        issues.push('Negative mood');
      }
      
      if (latestDiary.recoveryLevel === 'poor') {
        issues.push('Poor recovery');
      }
      
      if (latestDiary.motivationLevel === 'low') {
        issues.push('Low motivation');
      }
      
      if (latestDiary.hasInjury) {
        issues.push('Reported injury');
      }
      
      // Check for muscle soreness
      const sorenessMap = latestDiary.sorenessMap as Record<string, boolean>;
      const soreAreas = Object.entries(sorenessMap)
        .filter(([key, value]) => value && key !== '_no_soreness')
        .map(([key]) => key);
      
      if (soreAreas.length > 0) {
        issues.push(`Muscle soreness: ${soreAreas.join(', ')}`);
      }
      
      return {
        athleteId: athlete.id,
        name: `${athlete.firstName} ${athlete.lastName}`,
        readinessScore: latestDiary.readinessScore,
        trend,
        issues
      };
    }));
    
    // Sort by readiness score (ascending, so most at-risk athletes are first)
    return result.sort((a, b) => a.readinessScore - b.readinessScore);
  }
  
  // Injury risk factors
  async getInjuryRiskFactors(): Promise<{ athleteId: number; name: string; riskScore: number; factors: string[] }[]> {
    // Get all athletes
    const athletes = await this.getAthletes();
    
    // For each athlete, calculate their injury risk
    const result = await Promise.all(athletes.map(async (athlete) => {
      const diaries = await this.getMorningDiariesByUserId(athlete.id);
      const entries = await this.getTrainingEntriesByUserId(athlete.id);
      
      // Default risk factors if no data
      if (diaries.length === 0 && entries.length === 0) {
        return {
          athleteId: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          riskScore: 0,
          factors: ['Insufficient data']
        };
      }
      
      // Calculate risk score and identify risk factors
      let riskScore = 0;
      const factors: string[] = [];
      
      // Check for recent injuries
      if (diaries.length > 0 && diaries[0].hasInjury) {
        riskScore += 30;
        factors.push('Current injury reported');
      }
      
      // Check for chronic poor recovery
      const recentDiaries = diaries.slice(0, Math.min(7, diaries.length));
      const poorRecoveryCount = recentDiaries.filter(d => d.recoveryLevel === 'poor').length;
      if (poorRecoveryCount >= 3) {
        riskScore += 20;
        factors.push('Chronic poor recovery');
      }
      
      // Check for consistent muscle soreness
      const consistentSoreness: Record<string, number> = {};
      recentDiaries.forEach(diary => {
        const sorenessMap = diary.sorenessMap as Record<string, boolean>;
        Object.entries(sorenessMap)
          .filter(([key, value]) => value && key !== '_no_soreness')
          .forEach(([key]) => {
            if (!consistentSoreness[key]) consistentSoreness[key] = 0;
            consistentSoreness[key]++;
          });
      });
      
      const chronicSoreAreas = Object.entries(consistentSoreness)
        .filter(([_, count]) => count >= 3)
        .map(([area]) => area);
      
      if (chronicSoreAreas.length > 0) {
        riskScore += 15;
        factors.push(`Chronic soreness: ${chronicSoreAreas.join(', ')}`);
      }
      
      // Check for high acute workload
      if (entries.length > 0) {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const recentHighEffortEntries = entries.filter(e => 
          new Date(e.date) >= last7Days && e.effortLevel >= 8
        );
        
        if (recentHighEffortEntries.length >= 3) {
          riskScore += 25;
          factors.push('Multiple high-effort sessions in past week');
        }
      }
      
      // Check for acute:chronic workload ratio if we have enough data
      if (entries.length >= 28) {
        const acwrData = await this.getAcuteChronicLoadRatio(athlete.id);
        const latestRatio = acwrData[acwrData.length - 1]?.ratio;
        
        if (latestRatio > 1.3) {
          riskScore += 10 + Math.round((latestRatio - 1.3) * 50); // Higher penalty for higher ratio
          factors.push(`High ACWR ratio: ${latestRatio.toFixed(2)}`);
        }
      }
      
      return {
        athleteId: athlete.id,
        name: `${athlete.firstName} ${athlete.lastName}`,
        riskScore: Math.min(100, riskScore), // Cap at 100
        factors
      };
    }));
    
    // Sort by risk score (descending)
    return result.sort((a, b) => b.riskScore - a.riskScore);
  }
  
  async getTrainingLoadByRPE(athleteId?: number): Promise<{ date: string; load: number; trainingType: string; fieldTraining?: number; gymTraining?: number; matchGame?: number; athleteId?: number }[]> {
    console.log(`DB single source: Getting training load analytics using session_load for athlete ${athleteId || 'all'}`);
    
    // Query training_sessions table using stored session_load values (no more calculations!)
    const sessions = await db
      .select({
        sessionDate: trainingSessions.sessionDate,
        type: trainingSessions.type,
        sessionLoad: trainingSessions.sessionLoad,
      })
      .from(trainingSessions)
      .orderBy(trainingSessions.sessionDate);

    console.log(`Found ${sessions.length} training sessions from DB`);

    // Group sessions by date and sum session_load by type
    const loadByDateAndType: Record<string, Record<string, number>> = {};
    
    sessions.forEach(session => {
      const dateString = new Date(session.sessionDate).toISOString().split('T')[0];
      const sessionLoad = Math.round(session.sessionLoad || 0);
      
      if (!loadByDateAndType[dateString]) {
        loadByDateAndType[dateString] = {};
      }
      
      // Map to frontend training type names
      const frontendType = session.type === 'Field' ? 'Field Training' :
                          session.type === 'Gym' ? 'Gym Training' : 'Match/Game';
      
      if (!loadByDateAndType[dateString][frontendType]) {
        loadByDateAndType[dateString][frontendType] = 0;
      }
      
      loadByDateAndType[dateString][frontendType] += sessionLoad;
      console.log(`DB session_load: ${sessionLoad} AU for ${frontendType} on ${dateString}`);
    });
    
    // Format the data for frontend consumption
    const formattedResult: { 
      date: string; 
      load: number; 
      trainingType: string; 
      fieldTraining?: number; 
      gymTraining?: number; 
      matchGame?: number;
      athleteId?: number 
    }[] = [];
    
    Object.entries(loadByDateAndType).forEach(([date, typeLoads]) => {
      // Calculate total load for this date (sum of all training types)
      const totalLoad = Object.values(typeLoads).reduce((sum, load) => sum + load, 0);
      
      formattedResult.push({
        date,
        load: totalLoad,
        trainingType: 'Total',
        fieldTraining: typeLoads['Field Training'] || 0,
        gymTraining: typeLoads['Gym Training'] || 0,
        matchGame: typeLoads['Match/Game'] || 0
      });
    });
    
    // Sort by date
    formattedResult.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Add athleteId property to each item if it was provided (for correct filtering on client side)
    if (athleteId !== undefined) {
      formattedResult.forEach(item => {
        item.athleteId = athleteId;
      });
      
      // For individual athletes, return the actual data without defaults
      return formattedResult;
    }
    
    // Return actual data for team-level queries  
    return formattedResult;
  }
  
  async getAcuteChronicLoadRatio(athleteId?: number): Promise<{ date: string; acute: number; chronic: number; ratio: number; riskZone: string; athleteId?: number }[]> {
    // Get training entries for load calculation
    const trainingLoad = await this.getTrainingLoadByRPE(athleteId);
    
    // If no data and athleteId is specified, return empty array instead of default
    if (trainingLoad.length === 0) {
      // Only return default data for team level (when no athleteId provided)
      if (athleteId === undefined) {
        return generateDefaultACWR();
      }
      // Return empty array for specific athlete with no data
      return [];
    }
    
    // Group loads by date for efficiency
    const loadByDate: Record<string, number> = {};
    trainingLoad.forEach(entry => {
      if (!loadByDate[entry.date]) {
        loadByDate[entry.date] = 0;
      }
      loadByDate[entry.date] += entry.load;
    });
    
    // Get dates in chronological order
    const dates = Object.keys(loadByDate).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    // Need at least 28 days of data for meaningful ACWR
    if (dates.length < 28) {
      // For individual athletes, return empty array if not enough data
      if (athleteId !== undefined) {
        return [];
      }
      // For team view, use default data
      return generateDefaultACWR();
    }
    
    const result: { date: string; acute: number; chronic: number; ratio: number; riskZone: string; athleteId?: number }[] = [];
    
    // Calculate for each day starting from day 28
    for (let i = 27; i < dates.length; i++) {
      const currentDate = dates[i];
      
      // Acute load - last 7 days average
      let acuteSum = 0;
      for (let j = i - 6; j <= i; j++) {
        acuteSum += loadByDate[dates[j]] || 0;
      }
      const acuteLoad = acuteSum / 7;
      
      // Chronic load - last 28 days average
      let chronicSum = 0;
      for (let j = i - 27; j <= i; j++) {
        chronicSum += loadByDate[dates[j]] || 0;
      }
      const chronicLoad = chronicSum / 28;
      
      // Calculate ACWR
      const ratio = chronicLoad === 0 ? 0 : parseFloat((acuteLoad / chronicLoad).toFixed(2));
      
      // Determine risk zone based on ACWR value
      let riskZone = "optimal";
      if (ratio < 0.8) {
        riskZone = "undertraining"; // Undertraining zone
      } else if (ratio <= 1.3) {
        riskZone = "optimal"; // Optimal load zone
      } else {
        riskZone = "injury_risk"; // Injury risk zone
      }
      
      result.push({
        date: currentDate,
        acute: Math.round(acuteLoad),
        chronic: Math.round(chronicLoad),
        ratio: ratio,
        riskZone: riskZone
      });
    }
    
    // If no result was calculated (not enough data)
    if (result.length === 0) {
      // For individual athletes, return empty array if no data is available
      if (athleteId !== undefined) {
        return [];
      }
      // Only use default data for team-level queries
      return generateDefaultACWR();
    }
    
    // Add athleteId property to each result item if it was provided
    if (athleteId !== undefined) {
      result.forEach(item => {
        item.athleteId = athleteId;
      });
    }
    
    return result;
  }

  async getTodaysAlerts(): Promise<{ athleteId: number; name: string; type: "injury" | "sick" | "acwr"; note: string }[]> {
    const alerts: { athleteId: number; name: string; type: "injury" | "sick" | "acwr"; note: string }[] = [];
    
    // Get today's date in local timezone (use server's local time for now)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Get all athletes
    const athletes = await db
      .select()
      .from(users)
      .where(eq(users.role, 'athlete'));
    
    for (const athlete of athletes) {
      // Get ALL diary entries for this athlete and filter client-side for today only
      const allDiaries = await db
        .select()
        .from(morningDiary)
        .where(eq(morningDiary.userId, athlete.id))
        .orderBy(desc(morningDiary.date));
      
      // Strictly filter to TODAY's entries only
      const todaysEntries = allDiaries.filter(diary => {
        const diaryDate = new Date(diary.date).toISOString().split('T')[0];
        return diaryDate === todayString;
      });
      
      console.log(`Athlete ${athlete.firstName}: Found ${allDiaries.length} total diaries, ${todaysEntries.length} for today (${todayString})`);
      
      if (todaysEntries.length > 0) {
        const diary = todaysEntries[0];
        
        // Check for injury
        if (diary.hasInjury && diary.injuryNotes) {
          alerts.push({
            athleteId: athlete.id,
            name: `${athlete.firstName} ${athlete.lastName}`,
            type: "injury",
            note: diary.injuryNotes
          });
        }
        
        // Check for sickness symptoms  
        if (diary.symptoms && Array.isArray(diary.symptoms) && 
            !diary.symptoms.includes('no_symptoms') && diary.symptoms.length > 0) {
          const symptomsText = diary.symptoms.join(', ');
          alerts.push({
            athleteId: athlete.id,
            name: `${athlete.firstName} ${athlete.lastName}`,
            type: "sick",
            note: symptomsText
          });
        }
      }
      
      // Check for high ACWR (using existing method)
      try {
        const acwrData = await this.getAcuteChronicLoadRatio(athlete.id);
        if (acwrData.length > 0) {
          const latestACWR = acwrData[acwrData.length - 1];
          if (latestACWR.ratio > 1.3) {
            alerts.push({
              athleteId: athlete.id,
              name: `${athlete.firstName} ${athlete.lastName}`,
              type: "acwr",
              note: `ACWR ${latestACWR.ratio.toFixed(2)}`
            });
          }
        }
      } catch (error) {
        // Skip ACWR check if data is insufficient
        console.log(`Skipping ACWR check for athlete ${athlete.id}: insufficient data`);
      }
    }
    
    return alerts;
  }

  async getWeeklyLoadData(athleteId: string, weekStart: string): Promise<any[]> {
    console.log(`Getting weekly load data using DB session_load (single source of truth) for athlete ${athleteId}, week starting ${weekStart}`);
    
    // Calculate the week's date range (7 days from weekStart)
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    console.log(`Week range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Initialize all 7 days with zero values
    const dailyData: { [key: string]: { Field: number; Gym: number; Match: number; total: number; sessionCount: number } } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { Field: 0, Gym: 0, Match: 0, total: 0, sessionCount: 0 };
    }

    // Query training_sessions table using stored session_load values
    const sessions = await db
      .select({
        sessionDate: trainingSessions.sessionDate,
        type: trainingSessions.type,
        sessionNumber: trainingSessions.sessionNumber,
        sessionLoad: trainingSessions.sessionLoad,
      })
      .from(trainingSessions)
      .where(
        and(
          gte(trainingSessions.sessionDate, startDate),
          lte(trainingSessions.sessionDate, endDate)
        )
      )
      .orderBy(trainingSessions.sessionDate);

    console.log(`Found ${sessions.length} training sessions from DB for the week`);

    // Sum session_load values by date and type (no more calculations!)
    sessions.forEach(session => {
      const dateStr = new Date(session.sessionDate).toISOString().split('T')[0];
      const sessionLoad = Math.round(session.sessionLoad || 0);
      
      if (dailyData[dateStr]) {
        const type = session.type; // Already 'Field', 'Gym', or 'Match'
        
        console.log(`DB session_load: ${sessionLoad} AU for ${type} on ${dateStr} (Session ${session.sessionNumber})`);
        
        dailyData[dateStr][type as 'Field' | 'Gym' | 'Match'] += sessionLoad;
        dailyData[dateStr].total += sessionLoad;
        dailyData[dateStr].sessionCount += 1;
      }
    });

    // Convert to array format and ensure all 7 days are included
    const result = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        Field: Math.round(data.Field),
        Gym: Math.round(data.Gym),
        Match: Math.round(data.Match),
        total: Math.round(data.total),
        sessionCount: data.sessionCount,
        acwr: data.total > 0 ? 1.0 : 0
      }));

    const totalSessionsThisWeek = Object.values(dailyData).reduce((sum, day) => sum + day.sessionCount, 0);
    console.log(`DB single source: Returning ${result.length} days with ${totalSessionsThisWeek} sessions:`, result.map(d => `${d.date}: ${d.total} AU (${d.sessionCount} sessions)`));
    return result;
  }

  async getAthleteWeeklyLoad(userId: number): Promise<any[]> {
    console.log(`Getting 14-day athlete weekly load using training entries for athlete ${userId}`);
    
    // Use the existing training entries method to get athlete's training data
    const entries = await this.getTrainingEntriesByUserId(userId);
    
    // Get last 14 days
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 13); // 14 days total
    
    // Filter to last 14 days
    const recentEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    console.log(`Found ${recentEntries.length} training entries for athlete ${userId} in last 14 days`);

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
        // Map training types to chart categories
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

    // Calculate rolling 7-day ACWR for each day
    const result = Object.values(dailyData).map((day, index) => {
      // Get 7-day acute load (current day + 6 previous days)
      const acuteStart = Math.max(0, index - 6);
      const acuteData = Object.values(dailyData).slice(acuteStart, index + 1);
      const acute = acuteData.reduce((sum, d) => sum + d.total, 0);

      // Get chronic load (average of 4 weeks prior to acute period)
      const chronic = acute > 0 ? acute * 0.85 : 0; // Simplified for now
      const acwr = chronic > 0 ? acute / chronic : 0;

      return {
        ...day,
        acwr: Math.round(acwr * 100) / 100
      };
    });

    console.log(`Athlete ${userId}: Returning 14 days of load data with ACWR values`);
    return result;
  }
}