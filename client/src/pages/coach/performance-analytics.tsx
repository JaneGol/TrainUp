import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrainingLoadChart,
  ACWRChart,
  WellnessTrendsChart, 
  RecoveryReadinessDashboard, 
  InjuryRiskFactorAnalysis
} from "@/components/coach/enhanced-analytics";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface TrainingLoad {
  date: string;
  load: number;
  trainingType: string;
}

interface AcuteChronicWorkloadRatio {
  date: string;
  acute: number;
  chronic: number;
  ratio: number;
}

interface WellnessTrend {
  date: string;
  value: number;
  category: string;
}

interface AthleteRecoveryReadiness {
  athleteId: number;
  name: string;
  readinessScore: number;
  trend: string;
  issues: string[];
}

interface InjuryRiskFactor {
  athleteId: number;
  name: string;
  riskScore: number;
  factors: string[];
}

const TRAINING_TYPES_COLORS: Record<string, string> = {
  "Strength": "#f97316",
  "Endurance": "#0ea5e9",
  "Speed": "#22c55e",
  "Technical": "#a855f7",
  "Recovery": "#64748b",
  "Other": "#6b7280"
};

export default function PerformanceAnalyticsPage() {
  const [, navigate] = useLocation();
  const [timeFrame, setTimeFrame] = useState("30days");
  const [selectedAthlete, setSelectedAthlete] = useState<string | undefined>(undefined);
  
  // Fetch data for athletes (used in dropdown)
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
    queryFn: async () => {
      const res = await fetch("/api/athletes");
      if (!res.ok) throw new Error("Failed to fetch athletes");
      return await res.json();
    }
  });
  
  // Fetch training load data
  const { data: trainingLoadData, isLoading: trainingLoadLoading, error: trainingLoadError } = useQuery<TrainingLoad[]>({
    queryKey: ["/api/analytics/training-load", { athleteId: selectedAthlete }],
    queryFn: async () => {
      const url = selectedAthlete 
        ? `/api/analytics/training-load?athleteId=${selectedAthlete}`
        : `/api/analytics/training-load`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch training load data");
      return await res.json();
    }
  });
  
  // Fetch ACWR data
  const { data: acwrData, isLoading: acwrLoading, error: acwrError } = useQuery<AcuteChronicWorkloadRatio[]>({
    queryKey: ["/api/analytics/acwr", { athleteId: selectedAthlete }],
    queryFn: async () => {
      const url = selectedAthlete 
        ? `/api/analytics/acwr?athleteId=${selectedAthlete}`
        : `/api/analytics/acwr`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ACWR data");
      return await res.json();
    }
  });
  
  // Fetch team wellness trends data
  const { data: wellnessTrendsData, isLoading: wellnessTrendsLoading, error: wellnessTrendsError } = 
    useQuery<WellnessTrend[]>({
      queryKey: ["/api/analytics/team-wellness-trends"],
      queryFn: async () => {
        const res = await fetch("/api/analytics/team-wellness-trends");
        if (!res.ok) throw new Error("Failed to fetch wellness trends data");
        return await res.json();
      },
      enabled: !selectedAthlete // Only fetch team data when no athlete is selected
    });
  
  // Fetch athlete recovery readiness data
  const { data: recoveryReadinessData, isLoading: recoveryReadinessLoading, error: recoveryReadinessError } = 
    useQuery<AthleteRecoveryReadiness[]>({
      queryKey: ["/api/analytics/athlete-recovery-readiness"],
      queryFn: async () => {
        const res = await fetch("/api/analytics/athlete-recovery-readiness");
        if (!res.ok) throw new Error("Failed to fetch recovery readiness data");
        return await res.json();
      }
    });
    
  // Fetch injury risk factors data
  const { data: injuryRiskData, isLoading: injuryRiskLoading, error: injuryRiskError } = 
    useQuery<InjuryRiskFactor[]>({
      queryKey: ["/api/analytics/injury-risk-factors"],
      queryFn: async () => {
        const res = await fetch("/api/analytics/injury-risk-factors");
        if (!res.ok) throw new Error("Failed to fetch injury risk data");
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
    else if (timeFrame === "365days") daysToSubtract = 365;
    
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };
  
  // Process training load data to group by type and date
  const processTrainingLoadData = () => {
    if (!trainingLoadData) return [];
    
    const filteredData = filterDataByTimeFrame(trainingLoadData);
    
    // Sort by date
    return filteredData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  // Process ACWR data
  const processAcwrData = () => {
    if (!acwrData) return [];
    
    const filteredData = filterDataByTimeFrame(acwrData);
    
    // Sort by date
    return filteredData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  // Map training load data by type for stacked bar chart
  const mapTrainingLoadByType = () => {
    const data = processTrainingLoadData();
    if (!data.length) return [];
    
    // Group data by date
    const groupedByDate: Record<string, Record<string, number>> = {};
    
    data.forEach(item => {
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
  
  // Process wellness trends data
  const processWellnessTrendsData = () => {
    if (!wellnessTrendsData) return [];
    
    const filteredData = filterDataByTimeFrame(wellnessTrendsData);
    
    // Sort by date
    return filteredData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  // Get unique categories for wellness trends
  const getWellnessCategories = () => {
    if (!wellnessTrendsData) return [];
    return Array.from(new Set(wellnessTrendsData.map(item => item.category)));
  };
  
  // Group wellness data by category for multiline chart
  const mapWellnessTrendsByCategory = () => {
    const data = processWellnessTrendsData();
    if (!data.length) return [];
    
    // Group by date first
    const groupedByDate: Record<string, Record<string, number>> = {};
    
    data.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = {};
      }
      
      groupedByDate[item.date][item.category] = item.value;
    });
    
    // Convert to array format for chart
    return Object.entries(groupedByDate).map(([date, categories]) => ({
      date,
      ...categories
    }));
  };
  
  const processedTrainingLoad = processTrainingLoadData();
  const processedAcwr = processAcwrData();
  const trainingLoadByType = mapTrainingLoadByType();
  const processedWellnessTrends = processWellnessTrendsData();
  const wellnessTrendsByCategory = mapWellnessTrendsByCategory();
  const wellnessCategories = getWellnessCategories();
  
  // Filter recovery readiness data for selected athlete
  const filteredRecoveryReadiness = recoveryReadinessData && selectedAthlete 
    ? recoveryReadinessData.filter(item => item.athleteId.toString() === selectedAthlete)
    : recoveryReadinessData;
    
  // Filter injury risk data for selected athlete
  const filteredInjuryRisk = injuryRiskData && selectedAthlete
    ? injuryRiskData.filter(item => item.athleteId.toString() === selectedAthlete)
    : injuryRiskData;
  
  // Get all unique training types for the legend
  const uniqueTrainingTypes = processedTrainingLoad.length > 0
    ? Array.from(new Set(processedTrainingLoad.map(item => item.trainingType)))
    : [];
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Analytics</h2>
        
        <Tabs defaultValue="performance-analytics" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="team-overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/coach")}
            >
              Team Overview
            </TabsTrigger>
            <TabsTrigger 
              value="athlete-logs" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/coach/athlete-logs")}
            >
              Athlete Logs
            </TabsTrigger>
            <TabsTrigger 
              value="performance-analytics" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Performance Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="training-plans" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Training Plans
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance-analytics" className="mt-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedAthlete}
                  onValueChange={(value) => setSelectedAthlete(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Athletes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Athletes</SelectItem>
                    {athletes?.map((athlete: any) => (
                      <SelectItem key={athlete.id} value={athlete.id.toString()}>
                        {athlete.firstName} {athlete.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={timeFrame}
                  onValueChange={setTimeFrame}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="365days">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <TrainingLoadChart 
                data={processedTrainingLoad}
                loading={trainingLoadLoading}
                error={trainingLoadError}
              />
              
              <ACWRChart 
                data={processedAcwr}
                loading={acwrLoading}
                error={acwrError}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Acute & Chronic Workload</CardTitle>
                  <CardDescription>
                    Comparison of 7-day (acute) and 28-day (chronic) average workload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {acwrLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : acwrError ? (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load ACWR data. Please try again later.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={processedAcwr}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ 
                              value: 'Workload (arbitrary units)', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }}
                          />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === "acute") return [value, "Acute load (7-day)"];
                              if (name === "chronic") return [value, "Chronic load (28-day)"];
                              return [value, name];
                            }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="chronic" 
                            stackId="1" 
                            stroke="#8884d8" 
                            fill="#8884d8"
                            fillOpacity={0.3}
                            name="Chronic load (28-day)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="acute" 
                            stackId="2" 
                            stroke="#82ca9d" 
                            fill="#82ca9d"
                            fillOpacity={0.3}
                            name="Acute load (7-day)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Team wellness trends component - Only shown when no athlete is selected */}
              {!selectedAthlete && (
                <WellnessTrendsChart
                  data={processedWellnessTrends}
                  loading={wellnessTrendsLoading}
                  error={wellnessTrendsError}
                />
              )}
              
              {/* Recovery readiness dashboard component */}
              <RecoveryReadinessDashboard
                data={selectedAthlete ? filteredRecoveryReadiness : recoveryReadinessData}
                loading={recoveryReadinessLoading}
                error={recoveryReadinessError}
              />
              
              {/* Injury risk analysis component */}
              <InjuryRiskFactorAnalysis
                data={selectedAthlete ? filteredInjuryRisk : injuryRiskData}
                loading={injuryRiskLoading}
                error={injuryRiskError}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
