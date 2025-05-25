import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UpdateDurationParams {
  sessionId: string;
  duration: number;
}

export function useUpdateDuration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ sessionId, duration }: UpdateDurationParams) => {
      const response = await apiRequest("PATCH", `/api/training-sessions/${sessionId}`, {
        duration_minutes: duration
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/training-load"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/athlete-recovery-readiness"] });
      
      toast({
        title: "Duration updated",
        description: "Session duration has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}