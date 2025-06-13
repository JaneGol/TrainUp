import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import CoachDashboardLayout from "@/components/layout/coach-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Brain, Users, TrendingUp, AlertTriangle, Target, Calendar, Activity } from "lucide-react";
import { useLocation } from "wouter";

interface TrainingRecommendation {
  athleteId: number;
  athleteName: string;
  recommendedIntensity: 'Low' | 'Moderate' | 'High' | 'Rest';
  recommendedRPE: number;
  reasonCode: string;
  reasoning: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number;
  generatedAt: string;
}

interface TeamTrainingRecommendation {
  date: string;
  teamReadiness: number;
  recommendedSessionType: 'Recovery' | 'Moderate' | 'High Intensity' | 'Rest Day';
  participationRate: number;
  recommendations: TrainingRecommendation[];
  teamReasoning: string[];
}

export default function TrainingRecommendationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: teamRecommendations, isLoading, error } = useQuery<TeamTrainingRecommendation>({
    queryKey: ["/api/training-recommendations"],
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!user && user.role === 'coach'
  });

  // Debug logging
  console.log("Training Recommendations Query State:", {
    isLoading,
    error: error?.message,
    hasData: !!teamRecommendations,
    teamReadiness: teamRecommendations?.teamReadiness,
    participationRate: teamRecommendations?.participationRate,
    userRole: user?.role,
    queryEnabled: !!user && user.role === 'coach'
  });

  const handleBackClick = () => {
    navigate("/coach");
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Rest': return 'bg-gray-500';
      case 'Low': return 'bg-blue-500';
      case 'Moderate': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'Rest Day': return 'bg-gray-600';
      case 'Recovery': return 'bg-blue-600';
      case 'Moderate': return 'bg-yellow-600';
      case 'High Intensity': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <CoachDashboardLayout>
        <div className="p-6 bg-zinc-950 min-h-screen text-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Analyzing athlete data...</span>
          </div>
        </div>
      </CoachDashboardLayout>
    );
  }

  if (error) {
    return (
      <CoachDashboardLayout>
        <div className="p-6 bg-zinc-950 min-h-screen text-white">
          <div className="text-center text-red-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load training recommendations</p>
          </div>
        </div>
      </CoachDashboardLayout>
    );
  }

  return (
    <CoachDashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        {/* Header */}
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
                <Brain className="h-5 w-5 mr-2 text-primary" />
                Training Recommendations
              </h1>
              <p className="text-sm text-zinc-400">AI-powered intensity guidance based on athlete readiness</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">
              {new Date(teamRecommendations?.date || '').toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Team Summary Card */}
        <Card className="bg-zinc-900 border-zinc-800 text-white mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Team Training Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {teamRecommendations?.teamReadiness}%
                </div>
                <div className="text-sm text-zinc-400">Team Readiness</div>
              </div>
              <div className="text-center">
                <Badge className={`${getSessionTypeColor(teamRecommendations?.recommendedSessionType || '')} text-white`}>
                  {teamRecommendations?.recommendedSessionType}
                </Badge>
                <div className="text-sm text-zinc-400 mt-1">Recommended Session</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {teamRecommendations?.participationRate}%
                </div>
                <div className="text-sm text-zinc-400">Available Athletes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {teamRecommendations?.recommendations.length}
                </div>
                <div className="text-sm text-zinc-400">Athletes Analyzed</div>
              </div>
            </div>
            
            {/* Team Reasoning */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Team Analysis
              </h4>
              <ul className="space-y-1">
                {teamRecommendations?.teamReasoning.map((reason, index) => (
                  <li key={index} className="text-sm text-zinc-300 flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Individual Athlete Recommendations */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Individual Athlete Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teamRecommendations?.recommendations.map((rec) => (
                <div key={rec.athleteId} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  {/* Athlete Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{rec.athleteName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getIntensityColor(rec.recommendedIntensity)} text-white text-xs`}>
                          {rec.recommendedIntensity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          RPE {rec.recommendedRPE}
                        </Badge>
                        <Badge className={`${getRiskColor(rec.riskLevel)} text-white text-xs`}>
                          {rec.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Confidence</div>
                      <div className="text-lg font-semibold text-primary">{rec.confidence}%</div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300 flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      Analysis
                    </h4>
                    <ul className="space-y-1">
                      {rec.reasoning.map((reason, index) => (
                        <li key={index} className="text-sm text-zinc-400 flex items-start">
                          <span className="text-primary mr-2 text-xs">→</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Special Alerts */}
                  {rec.riskLevel === 'High' && (
                    <div className="mt-3 p-2 bg-red-900/20 border border-red-700/50 rounded flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-red-300">High injury risk - monitor closely</span>
                    </div>
                  )}

                  {rec.recommendedIntensity === 'Rest' && (
                    <div className="mt-3 p-2 bg-gray-900/20 border border-gray-700/50 rounded flex items-center">
                      <span className="text-sm text-gray-300">⏸️ Complete rest recommended</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button 
            onClick={() => navigate('/coach/training-log')}
            className="bg-primary text-black hover:bg-primary/90"
          >
            Plan Today's Session
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/coach/athlete-status')}
            className="border-zinc-600 text-white hover:bg-zinc-800"
          >
            View Athlete Status
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-zinc-600 text-white hover:bg-zinc-800"
          >
            Refresh Analysis
          </Button>
        </div>
      </div>
    </CoachDashboardLayout>
  );
}