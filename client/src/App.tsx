import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import { ProtectedRoute } from "./lib/protected-route";

// Athlete pages
import AthleteHomePage from "@/pages/athlete/home";
import FitnessProgressPage from "@/pages/athlete/fitness-progress";
import SmartDoctorPage from "@/pages/athlete/smart-doctor";
import MorningDiaryPage from "@/pages/athlete/morning-diary";
import TrainingEntryForm from "@/pages/athlete/training-entry";

// Coach pages
import CoachDashboard from "@/pages/coach/dashboard";
import NewCoachDashboard from "@/pages/coach/new-dashboard";
import AthleteStatus from "@/pages/coach/athlete-status";
import LoadInsights from "@/pages/coach/load-insights-clean";
import TrainingLog from "@/pages/coach/training-log";
import CoachSmartDoctor from "@/pages/coach/smart-doctor";
import AthleteLogsPage from "@/pages/coach/athlete-logs";
import TeamOverviewPage from "@/pages/coach/team-overview";
import PerformanceAnalyticsPage from "@/pages/coach/performance-analytics";
import EnhancedAnalyticsPage from "@/pages/coach/enhanced-analytics";
import DataExportPage from "@/pages/coach/data-export";
import TrainingRecommendationsPage from "@/pages/coach/training-recommendations";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Common routes */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Athlete routes */}
      <ProtectedRoute path="/" component={AthleteHomePage} />
      <ProtectedRoute path="/athlete" component={AthleteHomePage} />
      <ProtectedRoute path="/athlete/morning-diary" component={MorningDiaryPage} />
      <ProtectedRoute path="/athlete/training-entry" component={TrainingEntryForm} />
      <ProtectedRoute path="/athlete/fitness-progress" component={FitnessProgressPage} />
      <ProtectedRoute path="/athlete/smart-doctor" component={SmartDoctorPage} />
      
      {/* Coach routes */}
      <ProtectedRoute path="/coach" component={NewCoachDashboard} />
      <ProtectedRoute path="/coach/old-dashboard" component={CoachDashboard} />
      <ProtectedRoute path="/coach/athlete-status" component={AthleteStatus} />
      <ProtectedRoute path="/coach/load-insights" component={LoadInsights} />
      <ProtectedRoute path="/coach/training-log" component={TrainingLog} />
      <ProtectedRoute path="/coach/add-training" component={TrainingLog} />
      <ProtectedRoute path="/coach/smart-doctor" component={CoachSmartDoctor} />
      <ProtectedRoute path="/coach/athlete-logs" component={AthleteLogsPage} />
      <ProtectedRoute path="/coach/team-overview" component={TeamOverviewPage} />
      <ProtectedRoute path="/coach/performance-analytics" component={PerformanceAnalyticsPage} />
      <ProtectedRoute path="/coach/enhanced-analytics" component={EnhancedAnalyticsPage} />
      <ProtectedRoute path="/coach/data-export" component={DataExportPage} />
      <ProtectedRoute path="/coach/training-recommendations" component={TrainingRecommendationsPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
