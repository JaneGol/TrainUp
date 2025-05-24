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
  
  // Get training sessions based on RPE submissions
  const { data: trainingSessions = [], isLoading: sessionsLoading, refetch } = useQuery<DetectedSession[]>({
    queryKey: ["/api/training-sessions"],
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
      refetch();
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

  // Handle saving session duration
  const handleSaveDuration = (sessionId: string) => {
    const newDuration = sessionDurations[sessionId];
    if (newDuration && newDuration > 0) {
      updateDurationMutation.mutate({ sessionId, duration: newDuration });
    }
  };

  // Handle duration input change
  const handleDurationChange = (sessionId: string, duration: number) => {
    setSessionDurations(prev => ({ ...prev, [sessionId]: duration }));
  };

  // Format session type display
  const formatSessionType = (session: DetectedSession) => {
    if (session.type === "Field Training" && session.sessionNumber) {
      return `Field Session ${session.sessionNumber}`;
    }
    return session.type.replace(" Training", "").replace("/", "/");
  };

  // Format date display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate session summary based on average RPE
  const generateSessionSummary = (session: DetectedSession) => {
    const avgRPE = session.avgRPE || 0;
    let summary = "";
    
    // Base summary based on RPE range
    if (avgRPE >= 9.0) {
      summary = "Max intensity – high stress load";
    } else if (avgRPE >= 8.0) {
      summary = "High effort session with consistent intensity";
    } else if (avgRPE >= 6.0) {
      summary = "Solid session with sustained intensity";
    } else if (avgRPE >= 4.0) {
      summary = "Moderate workload, suitable for adaptation";
    } else {
      summary = "Light recovery session with low intensity";
    }
    
    // Add duration modifier
    if (session.duration < 45) {
      summary = "Short session - " + summary.toLowerCase();
    }
    
    return summary;
  };

  if (sessionsLoading) {
    return (
      <div className="bg-zinc-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading training sessions...</p>
        </div>
      </div>
    );
  }

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

        <div className="mb-6">
          <p className="text-zinc-400">
            Automatically detected training sessions based on athlete RPE submissions. 
            Edit session durations to ensure accurate load calculations.
          </p>
        </div>

        {trainingSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-500 mb-4">
              <Clock size={48} className="mx-auto mb-2" />
              <p className="text-lg">No training sessions detected</p>
              <p className="text-sm">Sessions appear when 50%+ of athletes submit RPE data</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {trainingSessions.map((session) => (
              <div key={session.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                {/* Header with date and session type */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span className="font-medium text-lg">{formatDate(session.date)} — {formatSessionType(session)}</span>
                  </div>
                  <div className="text-sm text-zinc-400">
                    Participants: {session.participants}/{session.totalAthletes}
                  </div>
                </div>

                {/* Key metrics in compact format */}
                <div className="flex items-center gap-6 mb-3 text-sm">
                  <span>
                    <strong>RPE:</strong> {session.avgRPE ? session.avgRPE.toFixed(1) : 'N/A'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span><strong>Duration:</strong></span>
                    {editingSession === session.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          max="300"
                          defaultValue={session.duration}
                          onChange={(e) => handleDurationChange(session.id, parseInt(e.target.value))}
                          className="w-16 h-6 px-2 bg-zinc-700 border-zinc-600 text-white text-xs"
                        />
                        <span className="text-xs text-zinc-400">min</span>
                        <Button
                          size="sm"
                          onClick={() => handleSaveDuration(session.id)}
                          disabled={updateDurationMutation.isPending}
                          className="h-6 px-2 bg-lime-600 hover:bg-lime-700 text-xs"
                        >
                          <Save size={10} />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSession(session.id);
                          setSessionDurations(prev => ({ ...prev, [session.id]: session.duration }));
                        }}
                        className="text-zinc-300 hover:text-white underline decoration-dotted"
                      >
                        {session.duration} min
                      </button>
                    )}
                  </div>
                  
                  <span>
                    <strong>Load:</strong> {session.calculatedAU} AU
                  </span>
                </div>

                {/* Auto-generated summary */}
                <div className="flex items-start gap-2 bg-zinc-750 rounded p-2">
                  <span className="text-sm">📝</span>
                  <div className="text-sm text-zinc-300 italic">
                    {generateSessionSummary(session)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}