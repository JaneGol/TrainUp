import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Activity, AlertTriangle, HeartPulse, 
  Dumbbell, Gauge, UserCheck, ClipboardList 
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

// Define the action button component
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
      className="h-24 flex flex-col items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white border-none"
      variant="outline"
    >
      <div className="bg-primary/20 p-2 rounded-full">
        {icon}
      </div>
      <span>{label}</span>
    </Button>
  );
};

export default function NewCoachDashboard() {
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
    <DashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        <h2 className="text-2xl font-bold mb-6">Coach Dashboard</h2>
        
        {/* Top-level summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Average Recovery"
            value={`${averageReadiness}%`}
            icon={<Activity className="h-5 w-5" />}
            color="primary"
            isLoading={readinessLoading}
          />
          
          <MetricCard
            title="Average Readiness"
            value={`${averageReadiness}%`}
            icon={<Gauge className="h-5 w-5" />}
            color="secondary"
            isLoading={readinessLoading}
          />
          
          <MetricCard
            title="Athletes at Risk"
            value={athletesAtRisk}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="warning"
            isLoading={athletesLoading}
          />
          
          <MetricCard
            title="Sick/Injured Athletes"
            value={sickOrInjuredAthletes}
            icon={<HeartPulse className="h-5 w-5" />}
            color="danger"
            isLoading={athletesLoading}
          />
          
          <MetricCard
            title="Weekly Training Load"
            value={`${weeklyTrainingLoad} AU`}
            icon={<Dumbbell className="h-5 w-5" />}
            color="success"
            isLoading={!trainingLoad}
          />
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
    </DashboardLayout>
  );
}