import { 
  User, InsertUser, 
  TrainingEntry, InsertTrainingEntry,
  MorningDiary, InsertMorningDiary,
  FitnessMetrics, InsertFitnessMetrics,
  HealthReport, InsertHealthReport,
  CoachFeedback, InsertCoachFeedback
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
// Use a more generic session store type to accommodate different implementations
type SessionStoreType = session.Store;

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAthletes(): Promise<User[]>;
  
  // Training entry methods
  createTrainingEntry(entry: InsertTrainingEntry): Promise<TrainingEntry>;
  getTrainingEntriesByUserId(userId: number): Promise<TrainingEntry[]>;
  markTrainingEntryAsReviewed(entryId: number): Promise<void>;
  
  // Morning diary methods
  createMorningDiary(diary: InsertMorningDiary, userId: number, readinessScore: number): Promise<MorningDiary>;
  getMorningDiariesByUserId(userId: number): Promise<MorningDiary[]>;
  getLatestMorningDiary(userId: number): Promise<MorningDiary | undefined>;
  
  // Fitness metrics methods
  createFitnessMetrics(metrics: InsertFitnessMetrics): Promise<FitnessMetrics>;
  getFitnessMetricsByUserId(userId: number): Promise<FitnessMetrics[]>;
  
  // Health report methods
  createHealthReport(report: InsertHealthReport): Promise<HealthReport>;
  getHealthReportsByUserId(userId: number): Promise<HealthReport[]>;
  
  // Coach feedback methods
  createCoachFeedback(feedback: InsertCoachFeedback): Promise<CoachFeedback>;
  getCoachFeedbackByCoachId(coachId: number): Promise<CoachFeedback[]>;
  getCoachFeedbackByAthleteId(athleteId: number): Promise<CoachFeedback[]>;
  
  // Team metrics
  getTeamReadiness(): Promise<{ date: string; value: number }[]>;
  
  // Enhanced Analytics methods
  getTrainingLoadByRPE(athleteId?: number): Promise<{ date: string; load: number; trainingType: string }[]>;
  getAcuteChronicLoadRatio(athleteId?: number): Promise<{ date: string; acute: number; chronic: number; ratio: number }[]>;
  
  // Session store
  sessionStore: SessionStoreType;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trainingEntries: Map<number, TrainingEntry>;
  private morningDiaries: Map<number, MorningDiary>;
  private fitnessMetrics: Map<number, FitnessMetrics>;
  private healthReports: Map<number, HealthReport>;
  private coachFeedback: Map<number, CoachFeedback>;
  
  sessionStore: SessionStoreType;
  
  private userCurrentId: number;
  private entryCurrentId: number;
  private diaryCurrentId: number;
  private metricsCurrentId: number;
  private reportCurrentId: number;
  private feedbackCurrentId: number;

  constructor() {
    this.users = new Map();
    this.trainingEntries = new Map();
    this.morningDiaries = new Map();
    this.fitnessMetrics = new Map();
    this.healthReports = new Map();
    this.coachFeedback = new Map();
    
    this.userCurrentId = 1;
    this.entryCurrentId = 1;
    this.diaryCurrentId = 1;
    this.metricsCurrentId = 1;
    this.reportCurrentId = 1;
    this.feedbackCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add some sample users for development
    this.createUser({
      username: "athlete1",
      password: "password123",
      email: "athlete1@example.com",
      firstName: "Alex",
      lastName: "Morgan",
      role: "athlete",
      teamPosition: "Forward"
    });
    
    this.createUser({
      username: "coach1",
      password: "password123",
      email: "coach1@example.com",
      firstName: "John",
      lastName: "Smith",
      role: "coach",
      teamPosition: "Head Coach"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      profileImage: null,
      teamPosition: insertUser.teamPosition || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAthletes(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "athlete",
    );
  }
  
  // Training entry methods
  async createTrainingEntry(entry: InsertTrainingEntry): Promise<TrainingEntry> {
    const id = this.entryCurrentId++;
    const newEntry: TrainingEntry = {
      ...entry,
      id,
      coachReviewed: false,
      createdAt: new Date()
    };
    this.trainingEntries.set(id, newEntry);
    return newEntry;
  }
  
  async getTrainingEntriesByUserId(userId: number): Promise<TrainingEntry[]> {
    return Array.from(this.trainingEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }
  
  async markTrainingEntryAsReviewed(entryId: number): Promise<void> {
    const entry = this.trainingEntries.get(entryId);
    if (entry) {
      entry.coachReviewed = true;
      this.trainingEntries.set(entryId, entry);
    }
  }
  
  // Morning diary methods
  async createMorningDiary(diary: InsertMorningDiary, userId: number, readinessScore: number): Promise<MorningDiary> {
    const id = this.diaryCurrentId++;
    const now = new Date();
    
    const newDiary: MorningDiary = {
      ...diary,
      id,
      userId,
      date: now,
      readinessScore,
      createdAt: now
    };
    
    this.morningDiaries.set(id, newDiary);
    return newDiary;
  }
  
  async getMorningDiariesByUserId(userId: number): Promise<MorningDiary[]> {
    return Array.from(this.morningDiaries.values())
      .filter(diary => diary.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }
  
  async getLatestMorningDiary(userId: number): Promise<MorningDiary | undefined> {
    const diaries = await this.getMorningDiariesByUserId(userId);
    return diaries.length > 0 ? diaries[0] : undefined;
  }
  
  // Fitness metrics methods
  async createFitnessMetrics(metrics: InsertFitnessMetrics): Promise<FitnessMetrics> {
    const id = this.metricsCurrentId++;
    const newMetrics: FitnessMetrics = {
      ...metrics,
      id
    };
    this.fitnessMetrics.set(id, newMetrics);
    return newMetrics;
  }
  
  async getFitnessMetricsByUserId(userId: number): Promise<FitnessMetrics[]> {
    return Array.from(this.fitnessMetrics.values())
      .filter(metrics => metrics.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }
  
  // Health report methods
  async createHealthReport(report: InsertHealthReport): Promise<HealthReport> {
    const id = this.reportCurrentId++;
    const newReport: HealthReport = {
      ...report,
      id,
      status: "new",
      createdAt: new Date()
    };
    this.healthReports.set(id, newReport);
    return newReport;
  }
  
  async getHealthReportsByUserId(userId: number): Promise<HealthReport[]> {
    return Array.from(this.healthReports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by date descending
  }
  
  // Coach feedback methods
  async createCoachFeedback(feedback: InsertCoachFeedback): Promise<CoachFeedback> {
    const id = this.feedbackCurrentId++;
    const newFeedback: CoachFeedback = {
      ...feedback,
      id,
      createdAt: new Date()
    };
    this.coachFeedback.set(id, newFeedback);
    return newFeedback;
  }
  
  async getCoachFeedbackByCoachId(coachId: number): Promise<CoachFeedback[]> {
    return Array.from(this.coachFeedback.values())
      .filter(feedback => feedback.coachId === coachId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCoachFeedbackByAthleteId(athleteId: number): Promise<CoachFeedback[]> {
    return Array.from(this.coachFeedback.values())
      .filter(feedback => feedback.athleteId === athleteId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Team metrics
  async getTeamReadiness(): Promise<{ date: string; value: number }[]> {
    // Generate random readiness data for the last 7 days
    const readiness: { date: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      readiness.push({
        date: dateString,
        value: Math.round(60 + Math.random() * 30) // Random value between 60-90
      });
    }
    
    return readiness;
  }
  
  // Enhanced Analytics methods
  async getTrainingLoadByRPE(athleteId?: number): Promise<{ date: string; load: number; trainingType: string }[]> {
    // Get all training entries, optionally filtered by athlete
    let entries = Array.from(this.trainingEntries.values());
    
    // Apply athlete filter if specified
    if (athleteId) {
      entries = entries.filter(entry => entry.userId === athleteId);
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

// Import DatabaseStorage implementation and helper functions
import { 
  DatabaseStorage, 
  generateDefaultTrainingLoad, 
  generateDefaultACWR 
} from './database-storage';

// Switch to the database storage implementation
export const storage = new DatabaseStorage();
