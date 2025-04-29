import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BarChart3,
  Activity,
  Heart,
  Loader2
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Simple header */}
      <header className="bg-white border-b p-4 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">
          Hello, {user?.firstName || 'Athlete'}
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 gap-6">
        <div className="grid grid-cols-1 gap-6 mt-2">
          {/* Self-Control Diary Button */}
          <Button
            onClick={() => navigate("/athlete/morning-diary")}
            className={`h-24 text-lg font-medium flex flex-col justify-center items-center gap-2 rounded-xl shadow-md ${
              hasCompletedDiaryToday
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {diaryLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                <FileText className="h-7 w-7" />
                <span>Self-Control Diary</span>
                {hasCompletedDiaryToday && (
                  <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">
                    Completed Today
                  </span>
                )}
              </>
            )}
          </Button>

          {/* RPE Form Button */}
          <Button
            onClick={() => navigate("/athlete/training-entry")}
            className="h-24 text-lg font-medium bg-indigo-600 hover:bg-indigo-700 flex flex-col justify-center items-center gap-2 rounded-xl shadow-md"
          >
            <Activity className="h-7 w-7" />
            <span>RPE Form</span>
          </Button>

          {/* Fitness Progress Button */}
          <Button
            onClick={() => navigate("/athlete/fitness-progress")}
            className="h-24 text-lg font-medium bg-amber-600 hover:bg-amber-700 flex flex-col justify-center items-center gap-2 rounded-xl shadow-md"
          >
            <BarChart3 className="h-7 w-7" />
            <span>Fitness Progress</span>
          </Button>

          {/* Smart Doctor Button */}
          <Button
            onClick={() => navigate("/athlete/smart-doctor")}
            className="h-24 text-lg font-medium bg-rose-600 hover:bg-rose-700 flex flex-col justify-center items-center gap-2 rounded-xl shadow-md"
          >
            <Heart className="h-7 w-7" />
            <span>Smart Doctor</span>
          </Button>
        </div>
      </main>
    </div>
  );
}