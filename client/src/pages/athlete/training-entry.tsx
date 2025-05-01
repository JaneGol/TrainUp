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
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Form schema
const trainingEntryFormSchema = z.object({
  trainingType: z.string().min(1, "Training type is required"),
  effortLevel: z.number().min(1).max(10),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  date: z.date().default(() => new Date()),
  mood: z.enum(["happy", "neutral", "tired", "exhausted"]),
  notes: z.string().optional(),
});

type TrainingEntryFormValues = z.infer<typeof trainingEntryFormSchema>;

export default function TrainingEntryForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [effortDescription, setEffortDescription] = useState("Normal effort");
  
  // Define form
  const form = useForm<TrainingEntryFormValues>({
    resolver: zodResolver(trainingEntryFormSchema),
    defaultValues: {
      trainingType: "",
      effortLevel: 5,
      duration: 60,
      date: new Date(), // Add date with current date as default
      mood: "neutral",
      notes: "",
    },
  });
  
  // Watch effort level to provide description
  const effortLevel = form.watch("effortLevel");
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-entries"] });
      toast({
        title: "Training entry submitted",
        description: "Your training session has been recorded",
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
  function onSubmit(data: TrainingEntryFormValues) {
    // Convert the Date object to an ISO string that the server can handle
    const formattedData = {
      ...data,
      date: data.date.toISOString()
    };
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
                          <SelectItem value="Strength">Strength</SelectItem>
                          <SelectItem value="Endurance">Endurance</SelectItem>
                          <SelectItem value="Speed">Speed</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Recovery">Recovery</SelectItem>
                          <SelectItem value="Match">Match/Competition</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={5}
                            max={240}
                            step={5}
                            defaultValue={[value]}
                            onValueChange={(vals) => onChange(vals[0])}
                            {...field}
                          />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">5 min</span>
                            <span className="text-sm font-medium">{value} min</span>
                            <span className="text-sm text-muted-foreground">240 min</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="effortLevel"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Rate of Perceived Exertion (RPE)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            defaultValue={[value]}
                            onValueChange={(vals) => onChange(vals[0])}
                            {...field}
                          />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Easy (1)</span>
                            <span className="text-sm font-medium">{value} - {effortDescription}</span>
                            <span className="text-sm text-muted-foreground">Max (10)</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        How hard was your training session?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mood After Training</FormLabel>
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
                          <SelectItem value="happy">Happy/Energized</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="tired">Tired</SelectItem>
                          <SelectItem value="exhausted">Exhausted</SelectItem>
                        </SelectContent>
                      </Select>
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