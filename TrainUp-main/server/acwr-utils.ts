/**
 * ACWR (Acute:Chronic Workload Ratio) Utilities
 * Implements proper ACWR calculations and zone classifications
 */

export interface WeeklyLoad {
  week: string;
  load: number;
}

export interface ACWRResult {
  acwr: number | null;
  status: string;
  color: string;
  zone: string;
}

/**
 * Compute ACWR from weekly loads
 * @param weeklyLoads Array of weekly load data, should be sorted by most recent first
 * @returns ACWR value or null if insufficient data
 */
export function computeACWR(weeklyLoads: WeeklyLoad[]): number | null {
  // Sort by most recent week first
  const recentWeeks = weeklyLoads
    .filter(w => w.load > 0) // Only include weeks with actual data
    .sort((a, b) => b.week.localeCompare(a.week));

  if (recentWeeks.length < 4) {
    return null; // Not enough data for ACWR
  }

  // Acute load: current week (most recent)
  const acuteLoad = recentWeeks[0].load;

  // Chronic load: average of previous 3 weeks
  const chronicLoad = recentWeeks.slice(1, 4).reduce((sum, w) => sum + w.load, 0) / 3;

  if (chronicLoad === 0) {
    return null; // Avoid division by zero
  }

  const acwr = acuteLoad / chronicLoad;
  return Math.round(acwr * 100) / 100; // Round to 2 decimal places
}

/**
 * Classify ACWR value into zones with status and color
 * @param acwr ACWR value or null
 * @returns Classification object with status, color, and zone
 */
export function classifyACWR(acwr: number | null): ACWRResult {
  if (acwr === null) {
    return {
      acwr,
      status: "Insufficient data",
      color: "gray",
      zone: "unknown"
    };
  }

  if (acwr < 0.8) {
    return {
      acwr,
      status: "Underload — safely increase training gradually",
      color: "blue",
      zone: "undertraining"
    };
  } else if (acwr <= 1.2) {
    return {
      acwr,
      status: "Optimal Zone",
      color: "green", 
      zone: "optimal"
    };
  } else if (acwr <= 1.3) {
    return {
      acwr,
      status: "Caution Zone",
      color: "yellow",
      zone: "caution"
    };
  } else {
    return {
      acwr,
      status: "High Risk Zone",
      color: "red",
      zone: "injury_risk"
    };
  }
}

/**
 * Get ACWR zone boundaries for UI display
 */
export function getACWRZones() {
  return {
    ok: "≤ 1.2",
    caution: "1.2 – 1.3", 
    high_risk: "> 1.3"
  };
}

/**
 * Calculate daily ACWR using rolling 7-day vs 28-day averages
 * @param dailyLoads Object with date strings as keys and load values
 * @param targetDate Date to calculate ACWR for
 * @returns ACWR value or null
 */
export function calculateDailyACWR(
  dailyLoads: Record<string, number>, 
  targetDate: string
): number | null {
  const target = new Date(targetDate);
  
  // Calculate 7-day acute load (including target date)
  let acuteSum = 0;
  let acuteDays = 0;
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(target);
    checkDate.setDate(target.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dailyLoads[dateStr] !== undefined) {
      acuteSum += dailyLoads[dateStr];
      acuteDays++;
    }
  }

  // Calculate 28-day chronic load
  let chronicSum = 0;
  let chronicDays = 0;
  for (let i = 0; i < 28; i++) {
    const checkDate = new Date(target);
    checkDate.setDate(target.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dailyLoads[dateStr] !== undefined) {
      chronicSum += dailyLoads[dateStr];
      chronicDays++;
    }
  }

  // Need at least 21 days of chronic data for meaningful ACWR
  if (chronicDays < 21) {
    return null;
  }

  const acuteAvg = acuteDays > 0 ? acuteSum / acuteDays : 0;
  const chronicAvg = chronicDays > 0 ? chronicSum / chronicDays : 0;

  if (chronicAvg === 0) {
    return null;
  }

  const acwr = acuteAvg / chronicAvg;
  return Math.round(acwr * 100) / 100;
}