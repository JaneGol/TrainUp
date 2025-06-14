import { IStorage } from "./storage";

export interface TrainingRecommendation {
  athleteId: number;
  athleteName: string;
  recommendedIntensity: 'Low' | 'Moderate' | 'High' | 'Rest';
  recommendedRPE: number;
  reasonCode: string;
  reasoning: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number; // 0-100%
  generatedAt: string;
}

export interface TeamTrainingRecommendation {
  date: string;
  teamReadiness: number;
  recommendedSessionType: 'Recovery' | 'Moderate' | 'High Intensity' | 'Rest Day';
  participationRate: number;
  recommendations: TrainingRecommendation[];
  teamReasoning: string[];
}

export class TrainingRecommendationService {
  constructor(private storage: IStorage) {}

  /**
   * Generate training recommendations for all athletes
   */
  async generateTeamRecommendations(teamId?: number): Promise<TeamTrainingRecommendation> {
    const athletes = teamId ? await this.storage.getTeamAthletes(teamId) : await this.storage.getAthletes();
    const athleteRecommendations: TrainingRecommendation[] = [];

    console.log(`Generating recommendations for ${athletes.length} athletes in team ${teamId || 'all'}`);

    for (const athlete of athletes) {
      console.log(`Processing athlete: ${athlete.username} (ID: ${athlete.id})`);
      const recommendation = await this.generateAthleteRecommendation(athlete.id);
      if (recommendation) {
        console.log(`Generated recommendation for ${athlete.username}: ${recommendation.recommendedIntensity}`);
        athleteRecommendations.push(recommendation);
      } else {
        console.log(`No recommendation generated for ${athlete.username}`);
      }
    }

    // Calculate team-level metrics
    const activeRecommendations = athleteRecommendations.filter(r => r.recommendedIntensity !== 'Rest');
    
    // Calculate team readiness using actual morning diary data
    const teamMorningDiaries = await Promise.all(
      athletes.map(athlete => this.storage.getMorningDiariesByUserId(athlete.id))
    );
    
    const latestReadinessScores = teamMorningDiaries
      .map(diaries => {
        const latest = diaries.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        return latest ? latest.readinessScore : 60; // Default if no data
      })
      .filter(score => score > 0);
    
    const teamReadiness = latestReadinessScores.length > 0 
      ? latestReadinessScores.reduce((sum, score) => sum + score, 0) / latestReadinessScores.length
      : 60;

    const participationRate = athleteRecommendations.length > 0 
      ? (activeRecommendations.length / athleteRecommendations.length) * 100
      : 0;
    
    console.log(`Team metrics: readiness=${Math.round(teamReadiness)}%, participation=${Math.round(participationRate)}%, active=${activeRecommendations.length}/${athleteRecommendations.length}`);

    // Determine team session type
    const teamSessionType = this.determineTeamSessionType(athleteRecommendations, teamReadiness);
    const teamReasoning = this.generateTeamReasoning(athleteRecommendations, teamReadiness, participationRate);

    return {
      date: new Date().toISOString().split('T')[0],
      teamReadiness: Math.round(teamReadiness),
      recommendedSessionType: teamSessionType,
      participationRate: Math.round(participationRate),
      recommendations: athleteRecommendations,
      teamReasoning
    };
  }

  /**
   * Generate recommendation for a specific athlete
   */
  async generateAthleteRecommendation(athleteId: number): Promise<TrainingRecommendation | null> {
    try {
      console.log(`Starting recommendation generation for athlete ${athleteId}`);
      
      // Get athlete data
      const athlete = await this.storage.getUser(athleteId);
      if (!athlete) {
        console.log(`No athlete found with ID ${athleteId}`);
        return null;
      }
      console.log(`Found athlete: ${athlete.username}`);

      // Get recent wellness data
      const morningDiaries = await this.storage.getMorningDiariesByUserId(athleteId);
      const trainingEntries = await this.storage.getTrainingEntriesByUserId(athleteId);
      console.log(`Found ${morningDiaries.length} morning diaries and ${trainingEntries.length} training entries for ${athlete.username}`);

      // Get latest diary for current readiness
      const latestDiary = morningDiaries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (!latestDiary) {
        console.log(`No morning diary found for ${athlete.username}, creating default recommendation`);
        return {
          athleteId,
          athleteName: athlete.username,
          recommendedIntensity: 'Moderate' as const,
          recommendedRPE: 5,
          reasonCode: 'NO_DATA',
          reasoning: ['No recent wellness data available', 'Using moderate intensity as default'],
          riskLevel: 'Medium' as const,
          confidence: 30,
          generatedAt: new Date().toISOString()
        };
      }

      // Calculate key metrics
      const readinessScore = latestDiary.readinessScore;
      const recentTrainingLoad = this.calculateRecentTrainingLoad(trainingEntries);
      const acwrRatio = this.calculateACWR(trainingEntries);
      const recoveryTrend = this.calculateRecoveryTrend(morningDiaries);

      // Generate recommendation based on analysis
      const recommendation = this.analyzeAndRecommend(
        athleteId,
        athlete.username,
        readinessScore,
        recentTrainingLoad,
        acwrRatio,
        recoveryTrend,
        latestDiary
      );

      return recommendation;

    } catch (error) {
      console.error(`Error generating recommendation for athlete ${athleteId}:`, error);
      return null;
    }
  }

