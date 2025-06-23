import { useQuery } from "@tanstack/react-query";

export const useKeyMetrics = () => {
  const { data: athleteReadiness } = useQuery<any[]>({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  const { data: athleteRisk } = useQuery<any[]>({
    queryKey: ["/api/analytics/injury-risk-factors"],
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  // Calculate metrics from real data with daily reset logic
  const calculateMetrics = () => {
    if (!athleteReadiness || !athleteRisk || !Array.isArray(athleteReadiness)) {
      return {
        avgRecovery: 0,
        avgReadiness: 0,
        highRisk: 0,
        lowReadiness: 0,
        isLoading: true,
        isPendingData: false
      };
    }

    // Check if we have TODAY's data from any athletes
    const today = new Date().toISOString().split('T')[0];
    const athletesWithTodaysData = athleteReadiness.filter((athlete: any) => {
      return athlete.readinessScore > 0 && 
             !athlete.issues?.includes("No recent data") &&
             !athlete.issues?.includes("No data from today");
    });

    // If no athletes have submitted data today, show pending state
    if (athletesWithTodaysData.length === 0) {
      return {
        avgRecovery: 0,
        avgReadiness: 0,
        highRisk: 0,
        sickInjured: 0,
        isLoading: false,
        isPendingData: true
      };
    }

    // Calculate average recovery (normalized to 1-5 scale)
    const avgRecovery = athletesWithTodaysData.reduce((sum: number, athlete: any) => 
      sum + Math.floor(athlete.readinessScore / 20), 0) / athletesWithTodaysData.length;

    // Calculate average readiness (keep as percentage)
    const avgReadiness = athletesWithTodaysData.reduce((sum: number, athlete: any) => 
      sum + athlete.readinessScore, 0) / athletesWithTodaysData.length;

    // Count high risk athletes (readiness < 60% or have multiple issues)
    const highRisk = athletesWithTodaysData.filter((athlete: any) => 
      athlete.readinessScore < 60 || (athlete.issues && athlete.issues.length >= 3)
    ).length;

    // Count sick/injured athletes (those with health-related issues)
    const sickInjured = athletesWithTodaysData.filter((athlete: any) => {
      const issues = athlete.issues || [];
      return issues.some((issue: string) => 
        issue.includes('soreness') || 
        issue.includes('injury') || 
        issue.includes('Sick') ||
        issue.includes('Fever') ||
        issue.includes('Sore Throat') ||
        issue.includes('Runny Nose') ||
        issue.includes('Headache') ||
        issue.includes('Fatigue')
      );
    }).length;

    return {
      avgRecovery: Number(avgRecovery.toFixed(1)),
      avgReadiness: Number(avgReadiness.toFixed(0)),
      highRisk,
      sickInjured,
      isLoading: false,
      isPendingData: false
    };
  };

  return calculateMetrics();
};