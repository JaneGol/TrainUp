import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { insertMorningDiarySchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScaleTumbler } from "@/components/ui/scale-tumbler";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { InjurySelector } from "@/components/forms/injury-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define Zod schema for the form
const morningDiarySchema = insertMorningDiarySchema.extend({
  sleepHours: z.string(),
  sleepQuality: z.enum(["poor", "average", "good"]),
  motivationEnergy: z.number().min(0).max(4), // Change to 0-4 scale
  recoveryLevel: z.number().min(0).max(4), // Change to 0-4 scale
  healthSymptoms: z.array(z.string()).default([]),
  muscleSoreness: z.enum(["yes", "no"]),
  sorenessIntensity: z.number().min(0).max(4).optional(), // Change to 0-4 scale
  hasInjury: z.enum(["yes", "no"]),
  injuryDetails: z.string().optional(),
  additionalNotes: z.string().optional()
});

// Type for form values derived from the schema
type MorningDiaryFormValues = z.infer<typeof morningDiarySchema>;

export default function MorningControlDiaryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasSoreness, setHasSoreness] = useState(false);
  const [hasInjury, setHasInjury] = useState(false);
  
  // Create form with default values
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: {
      userId: user?.id ?? 0,
      sleepHours: "7",
      sleepQuality: "average",
      motivationEnergy: 0, // Default to position 0 as requested
      recoveryLevel: 0, // Default to position 0 as requested
      healthSymptoms: [],
      muscleSoreness: "no",
      sorenessIntensity: 1, // Start at 1 for Pain Intensity scale
      hasInjury: "no",
      injuryPainIntensity: 1, // Start at 1 for Pain Intensity scale
      injuryPainTrend: "unchanged",
      injuryDetails: "",
      additionalNotes: "",
    },
  });
  
  // Update userId when user changes
  useEffect(() => {
    if (user) {
      form.setValue("userId", user.id);
    }
  }, [user, form]);
  
  // Watch for changes in muscleSoreness to show/hide sorenessIntensity slider
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "muscleSoreness") {
        setHasSoreness(value.muscleSoreness === "yes");
      }
      if (name === "hasInjury") {
        setHasInjury(value.hasInjury === "yes");
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Submit the diary entry to the API
  const submitMutation = useMutation({
    mutationFn: async (data: MorningDiaryFormValues) => {
      console.log("Submitting data:", data);
      
      // Make sure userId is set properly
      if (!data.userId && user) {
        data.userId = user.id;
      }
      
      // Transform the data to match the expected API format
      const apiData = {
        userId: data.userId,
        sleepQuality: data.sleepQuality, // already in the right format (poor, average, good)
        sleepHours: data.sleepHours,
        stressLevel: data.motivationEnergy >= 7 ? "low" : data.motivationEnergy >= 4 ? "medium" : "high", // Inverse relation
        mood: "neutral", // We're not collecting mood anymore but API expects it
        recoveryLevel: data.recoveryLevel >= 7 ? "good" : data.recoveryLevel >= 4 ? "moderate" : "poor",
        symptoms: data.healthSymptoms || [],
        motivationLevel: data.motivationEnergy >= 7 ? "high" : data.motivationEnergy >= 4 ? "moderate" : "low",
        sorenessMap: data.muscleSoreness === "yes" ? { general: true } : { _no_soreness: true },
        hasInjury: data.hasInjury === "yes",
        painLevel: data.hasInjury === "yes" ? (data.sorenessIntensity || 5) : null,
        injuryImproving: data.hasInjury === "yes" ? "unchanged" : undefined,
        injuryNotes: data.hasInjury === "yes" ? data.injuryDetails : undefined,
      };
      
      const res = await apiRequest("POST", "/api/morning-diary", apiData);
      
      // Check for errors
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error ? JSON.stringify(errorData.error) : "Failed to submit diary entry");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Morning Diary Submitted",
        description: "Your morning control diary has been recorded successfully.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/morning-diary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/morning-diary/latest"] });
      
      // Show success message
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      console.error("Submission error:", error);
      
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit morning diary.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: MorningDiaryFormValues) {
    submitMutation.mutate(data);
  }
  
  function calculateReadinessScore(data: MorningDiaryFormValues) {
    let score = 0;
    const maxScore = 10;
    
    // Sleep quality (poor, average, good)
    if (data.sleepQuality === "good") score += 2;
    else if (data.sleepQuality === "average") score += 1;
    else score += 0;
    
    // Motivation/Energy (0-10 scale)
    score += (data.motivationEnergy / 10) * 2; // 20% of total
    
    // Recovery level (0-10 scale)
    score += (data.recoveryLevel / 10) * 2; // 20% of total
    
    // Muscle soreness
    if (data.muscleSoreness === "no") {
      score += 2; // 20% of total
    } else if (data.sorenessIntensity) {
      score += ((10 - data.sorenessIntensity) / 10) * 2; // Inverse relation, lower intensity = better score
    }
    
    // Injury
    if (data.hasInjury === "no") {
      score += 2; // 20% of total
    } else {
      score += 0; // Injury present = 0 points for this category
    }
    
    // Convert to percentage
    return Math.round((score / maxScore) * 100);
  }

  // If form is already submitted, show success message and redirect after a delay
  if (isSubmitted) {
    const readinessScore = calculateReadinessScore(form.getValues());
    const [, setLocation] = useLocation();
    
    // Auto-redirect after 3 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        // Navigate back to athlete home screen
        setLocation("/athlete");
      }, 3000);
      
      return () => clearTimeout(timer);
    }, [setLocation]);
    
    return (
      <div className="bg-black p-6 rounded-xl shadow-sm border border-gray-800">
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white">Thank you for your answers!</h3>
          <p className="text-gray-300 max-w-md mx-auto">
            Have a great day!
          </p>
          <div className="mt-2">
            <p className="text-sm text-gray-400">Your readiness score</p>
            <p className="text-3xl font-bold text-primary">{readinessScore}%</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">Returning to home screen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black p-6 rounded-xl shadow-sm border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-6">Daily Morning Self-Control Diary</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Block 1: Sleep & Emotional State */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-white mb-4">Sleep & Emotional State</h4>
            
            {/* Sleep Quality Select - Now uses dropdown */}
            <FormField
              control={form.control}
              name="sleepQuality"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-white">How was your sleep quality?</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select sleep quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Sleep Hours */}
            <FormField
              control={form.control}
              name="sleepHours"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-white">How many hours did you sleep?</FormLabel>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-zinc-800 border-zinc-700 text-white"
                      onClick={() => {
                        const currentValue = parseFloat(field.value);
                        if (currentValue > 0) {
                          field.onChange((currentValue - 0.5).toString());
                        }
                      }}
                    >
                      -
                    </Button>
                    <div className="flex-1 mx-4 text-center text-white font-medium">
                      {field.value} hours
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-zinc-800 border-zinc-700 text-white"
                      onClick={() => {
                        const currentValue = parseFloat(field.value);
                        if (currentValue < 24) {
                          field.onChange((currentValue + 0.5).toString());
                        }
                      }}
                    >
                      +
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Motivation/Energy Slider - Tumbler style */}
            <FormField
              control={form.control}
              name="motivationEnergy"
              render={({ field }) => (
                <FormItem className="mb-6 pb-6 border-b border-zinc-800">
                  <FormLabel className="text-white text-lg mb-4">How motivated and energetic do you feel today?</FormLabel>
                  <FormControl>
                    <ScaleTumbler
                      min={0}
                      max={4}
                      value={field.value}
                      onChange={field.onChange}
                      lowLabel="Low"
                      highLabel="High"
                      className="mt-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Block 2: Recovery & Health */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-white mb-4">Recovery & Health</h4>
            
            {/* Recovery Level Slider */}
            <FormField
              control={form.control}
              name="recoveryLevel"
              render={({ field }) => (
                <FormItem className="mb-6 pb-6 border-b border-zinc-800">
                  <FormLabel className="text-white text-lg mb-4">How recovered do you feel today?</FormLabel>
                  <FormControl>
                    <ScaleTumbler
                      min={0}
                      max={4}
                      value={field.value}
                      onChange={field.onChange}
                      lowLabel="Poor"
                      highLabel="Great"
                      className="mt-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Health Symptoms */}
            <FormField
              control={form.control}
              name="healthSymptoms"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-white">Do you have any health symptoms today? (Select all that apply)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Headache",
                        "Sore throat",
                        "Fever",
                        "Cough",
                        "Congestion",
                        "Upset stomach",
                        "Fatigue",
                        "Body aches"
                      ].map((symptom) => (
                        <div key={symptom} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`symptom-${symptom}`}
                            className="mr-2 h-4 w-4 rounded border-gray-300 focus:ring-primary"
                            checked={field.value?.includes(symptom)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedValue = checked
                                ? [...(field.value || []), symptom]
                                : (field.value || []).filter((val: string) => val !== symptom);
                              field.onChange(updatedValue);
                            }}
                          />
                          <label htmlFor={`symptom-${symptom}`} className="text-sm text-gray-300">
                            {symptom}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Muscle Soreness */}
            <FormField
              control={form.control}
              name="muscleSoreness"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-white">Do you have any muscle soreness?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Soreness Intensity (conditional) */}
            {hasSoreness && (
              <FormField
                control={form.control}
                name="sorenessIntensity"
                render={({ field }) => (
                  <FormItem className="mb-4 ml-6 border-l-2 border-zinc-700 pl-4">
                    <FormLabel className="text-white">How intense is the soreness?</FormLabel>
                    <FormControl>
                      <ScaleTumbler
                        min={0}
                        max={4}
                        value={field.value ?? 0}
                        onChange={field.onChange}
                        lowLabel="Minimal"
                        highLabel="Severe"
                        className="mt-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Injuries */}
            <FormField
              control={form.control}
              name="hasInjury"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-white">Do you have any injuries?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Injury Details (conditional) */}
            {hasInjury && (
              <FormField
                control={form.control}
                name="injuryDetails"
                render={({ field }) => (
                  <FormItem className="mb-4 ml-6 border-l-2 border-zinc-700 pl-4">
                    <FormLabel className="text-white">Please describe your injury:</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the location, type, and severity of your injury..."
                        className="resize-none bg-zinc-800 border-zinc-700 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          {/* Additional Notes */}
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Additional Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Anything else you'd like to note about how you're feeling today?"
                    className="resize-none bg-zinc-800 border-zinc-700 text-white"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-gray-300">
                  You can include any other factors affecting your readiness today.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-[#CBFF00] hover:bg-[#bae800] text-black font-medium"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Morning Diary"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}