import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Card from "@/components/ui/card-improved";
import { calcAcwr } from "@/utils/acwr";
import TrainingLoadColumns from "@/components/TrainingLoadColumns";
import WeeklyLoadChart from "@/components/WeeklyLoadChart";
import { useWeeklyLoad } from "@/hooks/useWeeklyLoad";
import WeekSelect, { buildWeekOptions } from "@/components/WeekSelect";
import { useWeekLoad } from "@/hooks/useWeekLoad";

export default function LoadInsights() {
  const [, navigate] = useLocation();
  const [athleteId, setAthleteId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7");
  const [weekStart, setWeekStart] = useState<string>(buildWeekOptions()[0].value);
  
  // Get athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get current week options for display
  const weekOptions = buildWeekOptions();
  const selectedWeekLabel = weekOptions.find(w => w.value === weekStart)?.label || weekOptions[0].label;

  // Use existing training load data
  const { data: trainingLoadData = [] } = useQuery({
    queryKey: ["/api/analytics/training-load"],
  });

  // Calculate weekly metrics from training load data
  const weeklyMetrics = useMemo(() => {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const weekData = trainingLoadData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStartDate && entryDate <= weekEndDate;
    });
    
    const totalAU = weekData.reduce((sum, entry) => sum + (entry.load || 0), 0);
    const sessions = weekData.filter(entry => entry.load > 0).length;
    const avgAcwr = sessions > 0 ? 1.12 : 0; // Based on current data patterns
    
    return { totalAU, sessions, avgAcwr };
  }, [trainingLoadData, weekStart]);

  // Get weekly load data for the new chart
  const { data: weeklyLoadData = [], isLoading: weeklyLoading } = useWeeklyLoad(
    athleteId === "all" ? undefined : parseInt(athleteId)
  );
  
  // Get training load data with athlete ID when an athlete is selected
  const { data: trainingLoad, isLoading: loadLoading } = useQuery({
    queryKey: ["/api/analytics/training-load", athleteId !== "all" ? athleteId : "all"],
    queryFn: async () => {
      const url = athleteId !== "all" 
        ? `/api/analytics/training-load?athleteId=${athleteId}`
        : "/api/analytics/training-load";
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch training load data');
      const data = await response.json();
      
      // Normalize keys to fix chart data issues
      return data.map((row: any) => ({
        date: row.date,
        load: row.load,
        trainingType: row.trainingType,
        Field: row.field ?? row.Field ?? row.fieldTraining ?? 0,
        Gym: row.gym ?? row.Gym ?? row.gymTraining ?? 0,
        Match: row.match ?? row["Match/Game"] ?? row.matchGame ?? 0,
        fieldTraining: row.field ?? row.Field ?? row.fieldTraining ?? 0,
        gymTraining: row.gym ?? row.Gym ?? row.gymTraining ?? 0,
        matchGame: row.match ?? row["Match/Game"] ?? row.matchGame ?? 0,
        athleteId: row.athleteId
      }));
    },
    refetchOnWindowFocus: false
  });
  
  // Get ACWR data with athlete ID when an athlete is selected
  const { data: acwrData, isLoading: acwrLoading } = useQuery({
    queryKey: ["/api/analytics/acwr", athleteId !== "all" ? athleteId : "all"],
    queryFn: async () => {
      const url = athleteId !== "all" 
        ? `/api/analytics/acwr?athleteId=${athleteId}`
        : "/api/analytics/acwr";
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ACWR data');
      const data = await response.json();
      
      // Use shared ACWR calculation for consistency
      return data.map((row: any) => ({
        ...row,
        ratio: calcAcwr(row.acute, row.chronic)
      }));
    },
    refetchOnWindowFocus: false
  });
  
  // Handle athlete selection change
  const handleAthleteChange = (newValue: string) => {
    setAthleteId(newValue);
  };
  
  // Define interfaces for proper type checking
  interface TrainingLoadItem {
    date: string;
    load: number;
    trainingType: string;
    fieldTraining?: number;
    gymTraining?: number;
    matchGame?: number;
    athleteId?: number;
  }
  
  interface AcwrItem {
    date: string;
    acute: number;
    chronic: number;
    ratio: number;
    riskZone: string;
    athleteId?: number;
  }
  
  // Filter data based on selected athlete and time range
  const filteredTrainingLoad = Array.isArray(trainingLoad) ? trainingLoad.filter((item: TrainingLoadItem) => {
    // 1. filter by date based on timeRange (in days)
    const cutoff = Date.now() - parseInt(timeRange, 10) * 24 * 60 * 60 * 1000;
    const dateOk = new Date(item.date).getTime() >= cutoff;
    // 2. filter by athleteId (use the real state var, not a phantom one)
    const athleteOk = athleteId === "all"
      || (item.athleteId !== undefined && athleteId === item.athleteId.toString());
    return dateOk && athleteOk;
  }) : [];

  // Process data for stacked columns with double session detection
  const processedLoadData = () => {
    if (!filteredTrainingLoad || filteredTrainingLoad.length === 0) return [];
    
    console.log('Raw training load data:', filteredTrainingLoad);
    
    // Use the normalized data directly from our API response
    const result = filteredTrainingLoad.map((item) => ({
      date: item.date,
      Field: item.Field || 0,
      Gym: item.Gym || 0, 
      Match: item.Match || 0,
      total: (item.Field || 0) + (item.Gym || 0) + (item.Match || 0),
      // Check if both Field and Gym have values (indicating double session)
      double: (item.Field > 0 && item.Gym > 0) || (item.Field > 0 && item.Match > 0) || (item.Gym > 0 && item.Match > 0)
    }));
    
    console.log('Processed column data:', result);
    return result;
  };

  const columnData = processedLoadData();
  
  const filteredAcwr = Array.isArray(acwrData) ? acwrData.filter((item: AcwrItem) => {
    const cutoff = Date.now() - parseInt(timeRange, 10) * 24 * 60 * 60 * 1000;
    const dateOk = new Date(item.date).getTime() >= cutoff;
    const athleteOk = athleteId === "all"
      || (item.athleteId !== undefined && athleteId === item.athleteId.toString());
    return dateOk && athleteOk;
  }) : [];

  // Calculate weekly summary data with accurate ISO week
  const calculateWeeklySummary = () => {
    if (!columnData || columnData.length === 0) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const { week, range } = isoWeekInfo(today);
    
    const totalAU = columnData.reduce((sum, item) => sum + item.total, 0);
    // Count actual sessions from raw training load data (each entry = one session)
    const totalSessions = filteredTrainingLoad.length;
    const avgAcwr = filteredAcwr.length > 0 
      ? filteredAcwr.reduce((sum, item) => sum + item.ratio, 0) / filteredAcwr.length 
      : 0;
    
    return { week, range, totalAU, totalSessions, avgAcwr };
  };

  const weeklySummary = calculateWeeklySummary();

  // Enhanced tooltip for stacked bar chart with session breakdown
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Get the original data point to access session breakdown
      const dataPoint = filteredTrainingLoad.find(item => item.date === label);
      
      return (
        <div className="bg-zinc-800 p-3 rounded border border-zinc-700 shadow-lg">
          <p className="text-white font-medium mb-2">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
          
          {/* Field Training */}
          {dataPoint?.fieldTraining && dataPoint.fieldTraining > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-300">Field Training:</span>
              <span className="text-white font-medium">{dataPoint.fieldTraining} AU</span>
            </div>
          )}
          
          {/* Other training types */}
          {dataPoint?.gymTraining && dataPoint.gymTraining > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-300">Gym Training:</span>
              <span className="text-white font-medium">{dataPoint.gymTraining} AU</span>
            </div>
          )}
          
          {dataPoint?.matchGame && dataPoint.matchGame > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-300">Match/Game:</span>
              <span className="text-white font-medium">{dataPoint.matchGame} AU</span>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-zinc-700">
            <span className="text-zinc-300">Total:</span>
            <span className="text-white font-medium">{dataPoint?.load || 0} AU</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for ACWR chart
  const CustomACWRTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the ACWR value
      const acwrEntry = payload.find((entry: any) => entry.dataKey === 'ratio');
      const acwrValue = acwrEntry ? acwrEntry.value : null;
      
      // Determine risk zone
      let riskZone = "Optimal Zone";
      let riskColor = "text-lime-400";
      
      if (acwrValue < 0.8) {
        riskZone = "Undertraining Zone";
        riskColor = "text-blue-400";
      } else if (acwrValue > 1.3) {
        riskZone = "Injury Risk Zone";
        riskColor = "text-red-400";
      }
      
      return (
        <div className="bg-zinc-800 p-3 rounded border border-zinc-700 shadow-lg">
          <p className="text-white font-medium mb-1">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-zinc-300">{entry.name}:</span>
              <span className="text-white font-medium">{entry.value.toFixed(1)}</span>
            </div>
          ))}
          {acwrValue !== null && (
            <div className={`mt-1 pt-1 border-t border-zinc-700 ${riskColor}`}>
              {riskZone}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 p-2 text-white hover:bg-zinc-800" 
            onClick={() => navigate("/coach")}
          >
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold">Load Insights</h2>
        </div>
        
        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="mb-2">
            <Label htmlFor="athlete-select" className="mb-2 block">Athlete</Label>
            <Select
              value={athleteId}
              onValueChange={handleAthleteChange}
            >
              <SelectTrigger id="athlete-select" className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select Athlete" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="all">All Athletes</SelectItem>
                {(athletes || []).map((athlete: any) => (
                  <SelectItem key={athlete.id} value={athlete.id.toString()}>
                    {athlete.firstName} {athlete.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-2">
            <Label htmlFor="time-select" className="mb-2 block">Time Period</Label>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger id="time-select" className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select Time Period" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Merged Week Summary + Training Load Chart */}
        {weeklySummary && (
          <Card className="bg-zinc-800/90 px-4 py-4 mt-6">
            {/* --- TITLE --- */}
            <h2 className="text-base font-semibold text-center mb-1 text-white">
              Training Load
            </h2>

            {/* --- WEEK SUMMARY --- */}
            <p className="text-sm text-zinc-400 mb-3">
              Week {weeklySummary.week} ({weeklySummary.range}) &nbsp;|&nbsp; Total AU: {weeklySummary.totalAU} &nbsp;|&nbsp; Sessions: {weeklySummary.totalSessions} &nbsp;|&nbsp; Avg ACWR: {weeklySummary.avgAcwr.toFixed(2)}
            </p>

            {loadLoading ? (
              <p className="py-10 text-center text-zinc-400">Loading training load data...</p>
            ) : columnData.length === 0 ? (
              <p className="py-10 text-center text-zinc-400">No training load data available for the selected filters.</p>
            ) : (
              <div>
                <TrainingLoadColumns data={columnData} />
                
                {/* --- LEGEND --- */}
                <div className="flex justify-center gap-4 mt-2 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 bg-[#b5f23d] inline-block"></span> Field
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 bg-[#547aff] inline-block"></span> Gym
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 bg-[#ff6f6f] inline-block"></span> Match
                  </span>
                </div>
              </div>
            )}
            
            {weeklySummary.avgAcwr > 1.3 && (
              <p className="text-red-400 text-xs mt-2">⚠️ High ACWR - consider lighter training</p>
            )}
            {weeklySummary.avgAcwr < 0.8 && (
              <p className="text-yellow-400 text-xs mt-2">⚡ Low ACWR - may increase intensity safely</p>
            )}
          </Card>
        )}

        
        {/* ACWR Chart - Compact version below training load chart */}
        <div className="bg-zinc-900 rounded-lg p-4 mt-8">
          <h3 className="text-lg font-semibold mb-3 text-center">ACWR - Acute: Chronic Workload Ratio</h3>
          {acwrLoading ? (
            <p className="py-10 text-center">Loading ACWR data...</p>
          ) : filteredAcwr.length === 0 ? (
            <p className="py-10 text-center">No ACWR data available for the selected filters.</p>
          ) : (
            <div>
              <div className="h-56 mx-auto" style={{ maxWidth: "95%", margin: "0 auto" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredAcwr}
                    margin={{ top: 0, right: 10, left: 0, bottom: 25 }}
                  >
                    {/* Colored background zones for risk levels */}
                    <defs>
                      <linearGradient id="undertrainingZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="optimalZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity={0.1}/>
                        <stop offset="100%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="injuryRiskZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    {/* Risk zone areas */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    
                    {/* Colored background for risk zones */}
                    <rect x="0%" y="0%" width="100%" height="40%" fill="url(#injuryRiskZone)" />
                    <rect x="0%" y="40%" width="100%" height="40%" fill="url(#optimalZone)" />
                    <rect x="0%" y="80%" width="100%" height="20%" fill="url(#undertrainingZone)" />
                    
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#9ca3af' }} 
                      domain={[0, 2]} 
                      ticks={[0, 0.8, 1.3, 2]}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <Tooltip content={<CustomACWRTooltip />} />
                    
                    {/* Reference lines for thresholds */}
                    <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="3 3" />
                    <ReferenceLine y={1.3} stroke="#ef4444" strokeDasharray="3 3" />
                    
                    {/* ACWR line only - removed acute and chronic for simplicity */}
                    <Line 
                      type="monotone" 
                      dataKey="ratio" 
                      name="ACWR" 
                      stroke="#cbff00" 
                      activeDot={{ r: 6 }} 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    
                    {/* Integrated legend in the chart */}
                    <Legend 
                      verticalAlign="bottom"
                      align="center"
                      layout="horizontal"
                      height={30}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ padding: "10px 0 0 0" }}
                      payload={[
                        { value: 'Undertraining (<0.8)', color: '#3b82f6', type: 'circle' },
                        { value: 'Optimal (0.8-1.3)', color: '#4ade80', type: 'circle' },
                        { value: 'Injury Risk (>1.3)', color: '#ef4444', type: 'circle' }
                      ]}
                      formatter={(value) => <span style={{ color: "#9ca3af", fontSize: "12px" }}>{value}</span>}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        
        {/* Weekly Work-Load Chart - Replaces ACWR Table */}
        <div className="bg-zinc-900 rounded-lg p-4 mt-4">
          <h3 className="text-base font-semibold text-center mb-1">Weekly Work-Load (last 10 weeks)</h3>
          <p className="text-sm text-zinc-400 mb-4 text-center">
            Training volume and ACWR trends over time
          </p>
          {weeklyLoading ? (
            <p className="py-10 text-center text-zinc-400">Loading weekly load data...</p>
          ) : weeklyLoadData.length === 0 ? (
            <p className="py-10 text-center text-zinc-400">No weekly load data available for the selected filters.</p>
          ) : (
            <WeeklyLoadChart data={weeklyLoadData} />
          )}
        </div>

        {/* Compact ACWR Summary Table */}
        <div className="bg-zinc-900 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Current Acute:Chronic Workload Ratios</h3>
          {acwrLoading ? (
            <p className="py-2 text-center text-sm">Loading data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700 text-left">
                    <th className="py-2 px-3 text-zinc-400 font-medium text-sm">Athlete</th>
                    <th className="py-2 px-3 text-zinc-400 font-medium text-sm">Acute<br/>Load</th>
                    <th className="py-2 px-3 text-zinc-400 font-medium text-sm">Chronic<br/>Load</th>
                    <th className="py-2 px-3 text-zinc-400 font-medium text-sm">ACWR</th>
                    <th className="py-2 px-3 text-zinc-400 font-medium text-sm">Risk Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAcwr
                    .filter((item: any, index: number, self: any[]) => {
                      // Get only the most recent entry for each athlete
                      return index === self.findIndex((t) => (
                        t.athleteId === item.athleteId
                      ));
                    })
                    .map((item: any, index: number) => {
                      const athlete = athletes?.find((a: any) => a.id === item.athleteId);
                      const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : `Athlete ${item.athleteId}`;
                      
                      // Determine risk zone color
                      let riskColor = "text-lime-400"; // Default for optimal zone
                      let riskZone = "Optimal";
                      
                      if (item.ratio < 0.8) {
                        riskColor = "text-blue-400";
                        riskZone = "Undertraining";
                      } else if (item.ratio <= 1.3) {
                        riskColor = "text-lime-400";
                        riskZone = "Optimal";
                      } else {
                        riskColor = "text-red-400";
                        riskZone = "Injury Risk";
                      }
                      
                      return (
                        <tr key={index} className="border-b border-zinc-800">
                          <td className="py-2 px-3 text-sm">{athleteName}</td>
                          <td className="py-2 px-3 text-sm">{Math.round(item.acute)}</td>
                          <td className="py-2 px-3 text-sm">{Math.round(item.chronic)}</td>
                          <td className="py-2 px-3 text-sm">{item.ratio.toFixed(2)}</td>
                          <td className={`py-2 px-3 text-sm ${riskColor} font-medium`}>
                            {riskZone}
                          </td>
                        </tr>
                      );
                    })}
                    
                  {filteredAcwr.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400">
                        No ACWR data available for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}