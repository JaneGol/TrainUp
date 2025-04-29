import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MultiStepMorningDiaryForm from "@/components/forms/multi-step-morning-diary-form"; 

export default function MorningDiaryPage() {
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch latest diary to check if one was already submitted today
  const { data: latestDiary, isLoading: diaryLoading } = useQuery({
    queryKey: ["/api/morning-diary/latest"],
    queryFn: async () => {
      const res = await fetch("/api/morning-diary/latest");
      if (!res.ok) return null;
      return await res.json();
    }
  });
  
  // Check if user has already completed diary today
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedToday = latestDiary?.date?.split('T')[0] === today;
  
  // If loading, show loading state
  if (diaryLoading) {
    return (
      <div className="min-h-screen bg-[#1a1d22] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already completed today, show confirmation
  if (hasCompletedToday && !submitting) {
    return (
      <div className="min-h-screen bg-[#1a1d22] flex flex-col">
        <header className="bg-[#1a1d22] border-b border-gray-800 p-4 flex items-center shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/athlete")}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white flex-1 text-center pr-8">
            Morning Self-Control Diary
          </h1>
        </header>
        
        <main className="flex-1 p-4 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md bg-[#1a1d22] border border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Already Completed
              </CardTitle>
              <CardDescription className="text-gray-400">
                You've already completed your morning diary for today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Your readiness score for today is {latestDiary.readinessScore}%.
              </p>
              <p className="text-sm text-gray-400">
                Feel free to check the Smart Doctor section for personalized recommendations based on your input.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/athlete")}
              >
                Back to Home
              </Button>
              <Button onClick={() => navigate("/athlete/smart-doctor")}>
                View Recommendations
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }
  
  // Show the new multi-step form
  return (
    <div className="min-h-screen bg-[#1a1d22] flex flex-col">
      <header className="bg-[#1a1d22] border-b border-gray-800 p-4 flex items-center shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/athlete")}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-white flex-1 text-center pr-8">
          Morning Self-Control Diary
        </h1>
      </header>
      
      <main className="flex-1 p-4">
        <MultiStepMorningDiaryForm />
      </main>
    </div>
  );
}