import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  Line, 
  LineChart, 
  ComposedChart,
  ReferenceArea,
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { useLocation, Link } from "wouter";
import { Separator } from "@/components/ui/separator";

type TrainingEntry = {
  id: number;
  userId: number;
  trainingType: string;
  date: string;
  effortLevel: number;
  emotionalLoad: number;
  mood: string;
  notes?: string;
  createdAt: string;
};

type FitnessProgressMetrics = {
  summary: {
    acuteLoad: number;
    chronicLoad: number;
    acwr: number;
    avgPhysicalRPE: number;
    avgEmotionalRPE: number;
    riskLevel: "low" | "optimal" | "medium" | "high";
    riskMessage: string;
  };
  trendData: {
    date: string;
    physicalRPE: number;
    emotionalLoad: number;
    load: number;
    trainingType: string;
    notes: string;
  }[];
  recentEntries: TrainingEntry[];
};

export default function FitnessProgressPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "28d" | "3m">("28d");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Load fitness progress data
  const { data: fitnessData, isLoading, isError } = useQuery<FitnessProgressMetrics>({
    queryKey: ["/api/athlete/fitness-progress"],
    retry: 1,
    // On error, redirect to page that explains the data is being collected
    onError: () => {
      toast({
        title: "Unable to load fitness data",
        description: "We need more training entries to generate progress insights.",
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  // If there's no data or error, show an informative message
  if (isError || !fitnessData || fitnessData.trendData.length === 0) {
    return <NoDataState />;
  }
  
  // Filter data based on selected time range
  const filterDataByTimeRange = (data: FitnessProgressMetrics["trendData"]) => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "28d":
        startDate = subDays(now, 28);
        break;
      case "3m":
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 28);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  };
  
  const filteredData = filterDataByTimeRange(fitnessData.trendData);
  
  // Calculate acute load data for the chart
  const acuteLoadData = filteredData.map(item => ({
    date: item.date,
    load: item.load,
  }));
  
  // Determine color for risk level
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-blue-500";
      case "optimal":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };
  
  // Get icon for risk level
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <TrendingDown className="h-5 w-5 text-blue-500" />;
      case "optimal":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  return (
    <div className="container max-w-7xl mx-auto pb-8">
      <div className="flex items-center space-x-2 pl-0 pt-6 pb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => navigate("/athlete")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fitness Progress</h2>
          <p className="text-muted-foreground">
            Analysis of your training load and recovery trends
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {/* Acute Load Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Acute Load (7-day)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fitnessData.summary.acuteLoad.toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-1">AU</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on your recent 7 days of training
            </p>
          </CardContent>
        </Card>
        
        {/* Chronic Load Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Chronic Load (28-day)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fitnessData.summary.chronicLoad.toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-1">AU</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Average weekly load over past 28 days
            </p>
          </CardContent>
        </Card>
        
        {/* ACWR Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">ACWR</CardTitle>
            <div className="relative">
              {getRiskLevelIcon(fitnessData.summary.riskLevel)}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskLevelColor(fitnessData.summary.riskLevel)}`}>
              {fitnessData.summary.acwr.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Acute:Chronic Workload Ratio
            </p>
          </CardContent>
        </Card>
        
        {/* Average Weekly RPE Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Avg Weekly RPE</CardTitle>
            <div className="flex gap-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2">
              <div>
                <div className="text-xl font-bold flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                  {fitnessData.summary.avgPhysicalRPE.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Physical</p>
              </div>
              <div>
                <div className="text-xl font-bold flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-purple-500 mr-1"></span>
                  {fitnessData.summary.avgEmotionalRPE.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Emotional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7 mb-4">
        <Card className="md:col-span-5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Load Trend Analysis</CardTitle>
              <Select
                value={timeRange}
                onValueChange={(value) => setTimeRange(value as "7d" | "28d" | "3m")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="28d">28 Days</SelectItem>
                  <SelectItem value="3m">3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>
              Training load analysis over time with reference zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={acuteLoadData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSessionLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      return format(new Date(value), "MM/dd");
                    }}
                  />
                  <YAxis yAxisId="left" label={{ value: 'Load (AU)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'ACWR', angle: 90, position: 'insideRight' }} />
                  
                  {/* Optimal ACWR zone (0.8 - 1.3) */}
                  <ReferenceArea yAxisId="right" y1={0.8} y2={1.3} fill="green" fillOpacity={0.05} />
                  
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgb(38,38,38)', color: 'white', border: '1px solid #666' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'load') return [value.toFixed(1) + ' AU', 'Session Load'];
                      if (name === 'acuteLoad') return [value.toFixed(1) + ' AU', 'Acute Load'];
                      if (name === 'acwr') return [value.toFixed(2), 'ACWR'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => format(new Date(label), "MMMM d, yyyy")}
                  />
                  
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="load" 
                    stroke="#82ca9d" 
                    fillOpacity={0.3} 
                    fill="url(#colorSessionLoad)" 
                    name="load"
                  />
                  
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="acwr" 
                    stroke="#ff6b6b" 
                    strokeWidth={2}
                    dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 3 }}
                    name="acwr"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Plain-language ACWR messages */}
            <div className="mt-4 p-3 rounded-lg bg-zinc-800/50">
              {fitnessData.summary.acwr > 1.3 && (
                <p className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  ACWR {fitnessData.summary.acwr.toFixed(2)} – consider lighter sessions to reduce injury risk
                </p>
              )}
              {fitnessData.summary.acwr >= 0.8 && fitnessData.summary.acwr <= 1.3 && (
                <p className="text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  ACWR {fitnessData.summary.acwr.toFixed(2)} – you're in the optimal training zone
                </p>
              )}
              {fitnessData.summary.acwr < 0.8 && (
                <p className="text-yellow-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  ACWR {fitnessData.summary.acwr.toFixed(2)} – you may safely increase training intensity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[300px] justify-between">
            <div className="flex items-start space-x-4">
              {getRiskLevelIcon(fitnessData.summary.riskLevel)}
              <div>
                <p className={`font-semibold ${getRiskLevelColor(fitnessData.summary.riskLevel)}`}>
                  {fitnessData.summary.riskLevel.charAt(0).toUpperCase() + fitnessData.summary.riskLevel.slice(1)} Risk
                </p>
                <p className="text-sm text-muted-foreground">
                  {fitnessData.summary.riskMessage}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-1">Optimal Zone</h3>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                  style={{ width: "50%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.8</span>
                <span>1.3</span>
              </div>
              
              <div className="mt-4">
                <div className="text-xs font-semibold text-muted-foreground">Your ACWR</div>
                <div 
                  className="relative h-1 mt-1"
                  style={{ 
                    marginLeft: `${Math.min(Math.max((fitnessData.summary.acwr / 2) * 100, 0), 100)}%` 
                  }}
                >
                  <div className={`h-3 w-3 rounded-full ${getRiskLevelColor(fitnessData.summary.riskLevel)}`} 
                    style={{ marginTop: "-3px" }} />
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-4" variant="outline">View Training Recommendations</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Physical vs Emotional Load</CardTitle>
          <CardDescription>
            Comparison of your physical and emotional exertion levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="line">
            <TabsList className="mb-4">
              <TabsTrigger value="line">Line Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="line" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      return format(new Date(value), "MM/dd");
                    }}
                  />
                  <YAxis label={{ value: 'Rating', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgb(38,38,38)', color: 'white', border: '1px solid #666' }}
                    formatter={(value: any, name: any) => [value, name === 'physicalRPE' ? 'Physical RPE' : 'Emotional Load']}
                    labelFormatter={(label) => format(new Date(label), "MMMM d, yyyy")}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="physicalRPE" 
                    name="Physical RPE" 
                    stroke="#4f46e5" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="emotionalLoad" 
                    name="Emotional Load" 
                    stroke="#d946ef" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="bar" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      return format(new Date(value), "MM/dd");
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgb(38,38,38)', color: 'white', border: '1px solid #666' }}
                    formatter={(value: any, name: any) => [value, name === 'physicalRPE' ? 'Physical RPE' : 'Emotional Load']}
                    labelFormatter={(label) => format(new Date(label), "MMMM d, yyyy")}
                  />
                  <Legend />
                  <Bar dataKey="physicalRPE" name="Physical RPE" fill="#4f46e5" />
                  <Bar dataKey="emotionalLoad" name="Emotional Load" fill="#d946ef" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Training Sessions</CardTitle>
          <CardDescription>
            Your latest recorded training data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fitnessData.recentEntries.length > 0 ? (
              fitnessData.recentEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{entry.trainingType}</h4>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Physical RPE</p>
                      <p className="font-semibold">{entry.effortLevel}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Emotional Load</p>
                      <p className="font-semibold">{entry.emotionalLoad}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average</p>
                      <p className="font-semibold">{((entry.effortLevel + entry.emotionalLoad) / 2).toFixed(1)}/10</p>
                    </div>
                  </div>
                  {entry.notes && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-sm text-muted-foreground italic">{entry.notes}</p>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent training sessions recorded</p>
            )}
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => navigate("/athlete/training-entry")}>
                Add New Training Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="container max-w-7xl mx-auto pb-8">
      <div className="flex items-center space-x-2 pl-0 pt-6 pb-4">
        <div className="h-8 w-8">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="py-4">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// No data state component
function NoDataState() {
  const [, navigate] = useLocation();
  
  return (
    <div className="container max-w-7xl mx-auto pb-8">
      <div className="flex items-center space-x-2 pl-0 pt-6 pb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => navigate("/athlete")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fitness Progress</h2>
          <p className="text-muted-foreground">
            Analysis of your training load and recovery trends
          </p>
        </div>
      </div>
      
      <Card className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <TrendingUp className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Not Enough Training Data</h3>
        <p className="text-center text-muted-foreground max-w-md mb-6">
          We need more training entries to generate your fitness progress insights.
          Add at least 3-5 training sessions to start seeing your trends.
        </p>
        <Button onClick={() => navigate("/athlete/training-entry")}>
          Add Training Session
        </Button>
      </Card>
    </div>
  );
}