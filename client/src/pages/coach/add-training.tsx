import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Users, Save } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface DetectedSession {
  id: string;
  date: string;
  type: string;
  sessionNumber?: number;
  avgRPE: number;
  participants: number;
  totalAthletes: number;
  duration: number;
  calculatedAU: number;
}

export default function TrainingLog() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [sessionDurations, setSessionDurations] = useState<Record<string, number>>({});
  
  // Get training sessions with real-time updates
  const { data: trainingSessions = [], isLoading: sessionsLoading, refetch } = useQuery<DetectedSession[]>({
    queryKey: ["/api/training-sessions"],
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: true,
  });

  // Mutation to update session duration
  const updateDurationMutation = useMutation({
    mutationFn: async ({ sessionId, duration }: { sessionId: string; duration: number }) => {
      const response = await apiRequest("PATCH", `/api/training-sessions/${sessionId}`, { duration });
      if (!response.ok) {
        throw new Error("Failed to update session duration");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Session duration updated successfully",
      });
      // Invalidate multiple related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/load/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team-wellness-trends"] });
      refetch(); // Refresh the sessions data
      setEditingSession(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update session duration",
        variant: "destructive",
      });
    },
  });
  
  // Form definition
  const form = useForm<AddTrainingFormValues>({
    resolver: zodResolver(addTrainingSchema),
    defaultValues: {
      type: TrainingType.FIELD,
      duration: 60,
      athletes: [],
      notes: "",
    },
  });
  
  // Set all athletes as selected by default when data loads
  useEffect(() => {
    if (athletes.length > 0) {
      const athleteIds = athletes.map(athlete => athlete.id);
      form.setValue("athletes", athleteIds);
    }
  }, [athletes, form]);
  
  // Create training entry mutation
  const createTrainingMutation = useMutation({
    mutationFn: async (values: AddTrainingFormValues) => {
      // Create a training entry for each selected athlete
      const promises = values.athletes.map(async (athleteId) => {
        const trainingData = {
          userId: athleteId,
          trainingType: values.type === "field" ? "Field Training" : 
                      values.type === "gym" ? "Gym Training" : "Match/Game",
          duration: values.duration,
          notes: values.notes,
          // Default values required by the schema
          date: new Date(),
          effortLevel: 7,
          emotionalLoad: 5,
          mood: "good"
        };
        
        const res = await apiRequest("POST", "/api/training-entries", trainingData);
        return res.json();
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Thank you",
        description: "Training has been added",
      });
      // Invalidate multiple related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/training-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/athlete-recovery-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["/api/load/week"] });
      
      // Redirect to coach dashboard after successful submission
      setTimeout(() => {
        navigate("/coach");
      }, 1500);
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
    <div className="bg-zinc-950 min-h-screen text-white">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 p-2 text-white hover:bg-zinc-800" 
            onClick={() => navigate("/coach")}
          >
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold">Training Log</h2>
        </div>
        
        <div className="bg-zinc-900 rounded-lg">
          <div className="p-6">
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
                          <SelectItem value={TrainingType.FIELD}>Field</SelectItem>
                          <SelectItem value={TrainingType.GYM}>Gym</SelectItem>
                          <SelectItem value={TrainingType.MATCH}>Game/Match</SelectItem>
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
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            field.onChange(value);
                          }}
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
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Athlete Selection */}
                <div>
                  <FormLabel>Select Athletes</FormLabel>
                  <p className="text-xs text-zinc-400 mb-2">All athletes are selected by default. Deselect those who did not participate.</p>
                  {isLoading ? (
                    <p className="text-sm text-zinc-400 mt-2">Loading athletes...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {athletes.map((athlete) => {
                        // Check if this athlete is in the selected list
                        const isSelected = form.watch("athletes").includes(athlete.id);
                        
                        return (
                          <div key={athlete.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`athlete-${athlete.id}`}
                              checked={isSelected}
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
                        );
                      })}
                    </div>
                  )}
                  {!isLoading && athletes.length === 0 && (
                    <p className="text-sm text-zinc-400 mt-2">No athletes available.</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#CBFF00] hover:bg-[#b9e800] text-black font-medium"
                  disabled={createTrainingMutation.isPending}
                >
                  {createTrainingMutation.isPending ? "Adding..." : "Add Training"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}