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
      const raw = await res.json(); // [{week, field, gym, match}]
      
      // 1. Ensure we always return 10 items (oldest→newest)
      const weeksNeeded = 10 - raw.length;
      if (weeksNeeded > 0) {
        const oldestWeekStart = raw.length
          ? new Date(raw[0].week + 'T00:00:00Z')
          : dateFns.startOfISOWeek(dateFns.subWeeks(new Date(), 9));
        for (let i = weeksNeeded - 1; i >= 0; i--) {
          const wkStart = dateFns.format(
            dateFns.addWeeks(oldestWeekStart, -i - 1),
            'yyyy-\\WII'
          );
          raw.unshift({
            week: wkStart,
            field: 0,
            gym: 0,
            match: 0
          });
        }
      }
      
      return raw.map((w: any, idx: number, arr: any[]) => {
        const total = (w.field || 0) + (w.gym || 0) + (w.match || 0);
        
        // Calculate chronic load as mean of current + prev 3 weeks (if exist)
        const slice = arr.slice(Math.max(0, idx - 3), idx + 1);
        const chronic = slice.reduce((sum, r) => {
          const weekTotal = (r.field || 0) + (r.gym || 0) + (r.match || 0);
          return sum + weekTotal;
        }, 0) / Math.max(slice.length, 1);
        
        const acwr = chronic === 0 ? 0 : +(total / chronic).toFixed(2);
        
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