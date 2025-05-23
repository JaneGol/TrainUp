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

// Define Zod schema for the form with updated structure
export const morningDiarySchema = z.object({
  userId: z.number(),
  
  // Step 1: Sleep & Emotional State
  sleepQuality: z.enum(["good", "average", "poor"]),
  sleepHours: z.string(),
  stressLevel: z.enum(["low", "medium", "high"]),
  mood: z.enum(["low", "high"]), // Updated to motivation & energy level
  
  // Step 2: Recovery & Physical Status (merged sections)
  recoveryLevel: z.enum(["good", "moderate", "poor"]),
  symptoms: z.array(z.string()),
  
  // Muscle Soreness & Injury (now part of step 2)
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
  
  // Define properly typed default values
  const getDefaultValues = (): MorningDiaryFormValues => ({
    userId: user?.id ?? 0,
    
    // Step 1 defaults
    sleepQuality: "average" as "good" | "average" | "poor",
    sleepHours: "7",
    stressLevel: "medium" as "low" | "medium" | "high",
    mood: "low" as "low" | "high",
    
    // Step 2 defaults
    recoveryLevel: "moderate" as "good" | "moderate" | "poor",
    symptoms: [] as string[],
    
    // Muscle soreness and injury defaults
    sorenessMap: { _no_soreness: true } as Record<string, boolean>,
    sorenessNotes: "",
    hasInjury: false,
    painLevel: undefined,
    injuryImproving: undefined,
    injuryNotes: undefined,
  });

  // Create form with proper typing
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });
  
  // Reset form when user changes
  useEffect(() => {
    if (user?.id) {
      const freshDefaults = getDefaultValues();
      form.reset(freshDefaults, {
        keepDefaultValues: false,
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepSubmitCount: false
      });
      form.setValue('userId', user.id);
    }
  }, [user?.id, form]);
  
  // Handle checkbox changes for symptoms
  const handleSymptomChange = (symptom: string, checked: boolean) => {
    const currentSymptoms = form.getValues("symptoms") || [];
    let newSymptoms = [...currentSymptoms];
    
    if (symptom === "no_symptoms" && checked) {
      newSymptoms = ["no_symptoms"];
    } else if (checked) {
      if (currentSymptoms.includes("no_symptoms")) {
        newSymptoms = newSymptoms.filter(s => s !== "no_symptoms");
      }
      if (!newSymptoms.includes(symptom)) {
        newSymptoms.push(symptom);
      }
    } else {
      newSymptoms = newSymptoms.filter(s => s !== symptom);
    }
    
    form.setValue("symptoms", newSymptoms, { shouldValidate: true });
  };
  
  // Handler for muscle map changes
  const handleMuscleMapChange = (muscles: Record<string, boolean>) => {
    const currentMap = form.getValues("sorenessMap") as Record<string, boolean>;
    
    if (currentMap._no_soreness && Object.values(muscles).some(v => v)) {
      const updatedMuscles = { ...muscles } as Record<string, boolean>;
      delete updatedMuscles._no_soreness;
      form.setValue("sorenessMap", updatedMuscles, { shouldValidate: true });
    } else {
      form.setValue("sorenessMap", muscles, { shouldValidate: true });
    }
  };
  
  // Navigation between steps (now only 2 steps)
  const nextStep = () => {
    switch (currentStep) {
      case 1:
        form.trigger(["sleepQuality", "sleepHours", "stressLevel", "mood"]).then((isValid) => {
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
      sleepQuality: "average",
      sleepHours: "7",
      stressLevel: "medium",
      mood: "low",
      recoveryLevel: "moderate",
      symptoms: [],
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
      score += 1;
    }
    
    // Convert to percentage (0-100)
    return Math.round((score / maxScore) * 100);
  }
  
  return (
    <div className="bg-black p-6 rounded-xl shadow-sm border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Morning Self-Control Diary</h2>
        <div className="text-sm text-gray-400">
          Step {currentStep} of 2
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => {})} className="space-y-8">
          {/* Step 1: Sleep & Emotional State */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-100 mb-4">Sleep & Emotional State</h3>
              
              {/* Sleep Quality */}
              <FormField
                control={form.control}
                name="sleepQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">How was your sleep quality?</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <FormLabel className="text-gray-200">How many hours did you sleep?</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="12"
                        {...field}
                        className="w-full px-3 py-2 bg-[rgb(38,38,38)] text-white border border-gray-700 rounded-md"
                        placeholder="7.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stress Level */}
              <FormField
                control={form.control}
                name="stressLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">What is your stress level?</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 mt-2">
                        {["low", "medium", "high"].map((level) => (
                          <Button
                            key={level}
                            type="button"
                            variant={field.value === level ? "default" : "outline"}
                            onClick={() => field.onChange(level)}
                            className={`flex-1 capitalize ${
                              field.value === level
                                ? "bg-primary text-primary-foreground"
                                : "bg-[rgb(38,38,38)] text-white border-gray-700"
                            }`}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motivation & Energy Level (updated mood question) */}
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">What is your motivation & energy level today?</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 mt-2">
                        {["low", "high"].map((level) => (
                          <Button
                            key={level}
                            type="button"
                            variant={field.value === level ? "default" : "outline"}
                            onClick={() => field.onChange(level)}
                            className={`flex-1 capitalize ${
                              field.value === level
                                ? "bg-primary text-primary-foreground"
                                : "bg-[rgb(38,38,38)] text-white border-gray-700"
                            }`}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Recovery & Physical Status (merged sections) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-100 mb-4">Recovery & Physical Status</h3>
              
              {/* Recovery Level */}
              <FormField
                control={form.control}
                name="recoveryLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">How do you feel your recovery is today?</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 mt-2">
                        {["poor", "moderate", "good"].map((level) => (
                          <Button
                            key={level}
                            type="button"
                            variant={field.value === level ? "default" : "outline"}
                            onClick={() => field.onChange(level)}
                            className={`flex-1 capitalize ${
                              field.value === level
                                ? "bg-primary text-primary-foreground"
                                : "bg-[rgb(38,38,38)] text-white border-gray-700"
                            }`}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Health Status */}
              <FormField
                control={form.control}
                name="symptoms"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-gray-200">How are you feeling health-wise?</FormLabel>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {SYMPTOMS.map((symptom) => {
                        const isChecked = form.watch("symptoms")?.includes(symptom) ?? false;
                        return (
                          <div key={symptom} className="flex items-center space-x-2">
                            <Checkbox
                              id={symptom}
                              checked={isChecked}
                              onCheckedChange={(checked) => 
                                handleSymptomChange(symptom, checked === true)
                              }
                              className="border-gray-600 text-white"
                            />
                            <label
                              htmlFor={symptom}
                              className="text-sm text-gray-200 cursor-pointer"
                            >
                              {symptom === "no_symptoms" 
                                ? "I feel healthy" 
                                : symptom.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())
                              }
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Muscle Soreness */}
              <div className="border-t border-gray-700 pt-6">
                <FormField
                  control={form.control}
                  name="sorenessMap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Muscle Soreness Level</FormLabel>
                      <FormControl>
                        <SorenessSelector 
                          value={field.value}
                          onChange={handleMuscleMapChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Injury Check */}
              <div className="border-t border-gray-700 pt-6">
                <FormField
                  control={form.control}
                  name="hasInjury"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Do you have any injuries today?</FormLabel>
                      <FormControl>
                        <InjurySelector 
                          hasInjury={field.value}
                          painLevel={form.watch("painLevel")}
                          injuryImproving={form.watch("injuryImproving")}
                          injuryNotes={form.watch("injuryNotes")}
                          onHasInjuryChange={field.onChange}
                          onPainLevelChange={(level) => form.setValue("painLevel", level)}
                          onInjuryImprovingChange={(improving) => form.setValue("injuryImproving", improving as "yes" | "no" | "unchanged")}
                          onInjuryNotesChange={(notes) => form.setValue("injuryNotes", notes)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="bg-[rgb(38,38,38)] text-white border-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="bg-[rgb(38,38,38)] text-white border-gray-700"
              >
                Clear Form
              </Button>
              
              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-primary text-primary-foreground"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground"
                >
                  Submit Diary
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}