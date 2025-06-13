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
  
  // Generate smart recommendation text based on athlete's specific issues
  const getRecommendationText = () => {
    const texts = [];
    const issues = athlete.issues.join(' ').toLowerCase();
    
    // Check for specific health symptoms
    if (issues.includes('fever') || issues.includes('temperature')) {
      texts.push("🚨 IMMEDIATE ACTION: Fever detected - athlete must rest until fever-free for 24h. Monitor temperature.");
      texts.push("💧 Ensure adequate hydration and electrolyte replacement.");
      texts.push("📞 Consider medical consultation if fever persists beyond 48 hours.");
    } else if (issues.includes('sore throat') || issues.includes('throat')) {
      texts.push("⚠️ REST REQUIRED: Sore throat indicates potential infection - no training until symptoms resolve.");
      texts.push("🏠 Keep athlete isolated to prevent team spread. Monitor for additional symptoms.");
      texts.push("🔄 Re-evaluate in 24-48 hours before clearing for return to training.");
    } else if (issues.includes('sick') || issues.includes('ill') || issues.includes('nausea') || issues.includes('stomach')) {
      texts.push("🛑 NO TRAINING: Illness symptoms present - complete rest required.");
      texts.push("💊 Focus on recovery: rest, hydration, and nutrition. Monitor symptom progression.");
      texts.push("📋 Clearance required before return to training (48h symptom-free minimum).");
    }
    
    // Check for injury-related issues
    if (issues.includes('injury') || issues.includes('pain') || issues.includes('strain') || issues.includes('sprain')) {
      texts.push("🩹 INJURY PROTOCOL: Immediate assessment required. Apply RICE protocol if appropriate.");
      texts.push("🏥 Consider physiotherapy consultation for proper diagnosis and treatment plan.");
      texts.push("📊 Modify training plan - avoid aggravating movements until cleared.");
    }
    
    // Check for muscle soreness
    if (issues.includes('muscle soreness') || issues.includes('sore muscles')) {
      const severityMatch = issues.match(/(\d+)\s*areas?\s*affected/);
      const affectedAreas = severityMatch ? parseInt(severityMatch[1]) : 1;
      
      if (affectedAreas >= 3) {
        texts.push("💪 WIDESPREAD SORENESS: Multiple muscle groups affected - reduce training intensity by 40-50%.");
        texts.push("🧘 Focus on recovery: light stretching, massage, and adequate sleep (8+ hours).");
      } else if (affectedAreas >= 2) {
        texts.push("⚡ MODERATE SORENESS: Reduce training intensity by 20-30%. Focus on non-affected muscle groups.");
        texts.push("🔄 Active recovery recommended: light cardio and targeted stretching.");
      } else {
        texts.push("✅ MINOR SORENESS: Normal post-training response. Continue with planned intensity.");
        texts.push("🎯 Monitor closely - increase recovery focus if soreness spreads.");
      }
    }
    
    // Check for sleep issues
    if (issues.includes('sleep') || issues.includes('tired') || issues.includes('fatigue')) {
      texts.push("😴 SLEEP DEFICIENCY: Poor sleep affects recovery and injury risk. Reduce intensity by 25%.");
      texts.push("🌙 Sleep hygiene: consistent bedtime, dark room, limit screens 1h before bed.");
      texts.push("⏰ Target 8-9 hours nightly. Consider sleep tracking for better insights.");
    }
    
    // Readiness-based recommendations
    if (athlete.readinessScore < 40) {
      texts.push("🔴 CRITICAL: Very low readiness - mandatory rest day. Address underlying issues.");
    } else if (athlete.readinessScore < 60) {
      texts.push("🟡 CAUTION: Low readiness - light training only (RPE 3-4 max).");
    } else if (athlete.readinessScore >= 80) {
      texts.push("🟢 EXCELLENT: High readiness - athlete can handle planned training intensity.");
    }
    
    // Default if no specific issues
    if (texts.length === 0) {
      texts.push("✅ Standard monitoring sufficient. Continue with planned training program.");
    }
    
    return texts;
  };
  
  // Determine severity level for styling
  const getSeverityLevel = () => {
    const issues = athlete.issues.join(' ').toLowerCase();
    
    if (issues.includes('fever') || issues.includes('sick') || issues.includes('ill')) {
      return 'critical';
    }
    if (issues.includes('sore throat') || issues.includes('injury') || issues.includes('pain')) {
      return 'high';
    }
    if (athlete.readinessScore < 35) {
      return 'medium';
    }
    return 'low';
  };

  const severity = getSeverityLevel();
  
  // Styling based on severity
  const getBorderColor = () => {
    switch (severity) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      default: return 'border-primary-light';
    }
  };

  const getBackgroundColor = () => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10';
      case 'high': return 'bg-orange-500/10';
      case 'medium': return 'bg-yellow-500/10';
      default: return 'bg-zinc-900';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Activity className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className={`border-l-4 ${getBorderColor()} ${getBackgroundColor()} rounded-r-lg p-4 mb-4 border border-zinc-800`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          {getSeverityIcon()}
          {athlete.name}
          <span className={`text-sm font-normal px-2 py-1 rounded ${
            athlete.readinessScore >= 55 ? 'bg-green-500/20 text-green-400' :
            athlete.readinessScore >= 35 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {athlete.readinessScore}% Ready
          </span>
        </h3>
        
        {severity === 'critical' && (
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50 animate-pulse">
            URGENT
          </Badge>
        )}
        {severity === 'high' && (
          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
            HIGH PRIORITY
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {issueTypes.map((type, index) => (
          <Badge key={index} variant="outline" className={`flex items-center gap-1 ${
            severity === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/50' :
            severity === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/50' :
            severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
            'bg-zinc-800 text-zinc-300'
          }`}>
            {IssueIcon({ type })}
            <span className="capitalize">{type}</span>
          </Badge>
        ))}
      </div>
      
      <div className="space-y-1 mb-4">
        <h4 className="text-sm font-medium text-zinc-300 mb-1">Reported Issues:</h4>
        {athlete.issues.map((issue: string, i: number) => (
          <p key={i} className={`text-sm flex items-center gap-2 ${
            severity === 'critical' ? 'text-red-300' :
            severity === 'high' ? 'text-orange-300' :
            'text-zinc-400'
          }`}>
            <span className="w-1 h-1 rounded-full bg-current flex-shrink-0 mt-2"></span>
            {issue}
          </p>
        ))}
      </div>
      
      <div className="border-t border-zinc-700 pt-3">
        <h4 className="text-sm font-medium text-primary-light mb-2">Smart Recommendations:</h4>
        <div className="space-y-2">
          {getRecommendationText().map((text, i) => (
            <div key={i} className={`text-sm p-3 rounded-md border ${
              text.includes('🚨') || text.includes('🛑') ? 'bg-red-500/10 border-red-500/30 text-red-200' :
              text.includes('⚠️') || text.includes('🟡') ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' :
              text.includes('🟢') || text.includes('✅') ? 'bg-green-500/10 border-green-500/30 text-green-200' :
              'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}>
              {text}
            </div>
          ))}
        </div>
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
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <HeartPulse className="h-6 w-6 text-primary" />
                Team Health Overview
              </h3>
              
              {/* Critical Alerts Banner */}
              {!isLoading && athleteReadiness && (
                (() => {
                  const criticalCount = athleteReadiness.filter((a: any) => 
                    a.issues.some((issue: string) => 
                      issue.toLowerCase().includes('fever') || 
                      issue.toLowerCase().includes('sick') || 
                      issue.toLowerCase().includes('ill')
                    )
                  ).length;
                  
                  if (criticalCount > 0) {
                    return (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <h4 className="font-semibold text-red-400">TEAM HEALTH ALERT</h4>
                        </div>
                        <p className="text-red-200">
                          {criticalCount} athlete{criticalCount > 1 ? 's have' : ' has'} illness symptoms. 
                          Review individual recommendations and consider team isolation protocols.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-green-400">Ready to Train</h3>
                    <Activity className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {!isLoading && athleteReadiness 
                      ? athleteReadiness.filter((a: any) => {
                          // Ready if 55%+ readiness AND no injuries/illness
                          const hasIllness = a.issues.some((issue: string) => 
                            issue.toLowerCase().includes('fever') || 
                            issue.toLowerCase().includes('sick') || 
                            issue.toLowerCase().includes('ill') ||
                            issue.toLowerCase().includes('sore throat') ||
                            issue.toLowerCase().includes('injury') ||
                            issue.toLowerCase().includes('pain')
                          );
                          return a.readinessScore >= 55 && !hasIllness;
                        }).length 
                      : "-"} 
                    <span className="text-sm font-normal text-zinc-400">/{athleteReadiness?.length || 0}</span>
                  </p>
                  <p className="text-xs text-green-300 mt-1">55%+ ready, no illness/injury</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-yellow-400">Monitor Closely</h3>
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {!isLoading && athleteReadiness 
                      ? athleteReadiness.filter((a: any) => a.readinessScore >= 35 && a.readinessScore < 55).length 
                      : "-"}
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">35-54% readiness</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-red-400">High Risk</h3>
                    <Thermometer className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {!isLoading && athleteReadiness 
                      ? athleteReadiness.filter((a: any) => a.readinessScore < 35).length 
                      : "-"}
                  </p>
                  <p className="text-xs text-red-300 mt-1">&lt;35% readiness</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-orange-400">Significant Issues</h3>
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-orange-400">
                    {!isLoading && athleteReadiness 
                      ? athleteReadiness.filter((a: any) => {
                          return a.issues.some((issue: string) => {
                            const lowerIssue = issue.toLowerCase();
                            
                            // Critical issues (illness/injury)
                            if (lowerIssue.includes('fever') || lowerIssue.includes('sick') || 
                                lowerIssue.includes('ill') || lowerIssue.includes('sore throat') || 
                                lowerIssue.includes('injury') || lowerIssue.includes('pain')) {
                              return true;
                            }
                            
                            // High-level muscle soreness (3+ areas = signal, 4+ = red flag)
                            const sorenessMatch = lowerIssue.match(/(\d+)\s*areas?\s*affected/);
                            if (sorenessMatch) {
                              const areas = parseInt(sorenessMatch[1]);
                              return areas >= 3; // Level 3+ soreness is significant
                            }
                            
                            return false;
                          });
                        }).length 
                      : "-"}
                  </p>
                  <p className="text-xs text-orange-300 mt-1">requiring attention</p>
                </div>
              </div>
              
              {/* Detailed Health Breakdown */}
              <div className="mt-6 bg-zinc-800 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-primary">Health Issue Breakdown</h4>
                {!isLoading && athleteReadiness ? (
                  (() => {
                    const criticalIssues = athleteReadiness.filter((a: any) => 
                      a.issues.some((issue: string) => 
                        issue.toLowerCase().includes('fever') || 
                        issue.toLowerCase().includes('sick') || 
                        issue.toLowerCase().includes('ill') ||
                        issue.toLowerCase().includes('sore throat')
                      )
                    );
                    
                    const injuryIssues = athleteReadiness.filter((a: any) => 
                      a.issues.some((issue: string) => 
                        issue.toLowerCase().includes('injury') || 
                        issue.toLowerCase().includes('pain')
                      )
                    );
                    
                    const redFlagSoreness = athleteReadiness.filter((a: any) => 
                      a.issues.some((issue: string) => {
                        const match = issue.match(/(\d+)\s*areas?\s*affected/);
                        return match && parseInt(match[1]) >= 4;
                      })
                    );
                    
                    const signalSoreness = athleteReadiness.filter((a: any) => 
                      a.issues.some((issue: string) => {
                        const match = issue.match(/(\d+)\s*areas?\s*affected/);
                        return match && parseInt(match[1]) === 3;
                      })
                    );
                    
                    const normalSoreness = athleteReadiness.filter((a: any) => 
                      a.issues.some((issue: string) => {
                        const match = issue.match(/(\d+)\s*areas?\s*affected/);
                        return match && parseInt(match[1]) <= 2;
                      })
                    );
                    
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{criticalIssues.length}</div>
                          <div className="text-xs text-red-300">Critical</div>
                          <div className="text-xs text-zinc-400">Illness/Fever</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-400">{injuryIssues.length}</div>
                          <div className="text-xs text-orange-300">Injuries</div>
                          <div className="text-xs text-zinc-400">Pain/Injury</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{redFlagSoreness.length}</div>
                          <div className="text-xs text-red-300">Red Flag</div>
                          <div className="text-xs text-zinc-400">4+ Areas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-400">{signalSoreness.length}</div>
                          <div className="text-xs text-yellow-300">Signal</div>
                          <div className="text-xs text-zinc-400">3 Areas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">{normalSoreness.length}</div>
                          <div className="text-xs text-green-300">Normal</div>
                          <div className="text-xs text-zinc-400">1-2 Areas</div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-zinc-400">Loading breakdown...</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-primary">Team Recommendations</h4>
                  {!isLoading && athleteReadiness ? (
                    (() => {
                      const totalAthletes = athleteReadiness.length;
                      const readyAthletes = athleteReadiness.filter((a: any) => {
                        const hasIllness = a.issues.some((issue: string) => 
                          issue.toLowerCase().includes('fever') || 
                          issue.toLowerCase().includes('sick') || 
                          issue.toLowerCase().includes('ill') ||
                          issue.toLowerCase().includes('sore throat') ||
                          issue.toLowerCase().includes('injury') ||
                          issue.toLowerCase().includes('pain')
                        );
                        return a.readinessScore >= 55 && !hasIllness;
                      }).length;
                      const readyPercentage = Math.round((readyAthletes / totalAthletes) * 100);
                      
                      if (readyPercentage >= 70) {
                        return <p className="text-sm text-green-300">🟢 Team is ready for planned training intensity</p>;
                      } else if (readyPercentage >= 50) {
                        return <p className="text-sm text-yellow-300">🟡 Consider reducing team training intensity by 20-30%</p>;
                      } else {
                        return <p className="text-sm text-red-300">🔴 High risk - recommend team recovery day or very light training</p>;
                      }
                    })()
                  ) : (
                    <p className="text-sm text-zinc-400">Loading team assessment...</p>
                  )}
                </div>
                
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-primary">Next Actions</h4>
                  <div className="text-sm text-zinc-300 space-y-1">
                    <p>• Review flagged athletes below</p>
                    <p>• Check AI insights for detailed analysis</p>
                    <p>• Update training plans based on recommendations</p>
                  </div>
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