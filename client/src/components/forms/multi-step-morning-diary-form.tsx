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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

// Define Zod schema for the form based on new fields
const morningDiarySchema = z.object({
  userId: z.number(),
  
  // Step 1: Sleep & Emotional State
  sleepQuality: z.enum(["good", "average", "poor"]),
  sleepHours: z.number().min(0).max(24),
  stressLevel: z.enum(["low", "medium", "high"]),
  mood: z.enum(["positive", "neutral", "negative"]),
  
  // Step 2: Recovery & Health
  recoveryLevel: z.enum(["good", "moderate", "poor"]),
  symptoms: z.array(z.string()),
  motivationLevel: z.enum(["high", "moderate", "low"]),
  
  // Step 3: Muscle Soreness & Injury
  sorenessMap: z.record(z.string(), z.number()),
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

// Body parts for the body map
const FRONT_BODY_PARTS = [
  "head",
  "neck",
  "chest",
  "abs",
  "left_shoulder",
  "right_shoulder",
  "left_arm",
  "right_arm",
  "left_forearm",
  "right_forearm",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_quad",
  "right_quad",
  "left_knee",
  "right_knee",
  "left_shin",
  "right_shin",
  "left_ankle",
  "right_ankle",
  "left_foot",
  "right_foot"
];

const BACK_BODY_PARTS = [
  "head_back",
  "neck_back",
  "upper_back",
  "mid_back",
  "lower_back",
  "left_shoulder_back",
  "right_shoulder_back",
  "left_tricep",
  "right_tricep",
  "left_elbow",
  "right_elbow",
  "left_glute",
  "right_glute",
  "left_hamstring",
  "right_hamstring",
  "left_calf",
  "right_calf",
  "left_achilles",
  "right_achilles"
];

export default function MultiStepMorningDiaryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  
  // Create form with default values
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: {
      userId: user?.id ?? 0,
      
      // Step 1 defaults
      sleepQuality: "average",
      sleepHours: 7,
      stressLevel: "medium",
      mood: "neutral",
      
      // Step 2 defaults
      recoveryLevel: "moderate",
      symptoms: [],
      motivationLevel: "moderate",
      
      // Step 3 defaults
      sorenessMap: {},
      hasInjury: false,
    },
  });
  
  // Update userId when user changes
  useEffect(() => {
    if (user) {
      form.setValue("userId", user.id);
    }
  }, [user, form]);
  
  // Handle checkbox changes for symptoms
  const handleSymptomChange = (symptom: string, checked: boolean) => {
    const currentSymptoms = form.getValues("symptoms") || [];
    let newSymptoms = [...currentSymptoms];
    
    if (symptom === "no_symptoms" && checked) {
      // If "I feel well" is selected, clear all other symptoms
      newSymptoms = ["no_symptoms"];
    } else if (checked) {
      // Add the symptom, but remove "no_symptoms" if it was there
      newSymptoms = newSymptoms.filter(s => s !== "no_symptoms");
      if (!newSymptoms.includes(symptom)) {
        newSymptoms.push(symptom);
      }
    } else {
      // Remove the symptom
      newSymptoms = newSymptoms.filter(s => s !== symptom);
    }
    
    form.setValue("symptoms", newSymptoms, { shouldValidate: true });
  };
  
  // Handler for body map clicks
  const handleBodyPartClick = (bodyPart: string) => {
    const currentMap = { ...form.getValues("sorenessMap") };
    
    // Toggle between no soreness (0) and moderate soreness (1)
    if (currentMap[bodyPart]) {
      // If already has a value, increment or reset
      if (currentMap[bodyPart] >= 2) {
        delete currentMap[bodyPart]; // Remove if at max level
      } else {
        currentMap[bodyPart] = currentMap[bodyPart] + 1; // Increment soreness level
      }
    } else {
      // Set initial soreness
      currentMap[bodyPart] = 1;
    }
    
    form.setValue("sorenessMap", currentMap, { shouldValidate: true });
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
        form.trigger(["recoveryLevel", "symptoms", "motivationLevel"]).then((isValid) => {
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
  
  // Conditionally render injury-related fields
  useEffect(() => {
    // If hasInjury is false, reset related fields
    if (!form.getValues("hasInjury")) {
      form.setValue("painLevel", undefined);
      form.setValue("injuryImproving", undefined);
      form.setValue("injuryNotes", "");
    }
  }, [form.watch("hasInjury"), form]);
  
  // Calculate readiness score based on all form values
  function calculateReadinessScore(data: MorningDiaryFormValues): number {
    let score = 0;
    const maxScore = 10;
    
    // Sleep quality (max 1 point)
    if (data.sleepQuality === "good") score += 1;
    else if (data.sleepQuality === "average") score += 0.5;
    
    // Sleep hours (max 1 point)
    if (data.sleepHours >= 8) score += 1;
    else if (data.sleepHours >= 6) score += 0.5;
    
    // Stress level (max 1 point)
    if (data.stressLevel === "low") score += 1;
    else if (data.stressLevel === "medium") score += 0.5;
    
    // Mood (max 1 point)
    if (data.mood === "positive") score += 1;
    else if (data.mood === "neutral") score += 0.5;
    
    // Recovery level (max 1 point)
    if (data.recoveryLevel === "good") score += 1;
    else if (data.recoveryLevel === "moderate") score += 0.5;
    
    // Symptoms (max 1 point)
    if (data.symptoms.includes("no_symptoms")) score += 1;
    else if (data.symptoms.length <= 1) score += 0.5;
    
    // Motivation (max 1 point)
    if (data.motivationLevel === "high") score += 1;
    else if (data.motivationLevel === "moderate") score += 0.5;
    
    // Soreness (max 1 point)
    const sorenessCount = Object.keys(data.sorenessMap).length;
    if (sorenessCount === 0) score += 1;
    else if (sorenessCount <= 3) score += 0.5;
    
    // Injury (max 1 point)
    if (!data.hasInjury) score += 1;
    
    // Injury improving (max 1 point, only if hasInjury)
    if (data.hasInjury) {
      if (data.injuryImproving === "yes") score += 0.5;
    } else {
      score += 1; // If no injury, full points
    }
    
    // Convert to percentage
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
  
  // Form content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Step 1: Sleep & Emotional State</h3>
            
            {/* Sleep Quality */}
            <FormField
              control={form.control}
              name="sleepQuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Rate your sleep quality</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="good" />
                        </FormControl>
                        <FormLabel className="font-normal">Good</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="average" />
                        </FormControl>
                        <FormLabel className="font-normal">Average</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="poor" />
                        </FormControl>
                        <FormLabel className="font-normal">Poor</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
                  <FormLabel className="text-white">How many hours did you sleep?</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        className="w-20"
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 0 && value <= 24) {
                            field.onChange(value);
                          }
                        }}
                      />
                      <span className="text-white">hours</span>
                    </div>
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
                  <FormLabel className="text-white">What is your current stress level?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="low" />
                        </FormControl>
                        <FormLabel className="font-normal">Low</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="medium" />
                        </FormControl>
                        <FormLabel className="font-normal">Medium</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="high" />
                        </FormControl>
                        <FormLabel className="font-normal">High</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Mood */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">What is your mood this morning?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="positive" />
                        </FormControl>
                        <FormLabel className="font-normal">Positive</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="neutral" />
                        </FormControl>
                        <FormLabel className="font-normal">Neutral</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="negative" />
                        </FormControl>
                        <FormLabel className="font-normal">Negative</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Step 2: Recovery & Health</h3>
            
            {/* Recovery Level */}
            <FormField
              control={form.control}
              name="recoveryLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Rate your recovery level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="good" />
                        </FormControl>
                        <FormLabel className="font-normal">Good</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="moderate" />
                        </FormControl>
                        <FormLabel className="font-normal">Moderate</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="poor" />
                        </FormControl>
                        <FormLabel className="font-normal">Poor</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Symptoms */}
            <div className="space-y-2">
              <FormLabel className="text-white block">Do you have any symptoms today?</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="runny_nose"
                    checked={form.getValues("symptoms")?.includes("runny_nose")}
                    onCheckedChange={(checked) => handleSymptomChange("runny_nose", checked as boolean)}
                  />
                  <label htmlFor="runny_nose" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    Runny nose
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sore_throat"
                    checked={form.getValues("symptoms")?.includes("sore_throat")}
                    onCheckedChange={(checked) => handleSymptomChange("sore_throat", checked as boolean)}
                  />
                  <label htmlFor="sore_throat" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    Sore throat
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="fever"
                    checked={form.getValues("symptoms")?.includes("fever")}
                    onCheckedChange={(checked) => handleSymptomChange("fever", checked as boolean)}
                  />
                  <label htmlFor="fever" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    Fever
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="diarrhea"
                    checked={form.getValues("symptoms")?.includes("diarrhea")}
                    onCheckedChange={(checked) => handleSymptomChange("diarrhea", checked as boolean)}
                  />
                  <label htmlFor="diarrhea" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    Diarrhea
                  </label>
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Checkbox 
                    id="no_symptoms"
                    checked={form.getValues("symptoms")?.includes("no_symptoms")}
                    onCheckedChange={(checked) => handleSymptomChange("no_symptoms", checked as boolean)}
                  />
                  <label htmlFor="no_symptoms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    I feel well
                  </label>
                </div>
              </div>
            </div>
            
            {/* Motivation Level */}
            <FormField
              control={form.control}
              name="motivationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">What is your motivation level today?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="high" />
                        </FormControl>
                        <FormLabel className="font-normal">High</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="moderate" />
                        </FormControl>
                        <FormLabel className="font-normal">Moderate</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="low" />
                        </FormControl>
                        <FormLabel className="font-normal">Low</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Step 3: Muscle Soreness & Injury Check</h3>
            
            {/* Body Map with Front/Back Toggle */}
            <div className="space-y-4">
              <div className="flex justify-center space-x-2 mb-2">
                <Button
                  type="button"
                  variant={bodyView === 'front' ? 'default' : 'outline'}
                  onClick={() => setBodyView('front')}
                  className="w-24"
                >
                  Front
                </Button>
                <Button
                  type="button"
                  variant={bodyView === 'back' ? 'default' : 'outline'}
                  onClick={() => setBodyView('back')}
                  className="w-24"
                >
                  Back
                </Button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <FormLabel className="text-white block mb-2">Select areas where you feel soreness:</FormLabel>
                
                <div className="relative w-48 h-80 mx-auto">
                  {/* Body Silhouette */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-64 bg-gray-800 rounded-3xl relative">
                      {/* Simple body silhouette outline */}
                      {bodyView === 'front' ? (
                        // Front view clickable regions
                        <>
                          {FRONT_BODY_PARTS.map(part => (
                            <button
                              key={part}
                              type="button"
                              className={`absolute ${getBodyPartPosition(part)} w-6 h-6 rounded-full border border-gray-600 ${
                                getSorenessColor(form.getValues("sorenessMap")[part] || 0)
                              } hover:bg-opacity-70 transition-colors`}
                              onClick={() => handleBodyPartClick(part)}
                            />
                          ))}
                        </>
                      ) : (
                        // Back view clickable regions
                        <>
                          {BACK_BODY_PARTS.map(part => (
                            <button
                              key={part}
                              type="button"
                              className={`absolute ${getBodyPartPosition(part)} w-6 h-6 rounded-full border border-gray-600 ${
                                getSorenessColor(form.getValues("sorenessMap")[part] || 0)
                              } hover:bg-opacity-70 transition-colors`}
                              onClick={() => handleBodyPartClick(part)}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-4 space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary bg-opacity-30 mr-1"></div>
                    <span className="text-gray-300">Mild</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary bg-opacity-60 mr-1"></div>
                    <span className="text-gray-300">Moderate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
                    <span className="text-gray-300">Severe</span>
                  </div>
                </div>
              </div>
              
              {/* Comment about soreness/pain */}
              <Textarea
                placeholder="Describe any pain or discomfort (optional)"
                className="resize-none h-20"
                value={form.getValues("injuryNotes") || ""}
                onChange={(e) => form.setValue("injuryNotes", e.target.value)}
              />
            </div>
            
            {/* Injury Question */}
            <FormField
              control={form.control}
              name="hasInjury"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-white font-medium">Do you currently have an injury?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Conditional Injury Fields */}
            {form.watch("hasInjury") && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-700">
                {/* Pain Level Slider */}
                <FormField
                  control={form.control}
                  name="painLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Rate your pain level (0-10)</FormLabel>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value || 0]}
                            min={0}
                            max={10}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <div className="text-center text-lg font-semibold text-primary mt-2">
                          {field.value || 0}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Injury Improving */}
                <FormField
                  control={form.control}
                  name="injuryImproving"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Is the injury improving?</FormLabel>
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
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="unchanged" />
                            </FormControl>
                            <FormLabel className="font-normal">Unchanged</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Helper function to position body parts on the silhouette
  function getBodyPartPosition(part: string): string {
    // This is a simplified positioning - in a real app, you'd use more precise positioning
    const positions: Record<string, string> = {
      // Front positions
      "head": "top-2 left-1/2 -translate-x-1/2",
      "neck": "top-8 left-1/2 -translate-x-1/2",
      "chest": "top-16 left-1/2 -translate-x-1/2",
      "abs": "top-24 left-1/2 -translate-x-1/2",
      "left_shoulder": "top-12 left-4",
      "right_shoulder": "top-12 right-4",
      "left_arm": "top-20 left-2",
      "right_arm": "top-20 right-2",
      "left_forearm": "top-28 left-2",
      "right_forearm": "top-28 right-2",
      "left_wrist": "top-36 left-2",
      "right_wrist": "top-36 right-2",
      "left_hip": "top-32 left-6",
      "right_hip": "top-32 right-6",
      "left_quad": "top-40 left-6",
      "right_quad": "top-40 right-6",
      "left_knee": "top-48 left-6",
      "right_knee": "top-48 right-6",
      "left_shin": "top-56 left-6",
      "right_shin": "top-56 right-6",
      "left_ankle": "bottom-4 left-6",
      "right_ankle": "bottom-4 right-6",
      "left_foot": "bottom-0 left-6",
      "right_foot": "bottom-0 right-6",
      
      // Back positions
      "head_back": "top-2 left-1/2 -translate-x-1/2",
      "neck_back": "top-8 left-1/2 -translate-x-1/2",
      "upper_back": "top-12 left-1/2 -translate-x-1/2",
      "mid_back": "top-20 left-1/2 -translate-x-1/2",
      "lower_back": "top-28 left-1/2 -translate-x-1/2",
      "left_shoulder_back": "top-12 left-4",
      "right_shoulder_back": "top-12 right-4",
      "left_tricep": "top-20 left-2",
      "right_tricep": "top-20 right-2",
      "left_elbow": "top-28 left-2",
      "right_elbow": "top-28 right-2",
      "left_glute": "top-36 left-6",
      "right_glute": "top-36 right-6",
      "left_hamstring": "top-44 left-6",
      "right_hamstring": "top-44 right-6",
      "left_calf": "top-52 left-6",
      "right_calf": "top-52 right-6",
      "left_achilles": "bottom-8 left-6",
      "right_achilles": "bottom-8 right-6"
    };
    
    return positions[part] || "top-0 left-0";
  }
  
  // Helper to get color based on soreness level
  function getSorenessColor(level: number): string {
    switch (level) {
      case 1:
        return "bg-primary bg-opacity-30";
      case 2:
        return "bg-primary bg-opacity-60";
      case 3:
        return "bg-primary";
      default:
        return "bg-transparent";
    }
  }
  
  return (
    <div className="bg-black p-6 rounded-xl shadow-sm border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">Daily Morning Self-Control Diary</h3>
      
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex justify-between">
          <div className={`text-xs font-medium ${currentStep >= 1 ? 'text-primary' : 'text-gray-500'}`}>
            Sleep & Emotional State
          </div>
          <div className={`text-xs font-medium ${currentStep >= 2 ? 'text-primary' : 'text-gray-500'}`}>
            Recovery & Health
          </div>
          <div className={`text-xs font-medium ${currentStep >= 3 ? 'text-primary' : 'text-gray-500'}`}>
            Soreness & Injury
          </div>
        </div>
        <div className="w-full bg-gray-700 h-1.5 mt-2 rounded-full">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div></div> // Empty div to maintain flex alignment
            )}
            
            {currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={nextStep}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="w-32"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}