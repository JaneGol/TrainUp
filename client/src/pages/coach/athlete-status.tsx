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
  const [location, navigate] = useLocation();
  
  // Extract filter parameter from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const filter = urlParams.get('filter');
  
  // Go back to dashboard
  const handleBackClick = () => {
    navigate("/coach");
  };
  
  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get athlete readiness data
  const { data: athleteReadiness, isLoading: readinessLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });

  // Filter athletes based on URL parameter
  const filteredAthletes = athleteReadiness?.filter((athlete: any) => {
    if (filter === 'sick') {
      const issues = athlete.issues || [];
      return issues.some((issue: string) => 
        issue.includes('soreness') || 
        issue.includes('injury') || 
        issue.includes('Sick') ||
        issue.includes('Fever') ||
        issue.includes('Sore Throat') ||
        issue.includes('Runny Nose') ||
        issue.includes('Headache') ||
        issue.includes('Fatigue')
      );
    }
    return true; // Show all athletes if no filter
  }) || [];
  
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
                {filter === 'sick' ? 'Sick / Injured Athletes' : 'Athlete Status'}
              </h1>
              <p className="text-sm text-zinc-400">
                {filter === 'sick' ? 'Athletes with health issues requiring attention' : 'Monitor team health and performance'}
              </p>
            </div>
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
              {/* Compact athlete status table */}
              {readinessLoading || athletesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2"></th>
                        <th className="text-left py-3 px-2">Name</th>
                        <th className="text-left py-3 px-2">Recovery</th>
                        <th className="text-left py-3 px-2">Readiness</th>
                        <th className="text-left py-3 px-2">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAthletes.map((athlete: any) => {
                        const statusColor = (v: number) => 
                          v >= 80 ? "bg-green-500" : v >= 60 ? "bg-yellow-400" : "bg-red-500";
                        
                        const recoveryScore = Math.min(100, Math.max(0, athlete.readinessScore));
                        const readinessDisplay = Math.floor(recoveryScore / 10); // Convert to 1-10 scale
                        
                        return (
                          <tr key={athlete.athleteId} className="border-b border-white/10 hover:bg-white/5">
                            <td className="pr-2 py-3">🏃</td>
                            <td className="py-3 px-2 font-medium">{athlete.name}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-white text-xs font-medium ${statusColor(recoveryScore)}`}>
                                {Math.floor(recoveryScore / 20)}/5
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-white text-xs font-medium ${statusColor(recoveryScore)}`}>
                                {readinessDisplay}/10
                              </span>
                            </td>
                            <td className="py-3 px-2" style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset', wordBreak: 'break-word' }}>
                              <div className="flex items-start gap-2">
                                {athlete.issues?.length > 0 ? (
                                  <>
                                    <span className="text-red-400 mt-0.5">🌡️</span>
                                    <span className="text-[11px] text-zinc-300 leading-tight">
                                      {athlete.issues.map((issue: string, index: number) => {
                                        if (issue.includes('Muscle soreness:')) {
                                          // Extract the sore areas from the issue text
                                          const sorenessText = issue.replace('Muscle soreness: ', '');
                                          const soreAreas = sorenessText.split(', ').filter(area => area.trim() !== '' && area !== 'has_soreness');
                                          const sorenessCount = soreAreas.length;
                                          
                                          if (sorenessCount > 0) {
                                            return `Muscle soreness (${sorenessCount}/5)`;
                                          }
                                          return issue;
                                        }
                                        return issue;
                                      }).join(", ")}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-green-400">✅</span>
                                    <span className="text-[11px] text-zinc-300 leading-tight">Healthy</span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachDashboardLayout>
  );
}