import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import ReadinessChart from "@/components/charts/readiness-chart";
import AthleteTable from "@/components/coach/athlete-table";
import HealthAlerts from "@/components/coach/health-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File, HeartPulse, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamOverviewPage() {
  const [, navigate] = useLocation();
  
  // Get team readiness data
  const { data: teamReadiness, isLoading: readinessLoading } = useQuery({
    queryKey: ["/api/team-readiness"],
  });

  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get health reports with alerts
  const { data: healthReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/health-reports"],
  });

  // Filter health alerts (severity > 6)
  const healthAlerts = healthReports?.filter((report: any) => report.severity > 6) || [];
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Overview</h2>
        
        <Tabs defaultValue="team-overview" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="team-overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
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
              onClick={() => navigate("/coach/performance-analytics")}
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
          
          <TabsContent value="team-overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="mb-8">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Team Readiness Scores</CardTitle>
                    <Select defaultValue="7days">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="14days">Last 14 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    <ReadinessChart data={teamReadiness || []} isLoading={readinessLoading} />
                  </CardContent>
                </Card>
                
                <AthleteTable 
                  athletes={athletes || []} 
                  isLoading={athletesLoading} 
                />
              </div>
              
              <div>
                <HealthAlerts 
                  alerts={healthAlerts} 
                  isLoading={reportsLoading} 
                />
                
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Recent Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start border-l-2 border-primary-light pl-4 pb-4">
                        <div className="bg-primary text-white p-2 rounded-full mr-3">
                          <File className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Training diary submitted</h4>
                          <p className="text-sm text-gray-500">30 minutes ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start border-l-2 border-secondary-light pl-4 pb-4">
                        <div className="bg-secondary text-white p-2 rounded-full mr-3">
                          <HeartPulse className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">New fitness test recorded</h4>
                          <p className="text-sm text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start border-l-2 border-accent-light pl-4">
                        <div className="bg-accent text-white p-2 rounded-full mr-3">
                          <CalendarCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Team training plan updated</h4>
                          <p className="text-sm text-gray-500">Yesterday</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <Button variant="link" className="text-primary">
                        View All Updates
                      </Button>
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
