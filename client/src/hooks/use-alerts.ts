import { useQuery } from "@tanstack/react-query";

export interface AlertRow {
  athleteId: number;
  name: string;
  type: "injury" | "sick" | "acwr";
  note: string;
}

export const useAlerts = () => {
  // Include today's date in query key to ensure fresh data daily
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery<AlertRow[]>({
    queryKey: ["/api/alerts/today", today],
    queryFn: async () => {
      const response = await fetch("/api/alerts/today", {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      return response.json();
    },
    // Refetch every 30 seconds to catch new diary submissions
    refetchInterval: 30000,
  });
};