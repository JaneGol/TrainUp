import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Form schema
const morningDiarySchema = z.object({
  sleepQuality: z.enum(["good", "okay", "poor"]),
  sleepHours: z.coerce.number().min(0).max(24),
  mood: z.enum(["happy", "neutral", "stressed", "sad"]),
  stress: z.enum(["low", "medium", "high"]),
  fatigue: z.enum(["low", "medium", "high"]),
  soreness: z.enum(["low", "medium", "high"]),
  recovery: z.enum(["fully", "partially", "not at all"]),
  motivation: z.enum(["high", "medium", "low"]),
  pain: z.enum(["none", "mild", "moderate", "severe"]),
  mentalState: z.enum(["clear", "foggy", "distracted"]),
  hydrationLevel: z.enum(["good", "okay", "poor"]),
  additionalNotes: z.string().optional(),
});

type MorningDiaryFormValues = z.infer<typeof morningDiarySchema>;

export default function MorningDiaryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [readinessScore, setReadinessScore] = useState(0);
  
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
  
  // Define form
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: {
      sleepQuality: "okay",
      sleepHours: 7,
      mood: "neutral",
      stress: "medium",
      fatigue: "medium",
      soreness: "medium",
      recovery: "partially",
      motivation: "medium",
      pain: "none",
      mentalState: "clear",
      hydrationLevel: "okay",
      additionalNotes: "",
    },
  });
  
  // Calculate readiness score based on form values
  const calculateReadinessScore = (data: MorningDiaryFormValues) => {
    let score = 0;
    
    // Sleep quality (0-20 points)
    if (data.sleepQuality === "good") score += 20;
    else if (data.sleepQuality === "okay") score += 15;
    else if (data.sleepQuality === "poor") score += 5;
    
    // Sleep hours (0-15 points)
    if (data.sleepHours >= 8) score += 15;
    else if (data.sleepHours >= 7) score += 12;
    else if (data.sleepHours >= 6) score += 8;
    else if (data.sleepHours >= 5) score += 4;
    else score += 0;
    
    // Mood (0-10 points)
    if (data.mood === "happy") score += 10;
    else if (data.mood === "neutral") score += 7;
    else if (data.mood === "stressed") score += 3;
    else if (data.mood === "sad") score += 2;
    
    // Stress (0-10 points)
    if (data.stress === "low") score += 10;
    else if (data.stress === "medium") score += 5;
    else if (data.stress === "high") score += 0;
    
    // Fatigue (0-10 points)
    if (data.fatigue === "low") score += 10;
    else if (data.fatigue === "medium") score += 5;
    else if (data.fatigue === "high") score += 0;
    
    // Soreness (0-10 points)
    if (data.soreness === "low") score += 10;
    else if (data.soreness === "medium") score += 5;
    else if (data.soreness === "high") score += 0;
    
    // Recovery (0-10 points)
    if (data.recovery === "fully") score += 10;
    else if (data.recovery === "partially") score += 5;
    else if (data.recovery === "not at all") score += 0;
    
    // Motivation (0-5 points)
    if (data.motivation === "high") score += 5;
    else if (data.motivation === "medium") score += 3;
    else if (data.motivation === "low") score += 0;
    
    // Pain (0-5 points)
    if (data.pain === "none") score += 5;
    else if (data.pain === "mild") score += 3;
    else if (data.pain === "moderate") score += 1;
    else if (data.pain === "severe") score += 0;
    
    // Mental state (0-5 points)
    if (data.mentalState === "clear") score += 5;
    else if (data.mentalState === "foggy") score += 2;
    else if (data.mentalState === "distracted") score += 1;
    
    return score;
  };
  
  // Submit form mutation
  const submitDiary = useMutation({
    mutationFn: async (data: MorningDiaryFormValues & { readinessScore: number }) => {
      setSubmitting(true);
      const res = await fetch("/api/morning-diary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit diary");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/morning-diary/latest"] });
      toast({
        title: "Morning diary submitted",
        description: "Your daily check-in has been recorded",
        variant: "default",
      });
      
      // Show success state for a moment before navigating back
      setTimeout(() => {
        navigate("/athlete");
      }, 1500);
    },
    onError: (error: Error) => {
      setSubmitting(false);
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });
  
  // Form submission handler
  function onSubmit(data: MorningDiaryFormValues) {
    const score = calculateReadinessScore(data);
    setReadinessScore(score);
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // Submit the form with the calculated readiness score
    submitDiary.mutate({ ...data, readinessScore: score });
  }
  
  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/athlete");
    }
  };
  
  // If loading, show loading state
  if (diaryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already completed today, show confirmation
  if (hasCompletedToday && !submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <header className="bg-white border-b p-4 flex items-center shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/athlete")}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800 flex-1 text-center pr-8">
            Morning Self-Control Diary
          </h1>
        </header>
        
        <main className="flex-1 p-4 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Already Completed
              </CardTitle>
              <CardDescription>
                You've already completed your morning diary for today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your readiness score for today is {latestDiary.readinessScore}%.
              </p>
              <p className="text-sm">
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
  
  // When submitting, show loading
  if (submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <header className="bg-white border-b p-4 flex items-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">
            Submitting Diary
          </h1>
        </header>
        
        <main className="flex-1 p-4 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md text-center p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Recording your diary...</h3>
              <p className="text-muted-foreground">
                Please wait while we save your morning assessment.
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white border-b p-4 flex items-center shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800 flex-1 text-center pr-8">
          Morning Self-Control Diary
        </h1>
      </header>
      
      <main className="flex-1 p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Step {currentStep} of 3</CardTitle>
            <CardDescription>
              {currentStep === 1 && "How did you sleep last night?"}
              {currentStep === 2 && "How are you feeling today?"}
              {currentStep === 3 && "Final questions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Sleep */}
                {currentStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="sleepQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sleep Quality</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sleep quality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="okay">Okay</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How would you rate the quality of your sleep?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sleepHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours of Sleep</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={24}
                              step={0.5}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            How many hours did you sleep?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hydrationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hydration Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select hydration level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="okay">Okay</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How hydrated do you feel this morning?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {/* Step 2: General feeling */}
                {currentStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mood</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mood" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="happy">Happy</SelectItem>
                              <SelectItem value="neutral">Neutral</SelectItem>
                              <SelectItem value="stressed">Stressed</SelectItem>
                              <SelectItem value="sad">Sad</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How would you describe your mood today?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stress Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stress level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How stressed do you feel?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mentalState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mental State</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mental state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="clear">Clear</SelectItem>
                              <SelectItem value="foggy">Foggy</SelectItem>
                              <SelectItem value="distracted">Distracted</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How would you describe your mental clarity?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {/* Step 3: Recovery and pain */}
                {currentStep === 3 && (
                  <>
                    <FormField
                      control={form.control}
                      name="fatigue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fatigue Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fatigue level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How fatigued do you feel?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="soreness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Muscle Soreness</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select soreness level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How sore are your muscles?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recovery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recovery Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recovery level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fully">Fully recovered</SelectItem>
                              <SelectItem value="partially">Partially recovered</SelectItem>
                              <SelectItem value="not at all">Not recovered</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How recovered do you feel from previous training?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivation Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select motivation level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How motivated are you to train today?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pain Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pain level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Are you experiencing any pain?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other observations or notes..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Add any additional information.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleBack}
                  >
                    {currentStep === 1 ? "Cancel" : "Back"}
                  </Button>
                  <Button type="submit">
                    {currentStep < 3 ? "Next" : "Submit"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}