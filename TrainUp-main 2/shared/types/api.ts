// API Response Types for Training Load Analytics

export interface WeeklyLoadRow {
  date: string;
  Field: number;
  Gym: number;
  Match: number;
  total: number;
  acwr?: number;
}

export interface AcwrDataPoint {
  date: string;
  acute: number;
  chronic: number;
  acwr: number;
}

export interface TrainingSessionResponse {
  id: string;
  date: string;
  type: string;
  sessionNumber: number;
  avgRPE: number;
  participants: number;
  totalAthletes: number;
  duration: number;
  calculatedAU: number;
}

export interface TenWeekLoadData {
  week: string;
  weekStart: string;
  Field: number;
  Gym: number;
  Match: number;
  total: number;
  acwr: number;
}

export interface KeyMetricsResponse {
  teamRecovery: number;
  teamReadiness: number;
  teamEnergy: number;
  alerts: Array<{
    athleteId: number;
    athleteName: string;
    type: 'injury_risk' | 'poor_recovery' | 'low_readiness';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface AthleteHealthData {
  athleteId: number;
  name: string;
  readinessScore: number;
  trend: 'improving' | 'declining' | 'neutral';
  issues: string[];
}