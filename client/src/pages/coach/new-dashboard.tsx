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
  PlusCircle, Triangle
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
  });

  // Get team training load
  const { data: trainingLoad } = useQuery({
    queryKey: ["/api/analytics/training-load"],
  });

  // Calculate metrics
  const totalAthletes = athletes?.length || 0;
  
  // Calculate number of athletes at risk
  const athletesAtRisk = athleteReadiness?.filter((a: any) => a.riskScore > 7).length || 0;
  
  // Calculate sick or injured athletes
  const sickOrInjuredAthletes = athleteReadiness?.filter((a: any) => 
    a.issues.some((issue: string) => 
      issue.includes("sick") || issue.includes("injury") || issue.includes("ill")
    )
  ).length || 0;
  
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
              onClick={() => navigate("/profile")}
            >
              <Users className="h-5 w-5" />
              Profile
            </Button>
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
        
        {/* Modern Infographic Style Key Metrics Panel */}
        <div className="bg-zinc-900 rounded-lg py-4 px-6 mb-6 flex justify-between items-center gap-4 shadow-md">
          {/* Recovery Metric */}
          <div className="flex-1">
            <div className="relative">
              <div className="flex flex-col items-center">
                {/* Circular progress bar */}
                <div className="relative w-16 h-16 mb-1">
                  <CircleDashed 
                    className="w-16 h-16 text-zinc-700 absolute" 
                    strokeWidth={1} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {readinessLoading ? (
                      <div className="h-3 w-3 rounded-full animate-pulse bg-blue-500"></div>
                    ) : (
                      <>
                        {/* Battery icon based on recovery percentage */}
                        {averageReadiness >= 90 ? (
                          <BatteryFull className="h-7 w-7 text-blue-500" />
                        ) : averageReadiness >= 60 ? (
                          <BatteryMedium className="h-7 w-7 text-yellow-400" />
                        ) : (
                          <BatteryWarning className="h-7 w-7 text-red-500" />
                        )}
                        {/* Colored circle around the progress bar based on value */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            className={`
                              ${averageReadiness >= 90 ? 'stroke-blue-500' : 
                                 averageReadiness >= 60 ? 'stroke-yellow-400' : 
                                 'stroke-red-500'}
                            `}
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="transparent"
                            r="36"
                            cx="50"
                            cy="50"
                            strokeDasharray="226.2"
                            strokeDashoffset={226.2 - (226.2 * averageReadiness / 100)}
                          />
                        </svg>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold">
                    {readinessLoading ? "..." : `${averageReadiness}%`}
                  </span>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">Recovery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Readiness Metric */}
          <div className="flex-1">
            <div className="flex flex-col items-center">
              {/* Lightning bolt icon */}
              <div className="relative w-16 h-16 mb-1 flex items-center justify-center">
                <Zap className={`h-10 w-10 
                  ${averageReadiness > 80 ? 'text-green-500' : 
                    averageReadiness > 50 ? 'text-yellow-400' : 
                    'text-red-500'}`} 
                />
                {/* Horizontal bar indicator */}
                <div className="absolute bottom-0 w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full 
                      ${averageReadiness > 80 ? 'bg-green-500' : 
                        averageReadiness > 50 ? 'bg-yellow-400' : 
                        'bg-red-500'}`}
                    style={{ width: `${averageReadiness}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold">
                  {readinessLoading ? "..." : `${averageReadiness}%`}
                </span>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">Readiness</p>
              </div>
            </div>
          </div>

          {/* High Risk Metric */}
          <div className="flex-1">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-1 flex items-center justify-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                  ${athletesAtRisk === 0 ? 'bg-green-500/10' : 
                    athletesAtRisk <= 2 ? 'bg-yellow-400/10' : 
                    'bg-red-500/10'}`}
                >
                  <Triangle 
                    className={`h-8 w-8 
                      ${athletesAtRisk === 0 ? 'text-green-500' : 
                        athletesAtRisk <= 2 ? 'text-yellow-400' : 
                        'text-red-500'}`} 
                    fill={athletesAtRisk > 2 ? 'currentColor' : 'none'}
                  />
                </div>
              </div>
              <div className="text-center">
                <span className={`text-lg font-semibold 
                  ${athletesAtRisk === 0 ? 'text-green-500' : 
                    athletesAtRisk <= 2 ? 'text-yellow-400' : 
                    'text-red-500'}`}
                >
                  {athletesLoading ? "..." : athletesAtRisk}
                </span>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">High Risk</p>
              </div>
            </div>
          </div>

          {/* Sick/Injured Metric */}
          <div className="flex-1">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-1 flex items-center justify-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                  ${sickOrInjuredAthletes === 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                >
                  <HeartPulse 
                    className={`h-8 w-8 
                      ${sickOrInjuredAthletes === 0 ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
              </div>
              <div className="text-center">
                <span className={`text-lg font-semibold 
                  ${sickOrInjuredAthletes === 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {athletesLoading ? "..." : sickOrInjuredAthletes}
                </span>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">Sick/Injured</p>
              </div>
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
                  
                  <Button 
                    variant="outline"
                    className="w-full mt-4 border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={handleAthleteStatusClick}
                  >
                    View All Athletes
                  </Button>
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