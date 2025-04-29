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

// Define Zod schema for the form based on slider inputs and validation
const morningDiarySchema = z.object({
  userId: z.number(),
  
  // Step 1: Sleep & Emotional State
  sleepQuality: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  stressLevel: z.number().min(1).max(10),
  mood: z.number().min(1).max(10),
  
  // Step 2: Recovery & Health
  recoveryLevel: z.number().min(1).max(10),
  symptoms: z.array(z.string()),
  motivationLevel: z.number().min(1).max(10),
  
  // Step 3: Muscle Soreness & Injury
  sorenessMap: z.record(z.string(), z.number()).refine(
    (map) => Object.keys(map).length > 0 || map._no_soreness === 1, 
    { message: "Please select at least one body part or confirm you have no soreness" }
  ),
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
  const [, setLocation] = useLocation();
  
  // Create form with default values
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: {
      userId: user?.id ?? 0,
      
      // Step 1 defaults
      sleepQuality: 5, // Middle of 1-10 scale
      sleepHours: 7,
      stressLevel: 5, // Middle of 1-10 scale
      mood: 5, // Middle of 1-10 scale
      
      // Step 2 defaults
      recoveryLevel: 5, // Middle of 1-10 scale
      symptoms: [],
      motivationLevel: 5, // Middle of 1-10 scale
      
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
  
  // Calculate readiness score based on slider values
  function calculateReadinessScore(data: MorningDiaryFormValues): number {
    let score = 0;
    const maxScore = 10;
    
    // Sleep quality (max 1 point) - Convert 1-10 scale to 0-1 point
    score += Math.min(1, data.sleepQuality / 10);
    
    // Sleep hours (max 1 point)
    if (data.sleepHours >= 8) score += 1;
    else if (data.sleepHours >= 6) score += 0.5;
    
    // Stress level (max 1 point) - Higher stress means lower score
    // Invert the scale: 10 = low stress, 1 = high stress
    score += Math.min(1, (11 - data.stressLevel) / 10);
    
    // Mood (max 1 point) - Convert 1-10 scale to 0-1 point
    score += Math.min(1, data.mood / 10);
    
    // Recovery level (max 1 point) - Convert 1-10 scale to 0-1 point
    score += Math.min(1, data.recoveryLevel / 10);
    
    // Symptoms (max 1 point)
    if (data.symptoms.includes("no_symptoms")) score += 1;
    else if (data.symptoms.length <= 1) score += 0.5;
    
    // Motivation (max 1 point) - Convert 1-10 scale to 0-1 point
    score += Math.min(1, data.motivationLevel / 10);
    
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
            <h3 className="text-lg font-semibold text-white">Step 1: Sleep & Emotional State</h3>
            
            {/* Sleep Quality Slider */}
            <FormField
              control={form.control}
              name="sleepQuality"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-white">Rate your sleep quality</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="py-3"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Poor (1)</span>
                      <span>Good (10)</span>
                    </div>
                    <div className="text-center text-white">
                      Selected: <span className="font-semibold">{value}</span>
                    </div>
                  </div>
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
            
            {/* Stress Level Slider */}
            <FormField
              control={form.control}
              name="stressLevel"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-white">What is your current stress level?</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="py-3"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Low (1)</span>
                      <span>High (10)</span>
                    </div>
                    <div className="text-center text-white">
                      Selected: <span className="font-semibold">{value}</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Mood Slider */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-white">What is your mood this morning?</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="py-3"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Negative (1)</span>
                      <span>Positive (10)</span>
                    </div>
                    <div className="text-center text-white">
                      Selected: <span className="font-semibold">{value}</span>
                    </div>
                  </div>
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
            
            {/* Recovery Level Slider */}
            <FormField
              control={form.control}
              name="recoveryLevel"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-white">Rate your recovery level</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="py-3"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Poor (1)</span>
                      <span>Excellent (10)</span>
                    </div>
                    <div className="text-center text-white">
                      Selected: <span className="font-semibold">{value}</span>
                    </div>
                  </div>
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
              {form.formState.errors.symptoms && (
                <p className="text-red-500 text-sm mt-1">
                  Please select at least one option
                </p>
              )}
            </div>
            
            {/* Motivation Level Slider */}
            <FormField
              control={form.control}
              name="motivationLevel"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-white">What is your motivation level today?</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="py-3"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Low (1)</span>
                      <span>High (10)</span>
                    </div>
                    <div className="text-center text-white">
                      Selected: <span className="font-semibold">{value}</span>
                    </div>
                  </div>
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
                <FormLabel className="text-white block mb-2">
                  Select areas where you feel soreness (required):
                </FormLabel>
                
                <div className="relative w-64 h-96 mx-auto">
                  {/* Human Body Silhouette SVG - Front View */}
                  {bodyView === 'front' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <svg 
                        className="w-48 h-80" 
                        viewBox="0 0 200 400" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Base body silhouette */}
                        <path 
                          d="M100,30 C120,30 135,45 135,60 C135,75 125,85 120,95 C115,105 115,110 115,110 L115,140 C115,140 130,150 130,170 C130,190 125,220 120,240 C115,260 115,280 115,300 C115,320 115,340 110,350 C105,360 100,370 100,370 L100,390 L90,390 L90,370 C90,370 85,360 80,350 C75,340 75,320 75,300 C75,280 75,260 70,240 C65,220 60,190 60,170 C60,150 75,140 75,140 L75,110 C75,110 75,105 70,95 C65,85 55,75 55,60 C55,45 70,30 90,30 Z" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="2"
                        />
                        {/* Right shoulder (anatomical left) */}
                        <ellipse 
                          cx="130" 
                          cy="90" 
                          rx="15" 
                          ry="15" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1" 
                          onClick={() => handleBodyPartClick('left_shoulder')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_shoulder'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left shoulder (anatomical right) */}
                        <ellipse 
                          cx="70" 
                          cy="90" 
                          rx="15" 
                          ry="15" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_shoulder')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_shoulder'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right arm (anatomical left) */}
                        <rect 
                          x="140" 
                          y="100" 
                          width="10" 
                          height="50" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_arm')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_arm'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left arm (anatomical right) */}
                        <rect 
                          x="50" 
                          y="100" 
                          width="10" 
                          height="50" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_arm')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_arm'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Head */}
                        <circle 
                          cx="100" 
                          cy="40" 
                          r="25" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('head')}
                          className={getSorenessColor(form.getValues("sorenessMap")['head'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Chest */}
                        <rect 
                          x="85" 
                          y="110" 
                          width="30" 
                          height="30" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('chest')}
                          className={getSorenessColor(form.getValues("sorenessMap")['chest'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Abs */}
                        <rect 
                          x="85" 
                          y="145" 
                          width="30" 
                          height="40" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('abs')}
                          className={getSorenessColor(form.getValues("sorenessMap")['abs'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right thigh (anatomical left) */}
                        <rect 
                          x="100" 
                          y="200" 
                          width="20" 
                          height="60" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_quad')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_quad'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left thigh (anatomical right) */}
                        <rect 
                          x="80" 
                          y="200" 
                          width="20" 
                          height="60" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_quad')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_quad'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right knee (anatomical left) */}
                        <circle 
                          cx="110" 
                          cy="280" 
                          r="10" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_knee')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_knee'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left knee (anatomical right) */}
                        <circle 
                          cx="90" 
                          cy="280" 
                          r="10" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_knee')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_knee'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right shin (anatomical left) */}
                        <rect 
                          x="105" 
                          y="295" 
                          width="10" 
                          height="40" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_shin')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_shin'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left shin (anatomical right) */}
                        <rect 
                          x="85" 
                          y="295" 
                          width="10" 
                          height="40" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_shin')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_shin'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right foot (anatomical left) */}
                        <rect 
                          x="105" 
                          y="340" 
                          width="15" 
                          height="10" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_foot')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_foot'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left foot (anatomical right) */}
                        <rect 
                          x="80" 
                          y="340" 
                          width="15" 
                          height="10" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_foot')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_foot'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <svg 
                        className="w-48 h-80" 
                        viewBox="0 0 200 400" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Base body silhouette - Back view */}
                        <path 
                          d="M100,30 C120,30 135,45 135,60 C135,75 125,85 120,95 C115,105 115,110 115,110 L115,140 C115,140 130,150 130,170 C130,190 125,220 120,240 C115,260 115,280 115,300 C115,320 115,340 110,350 C105,360 100,370 100,370 L100,390 L90,390 L90,370 C90,370 85,360 80,350 C75,340 75,320 75,300 C75,280 75,260 70,240 C65,220 60,190 60,170 C60,150 75,140 75,140 L75,110 C75,110 75,105 70,95 C65,85 55,75 55,60 C55,45 70,30 90,30 Z" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="2"
                        />
                        {/* Head back */}
                        <circle 
                          cx="100" 
                          cy="40" 
                          r="25" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('head_back')}
                          className={getSorenessColor(form.getValues("sorenessMap")['head_back'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Neck back */}
                        <rect 
                          x="90" 
                          y="70" 
                          width="20" 
                          height="15" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('neck_back')}
                          className={getSorenessColor(form.getValues("sorenessMap")['neck_back'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Upper back */}
                        <rect 
                          x="80" 
                          y="90" 
                          width="40" 
                          height="30" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('upper_back')}
                          className={getSorenessColor(form.getValues("sorenessMap")['upper_back'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Mid back */}
                        <rect 
                          x="80" 
                          y="125" 
                          width="40" 
                          height="30" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('mid_back')}
                          className={getSorenessColor(form.getValues("sorenessMap")['mid_back'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Lower back */}
                        <rect 
                          x="80" 
                          y="160" 
                          width="40" 
                          height="30" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('lower_back')}
                          className={getSorenessColor(form.getValues("sorenessMap")['lower_back'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right glute (anatomical left) */}
                        <rect 
                          x="100" 
                          y="195" 
                          width="20" 
                          height="25" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_glute')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_glute'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left glute (anatomical right) */}
                        <rect 
                          x="80" 
                          y="195" 
                          width="20" 
                          height="25" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_glute')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_glute'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right hamstring (anatomical left) */}
                        <rect 
                          x="100" 
                          y="225" 
                          width="20" 
                          height="50" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_hamstring')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_hamstring'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left hamstring (anatomical right) */}
                        <rect 
                          x="80" 
                          y="225" 
                          width="20" 
                          height="50" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_hamstring')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_hamstring'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right calf (anatomical left) */}
                        <rect 
                          x="105" 
                          y="280" 
                          width="15" 
                          height="40" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_calf')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_calf'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left calf (anatomical right) */}
                        <rect 
                          x="80" 
                          y="280" 
                          width="15" 
                          height="40" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_calf')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_calf'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Right achilles (anatomical left) */}
                        <rect 
                          x="107" 
                          y="325" 
                          width="10" 
                          height="15" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('left_achilles')}
                          className={getSorenessColor(form.getValues("sorenessMap")['left_achilles'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                        {/* Left achilles (anatomical right) */}
                        <rect 
                          x="83" 
                          y="325" 
                          width="10" 
                          height="15" 
                          fill="#3e4955" 
                          stroke="#1a1d22" 
                          strokeWidth="1"
                          onClick={() => handleBodyPartClick('right_achilles')}
                          className={getSorenessColor(form.getValues("sorenessMap")['right_achilles'] || 0)}
                          style={{cursor: 'pointer'}}
                        />
                      </svg>
                    </div>
                  )}
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
                
                {/* No soreness option */}
                <div className="flex items-center justify-center mt-4">
                  <Checkbox 
                    id="no_soreness"
                    checked={form.getValues("sorenessMap")?._no_soreness === 1}
                    onCheckedChange={(checked) => {
                      const currentMap = { ...form.getValues("sorenessMap") };
                      if (checked) {
                        // Clear all other selections and set _no_soreness flag
                        form.setValue("sorenessMap", { _no_soreness: 1 }, { shouldValidate: true });
                      } else {
                        // Remove the _no_soreness flag
                        const { _no_soreness, ...rest } = currentMap;
                        form.setValue("sorenessMap", rest, { shouldValidate: true });
                      }
                    }}
                  />
                  <label htmlFor="no_soreness" className="ml-2 text-sm font-medium text-gray-300">
                    I have no muscle soreness today
                  </label>
                </div>
                
                {form.formState.errors.sorenessMap && (
                  <p className="text-sm text-red-500 mt-2 block text-center">
                    Please select at least one body part or confirm you have no soreness
                  </p>
                )}
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