import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatCard from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadinessChart from "@/components/charts/readiness-chart";
import AthleteTable from "@/components/coach/athlete-table";
import HealthAlerts from "@/components/coach/health-alerts";
import { Users, File, HeartPulse, CalendarCheck, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (user && user.role === "athlete") {
      navigate("/");
    }
  }, [user, navigate]);

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

  // Calculate team readiness percentage
  const teamReadinessPercent = teamReadiness?.length
    ? Math.round(
        teamReadiness.reduce((sum: number, item: any) => sum + item.value, 0) /
        teamReadiness.length
      )
    : 0;

  // Filter health alerts
  const healthAlerts = healthReports?.filter((report: any) => report.severity > 6) || [];

  // Mock data, would come from API in production
  const athleteUpdates = 7;
  const nextSession = "4:30 PM";

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Coach Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Team Readiness" 
            value={`${teamReadinessPercent}%`} 
            trend={{
              value: "3%",
              direction: "up",
              text: "from yesterday"
            }}
            icon={<Users className="h-5 w-5" />}
            color="secondary"
          />
          
          <StatCard 
            title="Athlete Updates" 
            value={`${athleteUpdates} new`} 
            info={
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                In the last 24 hours
              </div>
            }
            icon={<File className="h-5 w-5" />}
            color="primary"
          />
          
          <StatCard 
            title="Health Alerts" 
            value={healthAlerts.length.toString()} 
            info={
              <div className="flex items-center text-xs text-red-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Requires attention
              </div>
            }
            icon={<HeartPulse className="h-5 w-5" />}
            color="warning"
          />
          
          <StatCard 
            title="Next Team Session" 
            value={nextSession} 
            info={
              <div className="flex items-center text-xs text-gray-500">
                <CalendarCheck className="h-3 w-3 mr-1" />
                Today
              </div>
            }
            icon={<CalendarCheck className="h-5 w-5" />}
            color="accent"
          />
        </div>
        
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
                  <CardHeader>
                    <CardTitle>Team Readiness Scores</CardTitle>
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
          
          <TabsContent value="training-plans" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Training Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create and manage training plans for your team.</p>
                <p className="text-sm text-gray-500 mt-4">This feature is coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
