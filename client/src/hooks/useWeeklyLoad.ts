import { useQuery } from '@tanstack/react-query';

interface WeeklyLoadData {
  week: string;
  weekLabel: string;
  field: number;
  gym: number;
  match: number;
  total: number;
  acwr: number;
}

export function useWeeklyLoad(athleteId?: number) {
  return useQuery<WeeklyLoadData[]>({
    queryKey: ['/api/analytics/weekly-load', athleteId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (athleteId) {
        params.set('athleteId', athleteId.toString());
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/weekly-load?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weekly load data');
      }

      return response.json();
    },
  });
}
