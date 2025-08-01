import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronLeft,
  Heart,
  Loader2,
  Battery,
  Coffee,
  Utensils,
  AlertCircle,
  CheckCircle2,
  Info,
  Activity,
  Brain,
  Zap,
  Target,
  Award,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { MorningDiary } from "@shared/schema";

const API_URL = import.meta.env.VITE_API_URL;

export default function SmartDoctorPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: latestDiary, isLoading } = useQuery<MorningDiary>({
    queryKey: ["/api/morning-diary/latest"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/morning-diary/latest`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch latest diary");
      return await res.json();
    }
  });

  const { data: healthReports = [] } = useQuery({
    queryKey: ["/api/health-reports"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/health-reports`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch health reports");
      return await res.json();
    }
  });

  const { data: aiRecommendations, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["/api/health-recommendations"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/health-recommendations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch AI recommendations");
      return await res.json();
    },
    enabled: !!user
  });

  // Check if athlete submitted a morning diary today
  const today = new Date().toISOString().split('T')[0];
  const hasSubmittedToday = latestDiary?.date ? new Date(latestDiary.date).toISOString().split('T')[0] === today : false;

  // Generate AI health assessment based on latest diary
  const generateHealthAssessment = () => {
    if (!latestDiary) return null;

    const readinessScore = latestDiary.readinessScore;
    const symptoms = Array.isArray(latestDiary.symptoms) ? latestDiary.symptoms : [];
    const hasInjury = latestDiary.hasInjury;
    const painLevel = latestDiary.painLevel || 0;

    // Check for critical health symptoms
    const hasFever = symptoms.some((symptom: string) => {
      const symptomLower = symptom.toLowerCase();
      return symptomLower.includes('fever') ||
        symptomLower.includes('temperature') ||
        symptomLower.includes('high_temp') ||
        symptomLower.includes('temp') ||
        symptomLower.includes('hot') ||
        symptomLower.includes('burning');
    });

    const hasSickness = symptoms.some((symptom: string) => {
      const symptomLower = symptom.toLowerCase();
      return symptomLower.includes('sick') ||
        symptomLower.includes('ill') ||
        symptomLower.includes('nausea') ||
        symptomLower.includes('vomit') ||
        symptomLower.includes('dizzy') ||
        symptomLower.includes('weak');
    });

    const hasRespiratoryIssues = symptoms.some((symptom: string) => {
      const symptomLower = symptom.toLowerCase();
      return symptomLower.includes('cough') ||
        symptomLower.includes('throat') ||
        symptomLower.includes('breathing') ||
        symptomLower.includes('chest') ||
        symptomLower.includes('runny_nose') ||
        symptomLower.includes('congestion');
    });

    let status = "Normal";
    let recommendation = "";
    let color = "text-green-500";
    let statusIcon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
    let urgentAlert = "";

    // Critical health conditions override readiness score
    if (hasFever) {
      status = "MEDICAL ATTENTION REQUIRED";
      recommendation = "🚨 FEVER DETECTED - Complete rest required. No training until fever-free for 24 hours.";
      urgentAlert = "Monitor temperature regularly. Seek medical attention if fever persists or worsens.";
      color = "text-red-500";
      statusIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (hasSickness) {
      status = "Illness detected";
      recommendation = "Complete rest recommended. No training until symptoms resolve.";
      urgentAlert = "Focus on hydration and nutrition. Return to training gradually after recovery.";
      color = "text-red-500";
      statusIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (hasRespiratoryIssues) {
      status = "Respiratory symptoms";
      recommendation = "Avoid intense training. Light activity only if feeling well enough.";
      urgentAlert = "Monitor breathing during any activity. Stop if symptoms worsen.";
      color = "text-amber-500";
      statusIcon = <Info className="h-5 w-5 text-amber-500" />;
    } else if (hasInjury && painLevel > 6) {
      status = "Significant injury";
      recommendation = "Rest or very light training only. Focus on injury management.";
      urgentAlert = "Consider medical evaluation if pain persists or worsens.";
      color = "text-red-500";
      statusIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (readinessScore < 40) {
      status = "Recovery needed";
      recommendation = "Today should be a rest day or very light activity only.";
      color = "text-red-500";
      statusIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (readinessScore < 60) {
      status = "Low readiness";
      recommendation = "Light to moderate training only, focus on technique.";
      color = "text-amber-500";
      statusIcon = <Info className="h-5 w-5 text-amber-500" />;
    } else if (readinessScore < 80) {
      status = "Moderate readiness";
      recommendation = "Moderate training load is appropriate.";
      color = "text-blue-500";
      statusIcon = <Info className="h-5 w-5 text-blue-500" />;
    } else {
      status = "High readiness";
      recommendation = "You're ready for high-intensity training.";
      color = "text-green-500";
      statusIcon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }

    // Sleep advice
    let sleepAdvice = "";
    if (latestDiary.sleepHours < 7) {
      sleepAdvice = "Aim for 7-9 hours of sleep tonight to improve recovery.";
    } else if (latestDiary.sleepQuality === "poor") {
      sleepAdvice = "Consider improving sleep quality with a wind-down routine.";
    }

    // Recovery advice based on soreness and symptoms
    let recoveryAdvice = "";
    if (hasFever || hasSickness) {
      recoveryAdvice = "Complete rest and hydration are essential for recovery.";
    } else if (hasInjury && painLevel > 0) {
      recoveryAdvice = `Pain level ${painLevel}/10 - Consider ice, gentle stretching, or physiotherapy.`;
    } else if (latestDiary.recoveryLevel === "poor") {
      recoveryAdvice = "Focus on proper nutrition and hydration today.";
    }

    // Hydration advice - especially important when sick
    let hydrationAdvice = "";
    if (hasFever || hasSickness) {
      hydrationAdvice = "Increase fluid intake significantly - water, electrolyte solutions, and clear broths.";
    } else {
      hydrationAdvice = "Maintain regular hydration throughout the day.";
    }

    // Nutrition advice
    let nutritionAdvice = "Focus on balanced meals with protein, carbs, and vegetables.";
    if (hasFever || hasSickness) {
      nutritionAdvice = "Light, easily digestible foods. Focus on vitamin C and zinc-rich foods.";
    } else if (latestDiary.readinessScore < 60) {
      nutritionAdvice = "Prioritize protein and carbohydrates to support recovery.";
    }

    // Training load advice
    let trainingAdvice = "";
    if (hasFever || hasSickness) {
      trainingAdvice = "NO TRAINING until fully recovered and fever-free for 24+ hours.";
    } else if (hasInjury && painLevel > 6) {
      trainingAdvice = "Avoid exercises that aggravate the injury. Consider alternative training methods.";
    } else if (readinessScore < 40) {
      trainingAdvice = "Rest day recommended. Light stretching or walking only.";
    }

    return {
      status,
      statusIcon,
      color,
      recommendation,
      urgentAlert,
      sleepAdvice,
      recoveryAdvice,
      hydrationAdvice,
      nutritionAdvice,
      trainingAdvice,
      symptoms,
      hasInjury,
      painLevel
    };
  };

  const assessment = generateHealthAssessment();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple header with back button */}
      <header className="border-b border-border p-4 flex items-center shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/athlete")}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">
          Smart Doctor
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !latestDiary ? (
          <Alert className="mb-6">
            <Info className="h-5 w-5" />
            <AlertTitle>No diary entries found</AlertTitle>
            <AlertDescription>
              Complete your morning self-control diary to get personalized health recommendations.
            </AlertDescription>
          </Alert>
        ) : !hasSubmittedToday ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Today's diary missing</AlertTitle>
            <AlertDescription>
              You haven't completed your morning diary today. For the most accurate assessment, please fill out your diary.
            </AlertDescription>
            <Button
              onClick={() => navigate("/athlete/morning-diary")}
              className="mt-2 w-full"
              variant="outline"
            >
              Complete Morning Diary
            </Button>
          </Alert>
        ) : null}

        {latestDiary && assessment && (
          <div className="space-y-6">
            {/* Urgent Alert */}
            {assessment.urgentAlert && (
              <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      URGENT HEALTH ALERT
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {assessment.urgentAlert}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Health Status */}
            <Card>
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {assessment.statusIcon}
                    Current Health Status
                  </CardTitle>
                  <CardDescription className="text-xs mt-0">
                    Based on latest assessment
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Status</span>
                    <span className={`text-sm font-medium ${assessment.color}`}>{assessment.status}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Readiness Score</span>
                    <span className="text-sm font-medium">{latestDiary.readinessScore}%</span>
                  </div>
                  <Progress value={latestDiary.readinessScore} className="h-2" />
                </div>
                <p className="text-sm">{assessment.recommendation}</p>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-1">
                Last updated: {new Date(latestDiary.date).toLocaleString()}
              </CardFooter>
            </Card>

            {/* Current Symptoms */}
            {assessment.symptoms && assessment.symptoms.length > 0 && !assessment.symptoms.includes('no_symptoms') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Current Symptoms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {assessment.symptoms.map((symptom: string, index: number) => (
                      <Badge
                        key={index}
                        variant={symptom.toLowerCase().includes('fever') || symptom.toLowerCase().includes('temperature') ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Injury Information */}
            {assessment.hasInjury && assessment.painLevel > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Injury Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pain Level</span>
                      <Badge variant={assessment.painLevel > 6 ? "destructive" : "secondary"}>
                        {assessment.painLevel}/10
                      </Badge>
                    </div>
                    {assessment.painLevel > 6 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        High pain level detected - avoid activities that worsen the injury.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Training Recommendations */}
            {assessment.trainingAdvice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Training Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{assessment.trainingAdvice}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-amber-500" />
                  Recovery Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessment.sleepAdvice && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M18 8.4C18 6.35 17.36 4.96 16.36 4C15.36 3.04 14.02 2.4 12 2.4C9.98 2.4 8.64 3.04 7.64 4C6.64 4.96 6 6.35 6 8.4C6 17.36 2 19.4 2 19.4H22C22 19.4 18 17.36 18 8.4Z" />
                        <path d="M13.73 21.4C13.5 21.76 13.2 22.05 12.84 22.26C12.482 22.473 12.078 22.587 11.665 22.59C11.252 22.593 10.846 22.486 10.485 22.28C10.1247 22.0679 9.82091 21.7648 9.6 21.4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Sleep</h4>
                      <p className="text-sm text-muted-foreground">{assessment.sleepAdvice}</p>
                    </div>
                  </div>
                )}

                {assessment.recoveryAdvice && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Heart className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Recovery</h4>
                      <p className="text-sm text-muted-foreground">{assessment.recoveryAdvice}</p>
                    </div>
                  </div>
                )}

                {assessment.hydrationAdvice && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Coffee className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Hydration</h4>
                      <p className="text-sm text-muted-foreground">{assessment.hydrationAdvice}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Utensils className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Nutrition</h4>
                    <p className="text-sm text-muted-foreground">{assessment.nutritionAdvice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {healthReports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Health Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {healthReports.map((report: any) => (
                      <li key={report.id} className="bg-muted/30 p-3 rounded-md border border-border">
                        <div className="flex justify-between">
                          <span className="font-medium">{report.symptom}</span>
                          <Badge variant={report.severity > 7 ? "destructive" : "outline"}>
                            Severity: {report.severity}/10
                          </Badge>
                        </div>
                        {report.bodyPart && (
                          <p className="text-sm text-muted-foreground">Area: {report.bodyPart}</p>
                        )}
                        {report.notes && (
                          <p className="text-sm mt-1">{report.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* AI Health Recommendations */}
            {aiRecommendations && (
              <Card className="border-primary/20 bg-gradient-to-b from-black/20 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Health Insights
                  </CardTitle>
                  <CardDescription>
                    Personalized health recommendations based on your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  <div className="bg-black/30 p-4 rounded-md border border-primary/20">
                    <p className="text-sm">{aiRecommendations.summary}</p>
                  </div>

                  {/* Key Insights */}
                  {aiRecommendations.insights.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        Key Insights
                      </h3>
                      <ul className="space-y-1">
                        {aiRecommendations.insights.map((insight: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className="text-yellow-400">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiRecommendations.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1">
                        <Target className="h-4 w-4 text-primary" />
                        Recommendations
                      </h3>
                      <ul className="space-y-1">
                        {aiRecommendations.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risk Areas */}
                  {aiRecommendations.riskAreas.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        Risk Areas
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {aiRecommendations.riskAreas.map((area: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-red-500/10 text-red-200 border-red-500/30">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Areas */}
                  {aiRecommendations.improvementAreas.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1">
                        <Award className="h-4 w-4 text-blue-400" />
                        Focus Areas
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {aiRecommendations.improvementAreas.map((area: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground pt-0">
                  <div className="flex items-center">
                    <Sparkles className="h-3 w-3 mr-1 text-primary/70" />
                    Generated on {new Date(aiRecommendations.generatedAt).toLocaleDateString()}
                  </div>
                </CardFooter>
              </Card>
            )}

            <Button
              className="w-full mt-4"
              onClick={() => navigate("/athlete/morning-diary")}
            >
              Update Morning Diary
            </Button>
          </div>
        )}

        {/* Loading state for AI recommendations */}
        {isLoadingRecommendations && !isLoading && latestDiary && (
          <div className="mt-6 p-6 bg-black/20 rounded-lg border border-primary/20 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your health data...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}