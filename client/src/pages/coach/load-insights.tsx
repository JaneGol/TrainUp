import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Card from "@/components/ui/card-improved";

export default function LoadInsights() {
  const [, navigate] = useLocation();
  const [selectedAthlete, setSelectedAthlete] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30"); // Default to 30 days
  
  // Get athletes
  const { data: athletes } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get training load data with athlete ID when an athlete is selected
  const { data: trainingLoad, isLoading: loadLoading } = useQuery({
    queryKey: ["/api/analytics/training-load", selectedAthlete !== "all" ? selectedAthlete : "all"],
    queryFn: async () => {
      const url = selectedAthlete !== "all" 
        ? `/api/analytics/training-load?athleteId=${selectedAthlete}`
        : "/api/analytics/training-load";
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch training load data');
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Get ACWR data with athlete ID when an athlete is selected
  const { data: acwrData, isLoading: acwrLoading } = useQuery({
    queryKey: ["/api/analytics/acwr", selectedAthlete !== "all" ? selectedAthlete : "all"],
    queryFn: async () => {
      const url = selectedAthlete !== "all" 
        ? `/api/analytics/acwr?athleteId=${selectedAthlete}`
        : "/api/analytics/acwr";
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ACWR data');
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Handle athlete selection change
  const handleAthleteChange = (newValue: string) => {
    setSelectedAthlete(newValue);
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
    // Only filter by date when we have data to filter
    const dateFiltered = new Date(item.date) >= new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    // Individual athlete or team-level data
    return dateFiltered && (selectedAthlete === "all" || (item.athleteId !== undefined && parseInt(selectedAthlete) === item.athleteId));
  }) : [];
  
  const filteredAcwr = Array.isArray(acwrData) ? acwrData.filter((item: AcwrItem) => {
    // Only filter by date when we have data to filter
    const dateFiltered = new Date(item.date) >= new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    // Individual athlete or team-level data
    return dateFiltered && (selectedAthlete === "all" || (item.athleteId !== undefined && parseInt(selectedAthlete) === item.athleteId));
  }) : [];

  // Calculate weekly summary data
  const calculateWeeklySummary = () => {
    if (!filteredTrainingLoad || !filteredAcwr) return null;
    
    // Get current week's data (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyLoad = filteredTrainingLoad.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= weekAgo && itemDate <= today;
    });
    
    const weeklyAcwr = filteredAcwr.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= weekAgo && itemDate <= today;
    });
    
    const totalAU = weeklyLoad.reduce((sum, item) => sum + item.load, 0);
    const avgAcwr = weeklyAcwr.length > 0 
      ? weeklyAcwr.reduce((sum, item) => sum + item.ratio, 0) / weeklyAcwr.length 
      : 0;
    
    // Get current week number
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return { weekNum, totalAU, avgAcwr };
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
              value={selectedAthlete}
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
        
        {/* Weekly Summary Card */}
        {weeklySummary && (
          <Card>
            <h2 className="font-bold text-lg mb-2">Week {weeklySummary.weekNum}</h2>
            <p className="text-zinc-300">
              Total AU: <span className="text-white font-semibold">{weeklySummary.totalAU}</span> | 
              Avg ACWR: <span className="text-white font-semibold">{weeklySummary.avgAcwr.toFixed(2)}</span>
            </p>
            {weeklySummary.avgAcwr > 1.3 && (
              <p className="text-red-400 text-sm mt-2">⚠️ High ACWR - consider lighter training</p>
            )}
            {weeklySummary.avgAcwr < 0.8 && (
              <p className="text-yellow-400 text-sm mt-2">⚡ Low ACWR - may increase intensity safely</p>
            )}
          </Card>
        )}
        
        {/* Training Load Chart - More compact */}
        <div className="bg-zinc-900 rounded-lg p-4 mb-4">
          <h3 className="text-xl font-semibold mb-3">Training Load</h3>
          {loadLoading ? (
            <p className="py-10 text-center">Loading training load data...</p>
          ) : filteredTrainingLoad.length === 0 ? (
            <p className="py-10 text-center">No training load data available for the selected filters.</p>
          ) : (
            <div>
              {/* Height reduced from h-80 to h-64 for more compact display */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTrainingLoad}
                    margin={{ top: 0, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend 
                      verticalAlign="bottom"
                      align="center"
                      layout="horizontal"
                      height={25}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ padding: "2px 0 0 0" }}
                      formatter={(value: string) => {
                        const displayNames: Record<string, string> = {
                          "Field Training": "Field",
                          "Gym Training": "Gym",
                          "Match/Game": "Match/Game"
                        };
                        return <span style={{ color: "#9ca3af", fontSize: "12px" }}>{displayNames[value] || value}</span>;
                      }}
                    />
                    <Bar 
                      dataKey="fieldTraining" 
                      name="Field Training" 
                      stackId="a" 
                      fill="#A3E635" // Bright green
                    />
                    <Bar 
                      dataKey="gymTraining" 
                      name="Gym Training" 
                      stackId="a" 
                      fill="#60A5FA" // Blue
                    />
                    <Bar 
                      dataKey="matchGame" 
                      name="Match/Game" 
                      stackId="a" 
                      fill="#f87171" // Red
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        
        {/* ACWR Chart - Compact version below training load chart */}
        <div className="bg-zinc-900 rounded-lg p-4">
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
        
        {/* ACWR Table - More compact version */}
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