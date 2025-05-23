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
import { SorenessSelector } from "@/components/forms/soreness-selector";
import { InjurySelector } from "@/components/forms/injury-selector";

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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Activity } from "lucide-react";

// Define Zod schema for the form based on the database schema requirements
export const morningDiarySchema = z.object({
  userId: z.number(),
  
  // Step 1: Sleep & Emotional State
  sleepQuality: z.enum(["good", "average", "poor"]),
  sleepHours: z.string(),
  stressLevel: z.enum(["low", "medium", "high"]),
  mood: z.enum(["low", "high"]),
  
  // Step 2: Recovery & Physical Status
  recoveryLevel: z.enum(["good", "moderate", "poor"]),
  symptoms: z.array(z.string()),
  
  // Muscle Soreness & Injury (merged into step 2)
  sorenessMap: z.record(z.string(), z.boolean()).refine(
    (map) => Object.keys(map).length > 0 || map._no_soreness === true, 
    { message: "Please select at least one muscle group or confirm you have no soreness" }
  ),
  sorenessNotes: z.string().optional(),
  hasInjury: z.boolean(),
  painLevel: z.number().min(0).max(10).optional(),
  injuryImproving: z.enum(["yes", "no", "unchanged"]).optional(),
  injuryNotes: z.string().optional(),
});

// Type for form values derived from the schema
type MorningDiaryFormValues = z.infer<typeof morningDiarySchema>;

// Available symptoms list
const SYMPTOMS = [
  "runny_nose",
  "sore_throat",
  "fever",
  "diarrhea", 
  "no_symptoms"
];

