import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  BarChart3,
  Activity,
  Heart,
  Loader2,
  Trophy,
  ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AthleteHomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch latest morning diary to check if today's entry exists
  const { data: latestDiary, isLoading: diaryLoading } = useQuery({
    queryKey: ["/api/morning-diary/latest"],
    queryFn: async () => {
      const res = await fetch("/api/morning-diary/latest");
      if (!res.ok) throw new Error("Failed to fetch latest diary");
      return await res.json();
    }
  });

  // Check if user has completed diary today
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedDiaryToday = latestDiary?.date?.split('T')[0] === today;

  // Format date for display
  const currentDate = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  const formattedDate = currentDate.toLocaleDateString('en-US', dateOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      {/* Header with gradient */}
      <header className="gradient-bg text-white p-5 pb-8 rounded-b-3xl shadow-lg">
        <div className="mb-1 text-sm font-medium opacity-90">{formattedDate}</div>
        <h1 className="text-2xl font-bold">
          Hey, {user?.firstName || 'Athlete'}!
        </h1>
        <p className="mt-1 text-sm font-medium opacity-90">
          {hasCompletedDiaryToday ? 'Ready for today\'s training!' : 'Complete your daily check-in'}
        </p>
        
        {/* Today's readiness score if available */}
        {hasCompletedDiaryToday && latestDiary?.readinessScore && (
          <div className="mt-3 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-accent" />
            <span className="font-semibold">Today's Readiness: {latestDiary.readinessScore}%</span>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-5 gap-5 -mt-5">
        <div className="grid grid-cols-1 gap-5">
          {/* Self-Control Diary Button - Using gradient */}
          <Button
            onClick={() => navigate("/athlete/morning-diary")}
            className={`btn-athletic h-24 ${
              hasCompletedDiaryToday
                ? "bg-success text-white hover:bg-gray-400"
                : "bg-primary text-black hover:bg-gray-400"
            }`}
          >
            {diaryLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <ClipboardList className="h-7 w-7" />
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">Self-Control Diary</span>
                  {hasCompletedDiaryToday ? (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                      Completed Today
                    </span>
                  ) : (
                    <span className="text-xs flex items-center mt-1">
                      Complete now <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  )}
                </div>
              </>
            )}
          </Button>

          {/* RPE Form Button */}
          <Button
            onClick={() => navigate("/athlete/training-entry")}
            className="btn-athletic h-24 bg-primary text-black hover:bg-gray-400"
          >
            <Activity className="h-7 w-7" />
            <span className="text-xl font-bold">RPE Form</span>
          </Button>

          {/* Fitness Progress Button */}
          <Button
            onClick={() => navigate("/athlete/fitness-progress")}
            className="btn-athletic h-24 bg-primary text-black hover:bg-gray-400"
          >
            <BarChart3 className="h-7 w-7" />
            <span className="text-xl font-bold">Fitness Progress</span>
          </Button>

          {/* Smart Doctor Button */}
          <Button
            onClick={() => navigate("/athlete/smart-doctor")}
            className="btn-athletic h-24 bg-primary text-black hover:bg-gray-400"
          >
            <Heart className="h-7 w-7" />
            <span className="text-xl font-bold">Smart Doctor</span>
          </Button>
        </div>
      </main>
      
      {/* Footer with attribution */}
      <footer className="py-3 px-5 text-center text-xs text-muted-foreground">
        <p>Sport Team Performance Tracker</p>
      </footer>
    </div>
  );
}