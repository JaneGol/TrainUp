import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AthleteStatus() {
  const [, navigate] = useLocation();
  
  // Get athletes with recovery readiness
  const { data: athleteReadiness, isLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });
  
  const statusColor = (score: number) => {
    if (score > 75) return 'bg-green-500';
    if (score > 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const statusLabel = (score: number) => {
    if (score > 75) return 'Ready';
    if (score > 50) return 'Elevated Risk';
    return 'High Risk';
  };
  
  const trendIcon = (trend: string) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '–';
  };
  
  const trendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 p-2 text-white hover:bg-zinc-800" 
            onClick={() => navigate("/coach")}
          >
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold">Athlete Status Dashboard</h2>
        </div>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Athlete Readiness Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading athlete data...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 pb-2 border-b border-zinc-700 text-sm font-medium text-zinc-400">
                  <div>Athlete</div>
                  <div>Recovery Score</div>
                  <div>Trend</div>
                  <div>Status</div>
                  <div>Issues</div>
                </div>
                
                {(athleteReadiness || []).map((athlete: any, index: number) => (
                  <div key={index} className="grid grid-cols-5 gap-4 py-3 border-b border-zinc-800 items-center">
                    <div className="font-medium">{athlete.name}</div>
                    <div>{athlete.readinessScore}%</div>
                    <div className={`${trendColor(athlete.trend)}`}>
                      {trendIcon(athlete.trend)}
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${statusColor(athlete.readinessScore)}`} />
                      <span>{statusLabel(athlete.readinessScore)}</span>
                    </div>
                    <div>
                      {athlete.issues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {athlete.issues.map((issue: string, i: number) => (
                            <span key={i} className="inline-block px-2 py-1 bg-zinc-800 rounded-md text-xs">
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-500">No issues</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!athleteReadiness || athleteReadiness.length === 0) && (
                  <p className="text-center py-6 text-zinc-400">No athlete data available.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}