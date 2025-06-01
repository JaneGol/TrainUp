import { useQuery } from "@tanstack/react-query";
import * as dateFns from 'date-fns';

export interface TenWeekComboData {
  weekStart: string;
  Field: number;
  Gym: number;
  Match: number;
  total: number;
  chronic: number;
  acwr: number;
}

export function useTenWeekCombo(athleteId: string) {
  return useQuery<TenWeekComboData[]>({
    queryKey: ['tenWeekCombo', athleteId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/weekly-load`);
      if (!res.ok) {
        throw new Error('Failed to fetch ten week combo data');
      }
      const raw = await res.json(); // Server already ensures 10 weeks
      
      return raw.map((w: any) => {
        // Server already calculates totals and ACWR
        return {
          weekStart: w.weekLabel || w.week, // Use weekLabel if available
          Field: w.field || 0,
          Gym: w.gym || 0,
          Match: w.match || 0,
          total: w.total || 0,
          chronic: w.chronic || 0,
          acwr: w.acwr || 0
        };
      });
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: true,
  });
}