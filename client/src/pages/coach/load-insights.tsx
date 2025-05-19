import { useState } from "react";
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

export default function LoadInsights() {
  const [, navigate] = useLocation();
  const [selectedAthlete, setSelectedAthlete] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30"); // Default to 30 days
  
  // Get athletes
  const { data: athletes } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get training load data
  const { data: trainingLoad, isLoading: loadLoading } = useQuery({
    queryKey: ["/api/analytics/training-load"],
  });
  
  // Get ACWR data
  const { data: acwrData, isLoading: acwrLoading } = useQuery({
    queryKey: ["/api/analytics/acwr"],
  });
  
  // Filter data based on selected athlete and time range
  const filteredTrainingLoad = trainingLoad ? trainingLoad.filter((item: any) => {
    const dateFiltered = new Date(item.date) >= new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    return dateFiltered && (selectedAthlete === "all" || parseInt(selectedAthlete) === item.athleteId);
  }) : [];
  
  const filteredAcwr = acwrData ? acwrData.filter((item: any) => {
    const dateFiltered = new Date(item.date) >= new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    return dateFiltered && (selectedAthlete === "all" || parseInt(selectedAthlete) === item.athleteId);
  }) : [];

  // Custom tooltip for stacked bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 p-3 rounded border border-zinc-700 shadow-lg">
          <p className="text-white font-medium mb-1">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-zinc-300">{entry.name}:</span>
              <span className="text-white font-medium">{entry.value} AU</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-zinc-700">
            <span className="text-zinc-300">Total:</span>
            <span className="text-white font-medium">
              {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)} AU
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="athlete-select">Athlete</Label>
            <Select
              value={selectedAthlete}
              onValueChange={setSelectedAthlete}
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
          
          <div>
            <Label htmlFor="time-select">Time Period</Label>
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
        
        {/* Training Load Chart - Full width */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Training Load</h3>
          {loadLoading ? (
            <p className="py-10 text-center">Loading training load data...</p>
          ) : filteredTrainingLoad.length === 0 ? (
            <p className="py-10 text-center">No training load data available for the selected filters.</p>
          ) : (
            <div>
              {/* Height reduced from h-80 to h-64 for more compact display */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTrainingLoad}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
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
                      height={36}
                      iconType="circle"
                      iconSize={8}
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
                      fill="#A3E635" // Bright green to match screenshot
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
        <div className="bg-zinc-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">ACWR - Acute: Chronic Workload Ratio</h3>
          {acwrLoading ? (
            <p className="py-10 text-center">Loading ACWR data...</p>
          ) : filteredAcwr.length === 0 ? (
            <p className="py-10 text-center">No ACWR data available for the selected filters.</p>
          ) : (
            <div>
              <div className="h-64 mx-auto" style={{ maxWidth: "90%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredAcwr}
                    margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
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
                      height={36}
                      iconType="circle"
                      iconSize={8}
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