  /**
   * Core recommendation algorithm
   */
  private analyzeAndRecommend(
    athleteId: number,
    athleteName: string,
    readinessScore: number,
    recentLoad: number,
    acwrRatio: number,
    recoveryTrend: 'improving' | 'declining' | 'stable',
    latestDiary: any
  ): TrainingRecommendation {
    const reasoning: string[] = [];
    let recommendedIntensity: 'Low' | 'Moderate' | 'High' | 'Rest' = 'Moderate';
    let recommendedRPE = 5;
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    let confidence = 70;
    let reasonCode = 'NORMAL';

    // Readiness Score Analysis (40% weight) - Adjusted thresholds for more realistic recommendations
    if (readinessScore < 35) {
      recommendedIntensity = 'Rest';
      recommendedRPE = 0;
      riskLevel = 'High';
      reasonCode = 'LOW_READINESS';
      reasoning.push(`Very low readiness score (${readinessScore}%)`);
      reasoning.push('Complete rest recommended for recovery');
      confidence = 85;
    } else if (readinessScore < 50) {
      recommendedIntensity = 'Low';
      recommendedRPE = 3;
      riskLevel = 'High';
      reasonCode = 'POOR_READINESS';
      reasoning.push(`Poor readiness score (${readinessScore}%)`);
      reasoning.push('Light activity only to promote recovery');
      confidence = 80;
    } else if (readinessScore < 70) {
      recommendedIntensity = 'Moderate';
      recommendedRPE = 5;
      riskLevel = 'Medium';
      reasoning.push(`Moderate readiness score (${readinessScore}%)`);
      confidence = 75;
    } else {
      recommendedIntensity = 'High';
      recommendedRPE = 7;
      riskLevel = 'Low';
      reasoning.push(`Good readiness score (${readinessScore}%)`);
      confidence = 85;
    }

    // ACWR Analysis (30% weight) - Adjust recommendation based on training load ratio
    if (acwrRatio > 1.8) {
      // Very high injury risk due to rapid load increase
      if (recommendedIntensity === 'High') recommendedIntensity = 'Moderate';
      if (recommendedIntensity === 'Moderate') recommendedIntensity = 'Low';
      recommendedRPE = Math.max(recommendedRPE - 2, 2);
      riskLevel = 'High';
      reasonCode = 'HIGH_ACWR';
      reasoning.push(`Very high ACWR ratio (${acwrRatio.toFixed(2)}) indicates injury risk`);
      reasoning.push('Reducing intensity to manage load progression');
      confidence = Math.max(confidence - 15, 50);
    } else if (acwrRatio < 0.8) {
      // Low training stimulus - can potentially increase
      if (readinessScore > 70 && recommendedIntensity !== 'Rest') {
        if (recommendedIntensity === 'Low') recommendedIntensity = 'Moderate';
        if (recommendedIntensity === 'Moderate') recommendedIntensity = 'High';
        recommendedRPE = Math.min(recommendedRPE + 1, 8);
        reasoning.push(`Low ACWR ratio (${acwrRatio.toFixed(2)}) suggests potential for increased load`);
      }
    } else {
      reasoning.push(`ACWR ratio (${acwrRatio.toFixed(2)}) is within optimal range`);
    }

    // Recovery Trend Analysis (20% weight)
    if (recoveryTrend === 'declining' && recommendedIntensity !== 'Rest') {
      if (recommendedIntensity === 'High') recommendedIntensity = 'Moderate';
      recommendedRPE = Math.max(recommendedRPE - 1, 2);
      reasoning.push('Declining recovery trend suggests need for reduced intensity');
      confidence = Math.max(confidence - 10, 40);
    } else if (recoveryTrend === 'improving' && readinessScore > 60) {
      reasoning.push('Improving recovery trend supports current training approach');
      confidence = Math.min(confidence + 10, 95);
    }

    // Symptoms Check (10% weight) - Only severe symptoms require rest
    const hasSymptoms = latestDiary.symptoms && latestDiary.symptoms !== 'None';
    const hasSignificantPain = latestDiary.painIntensity && latestDiary.painIntensity > 6;
    const hasSignificantInjury = latestDiary.injuryNote && latestDiary.injuryNote.length > 20;
    
    if (hasSignificantPain || hasSignificantInjury) {
      recommendedIntensity = 'Rest';
      recommendedRPE = 0;
      riskLevel = 'High';
      reasonCode = 'HEALTH_CONCERNS';
      reasoning.push('Health symptoms or injury reported');
      reasoning.push('Complete rest until symptoms resolve');
      confidence = 90;
    }

    // Recent High Load Check
    if (recentLoad > 2000) { // High training load in recent days
      if (recommendedIntensity === 'High') recommendedIntensity = 'Moderate';
      reasoning.push(`High recent training load (${Math.round(recentLoad)} AU)`);
      reasoning.push('Managing accumulated fatigue');
    }

    return {
      athleteId,
      athleteName,
      recommendedIntensity,
      recommendedRPE,
      reasonCode,
      reasoning,
      riskLevel,
      confidence,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate recent training load (last 7 days)
   */
  private calculateRecentTrainingLoad(trainingEntries: any[]): number {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return trainingEntries
      .filter(entry => new Date(entry.date) >= sevenDaysAgo)
      .reduce((sum, entry) => sum + (entry.trainingLoad || 0), 0);
  }

  /**
   * Calculate ACWR ratio (Acute:Chronic Workload Ratio)
   */
  private calculateACWR(trainingEntries: any[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const twentyEightDaysAgo = new Date(now);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    // Acute load (last 7 days)
    const acuteLoad = trainingEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= sevenDaysAgo && entryDate <= now;
      })
      .reduce((sum, entry) => sum + (entry.trainingLoad || 0), 0);

    // Chronic load (last 28 days average)
    const chronicEntries = trainingEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= twentyEightDaysAgo && entryDate <= now;
      });

