import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, Sliders, AlertCircle, Info } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { format, parseISO, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";

// Helper function for date formatting
const formatDateLabel = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "MMM dd");
  } catch (e) {
    return dateStr;
  }
};

type TrainingLoadData = {
  date: string;
  load: number;
  trainingType: string;
};

type AcwrData = {
  date: string;
  acute: number;
  chronic: number;
  ratio: number;
};

export default function EnhancedAnalyticsPage() {
  const { toast } = useToast();
  
  // State for filters
  const [selectedAthlete, setSelectedAthlete] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");
  
  // Fetch athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
    queryFn: async () => {
      const res = await fetch("/api/athletes");
      if (!res.ok) throw new Error("Failed to fetch athletes");
      return await res.json();
    }
  });
  
  // Fetch training load data
  const { data: trainingLoad, isLoading: trainingLoadLoading } = useQuery({
    queryKey: ["/api/analytics/training-load", selectedAthlete],
    queryFn: async () => {
      const url = selectedAthlete !== "all" 
        ? `/api/analytics/training-load?athleteId=${selectedAthlete}`
        : `/api/analytics/training-load`;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch training load data");
      return await res.json();
    }
  });
  
  // Fetch acute:chronic workload ratio data
  const { data: acwrData, isLoading: acwrLoading } = useQuery({
    queryKey: ["/api/analytics/acwr", selectedAthlete],
    queryFn: async () => {
      const url = selectedAthlete !== "all"
        ? `/api/analytics/acwr?athleteId=${selectedAthlete}`
        : `/api/analytics/acwr`;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ACWR data");
      return await res.json();
    }
  });

  // Filter data by time range
  const filterDataByTimeRange = (data: any[]) => {
    if (!data || !data.length) return [];
    
    const days = parseInt(timeRange);
    const cutoffDate = subDays(new Date(), days);
    
    return data.filter(item => {
      try {
        return parseISO(item.date) >= cutoffDate;
      } catch (e) {
        return true;
      }
    });
  };
  
  // Filtered data
  const filteredTrainingLoad = trainingLoad ? filterDataByTimeRange(trainingLoad) : [];
  const filteredAcwrData = acwrData ? filterDataByTimeRange(acwrData) : [];
  
  // Group training load data by type
  const trainingLoadByType = filteredTrainingLoad.reduce((acc: Record<string, TrainingLoadData[]>, item) => {
    if (!acc[item.trainingType]) {
      acc[item.trainingType] = [];
    }
    acc[item.trainingType].push(item);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Performance Analytics</h1>
            <p className="text-muted-foreground">Advanced visualizations for training load and injury risk monitoring.</p>
          </div>
          
          {/* Filter controls */}
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Athletes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Athletes</SelectItem>
                {athletes?.map((athlete: any) => (
                  <SelectItem key={athlete.id} value={athlete.id.toString()}>
                    {athlete.firstName} {athlete.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="30 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Main dashboard content */}
        <Tabs defaultValue="trainingLoad" className="w-full">
          <TabsList className="w-full md:w-auto justify-start">
            <TabsTrigger value="trainingLoad">Training Load</TabsTrigger>
            <TabsTrigger value="acwr">Acute:Chronic Workload</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          {/* Training Load Tab */}
          <TabsContent value="trainingLoad" className="space-y-6">
            {/* Training Load Summary */}
            <Card>
              <CardHeader className="gradient-bg text-white rounded-t-lg">
                <CardTitle>Training Load Summary</CardTitle>
                <CardDescription className="text-white text-opacity-90">
                  Training load by type, visualized over {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {trainingLoadLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTrainingLoad.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-[300px] text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium">No training load data available</p>
                    <p className="text-muted-foreground">Try adjusting your filters or add new entries</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={filteredTrainingLoad}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDateLabel}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        name="Training Load" 
                        label={{ 
                          value: "Training Load (AU)", 
                          angle: -90, 
                          position: "insideLeft",
                          style: { textAnchor: 'middle' }
                        }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        labelFormatter={(label) => format(parseISO(label), "PP")}
                        formatter={(value, name) => [value, name === "load" ? "Load" : name]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="load" 
                        name="Training Load" 
                        fill="#CBFF00" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Training Load by Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(trainingLoadByType).map(([type, data]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle>{type}</CardTitle>
                    <CardDescription>
                      Training load for {type} sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDateLabel}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(label) => format(parseISO(label), "PP")}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="load" 
                          name="Load" 
                          stroke="#CBFF00" 
                          strokeWidth={2} 
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Acute:Chronic Workload Ratio Tab */}
          <TabsContent value="acwr" className="space-y-6">
            <Card>
              <CardHeader className="gradient-bg text-white rounded-t-lg">
                <CardTitle>Acute:Chronic Workload Ratio</CardTitle>
                <CardDescription className="text-white text-opacity-90">
                  7-day load (acute) vs 28-day load (chronic)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {acwrLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredAcwrData.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-[300px] text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium">No ACWR data available</p>
                    <p className="text-muted-foreground">Try adjusting your filters or add new entries</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart
                        data={filteredAcwrData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDateLabel}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          label={{ 
                            value: "Load (AU)", 
                            angle: -90, 
                            position: "insideLeft",
                            style: { textAnchor: 'middle' }
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 2]}
                          label={{ 
                            value: "A:C Ratio", 
                            angle: 90, 
                            position: "insideRight",
                            style: { textAnchor: 'middle' }
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          labelFormatter={(label) => format(parseISO(label), "PP")}
                        />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="acute" 
                          name="Acute Load (7d)" 
                          fill="#CBFF00" 
                          stroke="#CBFF00"
                          fillOpacity={0.3}
                        />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="chronic" 
                          name="Chronic Load (28d)" 
                          fill="#89B3FF" 
                          stroke="#89B3FF"
                          fillOpacity={0.3}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="ratio" 
                          name="A:C Ratio" 
                          stroke="#CBFF00" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        {/* Reference lines for injury risk zones */}
                        <ReferenceLine 
                          yAxisId="right" 
                          y={0.8} 
                          stroke="#ff9800" 
                          strokeDasharray="3 3"
                          label={{ 
                            value: "Undertraining Risk", 
                            position: "insideBottomLeft",
                            fill: "#ff9800",
                            fontSize: 12
                          }}
                        />
                        <ReferenceLine 
                          yAxisId="right" 
                          y={1.3} 
                          stroke="#e74c3c" 
                          strokeDasharray="3 3"
                          label={{ 
                            value: "Injury Risk Zone", 
                            position: "insideTopLeft",
                            fill: "#e74c3c",
                            fontSize: 12
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800 mb-1">Injury Risk Guidelines</h4>
                          <ul className="text-sm text-amber-700 space-y-1">
                            <li><span className="font-semibold">Ratio &lt; 0.8:</span> Potential undertraining, may lead to detraining effects</li>
                            <li><span className="font-semibold">Ratio 0.8-1.3:</span> "Sweet spot" - optimal training zone</li>
                            <li><span className="font-semibold">Ratio &gt; 1.3:</span> Higher injury risk due to excessive acute workload</li>
                            <li><span className="font-semibold">Ratio &gt; 1.5:</span> Significantly elevated injury risk</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* ACWR Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>ACWR Distribution</CardTitle>
                <CardDescription>
                  Distribution of workload ratios over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {acwrLoading ? (
                  <div className="flex justify-center items-center h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredAcwrData.length === 0 ? (
                  <div className="flex justify-center items-center h-[200px] text-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={filteredAcwrData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDateLabel}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 2]}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        labelFormatter={(label) => format(parseISO(label), "PP")}
                      />
                      <ReferenceLine y={0.8} stroke="#ff9800" strokeDasharray="3 3" />
                      <ReferenceLine y={1.3} stroke="#e74c3c" strokeDasharray="3 3" />
                      <Line 
                        type="monotone" 
                        dataKey="ratio" 
                        name="A:C Ratio" 
                        stroke="#CBFF00" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader className="gradient-bg text-white rounded-t-lg">
                <CardTitle>Key Performance Insights</CardTitle>
                <CardDescription className="text-white text-opacity-90">
                  Data-driven insights to optimize training and reduce injury risk
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Understanding Training Load</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4">Training load is calculated using the session-RPE method: Duration (minutes) × RPE (Rate of Perceived Exertion).</p>
                      
                      <p className="mb-2 font-medium">Key points to consider:</p>
                      <ul className="list-disc pl-5 space-y-1 mb-4">
                        <li>Monitor for consistent spikes in training load which may increase injury risk</li>
                        <li>Aim for progressive increases (no more than 10% week-to-week)</li>
                        <li>Balance different training types to promote overall development</li>
                      </ul>
                      
                      <p>Analyze training loads by type to ensure appropriate stimulus across different training modalities.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Acute:Chronic Workload Ratio</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4">The Acute:Chronic Workload Ratio (ACWR) compares the athlete's recent workload (acute load, 7 days) to their longer-term workload (chronic load, 28 days).</p>
                      
                      <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">ACWR Zones:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><span className="font-medium">Below 0.8:</span> Undertraining zone - may lead to detraining effects</li>
                          <li><span className="font-medium">0.8 to 1.3:</span> Optimal training zone - "sweet spot" for adaptation</li>
                          <li><span className="font-medium">Above 1.3:</span> Danger zone - elevated injury risk</li>
                          <li><span className="font-medium">Above 1.5:</span> High danger zone - significantly elevated injury risk</li>
                        </ul>
                      </div>
                      
                      <p>Research shows that maintaining the ACWR within the 0.8 to 1.3 range is associated with reduced injury risk while still promoting fitness development.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Actionable Recommendations</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-3 font-medium">Based on training load analysis, consider these evidence-based recommendations:</p>
                      
                      <ul className="list-disc pl-5 space-y-3 mb-4">
                        <li>
                          <span className="font-medium">Progressive Overload:</span> 
                          <p>Implement the 10% rule - increase weekly training loads by no more than 10% to allow for adaptation.</p>
                        </li>
                        <li>
                          <span className="font-medium">Load Management:</span> 
                          <p>After periods of high acute loads, implement strategic deload periods to reduce the ACWR and minimize injury risk.</p>
                        </li>
                        <li>
                          <span className="font-medium">Individualization:</span> 
                          <p>Use the athlete filter to analyze individual responses to training and customize programs accordingly.</p>
                        </li>
                        <li>
                          <span className="font-medium">Periodization:</span> 
                          <p>Plan training cycles with clear progression and recovery phases to optimize the ACWR throughout the season.</p>
                        </li>
                      </ul>
                      
                      <p>Combine these quantitative measures with qualitative feedback from morning wellness questionnaires for a comprehensive approach to athlete monitoring.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}