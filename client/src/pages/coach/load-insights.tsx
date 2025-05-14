import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LoadInsights() {
  const [, navigate] = useLocation();
  const [selectedAthlete, setSelectedAthlete] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");
  
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
    return selectedAthlete === "all" || parseInt(selectedAthlete) === item.athleteId;
  }) : [];
  
  const filteredAcwr = acwrData ? acwrData.filter((item: any) => {
    const dateFiltered = new Date(item.date) >= new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    return selectedAthlete === "all" || parseInt(selectedAthlete) === item.athleteId;
  }) : [];

  // Helper for risk level
  const getRiskLevel = (ratio: number) => {
    if (ratio < 0.8) return "Low";
    if (ratio <= 1.3) return "Optimal";
    if (ratio <= 1.5) return "Moderate";
    return "High";
  };
  
  const getRiskColor = (ratio: number) => {
    if (ratio < 0.8) return "text-blue-400";
    if (ratio <= 1.3) return "text-green-400";
    if (ratio <= 1.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
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
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training Load Chart */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>Training Load</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#333', border: 'none' }} 
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="load" name="Training Load (AU)" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* ACWR Chart */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>Acute:Chronic Workload Ratio</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <YAxis tick={{ fill: '#999' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#333', border: 'none' }} 
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="acute" name="Acute Load (7 days)" stroke="#10b981" />
                      <Line type="monotone" dataKey="chronic" name="Chronic Load (28 days)" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="ratio" name="ACWR" stroke="#f59e0b" activeDot={{ r: 8 }} />
                      {/* Reference lines for optimal range */}
                      <Line type="monotone" dataKey="ratio" name="Low Risk Threshold (0.8)" stroke="transparent" />
                      <Line type="monotone" dataKey="ratio" name="High Risk Threshold (1.3)" stroke="transparent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* ACWR Table */}
        <Card className="bg-zinc-900 border-zinc-800 text-white mt-6">
          <CardHeader>
            <CardTitle>Current Acute:Chronic Workload Ratios</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <th className="py-3 px-4 text-zinc-400 font-medium">Risk Level</th>
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
                        
                        return (
                          <tr key={index} className="border-b border-zinc-800">
                            <td className="py-3 px-4">{athleteName}</td>
                            <td className="py-3 px-4">{Math.round(item.acute)}</td>
                            <td className="py-3 px-4">{Math.round(item.chronic)}</td>
                            <td className="py-3 px-4">{item.ratio.toFixed(2)}</td>
                            <td className={`py-3 px-4 ${getRiskColor(item.ratio)}`}>
                              {getRiskLevel(item.ratio)}
                            </td>
                          </tr>
                        );
                      })}
                      
                    {filteredAcwr.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-400">
                          No ACWR data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}