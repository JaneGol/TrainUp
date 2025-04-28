import { 
  User, InsertUser, 
  TrainingEntry, InsertTrainingEntry,
  MorningDiary, InsertMorningDiary,
  FitnessMetrics, InsertFitnessMetrics,
  HealthReport, InsertHealthReport,
  CoachFeedback, InsertCoachFeedback,
  users, trainingEntries, morningDiary, fitnessMetrics, healthReports, coachFeedback
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

// Helper function to generate default training load
export function generateDefaultTrainingLoad(): { date: string; load: number; trainingType: string }[] {
  const result: { date: string; load: number; trainingType: string }[] = [];
  const trainingTypes = ['Strength', 'Endurance', 'Speed', 'Technical', 'Recovery'];
  
  // Generate 30 days of training data
  for (let i = 29; i >= 0; i--) {
    // Skip some days to simulate rest days
    if (i % 4 === 0) continue;
    
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Rotate through training types
    const trainingTypeIndex = (i % trainingTypes.length);
    const trainingType = trainingTypes[trainingTypeIndex];
    
    // Create a training pattern with varying loads
    // Higher loads every 3rd training session
    const baseLoad = (i % 6 === 0) ? 450 : (i % 3 === 0) ? 360 : 300;
    // Add some random variation
    const variation = Math.floor(Math.random() * 60) - 30; // -30 to +30
    
    result.push({
      date: dateString,
      load: baseLoad + variation,
      trainingType
    });
  }
  
  return result;
}

// Helper function to generate default ACWR data
export function generateDefaultACWR(): { date: string; acute: number; chronic: number; ratio: number }[] {
  const result: { date: string; acute: number; chronic: number; ratio: number }[] = [];
  
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
    
    result.push({
      date: dateString,
      acute,
      chronic,
      ratio
    });
  }
  
  return result;
}

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

// Helper function to generate default wellness trends
function generateDefaultWellnessTrends(): { date: string; value: number; category: string }[] {
  const trends: { date: string; value: number; category: string }[] = [];
  const categories = ['Sleep', 'Mood', 'Recovery'];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    categories.forEach(category => {
      // Base values for different categories
      let baseValue = category === 'Sleep' ? 75 : category === 'Mood' ? 80 : 70;
      // Add a slight trend
      baseValue += Math.floor((30 - i) / 10);
      // Add some variation
      const randomVariation = Math.floor(Math.random() * 16) - 8; // -8 to +8
      const value = Math.max(0, Math.min(100, baseValue + randomVariation));
      
      trends.push({
        date: dateString,
        value,
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
  
  // Training entry methods
  async createTrainingEntry(entry: InsertTrainingEntry): Promise<TrainingEntry> {
    const [newEntry] = await db
      .insert(trainingEntries)
      .values({
        ...entry,
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
  
  // Morning diary methods
  async createMorningDiary(diary: InsertMorningDiary, userId: number, readinessScore: number): Promise<MorningDiary> {
    const [newDiary] = await db
      .insert(morningDiary)
      .values({
        ...diary,
        userId,
        readinessScore,
        additionalNotes: diary.additionalNotes || null,
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
  
  async getTrainingLoadByRPE(athleteId?: number): Promise<{ date: string; load: number; trainingType: string }[]> {
    // Get training entries, optionally filtered by athlete
    let entries;
    
    if (athleteId) {
      entries = await db
        .select({
          trainingType: trainingEntries.trainingType,
          date: trainingEntries.date,
          effortLevel: trainingEntries.effortLevel,
          userId: trainingEntries.userId
        })
        .from(trainingEntries)
        .where(eq(trainingEntries.userId, athleteId))
        .orderBy(trainingEntries.date);
    } else {
      entries = await db
        .select({
          trainingType: trainingEntries.trainingType,
          date: trainingEntries.date,
          effortLevel: trainingEntries.effortLevel,
          userId: trainingEntries.userId
        })
        .from(trainingEntries)
        .orderBy(trainingEntries.date);
    }
    
    // Calculate load for each training session (RPE * duration)
    // For simplicity, we'll assume each session is 1 hour
    // In a real app, you would store and use actual duration
    const result = entries.map(entry => {
      const dateString = entry.date.toISOString().split('T')[0];
      // Training load = RPE (1-10) * Duration (in minutes)
      // For our example, we'll use 60 minutes as standard duration
      const trainingLoad = entry.effortLevel * 60;
      
      return {
        date: dateString,
        load: trainingLoad,
        trainingType: entry.trainingType
      };
    });
    
    // Sort by date
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result.length > 0 ? result : generateDefaultTrainingLoad();
  }
  
  async getAcuteChronicLoadRatio(athleteId?: number): Promise<{ date: string; acute: number; chronic: number; ratio: number }[]> {
    // Get training entries for load calculation
    const trainingLoad = await this.getTrainingLoadByRPE(athleteId);
    
    if (trainingLoad.length === 0) {
      return generateDefaultACWR();
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
      return generateDefaultACWR();
    }
    
    const result: { date: string; acute: number; chronic: number; ratio: number }[] = [];
    
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
      
      result.push({
        date: currentDate,
        acute: Math.round(acuteLoad),
        chronic: Math.round(chronicLoad),
        ratio: ratio
      });
    }
    
    return result.length > 0 ? result : generateDefaultACWR();
  }
}