    const chronicLoad = chronicEntries.length > 0
      ? chronicEntries.reduce((sum, entry) => sum + (entry.trainingLoad || 0), 0) / 4 // 4 weeks
      : 0;

    return chronicLoad > 0 ? acuteLoad / chronicLoad : 1.0;
  }

  /**
   * Calculate recovery trend from recent wellness data
   */
  private calculateRecoveryTrend(morningDiaries: any[]): 'improving' | 'declining' | 'stable' {
    if (morningDiaries.length < 3) return 'stable';

    const recent = morningDiaries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(d => d.readinessScore);

    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    const difference = firstAvg - secondAvg;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Determine team session type based on individual recommendations
   */
  private determineTeamSessionType(
    recommendations: TrainingRecommendation[], 
    teamReadiness: number
  ): 'Recovery' | 'Moderate' | 'High Intensity' | 'Rest Day' {
    const intensityCounts = recommendations.reduce((counts, rec) => {
      counts[rec.recommendedIntensity] = (counts[rec.recommendedIntensity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const total = recommendations.length;
    const restPercentage = (intensityCounts['Rest'] || 0) / total;
    const lowPercentage = (intensityCounts['Low'] || 0) / total;

    // If more than 40% need rest, make it a rest day
    if (restPercentage > 0.4) return 'Rest Day';
    
    // If more than 50% need low intensity, make it recovery
    if ((restPercentage + lowPercentage) > 0.5) return 'Recovery';
    
    // If team readiness is high and most can train moderately to high
    if (teamReadiness > 75 && (intensityCounts['High'] || 0) > (intensityCounts['Low'] || 0)) {
      return 'High Intensity';
    }

    return 'Moderate';
  }

  /**
   * Generate team-level reasoning
   */
  private generateTeamReasoning(
    recommendations: TrainingRecommendation[],
    teamReadiness: number,
    participationRate: number
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Team readiness: ${teamReadiness.toFixed(1)}%`);
    reasoning.push(`${participationRate.toFixed(0)}% of athletes available for training`);

    const riskCounts = recommendations.reduce((counts, rec) => {
      counts[rec.riskLevel] = (counts[rec.riskLevel] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    if (riskCounts['High'] > 0) {
      reasoning.push(`${riskCounts['High']} athlete(s) at high injury risk`);
    }

    const reasonCodes = recommendations.map(r => r.reasonCode);
    if (reasonCodes.includes('HEALTH_CONCERNS')) {
      reasoning.push('Some athletes reporting health concerns');
    }
    if (reasonCodes.includes('HIGH_ACWR')) {
      reasoning.push('Load management needed for some athletes');
    }

    return reasoning;
  }

  /**
   * Helper to get readiness score from recommendation
   */
  private getReadinessScore(recommendation: TrainingRecommendation): number {
    // Estimate readiness from recommended intensity
    switch (recommendation.recommendedIntensity) {
      case 'Rest': return 30;
      case 'Low': return 50;
      case 'Moderate': return 70;
      case 'High': return 85;
      default: return 60;
    }
  }
}