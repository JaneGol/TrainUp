import { 
  User, InsertUser, Team, InsertTeam,
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
  updateUserPassword(userId: number, hashedPassword: string): Promise<boolean>;
  getAthletes(): Promise<User[]>;
  
  // Team methods
  getTeamByName(name: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  validateTeamPin(teamName: string, pin: string): Promise<boolean>;
  getTeamAthletes(teamId: number): Promise<User[]>;
  
  // Training entry methods
  createTrainingEntry(entry: InsertTrainingEntry): Promise<TrainingEntry>;
  getTrainingEntriesByUserId(userId: number): Promise<TrainingEntry[]>;
  markTrainingEntryAsReviewed(entryId: number): Promise<void>;
  updateTrainingSessionDuration(sessionId: string, duration: number): Promise<any>;
  
  // Morning diary methods
  createMorningDiary(diary: InsertMorningDiary, userId: number, readinessScore: number): Promise<MorningDiary>;
  getMorningDiariesByUserId(userId: number): Promise<MorningDiary[]>;
  getLatestMorningDiary(userId: number): Promise<MorningDiary | undefined>;
  deleteLatestMorningDiary(userId: number): Promise<boolean>;
  
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
  
  // Enhanced Analytics methods
  getTrainingLoadByRPE(athleteId?: number): Promise<{ date: string; load: number; trainingType: string }[]>;
  getAcuteChronicLoadRatio(athleteId?: number): Promise<{ date: string; acute: number; chronic: number; ratio: number }[]>;
  getTeamWellnessTrends(teamId?: number): Promise<{ date: string; value: number; category: string }[]>;
  getAthleteRecoveryReadiness(teamId?: number): Promise<{ athleteId: number; name: string; readinessScore: number; trend: string; issues: string[] }[]>;
  getInjuryRiskFactors(teamId?: number): Promise<{ athleteId: number; name: string; riskScore: number; factors: string[] }[]>;
  getTodaysAlerts(teamId?: number): Promise<{ athleteId: number; name: string; type: "injury" | "sick" | "acwr"; note: string }[]>;
  getTeamReadiness(teamId?: number): Promise<{ date: string; value: number }[]>;
  getWeeklyLoadData(athleteId: string, weekStart: string): Promise<any[]>;
  getTodaysRpeSubmissions(userId: number, today: string): Promise<{ type: string; sessionNumber?: number }[]>;

  
  // Session store
  sessionStore: SessionStoreType;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private trainingEntries: Map<number, TrainingEntry>;
  private morningDiaries: Map<number, MorningDiary>;
  private fitnessMetrics: Map<number, FitnessMetrics>;
  private healthReports: Map<number, HealthReport>;
  private coachFeedback: Map<number, CoachFeedback>;
  
  sessionStore: SessionStoreType;
  
  private userCurrentId: number;
  private teamCurrentId: number;
  private entryCurrentId: number;
  private diaryCurrentId: number;
  private metricsCurrentId: number;
  private reportCurrentId: number;
  private feedbackCurrentId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.trainingEntries = new Map();
    this.morningDiaries = new Map();
    this.fitnessMetrics = new Map();
    this.healthReports = new Map();
    this.coachFeedback = new Map();
    
    this.userCurrentId = 1;
    this.teamCurrentId = 1;
    this.entryCurrentId = 1;
    this.diaryCurrentId = 1;
    this.metricsCurrentId = 1;
    this.reportCurrentId = 1;
    this.feedbackCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create default TEST team for existing users
    const defaultTeam = this.createTeam({
      name: "TEST",
      pinCode: "1234"
    });
    
    // Add some sample users for development
    this.createUser({
      username: "athlete1",
      password: "password123",
      email: "athlete1@example.com",
      firstName: "Alex",
      lastName: "Morgan",
      role: "athlete",
      teamPosition: "Forward",
      teamId: defaultTeam.id
    });
    
    this.createUser({
      username: "coach1",
      password: "password123",
      email: "coach1@example.com",
      firstName: "John",
      lastName: "Smith",
      role: "coach",
      teamPosition: "Head Coach",
      teamId: defaultTeam.id
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
    // Find the team by name to get the teamId
    const team = await this.getTeamByName(insertUser.teamName);
    if (!team) {
      throw new Error("Team not found");
    }
    
    const id = this.userCurrentId++;
    const user: User = { 
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: insertUser.role,
      teamPosition: insertUser.teamPosition || null,
      id, 
      profileImage: null,
      teamId: team.id
    };
    this.users.set(id, user);
    return user;
  }

  // Team methods
  async getTeamByName(name: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(
      (team) => team.name === name,
    );
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamCurrentId++;
    const team: Team = { 
      ...insertTeam, 
      id 
    };
    this.teams.set(id, team);
    return team;
  }

  async validateTeamPin(teamName: string, pin: string): Promise<boolean> {
    const team = await this.getTeamByName(teamName);
    return team?.pinCode === pin;
  }

  async getTeamAthletes(teamId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.teamId === teamId,
    );
  }
  
  async getAthletes(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "athlete",
    );
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      
      if (!user) {
        return false;
      }
      
      // Update the user's password
      user.password = hashedPassword;
      this.users.set(userId, user);
      
      return true;
    } catch (error) {
      console.error("Error updating user password:", error);
      return false;
    }
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

  async updateTrainingSessionDuration(sessionId: string, duration: number): Promise<any> {
    // Return mock updated session data
    return {
      id: sessionId,
      duration: duration,
      updated: true
    };
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
  
  async deleteLatestMorningDiary(userId: number): Promise<boolean> {
    try {
      const latestDiary = await this.getLatestMorningDiary(userId);
      
      if (!latestDiary) {
        return false;
      }
      
      this.morningDiaries.delete(latestDiary.id);
      return true;
    } catch (error) {
      console.error("Error deleting latest morning diary:", error);
      return false;
    }
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
  async getTeamReadiness(teamId?: number): Promise<{ date: string; value: number }[]> {
    // Filter diaries by team if teamId is provided
    let relevantDiaries = Array.from(this.morningDiaries.values());
    
    if (teamId !== undefined) {
      // Get athletes from the specified team
      const teamAthletes = Array.from(this.users.values())
        .filter(user => user.role === 'athlete' && user.teamId === teamId)
        .map(user => user.id);
      
      // Filter diaries to only include those from team athletes
      relevantDiaries = relevantDiaries.filter(diary => teamAthletes.includes(diary.userId));
    }
    
    // Group by date and calculate average readiness
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayDiaries = relevantDiaries.filter(diary => 
        diary.date.toISOString().split('T')[0] === dateString
      );
      
      const avgReadiness = dayDiaries.length > 0 
        ? Math.round(dayDiaries.reduce((sum, d) => sum + d.readinessScore, 0) / dayDiaries.length)
        : Math.round(60 + Math.random() * 30); // Fallback for demo
      
      last7Days.push({
        date: dateString,
        value: avgReadiness
      });
    }
    
    return last7Days;
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
  
  // Enhanced analytics for coaches
  async getTeamWellnessTrends(teamId?: number): Promise<{ date: string; value: number; category: string; }[]> {
    // Get all morning diaries
    const diaries = Array.from(this.morningDiaries.values());
    if (diaries.length === 0) {
      return generateDefaultWellnessTrends();
    }
    
    // Group diaries by date to get daily averages
    const diariesByDate: Record<string, MorningDiary[]> = {};
    diaries.forEach(diary => {
      const dateStr = diary.date.toISOString().split('T')[0];
      if (!diariesByDate[dateStr]) {
        diariesByDate[dateStr] = [];
      }
      diariesByDate[dateStr].push(diary);
    });
    
    // Calculate wellness metrics for each date
    const result: { date: string; value: number; category: string; }[] = [];
    
    Object.entries(diariesByDate).forEach(([date, diariesOnDate]) => {
      // Calculate average readiness score
      const avgReadiness = diariesOnDate.reduce((sum, diary) => sum + diary.readinessScore, 0) / diariesOnDate.length;
      result.push({
        date,
        value: parseFloat(avgReadiness.toFixed(1)),
        category: 'Readiness'
      });
      
      // Calculate average mood score (positive/neutral/negative -> 1/0.5/0)
      const moodScore = diariesOnDate.reduce((sum, diary) => {
        if (diary.mood === 'positive') return sum + 1;
        if (diary.mood === 'neutral') return sum + 0.5;
        return sum;
      }, 0) / diariesOnDate.length;
      
      result.push({
        date, 
        value: parseFloat(moodScore.toFixed(1)),
        category: 'Mood'
      });
      
      // Calculate average recovery score (good/moderate/poor -> 1/0.5/0)
      const recoveryScore = diariesOnDate.reduce((sum, diary) => {
        if (diary.recoveryLevel === 'good') return sum + 1;
        if (diary.recoveryLevel === 'moderate') return sum + 0.5;
        return sum;
      }, 0) / diariesOnDate.length;
      
      result.push({
        date,
        value: parseFloat(recoveryScore.toFixed(1)),
        category: 'Recovery'
      });
    });
    
    // Sort by date
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result;
  }
  
  async getAthleteRecoveryReadiness(teamId?: number): Promise<{ athleteId: number; name: string; readinessScore: number; trend: string; issues: string[] }[]> {
    // Get athletes filtered by team
    const athletes = Array.from(this.users.values()).filter(user => 
      user.role === 'athlete' && (teamId === undefined || user.teamId === teamId)
    );
    
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
  
  async getInjuryRiskFactors(teamId?: number): Promise<{ athleteId: number; name: string; riskScore: number; factors: string[] }[]> {
    // Get athletes filtered by team
    const athletes = Array.from(this.users.values()).filter(user => 
      user.role === 'athlete' && (teamId === undefined || user.teamId === teamId)
    );
    
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
          e.date >= last7Days && e.effortLevel >= 8
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
      
      // Calculate ACWR (7-day average vs 28-day average)
      const acuteAvg = acuteLoad / 7; // Average daily load for 7 days
      const ratio = chronicLoad === 0 ? 0 : parseFloat((acuteAvg / chronicLoad).toFixed(2));
      
      result.push({
        date: currentDate,
        acute: Math.round(acuteLoad),
        chronic: Math.round(chronicLoad),
        ratio: ratio
      });
    }
    
    return result.length > 0 ? result : generateDefaultACWR();
  }

  async getTodaysAlerts(teamId?: number): Promise<{ athleteId: number; name: string; type: "injury" | "sick" | "acwr"; note: string }[]> {
    const alerts: { athleteId: number; name: string; type: "injury" | "sick" | "acwr"; note: string }[] = [];
    
    // Get athletes filtered by team
    const athletes = Array.from(this.users.values()).filter(user => 
      user.role === 'athlete' && (teamId === undefined || user.teamId === teamId)
    );
    
    for (const athlete of athletes) {
      // Check latest morning diary for injury/sickness
      const latestDiary = await this.getLatestMorningDiary(athlete.id);
      
      if (latestDiary) {
        // Check for injury
        if (latestDiary.hasInjury && latestDiary.injuryType) {
          alerts.push({
            athleteId: athlete.id,
            name: `${athlete.firstName} ${athlete.lastName}`,
            type: "injury",
            note: latestDiary.injuryType
          });
        }
        
        // Check for sickness symptoms
        if (latestDiary.symptoms && Array.isArray(latestDiary.symptoms) && 
            !latestDiary.symptoms.includes('no_symptoms') && latestDiary.symptoms.length > 0) {
          alerts.push({
            athleteId: athlete.id,
            name: `${athlete.firstName} ${athlete.lastName}`,
            type: "sick",
            note: latestDiary.symptoms.join(', ')
          });
        }
      }
      
      // Check for high ACWR
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
        // Skip ACWR check if insufficient data
      }
    }
    
    return alerts;
  }

  async getWeeklyLoadData(athleteId: string, weekStart: string): Promise<any[]> {
    // Mock implementation for MemStorage
    return [];
  }

  async getTodaysRpeSubmissions(userId: number, today: string): Promise<{ type: string; sessionNumber?: number }[]> {
    // Mock implementation for MemStorage - return empty array since this is primarily for database use
    return [];
  }
}

// Import DatabaseStorage implementation and helper functions
import { 
  DatabaseStorage, 
  generateDefaultTrainingLoad, 
  generateDefaultACWR,
  generateDefaultWellnessTrends
} from './database-storage';

// Switch to the database storage implementation
export const storage = new DatabaseStorage();
