import { useQuery } from "@tanstack/react-query";

export const useKeyMetrics = () => {
  const { data: athleteReadiness } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  const { data: athleteRisk } = useQuery({
    queryKey: ["/api/analytics/injury-risk-factors"],
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  // Calculate metrics from real data
  const calculateMetrics = () => {
    if (!athleteReadiness || !athleteRisk) {
      return {
        avgRecovery: 0,
        avgReadiness: 0,
        highRisk: 0,
        lowReadiness: 0,
        isLoading: true
      };
    }

    // Filter out athletes with no data
    const activeAthletes = athleteReadiness.filter((athlete: any) => 
      athlete.readinessScore > 0 && !athlete.issues?.includes("No recent data")
    );

    if (activeAthletes.length === 0) {
      return {
        avgRecovery: 0,
        avgReadiness: 0,
        highRisk: 0,
        sickInjured: 0,
        isLoading: false
      };
    }

    // Calculate average recovery (normalized to 1-5 scale)
    const avgRecovery = activeAthletes.reduce((sum: number, athlete: any) => 
      sum + Math.floor(athlete.readinessScore / 20), 0) / activeAthletes.length;

    // Calculate average readiness (keep as percentage)
    const avgReadiness = activeAthletes.reduce((sum: number, athlete: any) => 
      sum + athlete.readinessScore, 0) / activeAthletes.length;

    // Count high risk athletes (readiness < 60% or have multiple issues)
    const highRisk = activeAthletes.filter((athlete: any) => 
      athlete.readinessScore < 60 || (athlete.issues && athlete.issues.length >= 3)
    ).length;

    // Count sick/injured athletes (those with health-related issues)
    const sickInjured = athleteReadiness.filter((athlete: any) => {
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
      isLoading: false
    };
  };

  return calculateMetrics();
};