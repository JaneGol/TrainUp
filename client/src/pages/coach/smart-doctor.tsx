import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, Moon, Thermometer, HeartPulse, Activity, 
  Brain, Target, AlertCircle, Award, Sparkles, Zap, Loader2 
} from "lucide-react";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// AI Recommendation Component
const AIRecommendation = ({ recommendation }: { recommendation: any }) => {
  if (!recommendation) return null;
  
  return (
    <Card className="border-primary/20 bg-gradient-to-b from-black/20 to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          AI Health Insights
        </CardTitle>
        <CardDescription className="text-xs">
          Personalized health recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Summary */}
        <div className="bg-black/30 p-3 rounded-md border border-primary/20">
          <p className="text-xs leading-relaxed">{recommendation.summary}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left column: Insights & Recommendations */}
          <div className="space-y-3">
            {/* Key Insights */}
            {recommendation.insights.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  Key Insights
                </h3>
                <ul className="space-y-1 pl-1">
                  {recommendation.insights.map((insight: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1 leading-tight">
                      <span className="text-yellow-400 flex-shrink-0">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendations */}
            {recommendation.recommendations.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold flex items-center gap-1">
                  <Target className="h-3 w-3 text-primary" />
                  Recommendations
                </h3>
                <ul className="space-y-1 pl-1">
                  {recommendation.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1 leading-tight">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Right column: Risk & Improvement Areas */}
          <div className="space-y-3">
            {/* Risk Areas */}
            {recommendation.riskAreas.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  Risk Areas
                </h3>
                <div className="flex flex-wrap gap-1">
                  {recommendation.riskAreas.map((area: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs py-0 h-5 bg-red-500/10 text-red-200 border-red-500/30">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Improvement Areas */}
            {recommendation.improvementAreas.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold flex items-center gap-1">
                  <Award className="h-3 w-3 text-blue-400" />
                  Focus Areas
                </h3>
                <div className="flex flex-wrap gap-1">
                  {recommendation.improvementAreas.map((area: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs py-0 h-5 bg-blue-500/10 text-blue-200 border-blue-500/30">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 text-[10px] text-zinc-500">
        <div className="flex items-center">
          <Sparkles className="h-2 w-2 mr-1 text-primary/50" />
          Generated on {new Date(recommendation.generatedAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default function CoachSmartDoctor() {
  const [, navigate] = useLocation();
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  
  // Get athletes with readiness and issues
  const { data: athleteReadiness, isLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });
  
  // Get injury risk factors
  const { data: injuryRiskFactors } = useQuery({
    queryKey: ["/api/analytics/injury-risk-factors"],
  });
  
  // Get AI health recommendations for selected athlete
  const { data: aiRecommendation, isLoading: isLoadingRecommendation } = useQuery({
    queryKey: ["/api/health-recommendations", selectedAthleteId],
    queryFn: async () => {
      if (!selectedAthleteId) return null;
      const res = await fetch(`/api/health-recommendations/${selectedAthleteId}`);
      if (!res.ok) throw new Error("Failed to fetch AI recommendations");
      return await res.json();
    },
    enabled: !!selectedAthleteId, // Only fetch when an athlete is selected
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
  
  // Handle athlete selection
  const handleAthleteSelect = (athleteId: number) => {
    setSelectedAthleteId(athleteId === selectedAthleteId ? null : athleteId);
  };

  // Get the selected athlete
  const selectedAthlete = athleteReadiness?.find((a: any) => a.athleteId === selectedAthleteId);
  
  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      <div className="p-6 max-w-7xl mx-auto">
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
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 bg-zinc-900 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">Overview</TabsTrigger>
            <TabsTrigger value="ai-insights" className="data-[state=active]:bg-zinc-800">AI Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="bg-zinc-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Health & Recovery Recommendations</h3>
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
            </div>
            
            <div className="bg-zinc-900 rounded-lg p-6 mt-6">
              <h3 className="text-xl font-semibold mb-4">Team Health Overview</h3>
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
            </div>
          </TabsContent>
          
          <TabsContent value="ai-insights" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Athlete List */}
              <div className="bg-zinc-900 rounded-lg col-span-1">
                <div className="p-6 border-b border-zinc-800">
                  <h3 className="text-base font-semibold">Athletes</h3>
                  <p className="text-xs text-zinc-400">
                    Select an athlete for AI health insights
                  </p>
                </div>
                <div className="pb-2 px-2">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-1 pr-2 p-4">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : athleteReadiness?.length > 0 ? (
                        athleteReadiness.map((athlete: any) => (
                          <div 
                            key={athlete.athleteId}
                            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                              selectedAthleteId === athlete.athleteId 
                                ? 'bg-primary/20 border border-primary/30' 
                                : 'bg-zinc-800 hover:bg-zinc-700'
                            }`}
                            onClick={() => handleAthleteSelect(athlete.athleteId)}
                          >
                            <div>
                              <div className="font-medium">{athlete.name}</div>
                              <div className="text-xs text-zinc-400">
                                Readiness: {athlete.readinessScore}%
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              athlete.readinessScore >= 75 
                                ? 'bg-green-400' 
                                : athlete.readinessScore >= 50 
                                  ? 'bg-yellow-400' 
                                  : 'bg-red-400'
                            }`} />
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-400 text-center py-6">No athlete data available</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* AI Recommendation */}
              <div className="col-span-1 md:col-span-2">
                {selectedAthleteId ? (
                  <div className="space-y-4">
                    <div className="bg-zinc-900 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <div className="font-bold">{selectedAthlete?.name}</div>
                        <div className={`ml-3 text-xs px-2 py-0.5 rounded ${
                          selectedAthlete?.readinessScore >= 75 
                            ? 'bg-green-400/20 text-green-200' 
                            : selectedAthlete?.readinessScore >= 50 
                              ? 'bg-yellow-400/20 text-yellow-200' 
                              : 'bg-red-400/20 text-red-200'
                        }`}>
                          {selectedAthlete?.readinessScore}% Readiness
                        </div>
                      </div>
                      
                      {isLoadingRecommendation ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="ml-2">Generating athlete insights...</p>
                        </div>
                      ) : aiRecommendation ? (
                        <AIRecommendation recommendation={aiRecommendation} />
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-zinc-400">No AI recommendations available for this athlete</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 bg-zinc-900 rounded-lg">
                    <Brain className="h-10 w-10 text-zinc-600 mb-3" />
                    <h3 className="text-zinc-400 font-medium mb-1">No athlete selected</h3>
                    <p className="text-zinc-500 text-sm">Select an athlete from the list to view AI health insights</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}