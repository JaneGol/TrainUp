import { useQuery } from "@tanstack/react-query";

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
      const raw = await res.json(); // [{week, field, gym, match}]
      
      return raw.map((w: any, idx: number, arr: any[]) => {
        const total = (w.field || 0) + (w.gym || 0) + (w.match || 0);
        
        // Calculate chronic load as mean of current + prev 3 weeks (if exist)
        const slice = arr.slice(Math.max(0, idx - 3), idx + 1);
        const chronic = slice.reduce((s, r) => {
          const weekTotal = (r.field || 0) + (r.gym || 0) + (r.match || 0);
          return s + weekTotal;
        }, 0) / slice.length;
        
        const acwr = chronic > 0 ? +(total / chronic).toFixed(2) : 0;
        
        return {
          weekStart: w.week,
          Field: w.field || 0,
          Gym: w.gym || 0,
          Match: w.match || 0,
          total,
          chronic,
          acwr
        };
      });
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: true,
  });
}