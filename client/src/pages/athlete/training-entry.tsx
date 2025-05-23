import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Activity } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ScaleTumbler } from "@/components/ui/scale-tumbler";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Form schema
const trainingEntryFormSchema = z.object({
  trainingType: z.enum(["Field Training", "Gym Training", "Match/Game"], {
    required_error: "Training type is required",
    invalid_type_error: "Training type must be one of the specified options"
  }),
  sessionNumber: z.coerce.number().min(1).max(2).default(1),
  effortLevel: z.number().min(1, "RPE must be at least 1").max(10, "RPE cannot exceed 10"),
  emotionalLoad: z.number().min(1, "Emotional load must be at least 1").max(5, "Emotional load cannot exceed 5"),
  mood: z.string().default("neutral"), // Add the required mood field
  date: z.date().default(() => new Date()),
  notes: z.string().optional(),
});

type TrainingEntryFormValues = z.infer<typeof trainingEntryFormSchema>;

export default function TrainingEntryForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [effortDescription, setEffortDescription] = useState("Normal effort");
  const [emotionalDescription, setEmotionalDescription] = useState("Moderate emotional impact");
  
  // Define form
  const form = useForm<TrainingEntryFormValues>({
    resolver: zodResolver(trainingEntryFormSchema),
    defaultValues: {
      trainingType: "Field Training",
      effortLevel: 1,
      emotionalLoad: 1,
      mood: "neutral", // Add default value for the required mood field
      date: new Date(), // Add date with current date as default
      notes: "",
    },
  });
  
  // Watch effort level and emotional load to provide descriptions
  const effortLevel = form.watch("effortLevel");
  const emotionalLoad = form.watch("emotionalLoad");
  
  // Update effort description when effortLevel changes
  useEffect(() => {
    if (effortLevel <= 2) {
      setEffortDescription("Very light effort");
    } else if (effortLevel <= 4) {
      setEffortDescription("Light effort");
    } else if (effortLevel <= 6) {
      setEffortDescription("Moderate effort");
    } else if (effortLevel <= 8) {
      setEffortDescription("Hard effort");
    } else {
      setEffortDescription("Maximum effort");
    }
  }, [effortLevel]);
  
  // Update emotional load description when emotionalLoad changes
  useEffect(() => {
    if (emotionalLoad <= 2) {
      setEmotionalDescription("Minimal emotional impact");
    } else if (emotionalLoad <= 4) {
      setEmotionalDescription("Light emotional impact");
    } else if (emotionalLoad <= 6) {
      setEmotionalDescription("Moderate emotional impact");
    } else if (emotionalLoad <= 8) {
      setEmotionalDescription("High emotional impact");
    } else {
      setEmotionalDescription("Extreme emotional impact");
    }
  }, [emotionalLoad]);
  
  // Submit form mutation
  const submitTrainingEntry = useMutation({
    mutationFn: async (data: TrainingEntryFormValues) => {
      setSubmitting(true);
      const res = await fetch("/api/training-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit training entry");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-entries"] });
      
      // Calculate the average if not provided in the response
      const averageLoad = data.averageLoad || 
        ((data.effortLevel + data.emotionalLoad) / 2);
      
      toast({
        title: "Training entry submitted",
        description: `Your training session has been recorded with an average load of ${averageLoad.toFixed(1)}/10`,
        variant: "default",
      });
      
      // Show success state for a moment before navigating back
      setTimeout(() => {
        navigate("/athlete");
      }, 2000);
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
  function onSubmit(data: TrainingEntryFormValues) {
    // Perform additional validation before submitting
    if (!data.trainingType) {
      toast({
        title: "Validation Error",
        description: "Please select a training type",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.effortLevel || data.effortLevel < 1 || data.effortLevel > 10) {
      toast({
        title: "Validation Error",
        description: "RPE must be between 1 and 10",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.emotionalLoad || data.emotionalLoad < 1 || data.emotionalLoad > 5) {
      toast({
        title: "Validation Error",
        description: "Emotional load must be between 1 and 5",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate and show the average load
    const averageLoad = (data.effortLevel + data.emotionalLoad) / 2;
    console.log(`Submitting: RPE: ${data.effortLevel}, Emotional Load: ${data.emotionalLoad}, Average: ${averageLoad.toFixed(1)}`);
    
    // Convert the Date object to an ISO string that the server can handle
    const formattedData = {
      ...data,
      date: data.date.toISOString()
    };
    
    // Submit the data
    submitTrainingEntry.mutate(formattedData as any);
  }
  
  // When submitting, show loading
  if (submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <header className="bg-[rgb(27,29,34)] border-b border-gray-800 p-4 flex items-center shadow-sm">
          <h1 className="text-xl font-bold text-white flex-1 text-center">
            Submitting Entry
          </h1>
        </header>
        
        <main className="flex-1 p-4 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md text-center p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Recording your training...</h3>
              <p className="text-muted-foreground">
                Please wait while we save your training entry.
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }
  
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
          Training Entry
        </h1>
      </header>
      
      <main className="flex-1 p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Rate Your Training Session
            </CardTitle>
            <CardDescription>
              Rate of Perceived Exertion (RPE) and session details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="trainingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select training type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Field Training">Field Training</SelectItem>
                          <SelectItem value="Gym Training">Gym Training</SelectItem>
                          <SelectItem value="Match/Game">Match/Game</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Only show session selector for Field Training */}
                {form.watch("trainingType") === "Field Training" && (
                  <FormField
                    control={form.control}
                    name="sessionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select session" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Session 1</SelectItem>
                            <SelectItem value="2">Session 2</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Field training can have multiple sessions per day
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="effortLevel"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-medium">Rate of Perceived Exertion (RPE)</FormLabel>
                      <FormControl>
                        <ScaleTumbler
                          min={1}
                          max={10}
                          value={value}
                          onChange={onChange}
                          lowLabel="Easy"
                          highLabel="Max effort"
                        />
                      </FormControl>
                      <FormDescription className="mt-2">
                        How physically demanding was your training session?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emotionalLoad"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-medium">Emotional Load</FormLabel>
                      <FormControl>
                        <ScaleTumbler
                          min={1}
                          max={5}
                          value={value > 5 ? 5 : value}
                          onChange={onChange}
                          lowLabel="Low"
                          highLabel="High"
                        />
                      </FormControl>
                      <FormDescription className="mt-2">
                        Rate the emotional intensity of your training session
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes about your training session..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include any specific exercises, achievements, or issues.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border rounded-md p-4 mb-6 bg-muted/20">
                  <h4 className="font-medium mb-2">Training Load Summary</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border rounded p-2 text-center">
                      <div className="text-sm text-muted-foreground">Physical RPE</div>
                      <div className="text-xl font-semibold">{effortLevel}/10</div>
                    </div>
                    <div className="border rounded p-2 text-center">
                      <div className="text-sm text-muted-foreground">Emotional Load</div>
                      <div className="text-xl font-semibold">
                        {emotionalLoad === 1 ? "1.00" : 
                         emotionalLoad === 2 ? "1.05" :
                         emotionalLoad === 3 ? "1.10" :
                         emotionalLoad === 4 ? "1.15" : "1.20"}
                      </div>
                    </div>
                    <div className="border rounded p-2 text-center bg-primary/10">
                      <div className="text-sm text-muted-foreground">Session Load</div>
                      <div className="text-xl font-semibold">
                        {(effortLevel * 60 * (emotionalLoad === 1 ? 1.00 : 
                                              emotionalLoad === 2 ? 1.05 :
                                              emotionalLoad === 3 ? 1.10 :
                                              emotionalLoad === 4 ? 1.15 : 1.20)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate("/athlete")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Entry
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