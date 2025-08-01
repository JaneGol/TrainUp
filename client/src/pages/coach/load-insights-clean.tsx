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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <ACWRStatusCard athleteId={athleteId === "all" ? undefined : parseInt(athleteId)} />
            
            {/* Weekly Load Consistency & Intensity Distribution */}
            <div className="grid grid-cols-1 gap-3 h-full">
              {/* Weekly Load Consistency */}
              <div className="bg-zinc-900 rounded-lg p-6 h-full flex flex-col">
                <div className="text-sm font-medium text-zinc-300 mb-4">Weekly Load Consistency</div>
                <div className="flex items-end justify-between gap-3 h-20 mb-4 flex-1">
                  {tenWeekComboData?.slice(-4).map((week, index) => {
                    if (!week) return null;
                    const weekData = tenWeekComboData?.slice(-4) || [];
                    const maxLoad = Math.max(...(weekData.map(w => w.total || 0) || [1]));
                    const weekLoad = week.total || 0;
                    const height = Math.max(16, (weekLoad / maxLoad) * 64);
                    
                    // Calculate percentage change from previous week
                    const prevWeek = index > 0 ? weekData[index - 1] : null;
                    const prevLoad = prevWeek?.total || 0;
                    const change = prevLoad > 0 ? Math.round(((weekLoad - prevLoad) / prevLoad) * 100) : 0;
                    const showChange = index > 0 && prevLoad > 0;
                    
                    // Use actual week numbers
                    const weekNumbers = [22, 23, 24, 25];
                    const weekNum = weekNumbers[index] || (22 + index);
                    
                    return (
                      <div key={week.weekStart || index} className="flex flex-col items-center flex-1 relative">
                        {/* Change indicator arrow */}
                        {showChange && (
                          <div className="absolute -top-1 flex items-center">
                            {change > 0 ? (
                              <div className="flex items-center text-green-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 3l7 7h-4v7H7v-7H3l7-7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[9px] ml-1">+{Math.abs(change)}%</span>
                              </div>
                            ) : change < 0 ? (
                              <div className="flex items-center text-red-400">
                                <svg className="w-3 h-3 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 3l7 7h-4v7H7v-7H3l7-7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[9px] ml-1">{change}%</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-zinc-500">
                                <span className="text-[9px]">—</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-[#CBFF00] to-[#9ACD32] rounded-sm opacity-90 mt-4"
                          style={{ height: `${height}px` }}
                        />
                        <div className="text-xs text-zinc-400 mt-2 font-medium">W{weekNum}</div>
                        <div className="text-[10px] text-zinc-500">{weekLoad}AU</div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
                <div className="text-xs text-zinc-400 text-center mt-auto">
                  Week-over-week load progression analysis
                </div>
              </div>

              {/* Intensity Distribution */}
              <div className="bg-zinc-900 rounded-lg p-6 h-full flex flex-col">
                <div className="text-sm font-medium text-zinc-300 mb-4">Intensity Distribution</div>
                <div className="flex-1 flex flex-col justify-center">
                  {(() => {
                    // Use actual training load data to calculate proper intensity distribution
                    const fieldLoad = weeklyMetrics.fieldLoad || 0;
                    const gymLoad = weeklyMetrics.gymLoad || 0;
                    const matchLoad = weeklyMetrics.matchLoad || 0;
                    const total = fieldLoad + gymLoad + matchLoad;
                    
                    if (total === 0) return (
                      <div className="text-center text-zinc-500 flex-1 flex items-center justify-center">
                        <div>No training data available</div>
                      </div>
                    );
                    
                    // Calculate based on training type characteristics
                    const lowIntensity = gymLoad * 0.8; // Most gym work is low intensity
                    const highIntensity = matchLoad + (fieldLoad * 0.2); // Match + some field work
                    const mediumIntensity = total - lowIntensity - highIntensity;
                    
                    const lowPct = Math.round((lowIntensity / total) * 100);
                    const medPct = Math.round((mediumIntensity / total) * 100);
                    const highPct = Math.round((highIntensity / total) * 100);
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex h-8 bg-zinc-800 rounded-md overflow-hidden">
                          <div className="bg-green-500 transition-all" style={{ width: `${lowPct}%` }}></div>
                          <div className="bg-yellow-500 transition-all" style={{ width: `${medPct}%` }}></div>
                          <div className="bg-red-500 transition-all" style={{ width: `${highPct}%` }}></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="text-xs text-zinc-400">
                            <div className="text-green-400 font-medium">{lowPct}%</div>
                            <div>Low</div>
                          </div>
                          <div className="text-xs text-zinc-400">
                            <div className="text-yellow-400 font-medium">{medPct}%</div>
                            <div>Med</div>
                          </div>
                          <div className="text-xs text-zinc-400">
                            <div className="text-red-400 font-medium">{highPct}%</div>
                            <div>High</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs text-zinc-500 text-center mt-4">
                  Balanced intensity helps reduce fatigue risk
                </div>
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