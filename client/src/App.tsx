import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import AthleteDashboard from "@/pages/athlete/dashboard";
import TrainingDiary from "@/pages/athlete/training-diary";
import FitnessProgress from "@/pages/athlete/fitness-progress";
import SmartDoctor from "@/pages/athlete/smart-doctor";
import MorningDiaryPage from "@/pages/athlete/morning-diary";
import CoachDashboard from "@/pages/coach/dashboard";
import AthleteLogsPage from "@/pages/coach/athlete-logs";
import TeamOverviewPage from "@/pages/coach/team-overview";
import PerformanceAnalyticsPage from "@/pages/coach/performance-analytics";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Athlete routes */}
      <ProtectedRoute path="/" component={AthleteDashboard} />
      <ProtectedRoute path="/morning-diary" component={MorningDiaryPage} />
      <ProtectedRoute path="/training-diary" component={TrainingDiary} />
      <ProtectedRoute path="/fitness-progress" component={FitnessProgress} />
      <ProtectedRoute path="/smart-doctor" component={SmartDoctor} />
      
      {/* Coach routes */}
      <ProtectedRoute path="/coach" component={CoachDashboard} />
      <ProtectedRoute path="/coach/athlete-logs" component={AthleteLogsPage} />
      <ProtectedRoute path="/coach/team-overview" component={TeamOverviewPage} />
      <ProtectedRoute path="/coach/performance-analytics" component={PerformanceAnalyticsPage} />
      
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
