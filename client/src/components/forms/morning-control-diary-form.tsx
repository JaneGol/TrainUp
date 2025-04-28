import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define the form schema
const morningDiarySchema = z.object({
  sleepQuality: z.enum(["good", "okay", "poor"]),
  restedness: z.enum(["very", "somewhat", "not at all"]),
  mood: z.enum(["happy", "neutral", "stressed", "sad"]),
  motivation: z.enum(["yes", "somewhat", "no"]),
  bodyFeeling: z.enum(["fresh", "a little sore", "very sore"]),
  pain: z.enum(["no", "slight", "yes"]),
  stressLevel: z.enum(["low", "medium", "high"]),
  recovery: z.enum(["yes", "somewhat", "no"]),
  focus: z.enum(["yes", "not fully", "no"]),
  readiness: z.enum(["yes", "almost", "no"]),
});

type MorningDiaryFormValues = z.infer<typeof morningDiarySchema>;

export default function MorningControlDiaryForm() {
  const { toast } = useToast();
  
  // Form initialization
  const form = useForm<MorningDiaryFormValues>({
    resolver: zodResolver(morningDiarySchema),
    defaultValues: {
      sleepQuality: "good",
      restedness: "very",
      mood: "happy",
      motivation: "yes",
      bodyFeeling: "fresh",
      pain: "no",
      stressLevel: "low",
      recovery: "yes",
      focus: "yes",
      readiness: "yes",
    },
  });
  
  // Mutation for submitting diary entry
  const submitDiaryMutation = useMutation({
    mutationFn: async (data: MorningDiaryFormValues) => {
      const res = await apiRequest("POST", "/api/morning-diary", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/morning-diary"] });
      toast({
        title: "Morning diary submitted",
        description: "Your morning check-in has been recorded.",
      });
      form.reset({
        sleepQuality: "good",
        restedness: "very",
        mood: "happy",
        motivation: "yes",
        bodyFeeling: "fresh",
        pain: "no",
        stressLevel: "low",
        recovery: "yes",
        focus: "yes",
        readiness: "yes",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit morning diary: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(data: MorningDiaryFormValues) {
    submitDiaryMutation.mutate(data);
  }
  
  // Helper function to calculate overall readiness score based on answers
  function calculateReadinessScore(data: MorningDiaryFormValues) {
    let score = 0;
    const maxScore = 10;
    
    // Sleep quality
    if (data.sleepQuality === "good") score += 1;
    else if (data.sleepQuality === "okay") score += 0.5;
    
    // Restedness
    if (data.restedness === "very") score += 1;
    else if (data.restedness === "somewhat") score += 0.5;
    
    // Mood (happy and neutral are considered positive)
    if (data.mood === "happy") score += 1;
    else if (data.mood === "neutral") score += 0.75;
    
    // Motivation
    if (data.motivation === "yes") score += 1;
    else if (data.motivation === "somewhat") score += 0.5;
    
    // Body feeling
    if (data.bodyFeeling === "fresh") score += 1;
    else if (data.bodyFeeling === "a little sore") score += 0.5;
    
    // Pain/injury
    if (data.pain === "no") score += 1;
    else if (data.pain === "slight") score += 0.5;
    
    // Stress level
    if (data.stressLevel === "low") score += 1;
    else if (data.stressLevel === "medium") score += 0.5;
    
    // Recovery
    if (data.recovery === "yes") score += 1;
    else if (data.recovery === "somewhat") score += 0.5;
    
    // Focus
    if (data.focus === "yes") score += 1;
    else if (data.focus === "not fully") score += 0.5;
    
    // Readiness
    if (data.readiness === "yes") score += 1;
    else if (data.readiness === "almost") score += 0.5;
    
    // Convert to percentage
    return Math.round((score / maxScore) * 100);
  }
  
  // Calculate dynamic readiness score as form values change
  const watchAllFields = form.watch();
  const readinessScore = calculateReadinessScore(watchAllFields);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Morning Self-Control Diary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-500">Your morning check-in helps monitor your readiness and recovery status</p>
          <div className={`text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center ${
            readinessScore >= 80 ? 'bg-green-100 text-green-700' :
            readinessScore >= 60 ? 'bg-primary-light text-primary' :
            'bg-red-100 text-red-700'
          }`}>
            {readinessScore}%
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sleepQuality"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">How well did I sleep?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="good" id="sleep-good" />
                        <Label htmlFor="sleep-good" className="text-sm">Good</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="okay" id="sleep-okay" />
                        <Label htmlFor="sleep-okay" className="text-sm">Okay</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="poor" id="sleep-poor" />
                        <Label htmlFor="sleep-poor" className="text-sm">Poor</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="restedness"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">How rested do I feel?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="very" id="rest-very" />
                        <Label htmlFor="rest-very" className="text-sm">Very</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="somewhat" id="rest-somewhat" />
                        <Label htmlFor="rest-somewhat" className="text-sm">Somewhat</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="not at all" id="rest-not" />
                        <Label htmlFor="rest-not" className="text-sm">Not at all</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">How is my mood this morning?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="happy" id="mood-happy" />
                        <Label htmlFor="mood-happy" className="text-sm">Happy</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="neutral" id="mood-neutral" />
                        <Label htmlFor="mood-neutral" className="text-sm">Neutral</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="stressed" id="mood-stressed" />
                        <Label htmlFor="mood-stressed" className="text-sm">Stressed</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="sad" id="mood-sad" />
                        <Label htmlFor="mood-sad" className="text-sm">Sad</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">Do I feel motivated for today?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="yes" id="mot-yes" />
                        <Label htmlFor="mot-yes" className="text-sm">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="somewhat" id="mot-somewhat" />
                        <Label htmlFor="mot-somewhat" className="text-sm">Somewhat</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="no" id="mot-no" />
                        <Label htmlFor="mot-no" className="text-sm">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bodyFeeling"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">How is my body feeling?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="fresh" id="body-fresh" />
                        <Label htmlFor="body-fresh" className="text-sm">Fresh</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="a little sore" id="body-littlesore" />
                        <Label htmlFor="body-littlesore" className="text-sm">A little sore</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="very sore" id="body-verysore" />
                        <Label htmlFor="body-verysore" className="text-sm">Very sore</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pain"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">Am I feeling any pain or injury?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="no" id="pain-no" />
                        <Label htmlFor="pain-no" className="text-sm">No</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="slight" id="pain-slight" />
                        <Label htmlFor="pain-slight" className="text-sm">Slight</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="yes" id="pain-yes" />
                        <Label htmlFor="pain-yes" className="text-sm">Yes</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stressLevel"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">How stressed do I feel?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="low" id="stress-low" />
                        <Label htmlFor="stress-low" className="text-sm">Low</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="medium" id="stress-medium" />
                        <Label htmlFor="stress-medium" className="text-sm">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="high" id="stress-high" />
                        <Label htmlFor="stress-high" className="text-sm">High</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recovery"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">Did I recover well yesterday?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="yes" id="rec-yes" />
                        <Label htmlFor="rec-yes" className="text-sm">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="somewhat" id="rec-somewhat" />
                        <Label htmlFor="rec-somewhat" className="text-sm">Somewhat</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="no" id="rec-no" />
                        <Label htmlFor="rec-no" className="text-sm">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="focus"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">Am I focused on today's goals?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="yes" id="focus-yes" />
                        <Label htmlFor="focus-yes" className="text-sm">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="not fully" id="focus-notfully" />
                        <Label htmlFor="focus-notfully" className="text-sm">Not fully</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="no" id="focus-no" />
                        <Label htmlFor="focus-no" className="text-sm">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="readiness"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">Am I ready to give my best today?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="yes" id="ready-yes" />
                        <Label htmlFor="ready-yes" className="text-sm">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="almost" id="ready-almost" />
                        <Label htmlFor="ready-almost" className="text-sm">Almost</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="no" id="ready-no" />
                        <Label htmlFor="ready-no" className="text-sm">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={submitDiaryMutation.isPending}
              >
                {submitDiaryMutation.isPending ? "Submitting..." : "Submit Morning Check-in"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}