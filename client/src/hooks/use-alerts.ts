import { useQuery } from "@tanstack/react-query";

export interface Alert {
  athleteId: number;
  name: string;
  type: "injury" | "sick" | "acwr";
  note: string;
}

export const useAlerts = () => {
  const { data: alerts = [], isLoading, error } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/today"],
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  // Get athlete readiness data to check if all have submitted today's diaries
  const { data: athleteReadiness = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  // Calculate alert status
  const getAlertStatus = () => {
    if (isLoading) {
      return {
        hasAlerts: false,
        isPendingData: true,
        message: "Loading...",
        alerts: []
      };
    }

    // Check if there are actual health alerts first (prioritize showing health issues)
    if (alerts.length > 0) {
      return {
        hasAlerts: true,
        isPendingData: false,
        message: `${alerts.length} alert${alerts.length > 1 ? 's' : ''}`,
        alerts
      };
    }

    // Check if any athletes are missing today's data
    const athletesMissingData = athleteReadiness.filter((athlete: any) => 
      athlete.issues?.includes("No data from today") || 
      athlete.issues?.includes("No recent data")
    );

    if (athletesMissingData.length > 0) {
      return {
        hasAlerts: false,
        isPendingData: true,
        message: "Awaiting today's diaries…",
        alerts: []
      };
    }

    // All athletes have submitted data - no health alerts
    return {
      hasAlerts: false,
      isPendingData: false,
      message: "No health alerts. Everyone is healthy.",
      alerts: []
    };
  };

  return getAlertStatus();
};