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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training Load Chart - Updated to stacked bar chart */}
          <div className="bg-zinc-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Training Load</h3>
            {loadLoading ? (
              <p className="py-10 text-center">Loading training load data...</p>
            ) : filteredTrainingLoad.length === 0 ? (
              <p className="py-10 text-center">No training load data available for the selected filters.</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTrainingLoad}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#999' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fill: '#999' }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend 
                      formatter={(value) => <span className="text-xs">{value}</span>}
                      iconSize={8}
                      wrapperStyle={{ paddingTop: 8 }}
                    />
                    <Bar 
                      dataKey="fieldTraining" 
                      name="Field Training" 
                      stackId="a" 
                      fill="#4ade80" // Green
                    />
                    <Bar 
                      dataKey="gymTraining" 
                      name="Gym Training" 
                      stackId="a" 
                      fill="#60a5fa" // Blue
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
            )}
          </div>
          
          {/* ACWR Chart - Updated with risk zones */}
          <div className="bg-zinc-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Acute:Chronic Workload Ratio</h3>
            {acwrLoading ? (
              <p className="py-10 text-center">Loading ACWR data...</p>
            ) : filteredAcwr.length === 0 ? (
              <p className="py-10 text-center">No ACWR data available for the selected filters.</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredAcwr}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#999' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fill: '#999' }} domain={[0, 2]} />
                    <Tooltip content={<CustomACWRTooltip />} />
                    <Legend 
                      formatter={(value) => <span className="text-xs">{value}</span>}
                      iconSize={8}
                      wrapperStyle={{ paddingTop: 8 }}
                    />
                    
                    {/* Risk zone areas */}
                    <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="3 3" />
                    <ReferenceLine y={1.3} stroke="#ef4444" strokeDasharray="3 3" />
                    
                    {/* Data lines - Colors match the design */}
                    <Line type="monotone" dataKey="acute" name="Acute Load (7 days)" stroke="#10b981" />
                    <Line type="monotone" dataKey="chronic" name="Chronic Load (28 days)" stroke="#3b82f6" />
                    <Line type="monotone" dataKey="ratio" name="ACWR" stroke="#cbff00" activeDot={{ r: 8 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Legend for risk zones */}
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-1"></div>
                    <span className="text-xs text-zinc-300">Undertraining Zone (&lt;0.8)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-lime-400 mr-1"></div>
                    <span className="text-xs text-zinc-300">Optimal Zone (0.8-1.3)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-400 mr-1"></div>
                    <span className="text-xs text-zinc-300">Injury Risk Zone (&gt;1.3)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* ACWR Table - Updated to include risk zones */}
        <div className="bg-zinc-900 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Current Acute:Chronic Workload Ratios</h3>
          {acwrLoading ? (
            <p className="py-5 text-center">Loading data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700 text-left">
                    <th className="py-3 px-4 text-zinc-400 font-medium">Athlete</th>
                    <th className="py-3 px-4 text-zinc-400 font-medium">Acute Load (7 days)</th>
                    <th className="py-3 px-4 text-zinc-400 font-medium">Chronic Load (28 days)</th>
                    <th className="py-3 px-4 text-zinc-400 font-medium">ACWR</th>
                    <th className="py-3 px-4 text-zinc-400 font-medium">Risk Zone</th>
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
                      let riskZone = "Optimal Zone";
                      
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
                          <td className="py-3 px-4">{athleteName}</td>
                          <td className="py-3 px-4">{Math.round(item.acute)}</td>
                          <td className="py-3 px-4">{Math.round(item.chronic)}</td>
                          <td className="py-3 px-4">{item.ratio.toFixed(2)}</td>
                          <td className={`py-3 px-4 ${riskColor}`}>
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