export default function MultiStepMorningDiaryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  
  // Define properly typed default values using proper enums to match the schema
  const getDefaultValues = (): MorningDiaryFormValues => ({
    userId: user?.id ?? 0,
    
    // Step 1 defaults with explicit types
    sleepQuality: "average" as "good" | "average" | "poor",
    sleepHours: "7",
    stressLevel: "medium" as "low" | "medium" | "high",
    mood: "low" as "low" | "high",
    
    // Step 2 defaults with explicit types
    recoveryLevel: "moderate" as "good" | "moderate" | "poor",
    symptoms: [] as string[],
    
    // Step 3 defaults
    sorenessMap: { _no_soreness: true } as Record<string, boolean>,
    sorenessNotes: "",
    hasInjury: false,
    // Optional fields initialized properly
    painLevel: undefined,
    injuryImproving: undefined,
    injuryNotes: undefined,
  });

  // Create form with proper typing
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: getDefaultValues(),
    mode: "onChange", // Validate on change for better UX
  });
  
  // Enhanced protection: Reset form when user changes to ensure no data leakage between sessions
  useEffect(() => {
    // Set userId field when user changes and reset entire form with fresh defaults
    if (user?.id) {
      const freshDefaults = getDefaultValues();
      
      // Always reset the form when the user ID changes to prevent data leakage
      form.reset(freshDefaults, {
        keepDefaultValues: false, // Don't keep default values when resetting
        keepDirty: false, // Don't keep dirty state
        keepErrors: false, // Reset all error states
        keepIsSubmitted: false, // Reset submission status
        keepTouched: false, // Reset touched state
        keepSubmitCount: false // Reset submission count
      });
      
      // Update form user ID separately to ensure it's always correct
      form.setValue('userId', user.id);
    }
  }, [user?.id, form]);
  
  // Remove this effect as we're already handling user ID updates in the reset effect above
  
  // Handle checkbox changes for symptoms
  const handleSymptomChange = (symptom: string, checked: boolean) => {
    const currentSymptoms = form.getValues("symptoms") || [];
    let newSymptoms = [...currentSymptoms];
    
    if (symptom === "no_symptoms" && checked) {
      // If "I feel healthy" is selected, clear all other symptoms
      newSymptoms = ["no_symptoms"];
    } else if (checked) {
      // If any other symptom is checked while "no_symptoms" is selected, remove "no_symptoms"
      if (currentSymptoms.includes("no_symptoms")) {
        newSymptoms = newSymptoms.filter(s => s !== "no_symptoms");
      }
      // Add the symptom if it's not already in the array
      if (!newSymptoms.includes(symptom)) {
        newSymptoms.push(symptom);
      }
    } else {
      // Remove the symptom
      newSymptoms = newSymptoms.filter(s => s !== symptom);
    }
    
    form.setValue("symptoms", newSymptoms, { shouldValidate: true });
  };
  
  // Handler for muscle map changes
  const handleMuscleMapChange = (muscles: Record<string, boolean>) => {
    // Get the current value of sorenessMap which might include _no_soreness
    const currentMap = form.getValues("sorenessMap") as Record<string, boolean>;
    
    // If selecting new muscles while "no soreness" is checked, remove the "no soreness" flag
    if (currentMap._no_soreness && Object.values(muscles).some(v => v)) {
      const updatedMuscles = { ...muscles } as Record<string, boolean>;
      delete updatedMuscles._no_soreness;
      form.setValue("sorenessMap", updatedMuscles, { shouldValidate: true });
    } else {
      form.setValue("sorenessMap", muscles, { shouldValidate: true });
    }
  };
  
  // Navigation between steps
  const nextStep = () => {
    // Validate current step fields before proceeding
    switch (currentStep) {
      case 1:
        form.trigger(["sleepQuality", "sleepHours", "stressLevel", "mood"]).then((isValid) => {
          if (isValid) setCurrentStep(prev => prev + 1);
        });
        break;
      case 2:
        form.trigger(["recoveryLevel", "symptoms"]).then((isValid) => {
          if (isValid) setCurrentStep(prev => prev + 1);
        });
        break;
      default:
        break;
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };
  
  // Reset form to default values
  const resetForm = () => {
    form.reset({
      userId: user?.id ?? 0,
      
      // Step 1 defaults
      sleepQuality: "average",
      sleepHours: "7",
      stressLevel: "medium",
      mood: "low",
      
      // Step 2 defaults
      recoveryLevel: "moderate",
      symptoms: [],
      
      // Step 3 defaults
      sorenessMap: {},
      sorenessNotes: "",
      hasInjury: false,
    });
    setCurrentStep(1);
    toast({
      title: "Form cleared",
      description: "All diary responses have been reset.",
    });
  };
  
  // Conditionally render injury-related fields
  useEffect(() => {
    // If hasInjury is false, reset related fields
    if (!form.getValues("hasInjury")) {
      form.setValue("painLevel", undefined);
      form.setValue("injuryImproving", undefined);
      form.setValue("injuryNotes", "");
    }
  }, [form.watch("hasInjury"), form]);
  
  // Calculate readiness score based on form values
  function calculateReadinessScore(data: MorningDiaryFormValues): number {
    let score = 0;
    const maxScore = 10;
    
    // Sleep quality (max 1 point)
    if (data.sleepQuality === "good") score += 1;
    else if (data.sleepQuality === "average") score += 0.5;
    
    // Sleep hours (max 1 point)
    const sleepHours = parseFloat(data.sleepHours);
    if (sleepHours >= 8) score += 1;
    else if (sleepHours >= 6) score += 0.5;
    
    // Stress level (max 1 point)
    if (data.stressLevel === "low") score += 1;
    else if (data.stressLevel === "medium") score += 0.5;
    
    // Motivation & Energy (max 1 point)
    if (data.mood === "high") score += 1;
    else if (data.mood === "low") score += 0.5;
    
    // Recovery level (max 1 point)
    if (data.recoveryLevel === "good") score += 1;
    else if (data.recoveryLevel === "moderate") score += 0.5;
    
    // Symptoms (max 1 point)
    if (data.symptoms.includes("no_symptoms")) score += 1;
    else if (data.symptoms.length <= 1) score += 0.5;
    
    // Soreness (max 1 point)
    const sorenessMap = data.sorenessMap as Record<string, boolean>;
    const sorenessCount = Object.keys(sorenessMap).filter(key => key !== '_no_soreness').length;
    if (sorenessCount === 0 || sorenessMap._no_soreness) score += 1;
    else if (sorenessCount <= 3) score += 0.5;
    
    // Injury (max 1 point)
    if (!data.hasInjury) score += 1;
    
    // Injury improving (max 1 point, only if hasInjury)
    if (data.hasInjury) {
      if (data.injuryImproving === "yes") score += 0.5;
    } else {
      score += 1; // If no injury, full points
    }
    
    // Convert to percentage (0-100)
    return Math.round((score / maxScore) * 100);
  }
  
  // Submit the diary entry to the API
  const submitMutation = useMutation({
    mutationFn: async (data: MorningDiaryFormValues) => {
      // Make sure userId is set properly
      if (!data.userId && user) {
        data.userId = user.id;
      }
      
      // Calculate readiness score
      const readinessScore = calculateReadinessScore(data);
      
      // Prepare the actual data for API submission
      const apiData = {
        ...data,
        readinessScore
      };
      
      const res = await apiRequest("POST", "/api/morning-diary", apiData);
      
      // Check for errors
      if (!res.ok) {
        const errorData = await res.json();
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
      
      // Reset form with fresh default values to prevent data leakage between sessions
      const freshDefaults = getDefaultValues();
      form.reset(freshDefaults, {
        keepDefaultValues: false,
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepSubmitCount: false
      });
      
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
    // Ensure userId is set properly
    if (!data.userId && user) {
      data.userId = user.id;
    }
    
    // Ensure symptoms array is properly initialized if empty
    if (!Array.isArray(data.symptoms) || data.symptoms.length === 0) {
      data.symptoms = ["no_symptoms"];
    }
    
    // Ensure sorenessMap is initialized if empty
    if (!data.sorenessMap || Object.keys(data.sorenessMap).length === 0) {
      data.sorenessMap = { "_no_soreness": true };
    }
    
    console.log("Submitting diary data:", data);
    
    // Submit the form data
    // Form reset will happen in the onSuccess handler
    submitMutation.mutate(data);
  }
  
  // Auto-redirect after successful submission
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        // Navigate back to athlete home screen
        setLocation("/athlete");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, setLocation]);
  
  // If form is already submitted, show success message
  if (isSubmitted) {
    const readinessScore = calculateReadinessScore(form.getValues());
    
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
  
  // Form content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Sleep & Emotional State</h3>
            
            {/* Sleep Quality Select */}
            <FormField
              control={form.control}
              name="sleepQuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">How was your sleep quality?</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[rgb(38,38,38)] text-white border-gray-700">
                        <SelectValue placeholder="Select sleep quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[rgb(38,38,38)] text-white border-gray-700">
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-gray-400"></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Sleep Hours */}
            <FormField
              control={form.control}
              name="sleepHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">How many hours did you sleep?</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-3">
                      <div className="flex bg-[rgb(30,30,30)] border border-gray-700 rounded-md">
                        <button 
                          type="button" 
                          className="flex items-center justify-center w-10 h-10 text-white hover:bg-[rgb(45,45,45)]"
                          onClick={() => {
                            const currentValue = parseFloat(field.value || "7");
                            const newValue = Math.max(0, currentValue - 0.5);
                            field.onChange(newValue.toString());
                          }}
                        >
                          <span className="text-xl font-bold">−</span>
                        </button>
                        <div className="flex items-center justify-center min-w-16 px-3 text-white font-medium">
                          {parseFloat(field.value || "7").toFixed(1).replace(/\.0$/, '')}
                        </div>
                        <button 
                          type="button" 
                          className="flex items-center justify-center w-10 h-10 text-white hover:bg-[rgb(45,45,45)]"
                          onClick={() => {
                            const currentValue = parseFloat(field.value || "7");
                            const newValue = Math.min(24, currentValue + 0.5);
                            field.onChange(newValue.toString());
                          }}
                        >
                          <span className="text-xl font-bold">+</span>
                        </button>
                      </div>
                      <span className="text-gray-200">hours</span>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400"></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Stress Level Slider */}
            <FormField
              control={form.control}
              name="stressLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">What is your current stress level?</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <div className="py-3">
                        <Slider
                          min={0}
                          max={5}
                          step={1}
                          defaultValue={[0]}
                          onValueChange={(vals) => {
                            const val = vals[0];
                            if (val <= 1) field.onChange("low");
                            else if (val === 2) field.onChange("low");
                            else if (val === 3) field.onChange("medium");
                            else if (val >= 4) field.onChange("high");
                          }}
                          className="py-3"
                        />
                      </div>
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-0">
                      <span>Low</span>
                      <span className="ml-auto">High</span>
                    </div>
                  </div>
                  <FormDescription className="text-xs text-gray-400"></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Mood Slider */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">What is your motivation & energy level today?</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <div className="py-3">
                        <Slider
                          min={0}
                          max={5}
                          step={1}
                          defaultValue={[0]}
                          onValueChange={(vals) => {
                            const val = vals[0];
                            if (val <= 1) field.onChange("negative");
                            else if (val === 2) field.onChange("negative");
                            else if (val === 3) field.onChange("neutral");
                            else if (val >= 4) field.onChange("positive");
                          }}
                          className="py-3"
                        />
                      </div>
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-0">
                      <span>Low</span>
                      <span className="ml-auto">High</span>
                    </div>
                  </div>
                  <FormDescription className="text-xs text-gray-400"></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Recovery & Physical Status</h3>
            
            {/* Recovery Level Slider */}
            <FormField
              control={form.control}
              name="recoveryLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">How recovered do you feel?</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <div className="py-3">
                        <Slider
                          min={0}
                          max={5}
                          step={1}
                          defaultValue={[0]}
                          onValueChange={(vals) => {
                            const val = vals[0];
                            if (val <= 1) field.onChange("poor");
                            else if (val === 2) field.onChange("poor");
                            else if (val === 3) field.onChange("moderate");
                            else if (val >= 4) field.onChange("good");
                          }}
                          className="py-3"
                        />
                      </div>
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-0">
                      <span>Not Recovered</span>
                      <span className="ml-auto">Fully Recovered</span>
                    </div>
                  </div>
                  <FormDescription className="text-xs text-gray-400"></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Symptoms */}
            <div className="space-y-4">
              <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">Do you have any symptoms?</FormLabel>
              
              {/* No Symptoms option - block style without left border */}
              <div className="mb-4 p-3 bg-secondary/30 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="no_symptoms"
                    checked={form.getValues("symptoms")?.includes("no_symptoms")}
                    onCheckedChange={(checked) => 
                      handleSymptomChange("no_symptoms", !!checked)
                    }
                  />
                  <label
                    htmlFor="no_symptoms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                  >
                    No Symptoms - I Feel Healthy
                  </label>
                </div>
              </div>
              
              {/* Other symptoms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SYMPTOMS.filter(symptom => symptom !== "no_symptoms").map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox 
                      id={symptom}
                      checked={form.getValues("symptoms")?.includes(symptom)}
                      onCheckedChange={(checked) => 
                        handleSymptomChange(symptom, !!checked)
                      }
                    />
                    <label
                      htmlFor={symptom}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200"
                    >
                      {symptom
                        .replace('_', ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </label>
                  </div>
                ))}
              </div>
              
              {form.formState.errors.symptoms && (
                <p className="text-red-500 text-sm mt-1">
                  Please select at least one option
                </p>
              )}
            
            {/* Muscle Soreness Selection with Pain Intensity */}
            <FormField
              control={form.control}
              name="sorenessMap"
              render={({ field }) => (
                <FormItem>
                  <SorenessSelector 
                    value={field.value as Record<string, boolean>} 
                    onChange={(value) => form.setValue("sorenessMap", value, { shouldValidate: true })}
                    painIntensity={form.watch("painLevel") || 0}
                    onPainIntensityChange={
                      (value) => {
                        // When adjusting pain intensity from soreness selector
                        form.setValue("painLevel", value);
                      }
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes about soreness (only show if not "No soreness") */}
            {!form.watch("sorenessMap")?._no_soreness && Object.keys(form.watch("sorenessMap") || {}).length > 0 && (
              <FormField
                control={form.control}
                name="sorenessNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-gray-200 mb-4 block">Additional notes about soreness</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your muscle soreness in more detail..."
                        className="bg-[rgb(30,30,30)] text-gray-200 border-gray-700 resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Injury Selector Component */}
            <FormField
              control={form.control}
              name="hasInjury"
              render={({ field }) => (
                <FormItem>
                  <InjurySelector 
                    hasInjury={field.value}
                    painLevel={form.watch("painLevel") || 0}
                    injuryImproving={form.watch("injuryImproving")}
                    injuryNotes={form.watch("injuryNotes") || ""}
                    onHasInjuryChange={(value) => form.setValue("hasInjury", value, { shouldValidate: true })}
                    onPainLevelChange={(value) => form.setValue("painLevel", value)}
                    onInjuryImprovingChange={(value) => form.setValue("injuryImproving", value as "yes" | "no" | "unchanged")}
                    onInjuryNotesChange={(value) => form.setValue("injuryNotes", value)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

          </div>
        );
      

      
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-[rgb(38,38,38)] rounded-xl p-6 shadow-lg max-w-3xl mx-auto">
      <div className="mb-2 flex items-center">
        <Activity className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-medium text-gray-100">Morning Self-Control Diary</h2>
      </div>
      
      <p className="text-gray-400 mb-6 text-sm">
        Please complete this morning assessment to help us monitor your wellness and recovery.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 ${
                  currentStep >= step ? "bg-primary" : "bg-gray-600"
                } ${step > 1 ? "ml-2" : ""}`}
              />
            ))}
          </div>
          
          {/* Dynamic Step Content */}
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 mt-8 border-t border-gray-700">
            {currentStep === 1 ? (
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation('/athlete')}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-200"
                >
                  Clear Responses
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex items-center"
              >
                <ArrowLeft className="mr-3 h-5 w-5" /> Previous
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep} className="flex items-center">
                Next <Activity className="ml-3 h-5 w-5" />
              </Button>
            ) : (
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation('/athlete')}
                  className="flex items-center text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center text-gray-200"
                >
                  Clear All
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Submit</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}