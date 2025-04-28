import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Mock data for visualization - in a real app this would come from API
const performanceByAthleteData = [
  { name: "Emma Wilson", endurance: 90, strength: 75, speed: 85, flexibility: 70 },
  { name: "Jamal Brown", endurance: 75, strength: 85, speed: 70, flexibility: 65 },
  { name: "Sarah Chen", endurance: 60, strength: 50, speed: 65, flexibility: 80 },
  { name: "Alex Morgan", endurance: 95, strength: 80, speed: 90, flexibility: 75 },
];

const athleteImprovementData = [
  { month: "Jan", improvement: 5 },
  { month: "Feb", improvement: 8 },
  { month: "Mar", improvement: 12 },
  { month: "Apr", improvement: 7 },
  { month: "May", improvement: 10 },
  { month: "Jun", improvement: 15 },
];

const trainingTypeDistribution = [
  { name: "Strength", value: 35 },
  { name: "Endurance", value: 25 },
  { name: "Speed", value: 20 },
  { name: "Technique", value: 15 },
  { name: "Recovery", value: 5 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function PerformanceAnalyticsPage() {
  const [, navigate] = useLocation();
  const [timeFrame, setTimeFrame] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("endurance");
  
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
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Performance By Athlete</CardTitle>
                  <div className="flex space-x-2">
                    <Select
                      value={selectedMetric}
                      onValueChange={setSelectedMetric}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={timeFrame}
                      onValueChange={setTimeFrame}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time frame" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1month">Last month</SelectItem>
                        <SelectItem value="3months">Last 3 months</SelectItem>
                        <SelectItem value="6months">Last 6 months</SelectItem>
                        <SelectItem value="1year">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={performanceByAthleteData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={selectedMetric} fill="#0062cc" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Athlete Improvement Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={athleteImprovementData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="improvement" 
                            stroke="#0062cc" 
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Training Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={trainingTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {trainingTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={performanceByAthleteData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="endurance" stackId="a" fill="#0062cc" />
                        <Bar dataKey="strength" stackId="a" fill="#ff5722" />
                        <Bar dataKey="speed" stackId="a" fill="#00c853" />
                        <Bar dataKey="flexibility" stackId="a" fill="#ffc107" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
