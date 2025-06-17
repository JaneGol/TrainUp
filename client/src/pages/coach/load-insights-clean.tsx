import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getAcwrSmoothed, formatAcwrDisplay } from "@/utils/getAcwrSmoothed";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
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
import { ACWRStatusCard } from "@/components/ACWRStatusCard";
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
  
  // Default to the current week (first in array since it's reversed)
  const weekOpts = buildWeekOptions();
  const [weekStart, setWeekStart] = useState<string>(
    weekOpts[0]?.value ?? ""
  );
  
  // Get athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get current week metadata for display
  const weekMeta = weekOpts.find(o => o.value === weekStart) || weekOpts[0];

  // Use the proper weekly load data hook for 7-day detailed view
  const { data: weeklyLoadData = [], isLoading: weeklyLoadLoading } = useWeekLoad(athleteId, weekStart);

  // Get combined 10-week data for the unified chart
  const { data: tenWeekComboData = [], isLoading: tenWeekComboLoading } = useTenWeekCombo(athleteId);

  // Get weekly load data for the past 4 weeks for consistency analysis
  const { data: weeklyLoadTrends = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/weekly-load"],
    staleTime: 30_000,
  });

  // Get ACWR data with real-time updates
  const { data: acwrData = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/acwr"],
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: true,
  });

  // Calculate enhanced weekly metrics from the weekly load data
  const weeklyMetrics = useMemo(() => {
    const totalAU = weeklyLoadData.reduce((sum, entry) => sum + (entry.total || 0), 0);
    const sessions = weeklyLoadData.reduce((sum, entry) => sum + (entry.sessionCount || 0), 0);
    
    // Calculate ACWR using unified helper - use the actual ACWR data from API
    const latestAcwr = Array.isArray(acwrData) && acwrData.length > 0 ? acwrData[acwrData.length - 1] : null;
    const acuteLoad = latestAcwr?.acute || 0;
    const chronicLoad = latestAcwr?.chronic || 0;
    
    const acwrValue = getAcwrSmoothed(acuteLoad, chronicLoad);
    const avgAcwr = formatAcwrDisplay(acwrValue);
    
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
      avgAcwr, // Already formatted as string
      monotony: monotony.toFixed(2),
      strain: strain.toFixed(0),
      fieldLoad,
      gymLoad,
      matchLoad,
      activeDays: activeDays.length
    };
  }, [weeklyLoadData, acwrData]);

  // Calculate weekly load consistency data for the past 4 weeks
  const weeklyConsistency = useMemo(() => {
    if (!weeklyLoadTrends || weeklyLoadTrends.length < 4) return null;
    
    const last4Weeks = weeklyLoadTrends.slice(-4).map(week => ({
      week: week.week,
      total: (week.field || 0) + (week.gym || 0) + (week.match || 0)
    }));
    
    const weekTotals = last4Weeks.map(w => w.total);
    const maxWeek = Math.max(...weekTotals);
    const currentWeek = weekTotals[weekTotals.length - 1];
    const changeFromHighest = maxWeek > 0 ? ((currentWeek - maxWeek) / maxWeek * 100) : 0;
    
    // Calculate week-to-week changes for color coding
    const coloredWeeks = last4Weeks.map((week, index) => {
      if (index === 0) return { ...week, color: 'bg-zinc-600' };
      
      const prevTotal = last4Weeks[index - 1].total;
      const change = prevTotal > 0 ? Math.abs((week.total - prevTotal) / prevTotal * 100) : 0;
      
      let color = 'bg-green-500'; // Stable
      if (change > 25) color = 'bg-red-500'; // Volatile
      else if (change > 10) color = 'bg-yellow-500'; // Moderate
      
      return { ...week, color };
    });
    
    return {
      weeks: coloredWeeks,
      changeFromHighest: changeFromHighest.toFixed(0)
    };
  }, [weeklyLoadTrends]);

  // Calculate intensity distribution based on session RPE ranges
  const intensityDistribution = useMemo(() => {
    if (!weeklyLoadData || weeklyLoadData.length === 0) return null;
    
    const totalLoad = weeklyMetrics.totalAU;
    if (totalLoad === 0) return null;
    
    // Estimate intensity zones based on load distribution
    // Low: Field training typically lower intensity, Gym moderate, Match high
    const lowIntensity = weeklyMetrics.fieldLoad * 0.6 + weeklyMetrics.gymLoad * 0.3;
    const mediumIntensity = weeklyMetrics.fieldLoad * 0.3 + weeklyMetrics.gymLoad * 0.5 + weeklyMetrics.matchLoad * 0.2;
    const highIntensity = weeklyMetrics.fieldLoad * 0.1 + weeklyMetrics.gymLoad * 0.2 + weeklyMetrics.matchLoad * 0.8;
    
    const lowPct = Math.round((lowIntensity / totalLoad) * 100);
    const mediumPct = Math.round((mediumIntensity / totalLoad) * 100);
    const highPct = 100 - lowPct - mediumPct;
    
    return {
      low: Math.max(0, lowPct),
      medium: Math.max(0, mediumPct),
      high: Math.max(0, highPct)
    };
  }, [weeklyMetrics]);



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
          <div className="text-xs text-zinc-400 mt-3 text-center">
            <div>*AU = Arbitrary Units — a combined measure of training volume and intensity</div>
            <div>(duration × session RPE)*</div>
          </div>
        </Card>

        <div className="h-8"></div>{/* 32-px spacer */}

        {/* Advanced Workload Metrics */}
        <Card className="bg-zinc-800/90 px-4 py-4">
          <h2 className="chart-title mb-1">Advanced Workload Metrics</h2>
          <p className="chart-meta mb-4">Training load analysis and distribution patterns</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Training Monotony */}
            <div className="bg-zinc-900 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Training Monotony</div>
              <div className="text-lg font-bold text-white">{weeklyMetrics.monotony}</div>
              <div className="text-xs text-zinc-500 mb-2">Variability Index</div>
              <div className="text-xs text-zinc-500">
                • 0.8–1.3 = ideal variety<br/>
                • {'<'}0.8 = too even — fatigue risk<br/>
                • {'>'}1.3 = erratic — injury/illness risk
              </div>
            </div>
            
            {/* Training Strain */}
            <div className="bg-zinc-900 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Training Strain</div>
              <div className="text-lg font-bold text-white">{weeklyMetrics.strain}</div>
              <div className="text-xs text-zinc-500">
                Training Strain combines weekly load<br/>
                with monotony:<br/>
                <br/>
                4,000 - 6,000 = moderate<br/>
                {'>'}7,500 indicates high cumulative stress
              </div>
            </div>
            
            {/* ACWR Status Card */}
            <div className="bg-zinc-900 rounded-lg">
              <ACWRStatusCard athleteId={athleteId === "all" ? undefined : parseInt(athleteId)} />
            </div>
            
            {/* Insight Cards Column */}
            <div className="space-y-4">
              {/* Weekly Load Consistency */}
              <div className="bg-zinc-900 rounded-lg p-3">
                <div className="text-xs text-zinc-400 mb-1">Weekly Load Consistency</div>
                {weeklyConsistency ? (
                  <>
                    <div className="flex items-end space-x-1 h-12 mb-2">
                      {weeklyConsistency.weeks.map((week, index) => {
                        const maxHeight = Math.max(...weeklyConsistency.weeks.map(w => w.total));
                        const height = maxHeight > 0 ? (week.total / maxHeight) * 100 : 0;
                        return (
                          <div key={week.week} className="flex-1 flex flex-col items-center">
                            <div 
                              className={`w-full ${week.color} rounded-sm`}
                              style={{ height: `${Math.max(height, 8)}%` }}
                            />
                            <div className="text-[9px] text-zinc-500 mt-1">
                              {week.week.replace('2025-', '')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-zinc-500">
                      → Change from highest week: {weeklyConsistency.changeFromHighest}%
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-zinc-500">Insufficient data for trend analysis</div>
                )}
              </div>
              
              {/* Intensity Distribution */}
              <div className="bg-zinc-900 rounded-lg p-3">
                <div className="text-xs text-zinc-400 mb-1">Intensity Distribution</div>
                {intensityDistribution ? (
                  <>
                    <div className="flex h-4 rounded-full overflow-hidden bg-zinc-800 mb-2">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${intensityDistribution.low}%` }}
                      />
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${intensityDistribution.medium}%` }}
                      />
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${intensityDistribution.high}%` }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Low: {intensityDistribution.low}%</span>
                        <span>Medium: {intensityDistribution.medium}%</span>
                        <span>High: {intensityDistribution.high}%</span>
                      </div>
                      <div className="text-[9px] text-zinc-600">
                        Balanced intensity promotes adaptation and recovery.
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-zinc-500">No training data available</div>
                )}
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
        {tenWeekComboLoading || !tenWeekComboData || tenWeekComboData.length === 0 ? (
          <Card className="bg-zinc-800/90 px-4 py-4">
            <h2 className="chart-title mb-1">Combined Weekly Load & ACWR (Last 10 Weeks)</h2>
            <p className="chart-meta mb-4">Unified view of training volume and injury risk trends</p>
            <div className="h-80 flex items-center justify-center">
              <div className="text-zinc-400">Loading combined chart...</div>
            </div>
          </Card>
        ) : (
          <CombinedLoadAcwrChart data={tenWeekComboData} />
        )}

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
                <RechartsTooltip 
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
                <RechartsTooltip 
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