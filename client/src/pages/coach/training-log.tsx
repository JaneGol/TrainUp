import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Users, Save } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import TrainingRow from "@/components/TrainingRow";
import SessionSheet from "@/components/SessionSheet";
import { useUpdateDuration } from "@/hooks/useUpdateDuration";
import CoachDashboardLayout from "@/components/layout/coach-dashboard-layout";
import { bucketByWeek, weekLabel } from "@/utils/weekHelpers";
import { format, parseISO } from "date-fns";

interface TrainingSession {
  id: string;
  date: string;
  trainingType: string;
  sessionNumber?: number;
  rpe: number | null;
  load: number;
  participantCount: number;
  totalAthletes: number;
  duration: number;
  emotionalLoad?: number;
}

export default function TrainingLog() {
  const [, navigate] = useLocation();
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [summary, setSummary] = useState(false); // false = session rows, true = daily summary
  
  // Get training sessions with real-time updates
  const { data: trainingSessions = [], isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: ["/api/training-sessions"],
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
    refetchOnWindowFocus: true,
  });

  // Use the duration update hook
  const updateDurationMutation = useUpdateDuration();

  // Transform API data to match our interface
  const transformedSessions: TrainingSession[] = trainingSessions.map((session: any) => ({
    id: session.id,
    date: session.date,
    trainingType: session.trainingType,
    sessionNumber: session.sessionNumber,
    rpe: session.rpe,
    load: session.load,
    participantCount: session.participantCount,
    totalAthletes: session.totalAthletes,
    duration: session.duration,
    emotionalLoad: 1.25 // Default emotional load
  }));

  // Build daily summary for "All Athletes" view
  const dailySummary = useMemo(() => {
    const grouped = transformedSessions.reduce((acc, session) => {
      const dateKey = session.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {} as Record<string, TrainingSession[]>);

    return Object.entries(grouped).map(([date, sessions]) => {
      const totalAU = sessions.reduce((sum, s) => sum + (s.load || 0), 0);
      const validRpeValues = sessions.filter(s => s.rpe !== null && s.rpe !== undefined && !isNaN(s.rpe)).map(s => s.rpe);
      const avgRpe = validRpeValues.length > 0 ? validRpeValues.reduce((sum, rpe) => sum + rpe, 0) / validRpeValues.length : null;
      
      console.log(`DEBUG Daily Summary - Date: ${date}, Sessions:`, sessions);
      console.log(`DEBUG - Total AU: ${totalAU}, Valid RPE values:`, validRpeValues, 'Avg RPE:', avgRpe);
      
      return {
        date,
        avgRpe: avgRpe !== null ? Number(avgRpe.toFixed(1)) : 0,
        totalAU,
        sessions: sessions.length,
        labelDate: format(parseISO(date), 'dd.MM'),
      };
    }).sort((a, b) => b.date.localeCompare(a.date)); // newest first
  }, [transformedSessions]);

  // Group sessions by ISO week
  const sessionsByWeek: Record<string, TrainingSession[]> = bucketByWeek(transformedSessions);
  const orderedWeeks = Object.keys(sessionsByWeek).sort().reverse(); // newest first

  const handleRowClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setIsSheetOpen(true);
  };

  const handleSave = (sessionId: string, duration: number) => {
    updateDurationMutation.mutate(
      { sessionId, duration },
      {
        onSuccess: () => {
          setIsSheetOpen(false);
          setSelectedSession(null);
        }
      }
    );
  };

  const handleBackClick = () => {
    navigate("/coach");
  };

  if (sessionsLoading) {
    return (
      <CoachDashboardLayout>
        <div className="p-6 bg-zinc-950 min-h-screen text-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading training sessions...</span>
          </div>
        </div>
      </CoachDashboardLayout>
    );
  }

  return (
    <CoachDashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2 hover:bg-zinc-800 text-white" 
            onClick={handleBackClick}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Training Sessions</h1>
            <p className="text-sm text-zinc-400">Manage and edit session details</p>
          </div>
        </div>

        {/* Toggle button for daily summary (only show for "All Athletes" view) */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setSummary(!summary)}
            className="text-[12px] underline underline-offset-2 text-zinc-400 hover:text-white"
          >
            {summary ? 'Show sessions' : 'Show daily summary'}
          </button>
        </div>

        {/* Mobile-first row list */}
        <div className="md:hidden space-y-6">
          {transformedSessions.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No training sessions found</p>
            </div>
          ) : summary ? (
            /* Daily summary view */
            <div className="space-y-3">
              {dailySummary.map(day => (
                <div key={day.date} className="flex justify-between items-center px-4 py-3 bg-zinc-800 rounded-lg">
                  <span className="text-sm font-medium text-white">{day.labelDate}</span>
                  <span className="text-sm text-zinc-300">RPE {day.avgRpe}</span>
                  <span className="text-sm font-medium text-white">{day.totalAU} AU</span>
                  <span className="text-[11px] text-zinc-400">{day.sessions} sess.</span>
                </div>
              ))}
            </div>
          ) : (
            /* Individual session view */
            orderedWeeks.map(wKey => (
              <div key={wKey}>
                {/* Week header */}
                <h3 className="px-2 py-1 mb-2 text-sm font-semibold tracking-wide text-zinc-400">
                  {weekLabel(wKey)}
                </h3>

                {/* Training rows for this week */}
                <div className="space-y-3">
                  {sessionsByWeek[wKey].map(session => (
                    <TrainingRow
                      key={session.id}
                      session={session}
                      onOpen={handleRowClick}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block space-y-6">
          {transformedSessions.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No training sessions found</p>
            </div>
          ) : (
            orderedWeeks.map(wKey => (
              <div key={wKey}>
                {/* Week header */}
                <h3 className="px-2 py-1 mb-2 text-sm font-semibold tracking-wide text-zinc-400">
                  {weekLabel(wKey)}
                </h3>

                {/* Table for this week */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-zinc-800">
                        <tr className="text-zinc-300">
                          <th className="p-4">Date</th>
                          <th className="p-4">Session</th>
                          <th className="p-4">Participants</th>
                          <th className="p-4">RPE</th>
                          <th className="p-4">Duration</th>
                          <th className="p-4">Load</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionsByWeek[wKey].map((session) => (
                          <tr 
                            key={session.id}
                            className="border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                            onClick={() => handleRowClick(session)}
                          >
                            <td className="p-4">{new Date(session.date).toLocaleDateString()}</td>
                            <td className="p-4">{session.trainingType}</td>
                            <td className="p-4">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {session.participantCount}/{session.totalAthletes}
                              </span>
                            </td>
                            <td className="p-4">{session.rpe}</td>
                            <td className="p-4">{session.duration} min</td>
                            <td className="p-4">{session.load} AU</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Session Sheet */}
        <SessionSheet
          open={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          session={selectedSession}
          onSave={handleSave}
          isLoading={updateDurationMutation.isPending}
        />
      </div>
    </CoachDashboardLayout>
  );
}