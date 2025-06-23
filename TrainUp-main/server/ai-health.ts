import { User, TrainingEntry, MorningDiary, HealthReport, FitnessMetrics } from "@shared/schema";
import { IStorage } from "./storage";

// Types for health recommendations
export interface HealthRecommendation {
  id: string;
  userId: number;
  date: string;
  summary: string;
  recommendations: string[];
  insights: string[];
  riskAreas: string[];
  improvementAreas: string[];
  generatedAt: string;
}

// Service to generate health recommendations
export class HealthRecommendationService {
  constructor(private storage: IStorage) {}

  /**
   * Generate health recommendations for an athlete
   * This implementation will use rule-based logic until API key is available
   */
  async generateRecommendationsForAthlete(userId: number): Promise<HealthRecommendation> {
    // Collect user data
    const [user, trainingEntries, morningDiaries, healthReports, fitnessMetrics] = await Promise.all([
      this.storage.getUser(userId),
      this.storage.getTrainingEntriesByUserId(userId),
      this.storage.getMorningDiariesByUserId(userId),
      this.storage.getHealthReportsByUserId(userId),
      this.storage.getFitnessMetricsByUserId(userId)
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    // Sort data by date to get the most recent entries
    const sortedDiaries = morningDiaries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const sortedTraining = trainingEntries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Generate recommendations based on available data
    const recommendations = this.generateRuleBasedRecommendations(
      user,
      sortedTraining,
      sortedDiaries,
      healthReports,
      fitnessMetrics
    );

    return {
      id: this.generateUniqueId(),
      userId,
      date: new Date().toISOString().split('T')[0],
      ...recommendations,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Rule-based logic to generate recommendations based on health data
   */
  private generateRuleBasedRecommendations(
    user: User, 
    trainingEntries: TrainingEntry[], 
    morningDiaries: MorningDiary[],
    healthReports: HealthReport[],
    fitnessMetrics: FitnessMetrics[]
  ): Omit<HealthRecommendation, 'id' | 'userId' | 'date' | 'generatedAt'> {
    const recommendations: string[] = [];
    const insights: string[] = [];
    const riskAreas: string[] = [];
    const improvementAreas: string[] = [];
    let summary = "Health assessment based on recent data";
    
    // 1. Analyze recent morning diaries for health symptoms and trends
    if (morningDiaries.length > 0) {
      const latestDiary = morningDiaries[0];
      
      // Check for critical health symptoms first
      const symptoms = Array.isArray(latestDiary.symptoms) ? latestDiary.symptoms : [];
      
      // Fever/Temperature detection
      const hasFever = symptoms.some((symptom: string) => {
        const symptomLower = symptom.toLowerCase();
        return symptomLower.includes('fever') || 
               symptomLower.includes('temperature') ||
               symptomLower.includes('high_temp') ||
               symptomLower.includes('temp') ||
               symptomLower.includes('hot') ||
               symptomLower.includes('burning');
      });
      
      // Illness symptoms
      const hasSickness = symptoms.some((symptom: string) => {
        const symptomLower = symptom.toLowerCase();
        return symptomLower.includes('sick') || 
               symptomLower.includes('ill') ||
               symptomLower.includes('nausea') ||
               symptomLower.includes('vomit') ||
               symptomLower.includes('dizzy') ||
               symptomLower.includes('weak');
      });
      
      // Respiratory issues
      const hasRespiratoryIssues = symptoms.some((symptom: string) => {
        const symptomLower = symptom.toLowerCase();
        return symptomLower.includes('cough') || 
               symptomLower.includes('throat') ||
               symptomLower.includes('breathing') ||
               symptomLower.includes('chest') ||
               symptomLower.includes('runny_nose') ||
               symptomLower.includes('congestion');
      });
      
      // Critical health conditions override other recommendations
      if (hasFever) {
        summary = "🚨 URGENT: Fever detected - immediate rest required";
        insights.push("🚨 FEVER ALERT: Elevated body temperature detected from morning assessment.");
        insights.push("Training is contraindicated until fever-free for 24+ hours.");
        riskAreas.push("Acute Illness");
        riskAreas.push("Infectious Disease Risk");
        recommendations.push("Complete rest and monitor temperature regularly.");
        recommendations.push("Increase fluid intake significantly - water, electrolyte solutions.");
        recommendations.push("Seek medical attention if fever persists or worsens.");
        recommendations.push("NO TRAINING until fever-free for 24 hours minimum.");
        improvementAreas.push("Hydration Management");
        improvementAreas.push("Rest and Recovery");
      } else if (hasSickness) {
        summary = "Illness symptoms detected - rest recommended";
        insights.push("General illness symptoms reported in morning assessment.");
        riskAreas.push("Illness Recovery");
        recommendations.push("Complete rest until symptoms fully resolve.");
        recommendations.push("Focus on hydration and nutrition.");
        recommendations.push("Return to training gradually after recovery.");
      } else if (hasRespiratoryIssues) {
        summary = "Respiratory symptoms present - modified training recommended";
        insights.push("Respiratory symptoms detected - monitor carefully during activity.");
        riskAreas.push("Respiratory Health");
        recommendations.push("Avoid high-intensity training.");
        recommendations.push("Light activity only if feeling well enough.");
        recommendations.push("Stop activity if breathing becomes difficult.");
      }
      
      // Check injury status
      if (latestDiary.hasInjury && latestDiary.painLevel && latestDiary.painLevel > 6) {
        insights.push(`High pain level reported: ${latestDiary.painLevel}/10`);
        riskAreas.push("Injury Management");
        recommendations.push("Avoid exercises that aggravate the injury.");
        recommendations.push("Consider medical evaluation if pain persists.");
      }
      
      // Only check other factors if no critical health issues
      if (!hasFever && !hasSickness) {
        // Check sleep quality
        const sleepQuality = latestDiary.sleepQuality;
        if (sleepQuality === "poor") {
          insights.push("Your recent sleep quality is below optimal levels.");
          riskAreas.push("Sleep Quality");
          recommendations.push("Consider adjusting your sleeping environment - reduce screen time before bed and maintain a consistent sleep schedule.");
        }
        
        // Check sleep duration
        if (latestDiary.sleepHours < 7) {
          insights.push("Your sleep duration is below the recommended 7-9 hours.");
          riskAreas.push("Sleep Duration");
          recommendations.push("Aim for 7-9 hours of sleep tonight to improve recovery and performance.");
        }
        
        // Check stress levels
        if (latestDiary.stressLevel === "high") {
          insights.push("You've reported high stress levels which can impact performance and recovery.");
          riskAreas.push("Mental Health");
          recommendations.push("Consider stress-reduction techniques like deep breathing, meditation, or light exercise.");
        }
        
        // Check readiness score
        if (latestDiary.readinessScore < 50) {
          insights.push("Your overall readiness score indicates you might need additional recovery time.");
          recommendations.push("Consider a light recovery session instead of intense training today.");
        }
      }
      
      // Check mood trends
      if (latestDiary.mood < 3) {
        insights.push("Your mood scores have been lower than usual.");
        recommendations.push("Consider incorporating mindfulness exercises into your daily routine to help regulate mood.");
      }
      
      // Check readiness
      if (latestDiary.readinessScore < 50) {
        insights.push("Your overall readiness score indicates you might need additional recovery time.");
        recommendations.push("Consider a light recovery session instead of intense training today.");
      }
    }
    
    // 2. Analyze training load from recent entries
    if (trainingEntries.length > 0) {
      const recentEntries = trainingEntries.slice(0, 7); // Last week of training
      const averageEffort = recentEntries.reduce((sum, entry) => sum + entry.effortLevel, 0) / recentEntries.length;
      
      if (averageEffort > 8) {
        insights.push("Your training intensity has been consistently high over the past week.");
        riskAreas.push("Training Load");
        recommendations.push("Consider scheduling an active recovery day to prevent overtraining.");
      }
      
      // Check for consistent high effort days without recovery
      const consecutiveHighEffortDays = this.calculateConsecutiveHighEffortDays(recentEntries);
      if (consecutiveHighEffortDays >= 3) {
        riskAreas.push("Recovery");
        insights.push(`You've had ${consecutiveHighEffortDays} consecutive days of high-intensity training.`);
        recommendations.push("Schedule a recovery day to prevent fatigue accumulation and reduce injury risk.");
      }
    }
    
    // 3. Analyze health reports for injury patterns
    if (healthReports.length > 0) {
      const recentInjuries = healthReports.filter(report => 
        report.severity > 5 && 
        new Date(report.reportDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
      );
      
      if (recentInjuries.length > 0) {
        const bodyParts = new Set(recentInjuries.map(r => r.bodyPart));
        insights.push(`You've reported discomfort in: ${Array.from(bodyParts).join(', ')}.`);
        riskAreas.push("Injury Management");
        recommendations.push("Consider consulting with your team physiotherapist for a detailed assessment.");
      }
    }
    
    // 4. Analyze fitness metrics for progress and areas of improvement
    if (fitnessMetrics.length > 2) {
      const sortedMetrics = fitnessMetrics.sort((a, b) => 
        new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
      );
      
      // Compare latest metrics with previous test
      const latest = sortedMetrics[0];
      const previous = sortedMetrics[1];
      
      if (latest && previous) {
        if (latest.vo2Max < previous.vo2Max) {
          improvementAreas.push("Aerobic Capacity");
          recommendations.push("Include more zone 2 training to improve aerobic efficiency.");
        }
        
        if (latest.strengthScore < previous.strengthScore) {
          improvementAreas.push("Strength Levels");
          recommendations.push("Add 1-2 targeted strength sessions per week focusing on compound movements.");
        }
        
        if (latest.flexibility < previous.flexibility) {
          improvementAreas.push("Flexibility");
          recommendations.push("Incorporate a dedicated mobility routine into your warm-up and cool-down.");
        }
      }
    }
    
    // 5. Generate default recommendations if we don't have enough data
    if (recommendations.length === 0) {
      recommendations.push(
        "Stay consistent with your training schedule and recovery protocols.",
        "Remember to log your morning wellness data daily for more personalized recommendations.",
        "Schedule regular fitness assessments to track your progress."
      );
    }
    
    // Use the summary we set earlier or generate a default one
    if (summary === "Health assessment based on recent data" && insights.length > 0) {
      if (riskAreas.includes("Acute Illness")) {
        // Keep the fever summary we set earlier
      } else if (riskAreas.length > 0) {
        summary = `Attention needed: ${riskAreas[0].toLowerCase()} requires focus`;
      } else {
        summary = "Overall health indicators are within normal ranges";
      }
    }
    
    return {
      summary,
      recommendations,
      insights,
      riskAreas,
      improvementAreas
    };
  }
  
  /**
   * Calculate consecutive high effort training days
   */
  private calculateConsecutiveHighEffortDays(entries: TrainingEntry[]): number {
    // Sort entries by date, most recent first
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let consecutive = 0;
    let maxConsecutive = 0;
    
    for (const entry of sortedEntries) {
      if (entry.effortLevel >= 7) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }
    
    return maxConsecutive;
  }
  
  /**
   * Generate a summary based on insights and areas of focus
   */
  private generateSummary(
    insights: string[], 
    riskAreas: string[], 
    improvementAreas: string[]
  ): string {
    let summary = "Based on your recent data, ";
    
    if (riskAreas.length > 0) {
      summary += `we've identified potential risk areas in: ${riskAreas.join(', ')}. `;
    }
    
    if (improvementAreas.length > 0) {
      summary += `We recommend focusing on improving: ${improvementAreas.join(', ')}. `;
    }
    
    if (insights.length > 0) {
      summary += "Key insights: " + insights[0];
      if (insights.length > 1) {
        summary += ` and ${insights.length - 1} more.`;
      }
    }
    
    if (riskAreas.length === 0 && improvementAreas.length === 0) {
      summary = "Your current training and recovery patterns appear to be well balanced. Continue monitoring for more personalized recommendations.";
    }
    
    return summary;
  }
  
  /**
   * Generate a unique ID for the recommendation
   */
  private generateUniqueId(): string {
    return 'rec_' + Math.random().toString(36).substring(2, 15);
  }
}