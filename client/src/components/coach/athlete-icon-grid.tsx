import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Loader2, User2 } from "lucide-react";
import { useLocation } from "wouter";

interface AthleteIconProps {
  athleteId: number;
  name: string;
  initials: string;
  readinessScore: number;
  moodScore?: number;
  recoveryScore?: number;
  hasIssues: boolean;
  onClick?: () => void;
}

function AthleteIcon({ 
  athleteId, 
  name, 
  initials, 
  readinessScore, 
  moodScore = 70, 
  recoveryScore = 65, 
  hasIssues, 
  onClick 
}: AthleteIconProps) {
  // Helper function to determine color based on score
  const getColorClass = (score: number) => {
    return score >= 75 
      ? 'bg-green-500' 
      : score >= 50 
        ? 'bg-yellow-500' 
        : 'bg-red-500';
  };
  
  return (
    <div 
      className="flex p-3 cursor-pointer transition-all hover:bg-zinc-800 rounded-lg"
      onClick={onClick}
    >
      {/* Left side: Athlete avatar/initials */}
      <div className="h-12 w-12 bg-zinc-800 flex items-center justify-center rounded-lg mr-3">
        <span className="text-sm font-semibold">{initials}</span>
        
        {/* Health issue indicator */}
        {hasIssues && (
          <Badge 
            variant="outline" 
            className="absolute -top-1 -right-1 p-1 min-w-0 min-h-0 h-4 w-4 flex items-center justify-center bg-red-500 border-red-500"
          >
            <span className="sr-only">Health issue</span>
          </Badge>
        )}
      </div>
      
      {/* Right side: Status bars */}
      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        {/* Readiness bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-14">Readiness</span>
          <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getColorClass(readinessScore)}`} 
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>
        
        {/* Mood bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-14">Mood</span>
          <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getColorClass(moodScore)}`} 
              style={{ width: `${moodScore}%` }}
            />
          </div>
        </div>
        
        {/* Recovery bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-14">Recovery</span>
          <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getColorClass(recoveryScore)}`} 
              style={{ width: `${recoveryScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AthleteIconGrid() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get athlete readiness data
  const { data: athleteReadiness, isLoading: readinessLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });
  
  // Get morning diary data for all athletes (would be implemented in a real API)
  // For demo purposes, we'll create synthetic sleep data
  const [mergedAthleteData, setMergedAthleteData] = useState<any[]>([]);
  
  useEffect(() => {
    if (athletes && Array.isArray(athletes) && athleteReadiness && Array.isArray(athleteReadiness)) {
      // Merge athlete data with readiness data
      const merged = athleteReadiness.map((readiness: any) => {
        const athlete = athletes.find((a: any) => a.id === readiness.athleteId);
        
        if (!athlete) return null;
        
        // Generate initials from name
        const nameParts = readiness.name.split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[1][0]}` 
          : nameParts[0].substring(0, 2);
        
        // Determine if athlete has health issues
        const hasIssues = Array.isArray(readiness.issues) && readiness.issues.some((issue: string) => 
          issue.includes("sick") || 
          issue.includes("injury") || 
          issue.includes("ill") ||
          issue.includes("pain")
        );
        
        // Generate mood score based on readiness (in a real app this would come from the diary entries)
        // Mood is slightly higher than readiness on average
        const moodScore = Math.min(100, Math.max(0, readiness.readinessScore + 5 + (Math.random() * 10 - 5)));
        
        // Generate recovery score based on readiness (in a real app this would come from the diary entries)
        // Recovery is slightly lower than readiness on average
        const recoveryScore = Math.min(100, Math.max(0, readiness.readinessScore - 5 + (Math.random() * 10 - 5)));
        
        return {
          ...readiness,
          athleteId: athlete.id,
          initials,
          hasIssues,
          moodScore: Math.round(moodScore),
          recoveryScore: Math.round(recoveryScore)
        };
      }).filter(Boolean);
      
      setMergedAthleteData(merged);
    }
  }, [athletes, athleteReadiness]);
  
  // Handle click on athlete icon
  const handleAthleteClick = (athleteId: number) => {
    navigate(`/coach/athlete/${athleteId}`);
  };
  
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Athlete Status</CardTitle>
      </CardHeader>
      <CardContent>
        {readinessLoading || athletesLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mergedAthleteData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {mergedAthleteData.map((athlete: any) => (
              <AthleteIcon
                key={athlete.athleteId}
                athleteId={athlete.athleteId}
                name={athlete.name}
                initials={athlete.initials}
                readinessScore={athlete.readinessScore}
                moodScore={athlete.moodScore}
                recoveryScore={athlete.recoveryScore}
                hasIssues={athlete.hasIssues}
                onClick={() => handleAthleteClick(athlete.athleteId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <User2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No athlete data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}