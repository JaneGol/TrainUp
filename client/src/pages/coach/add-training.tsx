import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, FormControl, FormField, FormItem, 
  FormLabel, FormMessage 
} from "@/components/ui/form";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { insertTrainingEntrySchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Extend the training entry schema for form validation
const addTrainingSchema = insertTrainingEntrySchema.extend({
  athletes: z.array(z.number()),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
});

type AddTrainingFormValues = z.infer<typeof addTrainingSchema>;

export default function AddTraining() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get athletes
  const { data: athletes, isLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Form definition with default values
  const form = useForm<AddTrainingFormValues>({
    resolver: zodResolver(addTrainingSchema),
    defaultValues: {
      type: "",
      duration: 60,
      athletes: [],
      notes: "",
    },
  });
  
  // Create training entry mutation
  const createTrainingMutation = useMutation({
    mutationFn: async (values: AddTrainingFormValues) => {
      // Create a training entry for each selected athlete
      const promises = values.athletes.map(async (athleteId) => {
        const trainingData = {
          userId: athleteId,
          type: values.type,
          duration: values.duration,
          notes: values.notes,
        };
        
        const res = await apiRequest("POST", "/api/training-entries", trainingData);
        return res.json();
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Training Added",
        description: "Training has been scheduled for the selected athletes",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training-entries"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: AddTrainingFormValues) => {
    if (values.athletes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one athlete",
        variant: "destructive",
      });
      return;
    }
    
    createTrainingMutation.mutate(values);
  };
  
  // Helper text for training load calculation
  const getLoadHelperText = () => {
    const duration = form.watch("duration") || 0;
    return `Training load will be calculated as RPE × ${duration} minutes`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 p-2 text-white hover:bg-zinc-800" 
            onClick={() => navigate("/coach")}
          >
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold">Add Training</h2>
        </div>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Schedule Training Session</CardTitle>
            <CardDescription className="text-zinc-400">
              Create a training session for one or multiple athletes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Training Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Select training type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="field">Field</SelectItem>
                          <SelectItem value="gym">Gym</SelectItem>
                          <SelectItem value="match">Game/Match</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-zinc-400">{getLoadHelperText()}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Athlete Selection */}
                <div>
                  <FormLabel>Select Athletes</FormLabel>
                  {isLoading ? (
                    <p className="text-sm text-zinc-400 mt-2">Loading athletes...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {(athletes || []).map((athlete: any) => (
                        <div key={athlete.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`athlete-${athlete.id}`}
                            onCheckedChange={(checked) => {
                              const currentAthletes = form.getValues("athletes");
                              if (checked) {
                                form.setValue("athletes", [...currentAthletes, athlete.id]);
                              } else {
                                form.setValue(
                                  "athletes",
                                  currentAthletes.filter((id) => id !== athlete.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`athlete-${athlete.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {athlete.firstName} {athlete.lastName}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isLoading && (!athletes || athletes.length === 0) && (
                    <p className="text-sm text-zinc-400 mt-2">No athletes available.</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={createTrainingMutation.isPending}
                >
                  {createTrainingMutation.isPending ? "Scheduling..." : "Schedule Training"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}