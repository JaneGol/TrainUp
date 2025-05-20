import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CoachDashboardLayout from "@/components/layout/coach-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Activity, AlertTriangle, HeartPulse, 
  Dumbbell, Gauge, UserCheck, ClipboardList, 
  ChevronRight, LogOut, Battery, Zap, 
  BatteryMedium, BatteryWarning, BatteryFull,
  CircleDashed, TrendingUp, TrendingDown,
  PlusCircle, Triangle, FileSpreadsheet
} from "lucide-react";

// Define card component for metrics
const MetricCard = ({ 
  title, 
  value, 
  trend = null, 
  icon, 
  color = "primary",
  isLoading = false 
}: { 
  title: string;
  value: string | number;
  trend?: { value: string; direction: "up" | "down"; text: string } | null;
  icon: React.ReactNode;
  color?: "primary" | "secondary" | "warning" | "success" | "danger";
  isLoading?: boolean;
}) => {
  const colorClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    warning: "bg-yellow-500 text-white",
    success: "bg-green-500 text-white",
    danger: "bg-red-500 text-white"
  };
  
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{isLoading ? "..." : value}</h3>
            {trend && (
              <p className={`text-xs mt-1 ${trend.direction === "up" ? "text-green-400" : "text-red-400"}`}>
                {trend.direction === "up" ? "↑" : "↓"} {trend.value} {trend.text}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Define the action button component styled like athlete interface buttons
const ActionButton = ({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void 
}) => {
  return (
    <Button 
      onClick={onClick}
      className="h-20 flex items-center justify-between w-full bg-[#c5f42c] hover:bg-[#d8ff43] text-black border-none rounded-lg text-xl font-bold py-8 px-6"
      variant="default"
    >
      <div className="flex items-center">
        <div className="mr-4">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <ChevronRight className="h-6 w-6" />
    </Button>
  );
};

export default function NewCoachDashboard() {
  const { user, logoutMutation } = useAuth();
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

  // Get average readiness score
  const averageReadiness = teamReadiness?.length
    ? Math.round(
        teamReadiness.reduce((sum: number, item: any) => sum + item.value, 0) /
        teamReadiness.length
      )
    : 0;

  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get athletes with health status
  const { data: athleteReadiness } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
    onSuccess: (data) => {
      // Log the data to inspect the issues array for debugging
      console.log("Athlete readiness data:", data);
      if (data) {
        data.forEach((athlete: any) => {
          if (athlete.issues && athlete.issues.length > 0) {
            console.log(`Athlete ${athlete.name} issues:`, athlete.issues);
          }
        });
      }
    }
  });

  // Get team training load
  const { data: trainingLoad } = useQuery({
    queryKey: ["/api/analytics/training-load"],
  });

  // Calculate metrics
  const totalAthletes = athletes?.length || 0;
  
  // Calculate team average recovery rate based on actual API response structure
  const averageRecovery = athleteReadiness?.length
    ? Math.round(
        athleteReadiness.reduce((sum: any, athlete: any) => {
          // The API returns readinessScore, not recoveryScore
          // We'll use this value as a baseline and adjust accordingly
          const baseScore = athlete.readinessScore || 0;
          
          // Most readiness scores are between 0-100
          return sum + baseScore;
        }, 0) / athleteReadiness.length
      )
    : 70; // Default to 70% if no data available
  
  // Calculate team average readiness (leave averageReadiness from earlier for now)
  
  // Calculate number of athletes at high risk
  const athletesAtRisk = athleteReadiness?.filter((a: any) => {
    // Consider an athlete high risk if their riskScore is high (> 7)
    // or if they have injuries or significant health issues
    if (a.riskScore > 7) return true;
    
    // Also check reported issues for serious problems
    if (Array.isArray(a.issues)) {
      return a.issues.some((issue: string) => {
        const lowercaseIssue = issue.toLowerCase();
        return (
          // Look for serious health indicators
          lowercaseIssue.includes("severe") ||
          lowercaseIssue.includes("critical") ||
          lowercaseIssue.includes("acute injury") ||
          lowercaseIssue.includes("significant") ||
          // High risk ACWR
          lowercaseIssue.includes("high acwr") ||
          lowercaseIssue.includes("overtraining")
        );
      });
    }
    return false;
  }).length || 0;
  
  // Calculate sick or injured athletes - match specific keywords for health issues
  const sickOrInjuredAthletes = athleteReadiness?.filter((a: any) => {
    if (!Array.isArray(a.issues)) return false;
    
    // Skip "No recent data" and "No data from yesterday" as these are not health issues
    const filteredIssues = a.issues.filter((issue: string) => 
      !issue.includes("No recent data") && 
      !issue.includes("No data from yesterday") &&
      issue !== ""
    );
    
    if (filteredIssues.length === 0) return false;
    
    // Count as sick/injured only with specific health-related terms
    return filteredIssues.some((issue: string) => {
      const lowercaseIssue = issue.toLowerCase();
      return (
        // Illness related
        lowercaseIssue.includes("sick") || 
        lowercaseIssue.includes("ill") ||
        lowercaseIssue.includes("fever") || 
        lowercaseIssue.includes("flu") ||
        
        // Injury related - be more specific
        lowercaseIssue.includes("injury") ||
        lowercaseIssue.includes("pain") && !lowercaseIssue.includes("no pain") ||
        (lowercaseIssue.includes("sore") && !lowercaseIssue.includes("no soreness"))
      );
    });
  }).length || 0;
  
  // Calculate team training load (weekly total)
  const weeklyTrainingLoad = trainingLoad 
    ? trainingLoad
        .filter((item: any) => {
          const date = new Date(item.date);
          const now = new Date();
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return date >= sevenDaysAgo && date <= now;
        })
        .reduce((sum: number, item: any) => sum + item.load, 0)
    : 0;

  // Action button handlers
  const handleAthleteStatusClick = () => {
    navigate("/coach/athlete-status");
  };

  const handleAddTrainingClick = () => {
    navigate("/coach/add-training");
  };

  const handleLoadInsightsClick = () => {
    navigate("/coach/load-insights");
  };

  const handleSmartDoctorClick = () => {
    navigate("/coach/smart-doctor");
  };
  
  const handleDataExportClick = () => {
    navigate("/coach/data-export");
  };

  return (
    <CoachDashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        {/* Welcome text with logout button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">
              Hey, {user?.firstName || 'Coach'}!
            </h2>
            <p className="text-zinc-400 mt-1">
              Today - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-zinc-800 flex items-center gap-2"
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    navigate("/auth");
                  }
                });
              }}
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </Button>
          </div>
        </div>
        
        {/* Ultra-Compact Key Metrics Panel */}
        <div className="bg-zinc-900 rounded-full py-1.5 px-3 mb-6 flex justify-between items-center gap-2 shadow-md mx-auto max-w-2xl">
          {/* Recovery Metric */}
          <div className="flex items-center gap-1 px-1.5">
            <BatteryFull className={`h-4 w-4 ${averageRecovery >= 70 ? 'text-green-500' : 'text-amber-500'}`} />
            <div>
              <div className="text-xs font-bold">{readinessLoading ? "..." : `${averageRecovery}%`}</div>
              <div className="text-[9px] text-zinc-400 -mt-0.5">Recovery</div>
            </div>
          </div>

          <div className="w-px h-6 bg-zinc-800"></div>

          {/* Readiness Metric */}
          <div className="flex items-center gap-1 px-1.5">
            <Zap className={`h-4 w-4 ${averageReadiness >= 70 ? 'text-green-500' : 'text-amber-500'}`} />
            <div>
              <div className="text-xs font-bold">{readinessLoading ? "..." : `${averageReadiness}%`}</div>
              <div className="text-[9px] text-zinc-400 -mt-0.5">Readiness</div>
            </div>
          </div>

          <div className="w-px h-6 bg-zinc-800"></div>

          {/* High Risk Metric */}
          <div className="flex items-center gap-1 px-1.5">
            <Triangle 
              className={`h-4 w-4 
                ${athletesAtRisk === 0 ? 'text-green-500' : 
                  athletesAtRisk <= 2 ? 'text-yellow-400' : 
                  'text-red-500'}`} 
              fill={athletesAtRisk > 2 ? 'currentColor' : 'none'}
            />
            <div>
              <div className="text-xs font-bold">{athletesLoading ? "..." : athletesAtRisk}</div>
              <div className="text-[9px] text-zinc-400 -mt-0.5">High Risk</div>
            </div>
          </div>

          <div className="w-px h-6 bg-zinc-800"></div>

          {/* Sick/Injured Metric */}
          <div className="flex items-center gap-1 px-1.5">
            <HeartPulse className={`h-4 w-4 ${sickOrInjuredAthletes === 0 ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <div className="text-xs font-bold">{athletesLoading ? "..." : sickOrInjuredAthletes}</div>
              <div className="text-[9px] text-zinc-400 -mt-0.5">Sick/Injured</div>
            </div>
          </div>
        </div>
        
        {/* Action buttons styled like athlete interface */}
        <div className="space-y-4 max-w-2xl mx-auto mb-8">
          <ActionButton
            icon={<UserCheck className="h-6 w-6" />}
            label="Athlete Status"
            onClick={handleAthleteStatusClick}
          />
          
          <ActionButton
            icon={<ClipboardList className="h-6 w-6" />}
            label="Add Training"
            onClick={handleAddTrainingClick}
          />
          
          <ActionButton
            icon={<Activity className="h-6 w-6" />}
            label="Load Insights"
            onClick={handleLoadInsightsClick}
          />
          
          <ActionButton
            icon={<HeartPulse className="h-6 w-6" />}
            label="Smart Doctor"
            onClick={handleSmartDoctorClick}
          />
        </div>
        
        {/* Recent activity section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-zinc-900 border-zinc-800 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Athlete Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {athletesLoading ? (
                <p>Loading athlete status...</p>
              ) : (
                <div className="space-y-4">
                  {(athleteReadiness || []).slice(0, 5).map((athlete: any, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b border-zinc-700 pb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          athlete.readinessScore > 75 ? 'bg-green-500' : 
                          athlete.readinessScore > 50 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`} />
                        <span>{athlete.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-3">{athlete.readinessScore}%</span>
                        <span className={`text-xs ${
                          athlete.trend === 'up' ? 'text-green-400' : 
                          athlete.trend === 'down' ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {athlete.trend === 'up' ? '↑' : 
                           athlete.trend === 'down' ? '↓' : 
                           '–'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline"
                      className="w-full border-zinc-700 hover:bg-zinc-800 text-white"
                      onClick={handleAthleteStatusClick}
                    >
                      View All Athletes
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full border-zinc-700 hover:bg-zinc-800 text-white flex items-center justify-center"
                      onClick={handleDataExportClick}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-[rgb(200,255,1)]" />
                      Export Data to Sheets
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>High Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(athleteReadiness || [])
                  .filter((a: any) => a.riskScore > 7)
                  .slice(0, 3)
                  .map((athlete: any, index: number) => (
                    <div key={index} className="border-l-2 border-red-500 pl-4 py-2">
                      <h4 className="font-semibold">{athlete.name}</h4>
                      <p className="text-sm text-zinc-400 mb-1">Risk score: {athlete.riskScore}/10</p>
                      <ul className="text-sm space-y-1">
                        {athlete.issues.map((issue: string, i: number) => (
                          <li key={i} className="text-red-300">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                
                {(!athleteReadiness || athleteReadiness.filter((a: any) => a.riskScore > 7).length === 0) && (
                  <p className="text-zinc-400">No high-risk athletes at the moment.</p>
                )}
                
                <Button 
                  variant="outline"
                  className="w-full mt-4 border-zinc-700 hover:bg-zinc-800 text-white"
                  onClick={handleSmartDoctorClick}
                >
                  View Smart Doctor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachDashboardLayout>
  );
}