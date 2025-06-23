import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { WellnessProgressRing } from "@/components/ui/animated-progress-ring";

import {
  ClipboardCheck,
  BarChart3,
  Dumbbell,
  Heart,
  Loader2,
  Trophy,
  ArrowRight,
  LogOut,
  LineChart,
  User,
  MapPin,
  Zap,
  Target,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AthleteHomePage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Handle logout click
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  // Fetch latest morning diary to check if today's entry exists
  const { data: latestDiary, isLoading: diaryLoading } = useQuery({
    queryKey: ["/api/morning-diary/latest"],
    queryFn: async () => {
      const res = await fetch("/api/morning-diary/latest");
      if (!res.ok) throw new Error("Failed to fetch latest diary");
      return await res.json();
    }
  });

  // Fetch today's RPE submissions to check if RPE has been completed today
  const { data: todaysRpe, isLoading: rpeLoading } = useQuery({
    queryKey: ["/api/rpe/today"],
    queryFn: async () => {
      const res = await fetch("/api/rpe/today");
      if (!res.ok) throw new Error("Failed to fetch today's RPE submissions");
      return await res.json();
    }
  });

  // Check if user has completed diary today
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedDiaryToday = latestDiary?.date?.split('T')[0] === today;

  // Check if user has completed RPE today and get training types
  const hasCompletedRpeToday = todaysRpe && todaysRpe.length > 0;
  const completedTrainingTypes = hasCompletedRpeToday ? todaysRpe : [];
  const primaryTrainingType = hasCompletedRpeToday ? todaysRpe[0]?.type : null;

  // Function to get training type icon
  const getTrainingIcon = (type: string) => {
    if (type?.includes('Field')) return MapPin;
    if (type?.includes('Gym')) return Activity;
    if (type?.includes('Match')) return Target;
    return Dumbbell; // Default
  };

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

        {/* Today's wellness status */}
        {hasCompletedDiaryToday && latestDiary?.readinessScore && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Trophy className="h-5 w-5 mr-2 text-accent" />
              <span className="font-semibold">Today's Wellness</span>
            </div>
            <div className="ml-7">
              {(() => {
                const score = latestDiary.readinessScore;
                if (score >= 76) {
                  return <span className="text-sm text-green-400 font-medium">High Readiness 🟢</span>;
                } else if (score >= 45) {
                  return <span className="text-sm text-yellow-400 font-medium">Moderate Readiness 🟡</span>;
                } else {
                  return <span className="text-sm text-red-400 font-medium">Low Readiness 🔴</span>;
                }
              })()}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-5 gap-5 -mt-5">
        <div className="grid grid-cols-1 gap-5">
          {/* Self-Control Diary Button - Using gradient */}
          <Button
            onClick={() => navigate("/athlete/morning-diary")}
            className={`btn-athletic h-24 ${hasCompletedDiaryToday
                ? "bg-success text-white"
                : "bg-primary text-black"
              }`}
          >
            {diaryLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <div className="flex items-center">
                  <ClipboardCheck className="sport-icon" />
                  <div className="flex flex-col items-start">
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
                </div>
                <ArrowRight className="h-5 w-5 opacity-70" />
              </>
            )}
          </Button>

          {/* RPE Form Button */}
          <Button
            onClick={() => navigate("/athlete/training-entry")}
            className={`btn-athletic h-24 ${hasCompletedRpeToday
                ? "bg-success text-white"
                : "bg-gray-600 text-primary hover:text-primary"
              }`}
          >
            {rpeLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <div className="flex items-center">
                  {hasCompletedRpeToday ? (
                    <>
                      <div className="flex items-center gap-1 mr-3">
                        {completedTrainingTypes.map((training, index) => {
                          const TrainingIcon = getTrainingIcon(training.type);
                          return <TrainingIcon key={index} className="sport-icon" style={{ width: '20px', height: '20px' }} />;
                        })}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xl font-bold">RPE Form</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            Completed Today
                          </span>
                          <div className="flex gap-1">
                            {completedTrainingTypes.map((training, index) => (
                              <span key={index} className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                                {training.type?.replace(' Training', '')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Dumbbell className="sport-icon" />
                      <span className="text-xl font-bold">RPE Form</span>
                    </>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 opacity-70" />
              </>
            )}
          </Button>

          {/* Fitness Progress Button */}
          <Button
            onClick={() => navigate("/athlete/fitness-progress")}
            className="btn-athletic h-24 bg-primary text-black"
          >
            <div className="flex items-center">
              <LineChart className="sport-icon" />
              <span className="text-xl font-bold">Fitness Progress</span>
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </Button>

          {/* Smart Doctor Button */}
          <Button
            onClick={() => navigate("/athlete/smart-doctor")}
            className="btn-athletic h-24 bg-primary text-black"
          >
            <div className="flex items-center">
              <Heart className="sport-icon" />
              <span className="text-xl font-bold">Smart Doctor</span>
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      </main>

      {/* Profile and Logout buttons */}
      <div className="bg-zinc-900 py-3 mt-4 flex justify-center space-x-4">
        <Button
          onClick={() => navigate("/profile")}
          variant="ghost"
          className="flex items-center text-lime-300 hover:text-lime-400 font-semibold gap-2"
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Button>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="flex items-center text-lime-300 hover:text-lime-400 font-semibold gap-2"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span>Log Out</span>
        </Button>
      </div>

      {/* Footer with attribution */}
      <footer className="py-3 px-5 text-center text-xs text-muted-foreground">
        <p>Sport Team Performance Tracker</p>
      </footer>
    </div>
  );
}