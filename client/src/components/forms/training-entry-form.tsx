import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { insertTrainingEntrySchema } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";

// Extend the schema for the form
const trainingEntryFormSchema = insertTrainingEntrySchema.extend({
  date: z.string().min(1, { message: "Date is required" }),
  sessionNumber: z.number().min(1).max(2).optional(),
});

// Define the type for form values
type TrainingEntryFormValues = z.infer<typeof trainingEntryFormSchema>;

export default function TrainingEntryForm() {
  const { toast } = useToast();
  const [effortLevel, setEffortLevel] = useState(7);
  
  // Form initialization
  const form = useForm<TrainingEntryFormValues>({
    resolver: zodResolver(trainingEntryFormSchema),
    defaultValues: {
      trainingType: "Field Training" as const,
      date: new Date().toISOString().slice(0, 16), // Format as YYYY-MM-DDThh:mm
      effortLevel: 7,
      emotionalLoad: 3,
      mood: "neutral",
      notes: "",
      sessionNumber: 1,
    },
  });
  
  // Mutation for creating a training entry
  const createEntryMutation = useMutation({
    mutationFn: async (data: TrainingEntryFormValues) => {
      const res = await apiRequest("POST", "/api/training-entries", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-entries"] });
      toast({
        title: "Training entry saved",
        description: "Your training diary has been updated.",
      });
      form.reset({
        trainingType: "Field Training",
        date: new Date().toISOString().slice(0, 16),
        effortLevel: 7,
        emotionalLoad: 3,
        mood: "neutral",
        notes: "",
        sessionNumber: 1,
      });
      setEffortLevel(7);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save training entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(data: TrainingEntryFormValues) {
    createEntryMutation.mutate(data);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Training Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trainingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Training Type" />
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
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="effortLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Your Effort</FormLabel>
                  <div className="flex justify-between px-2 text-xs text-gray-500 mb-1">
                    <span>Easy</span>
                    <span>Medium</span>
                    <span>Hard</span>
                    <span>Very Hard</span>
                    <span>Maximum</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => {
                        field.onChange(vals[0]);
                        setEffortLevel(vals[0]);
                      }}
                    />
                  </FormControl>
                  <div className="mt-1 text-center">
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {effortLevel}/10
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={field.value === "great" ? "default" : "outline"}
                      className={field.value === "great" ? "bg-primary-light text-primary" : ""}
                      onClick={() => field.onChange("great")}
                    >
                      😃 Great
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "good" ? "default" : "outline"}
                      className={field.value === "good" ? "bg-primary-light text-primary" : ""}
                      onClick={() => field.onChange("good")}
                    >
                      🙂 Good
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "tired" ? "default" : "outline"}
                      className={field.value === "tired" ? "bg-primary-light text-primary" : ""}
                      onClick={() => field.onChange("tired")}
                    >
                      😴 Tired
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "stressed" ? "default" : "outline"}
                      className={field.value === "stressed" ? "bg-primary-light text-primary" : ""}
                      onClick={() => field.onChange("stressed")}
                    >
                      😓 Stressed
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about your training session..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-500 text-sm">
                <Info className="h-4 w-4 mr-1" />
                <span>Entry will be shared with your coach</span>
              </div>
              <Button 
                type="submit" 
                disabled={createEntryMutation.isPending}
              >
                {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
