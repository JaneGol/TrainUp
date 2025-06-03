import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import MultiStepMorningDiaryForm from "@/components/forms/multi-step-morning-diary-form"; 

export default function MorningDiaryPage() {
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch latest diary to check if one was already submitted today
  const { data: latestDiary, isLoading: diaryLoading } = useQuery({
    queryKey: ["/api/morning-diary/latest"],
    queryFn: async () => {
      const res = await fetch("/api/morning-diary/latest");
      if (!res.ok) return null;
      return await res.json();
    }
  });
  
  // Mutation to delete the latest diary entry
  const deleteDiaryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/morning-diary/latest", {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete diary entry");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries after successful deletion
      queryClient.invalidateQueries({ queryKey: ["/api/morning-diary/latest"] });
      toast({
        title: "Entry cleared",
        description: "Your diary entry has been cleared. You can now fill out a new one.",
        variant: "default",
      });
      setSubmitting(true);
    },
    onError: (error) => {
      toast({
        title: "Failed to clear entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Check if user has already completed diary today
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedToday = latestDiary?.date?.split('T')[0] === today;
  
  // If loading, show loading state
  if (diaryLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already completed today, show confirmation
  if (hasCompletedToday && !submitting) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <header className="bg-[rgb(27,29,34)] border-b border-gray-800 p-4 flex items-center shadow-sm">
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
          <Card className="w-full max-w-md bg-black border border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Thank you for your answers!
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your diary for today is complete.
                <br /><br />
                Have a great day!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Your readiness score for today is {latestDiary.readinessScore}%.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  onClick={() => navigate("/athlete")}
                >
                  Back to Home
                </Button>
                <Button onClick={() => navigate("/athlete/smart-doctor")}>
                  View Recommendations
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-center text-gray-400 hover:text-white border border-gray-800"
                onClick={() => deleteDiaryMutation.mutate()}
                disabled={deleteDiaryMutation.isPending}
              >
                {deleteDiaryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing entry...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Entry & Restart
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }
  
  // Show the new multi-step form
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-[rgb(27,29,34)] border-b border-gray-800 p-4 flex items-center shadow-sm">
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
        <Card className="w-full">
          <CardContent className="p-0">
            <MultiStepMorningDiaryForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}