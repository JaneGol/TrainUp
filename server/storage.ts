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
type SessionStoreType = InstanceType<typeof MemoryStore>;

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
    const user: User = { ...insertUser, id, profileImage: null };
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
}

export const storage = new MemStorage();
