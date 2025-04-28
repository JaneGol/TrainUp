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

const PostgresSessionStore = connectPg(session);

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
  
  async getTrainingTypeDistribution(): Promise<{ name: string; value: number }[]> {
    // Get all training entries
    const allEntries = await db
      .select({
        trainingType: trainingEntries.trainingType,
      })
      .from(trainingEntries);
    
    // Count occurrences of each training type
    const typeCounts: Record<string, number> = {};
    allEntries.forEach(entry => {
      const type = entry.trainingType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    // Convert to required format
    const result = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
    }));
    
    return result.length > 0 ? result : [
      { name: "Endurance", value: 10 },
      { name: "Strength", value: 8 },
      { name: "Speed", value: 5 },
      { name: "Flexibility", value: 3 }
    ];
  }
  
  async getAthletePerformanceComparison(): Promise<{ 
    name: string; 
    endurance: number; 
    strength: number; 
    speed: number; 
    flexibility: number 
  }[]> {
    // Get all athletes
    const athletes = await this.getAthletes();
    
    // This would typically join multiple tables and do complex aggregations
    // Here we're creating a simplified result based on available data
    
    const result = await Promise.all(
      athletes.map(async athlete => {
        // Get latest fitness metrics for this athlete
        const metrics = await this.getFitnessMetricsByUserId(athlete.id);
        
        // Return performance metrics - in a real app these would be calculated from
        // multiple sources including fitness metrics, training entries, etc.
        return {
          name: `${athlete.firstName} ${athlete.lastName}`,
          endurance: this.getMetricValue(metrics, "endurance", 70 + Math.floor(Math.random() * 20)),
          strength: this.getMetricValue(metrics, "strength", 65 + Math.floor(Math.random() * 25)),
          speed: this.getMetricValue(metrics, "speed", 60 + Math.floor(Math.random() * 30)),
          flexibility: this.getMetricValue(metrics, "flexibility", 55 + Math.floor(Math.random() * 35))
        };
      })
    );
    
    return result;
  }
  
  // Helper function to extract metric value from metrics array
  private getMetricValue(metrics: FitnessMetrics[], type: string, defaultValue: number): number {
    const metric = metrics.find(m => m.metricType.toLowerCase() === type.toLowerCase());
    return metric ? metric.value : defaultValue;
  }
  
  async getAthleteProgressOverTime(athleteId: number): Promise<{ date: string; value: number }[]> {
    // This would typically involve complex queries tracking progress over time
    // For this implementation, we'll use the morning diary readiness scores as a proxy
    
    const diaries = await this.getMorningDiariesByUserId(athleteId);
    
    // Map to required format and sort chronologically
    const progressData = diaries
      .map(diary => ({
        date: diary.date.toISOString().split('T')[0],
        value: diary.readinessScore
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
    
    return progressData.length > 0 ? progressData : generateDefaultAthleteProgress();
  }
  
  async getTeamWellnessTrends(timeframe: string): Promise<{ date: string; value: number; category: string }[]> {
    // Get all morning diaries
    let limit = 30; // Default 30 days
    if (timeframe === '7days') limit = 7;
    if (timeframe === '90days') limit = 90;
    
    const diaries = await db
      .select()
      .from(morningDiary)
      .orderBy(desc(morningDiary.date))
      .limit(limit);
    
    // Group by categories
    const sleepData: {date: string; value: number; category: string}[] = [];
    const moodData: {date: string; value: number; category: string}[] = [];
    const recoveryData: {date: string; value: number; category: string}[] = [];
    
    // Group by date first
    const dateGroups: Record<string, MorningDiary[]> = {};
    diaries.forEach(diary => {
      const dateString = diary.date.toISOString().split('T')[0];
      if (!dateGroups[dateString]) {
        dateGroups[dateString] = [];
      }
      dateGroups[dateString].push(diary);
    });
    
    // Calculate averages for each date
    Object.entries(dateGroups).forEach(([date, entries]) => {
      // Sleep quality average
      const sleepQualityMap = { good: 100, okay: 60, poor: 20 };
      const sleepAvg = entries.reduce((sum, entry) => {
        return sum + sleepQualityMap[entry.sleepQuality as keyof typeof sleepQualityMap];
      }, 0) / entries.length;
      
      // Mood average
      const moodMap = { happy: 100, neutral: 70, stressed: 40, sad: 20 };
      const moodAvg = entries.reduce((sum, entry) => {
        return sum + moodMap[entry.mood as keyof typeof moodMap];
      }, 0) / entries.length;
      
      // Recovery average
      const recoveryMap = { yes: 100, somewhat: 50, no: 0 };
      const recoveryAvg = entries.reduce((sum, entry) => {
        return sum + recoveryMap[entry.recovery as keyof typeof recoveryMap];
      }, 0) / entries.length;
      
      sleepData.push({ date, value: Math.round(sleepAvg), category: 'Sleep' });
      moodData.push({ date, value: Math.round(moodAvg), category: 'Mood' });
      recoveryData.push({ date, value: Math.round(recoveryAvg), category: 'Recovery' });
    });
    
    // Combine all categories and sort by date
    const result = [...sleepData, ...moodData, ...recoveryData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result.length > 0 ? result : generateDefaultWellnessTrends();
  }
  
  async getInjuryRiskAnalytics(): Promise<{ name: string; risk: number; factors: string[] }[]> {
    // Get all athletes
    const athletes = await this.getAthletes();
    
    // For each athlete, calculate injury risk based on:
    // 1. Health reports
    // 2. Morning diary reports (pain, recovery, etc.)
    // 3. Training loads
    
    const result = await Promise.all(
      athletes.map(async athlete => {
        // Get health reports
        const healthReports = await this.getHealthReportsByUserId(athlete.id);
        // Get morning diaries
        const diaries = await this.getMorningDiariesByUserId(athlete.id);
        // Get training entries
        const trainingEntries = await this.getTrainingEntriesByUserId(athlete.id);
        
        // Calculate risk factors
        const factors: string[] = [];
        let riskScore = 0;
        
        // Factor 1: Recent health reports
        const recentReports = healthReports.filter(r => {
          const reportDate = new Date(r.createdAt);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff < 14; // Reports in the last 2 weeks
        });
        
        if (recentReports.length > 0) {
          factors.push(`${recentReports.length} recent health issue(s)`);
          riskScore += recentReports.length * 10;
        }
        
        // Factor 2: Pain reported in morning diaries
        const recentPainReports = diaries.filter(d => {
          const diaryDate = new Date(d.date);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - diaryDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff < 7 && (d.pain === "yes" || d.pain === "slight");
        });
        
        if (recentPainReports.length > 0) {
          factors.push(`Pain reported in ${recentPainReports.length} recent diary entries`);
          riskScore += recentPainReports.length * 15;
        }
        
        // Factor 3: High training load
        const highIntensityTraining = trainingEntries.filter(t => {
          const trainingDate = new Date(t.date);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - trainingDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff < 7 && t.effortLevel > 7;
        });
        
        if (highIntensityTraining.length > 2) {
          factors.push(`${highIntensityTraining.length} high intensity training sessions in the past week`);
          riskScore += highIntensityTraining.length * 5;
        }
        
        // Factor 4: Low readiness scores
        const lowReadiness = diaries.filter(d => {
          const diaryDate = new Date(d.date);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - diaryDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff < 7 && d.readinessScore < 60;
        });
        
        if (lowReadiness.length > 0) {
          factors.push(`Low readiness scores in ${lowReadiness.length} recent diary entries`);
          riskScore += lowReadiness.length * 10;
        }
        
        // Cap risk at 100
        const risk = Math.min(100, riskScore);
        
        return {
          name: `${athlete.firstName} ${athlete.lastName}`,
          risk,
          factors: factors.length > 0 ? factors : ["No significant risk factors identified"]
        };
      })
    );
    
    return result;
  }
}

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