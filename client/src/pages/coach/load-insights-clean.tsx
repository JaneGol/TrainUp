import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Card from "@/components/ui/card-improved";
import TrainingLoadColumns from "@/components/TrainingLoadColumns";
import WeekSelect, { buildWeekOptions } from "@/components/WeekSelect";
import LegendChips from "@/components/LegendChips";
import { useWeekLoad } from "@/hooks/useWeekLoad";
import { useTenWeekCombo } from "@/hooks/useTenWeekCombo";
import CombinedLoadAcwrChart from "@/components/CombinedLoadAcwrChart";
import { format, parseISO } from 'date-fns';

// Mobile detection hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useMemo(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);
  
  return matches;
}

export default function LoadInsights() {
  const [, navigate] = useLocation();
  const [athleteId, setAthleteId] = useState<string>("all");
  const [compact, setCompact] = useState(false);
  
  // Mobile detection
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  // Default to current ISO week (Week 22) - May 26, 2025
  const weekOpts = buildWeekOptions();
  const currentWeekValue = "2025-05-26"; // Week 22 starts on Monday May 26, 2025
  const [weekStart, setWeekStart] = useState<string>(
    weekOpts.find(o => o.value === currentWeekValue)?.value ?? weekOpts[0].value
  );
  
  // Get athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get current week metadata for display
  const weekMeta = weekOpts.find(o => o.value === weekStart) || weekOpts[0];

  // Use the proper weekly load data hook for 7-day detailed view
  const { data: weeklyLoadData = [], isLoading: weeklyLoadLoading } = useWeekLoad(athleteId, weekStart);

  // Calculate enhanced weekly metrics from the weekly load data
  const weeklyMetrics = useMemo(() => {
    const totalAU = weeklyLoadData.reduce((sum, entry) => sum + (entry.total || 0), 0);
    const sessions = weeklyLoadData.reduce((sum, entry) => sum + (entry.sessionCount || 0), 0);
    const avgAcwr = weeklyLoadData.length > 0 
      ? (weeklyLoadData.reduce((sum, entry) => sum + (entry.acwr || 0), 0) / weeklyLoadData.length)
      : 0;
    
    // Calculate training monotony (coefficient of variation)
    const activeDays = weeklyLoadData.filter(day => day.total > 0);
    const avgLoad = activeDays.length > 0 ? totalAU / activeDays.length : 0;
    const variance = activeDays.length > 1 
      ? activeDays.reduce((sum, day) => sum + Math.pow(day.total - avgLoad, 2), 0) / (activeDays.length - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    const monotony = avgLoad > 0 ? (stdDev / avgLoad) : 0;
    
    // Calculate training strain (total load * monotony)
    const strain = totalAU * (1 + monotony);
    
    // Calculate workload distribution
    const fieldLoad = weeklyLoadData.reduce((sum, entry) => sum + (entry.Field || 0), 0);
    const gymLoad = weeklyLoadData.reduce((sum, entry) => sum + (entry.Gym || 0), 0);
    const matchLoad = weeklyLoadData.reduce((sum, entry) => sum + (entry.Match || 0), 0);
    
    return { 
      totalAU, 
      sessions, 
      avgAcwr: avgAcwr.toFixed(2),
      monotony: monotony.toFixed(2),
      strain: strain.toFixed(0),
      fieldLoad,
      gymLoad,
      matchLoad,
      activeDays: activeDays.length
    };
  }, [weeklyLoadData]);

  // Get ACWR data with real-time updates
  const { data: acwrData = [] } = useQuery({
    queryKey: ["/api/analytics/acwr"],
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: true,
  });

  // Get combined 10-week load and ACWR data
  const { data: tenWeekComboData = [] } = useTenWeekCombo(athleteId);

  // Use the weekly load data directly - it already contains all 7 days
  const weekTrainingData = weeklyLoadData;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/coach")}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Load Insights</h1>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="text-sm font-medium text-zinc-300 mb-2 block">
              Athlete
            </Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select athlete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Athletes</SelectItem>
                {(athletes as any[]).map((athlete: any) => (
                  <SelectItem key={athlete.id} value={athlete.id.toString()}>
                    {athlete.firstName} {athlete.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-zinc-300 mb-2 block">
              Week
            </Label>
            <Select value={weekStart} onValueChange={setWeekStart} className="w-full">
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue>
                  {weekMeta.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {weekOpts.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weekly Training Load Card */}
        <Card className="bg-zinc-800/90 px-4 py-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="chart-title mb-1 text-center">Weekly Training Load</h2>
            </div>
            {isMobile && (
              <button 
                onClick={() => setCompact(!compact)}
                className="text-[11px] underline text-zinc-400 hover:text-white absolute top-4 right-4"
              >
                {compact ? 'Bars' : 'Totals'}
              </button>
            )}
          </div>
          <p className="chart-meta mb-3">
            {weekMeta.label} │ Total AU: {weeklyMetrics.totalAU} │ Sessions: {weeklyMetrics.sessions} │ Active Days: {weeklyMetrics.activeDays}
          </p>
          <div className={compact ? "space-y-1" : "h-64"}>
            {compact ? (
              // Mobile compact totals view
              <div className="space-y-1">
                {weekTrainingData.map(day => (
                  <div key={day.date} className="flex justify-between text-[11px] py-1 border-b border-zinc-800">
                    <span className="text-zinc-300">{format(parseISO(day.date), 'dd.MM')}</span>
                    <span className="text-white font-medium">{day.total} AU</span>
                  </div>
                ))}
              </div>
            ) : (
              // Full chart view
              <TrainingLoadColumns data={weekTrainingData} />
            )}
          </div>
          <div className="mt-3">
            <LegendChips keys={['Field','Gym','Match']} />
          </div>
        </Card>

        <div className="h-8"></div>{/* 32-px spacer */}

        {/* Advanced Workload Metrics */}
        <Card className="bg-zinc-800/90 px-4 py-4">
          <h2 className="chart-title mb-1">Advanced Workload Metrics</h2>
          <p className="chart-meta mb-4">Training load analysis and distribution patterns</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Training Monotony */}
            <div className="bg-zinc-900 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Training Monotony</div>
              <div className="text-lg font-bold text-white">{weeklyMetrics.monotony}</div>
              <div className="text-xs text-zinc-500">Variability Index</div>
            </div>
            
            {/* Training Strain */}
            <div className="bg-zinc-900 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Training Strain</div>
              <div className="text-lg font-bold text-white">{weeklyMetrics.strain}</div>
              <div className="text-xs text-zinc-500">
                Training Strain combines weekly load<br/>
                with monotony. 4,000-6,000 = moderate,<br/>
                {'>'}7,500 indicates high cumulative stress.
              </div>
            </div>
            
            {/* ACWR Average */}
            <div className="bg-zinc-900 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Avg ACWR</div>
              <div className="text-lg font-bold text-white">{weeklyMetrics.avgAcwr}</div>
              <div className="text-xs text-zinc-500">Acute:Chronic Ratio</div>
            </div>
            
            {/* Load Distribution */}
            <div className="bg-zinc-900 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Primary Type</div>
              <div className="text-lg font-bold text-white">
                {weeklyMetrics.fieldLoad >= weeklyMetrics.gymLoad && weeklyMetrics.fieldLoad >= weeklyMetrics.matchLoad 
                  ? 'Field' 
                  : weeklyMetrics.gymLoad >= weeklyMetrics.matchLoad 
                    ? 'Gym' 
                    : 'Match'}
              </div>
              <div className="text-xs text-zinc-500">
                {Math.round((Math.max(weeklyMetrics.fieldLoad, weeklyMetrics.gymLoad, weeklyMetrics.matchLoad) / weeklyMetrics.totalAU) * 100)}% of load
              </div>
            </div>
          </div>
          
          {/* Load Distribution Bar */}
          <div className="mt-4">
            <div className="text-xs text-zinc-400 mb-2">Training Type Distribution</div>
            <div className="flex h-3 rounded-full overflow-hidden bg-zinc-900">
              {weeklyMetrics.totalAU > 0 && (
                <>
                  <div 
                    className="bg-[#b5f23d]" 
                    style={{ width: `${(weeklyMetrics.fieldLoad / weeklyMetrics.totalAU) * 100}%` }}
                  />
                  <div 
                    className="bg-[#547aff]" 
                    style={{ width: `${(weeklyMetrics.gymLoad / weeklyMetrics.totalAU) * 100}%` }}
                  />
                  <div 
                    className="bg-[#ff6b6b]" 
                    style={{ width: `${(weeklyMetrics.matchLoad / weeklyMetrics.totalAU) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Field: {weeklyMetrics.fieldLoad} AU</span>
              <span>Gym: {weeklyMetrics.gymLoad} AU</span>
              <span>Match: {weeklyMetrics.matchLoad} AU</span>
            </div>
          </div>
        </Card>

        <div className="h-8"></div>{/* 32-px spacer */}

        {/* Combined Weekly Load & ACWR Chart */}
        <CombinedLoadAcwrChart data={tenWeekComboData} />

        {/* Legacy ACWR Chart - Temporarily Hidden */}
        <div style={{display: 'none'}}>
        <Card className="bg-zinc-800/90 px-4 py-4">
          <h2 className="chart-title mb-1">ACWR – Acute:Chronic Workload Ratio (Last 30 Days)</h2>
          <p className="chart-meta mb-3">Risk monitoring and training load balance</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={acwrData as any[]}>
                <CartesianGrid strokeOpacity={0.15} />
                <ReferenceArea y1={0.8} y2={1.3} stroke="none" fill="#10b981" fillOpacity={0.08} />
                <ReferenceArea y1={1.3} y2={1.8} stroke="none" fill="#f87171" fillOpacity={0.05} />
                <ReferenceArea y1={0.5} y2={0.8} stroke="none" fill="#38bdf8" fillOpacity={0.05} />
                {/* Clear boundary lines */}
                <ReferenceLine y={0.8} stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.8} strokeDasharray="3 3" />
                <ReferenceLine y={1.3} stroke="#ef4444" strokeWidth={2} strokeOpacity={0.8} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => format(parseISO(d), 'dd.MM')}
                  tick={{ className: 'tick-font' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis 
                  domain={[0.5, 1.8]}
                  tick={{ className: 'tick-font' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  dataKey="ratio" 
                  type="monotone" 
                  stroke="#facc15" 
                  strokeWidth={2} 
                  dot={{r:3}} 
                />
              </LineChart>
            </ResponsiveContainer>
            <LegendChips keys={['ACWR']} acwrLine />
            {/* ACWR Zone Explanation */}
            <p className="mt-3 text-[11px] text-zinc-400 text-center">
              Green band = optimal ACWR&nbsp;(0.8 – 1.3).<br className="sm:hidden"/>
              Below 🟦 0.8 ⇒ under-training, above 🟥 1.3 ⇒ elevated injury risk.
            </p>
          </div>
        </Card>

        {/* Weekly Work-Load (10 weeks) */}
        <Card className="bg-zinc-800/90 px-4 py-4 mt-6">
          <h2 className="chart-title mb-1">Weekly Work-Load Trends (Last 10 Weeks)</h2>
          <p className="chart-meta mb-4">Training volume and type distribution over time</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenWeekComboData as any[]}>
                <CartesianGrid strokeOpacity={0.15} />
                <XAxis 
                  dataKey="weekStart" 
                  tick={{ className: 'tick-font' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis 
                  tick={{ className: 'tick-font' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="Field" stackId="a" fill="#b5f23d" name="Field" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Gym" stackId="a" fill="#547aff" name="Gym" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Match" stackId="a" fill="#ff6b6b" name="Match/Game" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3">
            <LegendChips keys={['Field','Gym','Match']} />
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}