import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";

// Mock data, would come from the API in production
const mockFitnessData = [
  { date: "Jan", endurance: 65, strength: 45, speed: 70, flexibility: 50 },
  { date: "Feb", endurance: 68, strength: 48, speed: 72, flexibility: 53 },
  { date: "Mar", endurance: 70, strength: 52, speed: 75, flexibility: 55 },
  { date: "Apr", endurance: 73, strength: 55, speed: 74, flexibility: 58 },
  { date: "May", endurance: 75, strength: 60, speed: 76, flexibility: 62 },
  { date: "Jun", endurance: 80, strength: 63, speed: 78, flexibility: 65 },
];

const mockWeeklyPerformance = [
  { day: "Mon", performance: 75 },
  { day: "Tue", performance: 82 },
  { day: "Wed", performance: 78 },
  { day: "Thu", performance: 85 },
  { day: "Fri", performance: 88 },
  { day: "Sat", performance: 90 },
  { day: "Sun", performance: 86 },
];

export default function FitnessProgress() {
  const [, navigate] = useLocation();
  const [timeFrame, setTimeFrame] = useState("6months");
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Fitness Progress</h2>
        
        <Tabs defaultValue="fitness-progress" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="training-diary" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/training-diary")}
            >
              Training Diary
            </TabsTrigger>
            <TabsTrigger 
              value="fitness-progress" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Fitness Progress
            </TabsTrigger>
            <TabsTrigger 
              value="smart-doctor" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/smart-doctor")}
            >
              Smart Doctor
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Feedback
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="fitness-progress" className="mt-0">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Performance Metrics</CardTitle>
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
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mockFitnessData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="endurance" 
                          stroke="#0062cc" 
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="strength" 
                          stroke="#ff5722" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="speed" 
                          stroke="#00c853" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="flexibility" 
                          stroke="#ffc107" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={mockWeeklyPerformance}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="performance" fill="#0062cc" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance By Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Endurance</span>
                          <span className="text-sm font-medium">80%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "80%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Strength</span>
                          <span className="text-sm font-medium">63%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-secondary h-2.5 rounded-full" style={{ width: "63%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Speed</span>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-accent h-2.5 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Flexibility</span>
                          <span className="text-sm font-medium">65%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-warning h-2.5 rounded-full" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
