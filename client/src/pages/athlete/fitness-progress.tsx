import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface TrainingLoad {
  date: string;
  load: number;
  trainingType: string;
}

const TRAINING_TYPES_COLORS: Record<string, string> = {
  "Strength": "#f97316",
  "Endurance": "#0ea5e9",
  "Speed": "#22c55e",
  "Technical": "#a855f7",
  "Recovery": "#64748b",
  "Other": "#6b7280"
};

export default function FitnessProgressPage() {
  const [, navigate] = useLocation();
  const [timeFrame, setTimeFrame] = useState("30days");
  const isMobile = useIsMobile();

  // Fetch training load data
  const { data: trainingLoadData, isLoading, error } = useQuery<TrainingLoad[]>({
    queryKey: ["/api/analytics/training-load"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/training-load");
      if (!res.ok) throw new Error("Failed to fetch training load data");
      return await res.json();
    }
  });
  
  // Filter data based on timeframe
  const filterDataByTimeFrame = (data: any[]) => {
    if (!data) return [];
    
    const now = new Date();
    let daysToSubtract = 30;
    
    if (timeFrame === "7days") daysToSubtract = 7;
    else if (timeFrame === "30days") daysToSubtract = 30;
    else if (timeFrame === "90days") daysToSubtract = 90;
    
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };
  
  // Process training load data
  const processTrainingLoadData = () => {
    if (!trainingLoadData) return [];
    
    const filteredData = filterDataByTimeFrame(trainingLoadData);
    
    // Sort by date
    return filteredData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  // Calculate weekly load totals
  const calculateWeeklyLoad = () => {
    if (!trainingLoadData) return [];
    
    const processedData = processTrainingLoadData();
    const weeklyLoads: Record<string, { weekLabel: string, totalLoad: number }> = {};
    
    processedData.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
      
      if (!weeklyLoads[weekLabel]) {
        weeklyLoads[weekLabel] = { weekLabel, totalLoad: 0 };
      }
      
      weeklyLoads[weekLabel].totalLoad += item.load;
    });
    
    return Object.values(weeklyLoads);
  };
  
  // Group training loads by type
  const groupByTrainingType = () => {
    if (!trainingLoadData) return [];
    
    const processedData = processTrainingLoadData();
    const groupedByDate: Record<string, Record<string, number>> = {};
    
    processedData.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = {};
      }
      
      if (!groupedByDate[item.date][item.trainingType]) {
        groupedByDate[item.date][item.trainingType] = 0;
      }
      
      groupedByDate[item.date][item.trainingType] += item.load;
    });
    
    // Convert to array format for chart
    return Object.entries(groupedByDate).map(([date, types]) => ({
      date,
      ...types
    }));
  };
  
  const processedTrainingLoad = processTrainingLoadData();
  const weeklyLoadData = calculateWeeklyLoad();
  const trainingTypeData = groupByTrainingType();
  
  // Get all unique training types for the legend
  const uniqueTrainingTypes = processedTrainingLoad.length > 0
    ? Array.from(new Set(processedTrainingLoad.map(item => item.trainingType)))
    : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Simple header with back button */}
      <header className="bg-white border-b p-4 flex items-center shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/athlete")}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800 flex-1 text-center pr-8">
          Fitness Progress
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="mb-4 flex justify-end">
          <Select
            value={timeFrame}
            onValueChange={setTimeFrame}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load fitness data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : processedTrainingLoad.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                No training data available. Start logging your training sessions to track your progress.
              </p>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Training Load Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={processedTrainingLoad}
                        margin={{
                          top: 10,
                          right: 10,
                          left: isMobile ? 0 : 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          label={isMobile ? undefined : { 
                            value: 'Load (RPE × Duration)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} units`, 'Training Load']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="load" 
                          stroke="#0062cc" 
                          fill="#0062cc"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Training Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyLoadData}
                        margin={{
                          top: 10,
                          right: 10,
                          left: isMobile ? 0 : 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="weekLabel" 
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          label={isMobile ? undefined : { 
                            value: 'Total Load', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} units`, 'Total Load']}
                        />
                        <Bar 
                          dataKey="totalLoad" 
                          fill="#4f46e5"
                          name="Weekly Load"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Training Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trainingTypeData}
                        margin={{
                          top: 10,
                          right: 10,
                          left: isMobile ? 0 : 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          label={isMobile ? undefined : { 
                            value: 'Load', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fontSize: '12px' }
                          }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        {uniqueTrainingTypes.map((type) => (
                          <Bar 
                            key={type} 
                            dataKey={type} 
                            stackId="a" 
                            fill={TRAINING_TYPES_COLORS[type] || TRAINING_TYPES_COLORS.Other} 
                            name={type}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}