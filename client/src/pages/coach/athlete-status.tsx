import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CoachDashboardLayout from "@/components/layout/coach-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Activity, Users } from "lucide-react";
import HealthTrendChart from "@/components/coach/health-trend-chart";
import AthleteIconGrid from "@/components/coach/athlete-icon-grid";

export default function AthleteStatusPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Go back to dashboard
  const handleBackClick = () => {
    navigate("/coach/dashboard");
  };
  
  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get athlete readiness data
  const { data: athleteReadiness, isLoading: readinessLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });
  
  return (
    <CoachDashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        {/* Header with back button and page title */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-2 hover:bg-zinc-800 text-white" 
              onClick={handleBackClick}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Athlete Status
              </h1>
              <p className="text-sm text-zinc-400">Monitor team health and performance</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="text-xs px-3 py-1 h-8 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
              onClick={() => navigate("/coach/dashboard")}
            >
              Dashboard
            </Button>
          </div>
        </div>
        
        {/* 7-Day Health Trends Chart */}
        <div className="mb-6">
          <HealthTrendChart 
            title="7-Day Team Wellness Trends" 
            description="Average metrics from athlete daily self-assessments"
          />
        </div>
        
        {/* Athlete Grid */}
        <div className="mb-6">
          <Card className="bg-zinc-900 border-zinc-800 text-white overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Team Members Status
                </CardTitle>
                <p className="text-xs text-zinc-400">Readiness, recovery status and health indicators</p>
              </div>
            </CardHeader>
            <CardContent>
              {/* Athlete icon grid component with auto-filtered display */}
              <AthleteIconGrid />
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachDashboardLayout>
  );
}