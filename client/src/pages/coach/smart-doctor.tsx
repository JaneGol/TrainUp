import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Moon, Thermometer, HeartPulse, Activity } from "lucide-react";
import { useLocation } from "wouter";

// Icons for different issue types
const IssueIcon = ({ type }: { type: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    sleep: <Moon className="h-4 w-4" />,
    illness: <Thermometer className="h-4 w-4" />,
    injury: <HeartPulse className="h-4 w-4" />,
    recovery: <Activity className="h-4 w-4" />,
  };
  
  // Default to recovery icon if type not found
  return iconMap[type] || iconMap.recovery;
};

// Component to display health recommendations
const HealthRecommendation = ({ athlete, recommendations }: { 
  athlete: any, 
  recommendations: any 
}) => {
  // Determine issue types based on athlete's issues
  const getIssueTypes = (issues: string[]) => {
    const types = [];
    
    if (issues.some(i => i.toLowerCase().includes('sleep'))) {
      types.push('sleep');
    }
    
    if (issues.some(i => i.toLowerCase().includes('sick') || i.toLowerCase().includes('ill'))) {
      types.push('illness');
    }
    
    if (issues.some(i => i.toLowerCase().includes('injury') || i.toLowerCase().includes('pain'))) {
      types.push('injury');
    }
    
    if (types.length === 0) {
      types.push('recovery');
    }
    
    return types;
  };
  
  const issueTypes = getIssueTypes(athlete.issues);
  
  // Generate recommendation text based on athlete's issues
  const getRecommendationText = () => {
    const texts = [];
    
    if (issueTypes.includes('sleep')) {
      texts.push("Monitor closely: Athlete reported poor sleep. Suggest reduced training intensity.");
    }
    
    if (issueTypes.includes('illness')) {
      texts.push("Sickness reported. Mark as inactive and reassess in 48 hours.");
    }
    
    if (issueTypes.includes('injury')) {
      texts.push("Injury reported. Recommend rest for 3-5 days and follow-up check-in.");
    }
    
    if (texts.length === 0 || issueTypes.includes('recovery')) {
      if (athlete.readinessScore < 50) {
        texts.push("Low recovery with elevated risk – taper recommended.");
      } else {
        texts.push("Normal training can continue with standard monitoring.");
      }
    }
    
    return texts;
  };
  
  return (
    <div className="border-l-2 border-primary-light pl-4 py-4">
      <h3 className="font-bold flex items-center">
        {athlete.name}
        <span className="ml-2 text-sm font-normal">
          (Readiness: {athlete.readinessScore}%)
        </span>
      </h3>
      
      <div className="flex flex-wrap gap-1 mt-1 mb-2">
        {issueTypes.map((type, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1 bg-zinc-800">
            {IssueIcon({ type })}
            <span className="capitalize">{type}</span>
          </Badge>
        ))}
      </div>
      
      <div className="space-y-1 mt-3">
        {athlete.issues.map((issue: string, i: number) => (
          <p key={i} className="text-sm text-zinc-400">• {issue}</p>
        ))}
      </div>
      
      <div className="mt-4 border-t border-zinc-800 pt-3">
        <h4 className="text-sm font-medium text-primary-light mb-2">Recommendations:</h4>
        {getRecommendationText().map((text, i) => (
          <p key={i} className="text-sm bg-zinc-800 p-2 rounded mb-2">{text}</p>
        ))}
      </div>
    </div>
  );
};

export default function CoachSmartDoctor() {
  const [, navigate] = useLocation();
  
  // Get athletes with readiness and issues
  const { data: athleteReadiness, isLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });
  
  // Get injury risk factors
  const { data: injuryRiskFactors } = useQuery({
    queryKey: ["/api/analytics/injury-risk-factors"],
  });
  
  // Filter athletes with issues
  const flaggedAthletes = athleteReadiness
    ? athleteReadiness.filter((athlete: any) => 
        athlete.issues.length > 0 || athlete.readinessScore < 65
      )
    : [];
  
  // Find athlete data in risk factors
  const getAthleteRiskFactors = (athleteId: number) => {
    return injuryRiskFactors?.find((risk: any) => risk.athleteId === athleteId);
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
          <h2 className="text-2xl font-bold">Smart Doctor</h2>
        </div>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>AI-Driven Health & Recovery Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-10 text-center">Analyzing athlete data...</p>
            ) : flaggedAthletes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-green-400 font-medium mb-2">All athletes are in good condition</p>
                <p className="text-zinc-400">No athletes currently require special attention.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {flaggedAthletes.map((athlete: any, index: number) => (
                  <HealthRecommendation 
                    key={index} 
                    athlete={athlete} 
                    recommendations={getAthleteRiskFactors(athlete.athleteId)} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white mt-6">
          <CardHeader>
            <CardTitle>Team Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Athletes Ready</h3>
                <p className="text-3xl font-bold text-green-400">
                  {!isLoading && athleteReadiness 
                    ? athleteReadiness.filter((a: any) => a.readinessScore >= 75).length 
                    : "-"} 
                  <span className="text-lg font-normal text-zinc-400">/{athleteReadiness?.length || 0}</span>
                </p>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Elevated Risk</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {!isLoading && athleteReadiness 
                    ? athleteReadiness.filter((a: any) => a.readinessScore >= 50 && a.readinessScore < 75).length 
                    : "-"}
                </p>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">High Risk</h3>
                <p className="text-3xl font-bold text-red-400">
                  {!isLoading && athleteReadiness 
                    ? athleteReadiness.filter((a: any) => a.readinessScore < 50).length 
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}