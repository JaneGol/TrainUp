import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // 🟢 добавлено

// Типы
interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
}

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

enum TrainingType {
  FIELD = "field",
  GYM = "gym",
  MATCH = "match",
}

const addTrainingSchema = z.object({
  type: z.nativeEnum(TrainingType),
  duration: z.coerce.number().min(1),
  notes: z.string().optional(),
  athletes: z.array(z.string()),
});

type AddTrainingFormValues = z.infer<typeof addTrainingSchema>;

export default function TrainingLog() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [sessionDurations, setSessionDurations] = useState<Record<string, number>>({});

  const { data: trainingSessions = [], refetch } = useQuery<DetectedSession[]>({
    queryKey: ["/api/training-sessions"],
    queryFn: () => apiRequest("GET", "/api/training-sessions").then(res => res.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const { data: athletes = [], isLoading } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
    queryFn: () => apiRequest("GET", "/api/athletes").then(res => res.json()),
  });

  const form = useForm<AddTrainingFormValues>({
    resolver: zodResolver(addTrainingSchema),
    defaultValues: {
      type: TrainingType.FIELD,
      duration: 60,
      notes: "",
      athletes: [],
    },
  });

  useEffect(() => {
    if (athletes.length > 0) {
      const allIds = athletes.map((a) => a.id);
      form.setValue("athletes", allIds);
    }
  }, [athletes, form]);

  const updateDurationMutation = useMutation({
    mutationFn: async ({ sessionId, duration }: { sessionId: string; duration: number }) => {
      const res = await apiRequest("PATCH", `/api/training-sessions/${sessionId}`, { duration });
      if (!res.ok) throw new Error("Failed to update duration");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Duration updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/load/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team-wellness-trends"] });
      refetch();
      setEditingSession(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: async (values: AddTrainingFormValues) => {
      const promises = values.athletes.map((athleteId) => {
        const data = {
          userId: athleteId,
          trainingType:
            values.type === "field"
              ? "Field Training"
              : values.type === "gym"
              ? "Gym Training"
              : "Match/Game",
          duration: values.duration,
          notes: values.notes,
          date: new Date(),
          effortLevel: 7,
          emotionalLoad: 5,
          mood: "good",
        };
        return apiRequest("POST", "/api/training-entries", data).then(res => res.json());
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Training created" });
      queryClient.invalidateQueries({ queryKey: ["/api/training-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/athlete-recovery-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["/api/load/week"] });
      setTimeout(() => navigate("/coach"), 1500);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: AddTrainingFormValues) => {
    if (values.athletes.length === 0) {
      toast({ title: "Error", description: "Select at least one athlete", variant: "destructive" });
      return;
    }
    createTrainingMutation.mutate(values);
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-4" onClick={() => navigate("/coach")}>
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold">Training Log</h2>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TrainingType.FIELD}>Field</SelectItem>
                        <SelectItem value={TrainingType.GYM}>Gym</SelectItem>
                        <SelectItem value={TrainingType.MATCH}>Match/Game</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </FormControl>
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
                      <Input
                        className="bg-zinc-800 border-zinc-700 text-white"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Select Athletes</FormLabel>
                <p className="text-xs text-zinc-400 mb-2">All selected by default</p>
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {athletes.map((athlete) => {
                      const selected = form.watch("athletes").includes(athlete.id);
                      return (
                        <div key={athlete.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`athlete-${athlete.id}`}
                            checked={selected}
                            onCheckedChange={(checked) => {
                              const list = form.getValues("athletes");
                              if (checked) {
                                form.setValue("athletes", [...list, athlete.id]);
                              } else {
                                form.setValue("athletes", list.filter((id) => id !== athlete.id));
                              }
                            }}
                          />
                          <label htmlFor={`athlete-${athlete.id}`} className="text-sm">
                            {athlete.firstName} {athlete.lastName}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#CBFF00] text-black">
                {createTrainingMutation.isPending ? "Adding..." : "Add Training"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
