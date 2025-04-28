import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import MorningControlDiaryForm from "@/components/forms/morning-control-diary-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunMoon, Battery } from "lucide-react";

export default function MorningDiaryPage() {
  const [, navigate] = useLocation();
  
  // Get latest morning diary entry to display readiness score
  const { data: latestDiary, isLoading: diaryLoading } = useQuery({
    queryKey: ["/api/morning-diary/latest"],
    // If API returns 404, don't treat it as an error since user might not have submitted any diary yet
    refetchOnWindowFocus: false,
  });
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Self-Monitoring Diary</h2>
        
        <Tabs defaultValue="morning-diary" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="morning-diary" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Morning Diary
            </TabsTrigger>
            <TabsTrigger 
              value="training-evaluation" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/training-diary")}
            >
              Training Evaluation
            </TabsTrigger>
            <TabsTrigger 
              value="fitness-progress" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/fitness-progress")}
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
          </TabsList>
          
          <TabsContent value="morning-diary" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <MorningControlDiaryForm />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Battery className="h-5 w-5 mr-2 text-primary" />
                      Daily Readiness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {diaryLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                      ) : latestDiary ? (
                        <div className="relative w-40 h-40 flex items-center justify-center">
                          <div className="absolute w-full h-full rounded-full bg-gray-100"></div>
                          <div className="absolute top-0 left-0 w-full h-full">
                            <svg 
                              className="w-full h-full transform -rotate-90" 
                              viewBox="0 0 100 100"
                            >
                              <circle
                                className="text-primary" 
                                strokeWidth="10"
                                stroke="currentColor"
                                fill="transparent"
                                r="40"
                                cx="50"
                                cy="50"
                                strokeDasharray={`${2 * Math.PI * 40 * latestDiary.readinessScore / 100} ${2 * Math.PI * 40}`}
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-4xl font-bold text-primary">{latestDiary.readinessScore}%</span>
                            <span className="text-sm text-gray-500">Readiness</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                          <SunMoon className="h-12 w-12 text-gray-300" />
                          <p className="text-gray-500">Complete your morning assessment to see your readiness score</p>
                        </div>
                      )}
                      <p className="text-gray-600 text-center">
                        {latestDiary ? 
                          `Last updated: ${new Date(latestDiary.date).toLocaleDateString()}` : 
                          "Complete your morning diary assessment daily for accurate readiness tracking"
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About Daily Self-Monitoring</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        The morning control diary helps evaluate your daily readiness for training based on:
                      </p>
                      <ul className="space-y-2 text-gray-600 list-disc pl-5">
                        <li>Sleep quality and restedness</li>
                        <li>Mood and motivation</li>
                        <li>Body feeling and any pain</li>
                        <li>Recovery status</li>
                        <li>Mental focus and readiness</li>
                      </ul>
                      <p className="text-gray-600 mt-4">
                        Complete this assessment each morning to help your coaches monitor your health and
                        optimize your training program.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}