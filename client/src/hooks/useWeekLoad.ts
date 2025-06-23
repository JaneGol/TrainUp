import { useQuery } from "@tanstack/react-query";

export interface WeekLoadData {
  date: string;
  Field: number;
  Gym: number;
  Match: number;
  total: number;
  sessionCount: number;
  acwr: number;
}

export const useWeekLoad = (athleteId: string, weekStart: string) => {
  return useQuery<WeekLoadData[]>({
    queryKey: ["weekLoad", athleteId, weekStart],
    queryFn: async () => {
      const params = new URLSearchParams({
        ath: athleteId,
        weekStart: weekStart,
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/load/week?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch weekly load data");
      }

      return response.json();
    },
  });
};
