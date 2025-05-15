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
  sleepQuality?: string;
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
  sleepQuality = 'average',
  hasIssues, 
  onClick 
}: AthleteIconProps) {
  // Helper function to determine color based on score
  const getColorClass = (score: number) => {
    return score >= 75 
      ? 'text-green-500' 
      : score >= 50 
        ? 'text-yellow-500' 
        : 'text-red-500';
  };

  // Helper function to determine border color based on sleep quality
  const getSleepQualityBorderColor = () => {
    return sleepQuality === 'good'
      ? 'border-green-500'
      : sleepQuality === 'average'
        ? 'border-yellow-500'
        : 'border-red-500';
  };
  
  return (
    <div 
      className="p-2 cursor-pointer transition-all hover:bg-zinc-800 rounded-lg flex flex-col items-center"
      onClick={onClick}
    >
      {/* Athlete icon with indicators */}
      <div className="relative w-14 h-14 mb-1">
        {/* Outer circle - Sleep quality */}
        <div className={`absolute inset-0 rounded-full border-3 ${getSleepQualityBorderColor()}`} />
        
        {/* Inner circle - Mood level */}
        <div 
          className="absolute inset-1 rounded-full border-2 border-dashed" 
          style={{ 
            borderColor: moodScore >= 75 
              ? 'rgba(34, 197, 94, 0.7)' 
              : moodScore >= 50 
                ? 'rgba(234, 179, 8, 0.7)' 
                : 'rgba(239, 68, 68, 0.7)'
          }}
        />
        
        {/* Avatar/initials */}
        <div className="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-sm font-semibold">{initials}</span>
        </div>
        
        {/* Recovery status - Top right corner */}
        <div 
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
            recoveryScore >= 75 ? 'bg-green-500/20' : 
            recoveryScore >= 50 ? 'bg-yellow-500/20' : 
            'bg-red-500/20'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={getColorClass(recoveryScore)}
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        
        {/* Health issue indicator - Bottom left */}
        {hasIssues && (
          <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-white"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Athlete name */}
      <div className="text-xs font-medium text-center truncate w-full mt-1">
        {name}
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
        
        // Generate sleep quality data (in a real app this would come from diary entries)
        // Correlate sleep quality with readiness score
        let sleepQuality: 'good' | 'average' | 'poor';
        if (readiness.readinessScore >= 75) {
          sleepQuality = 'good';
        } else if (readiness.readinessScore >= 50) {
          sleepQuality = 'average';
        } else {
          sleepQuality = 'poor';
        }
        
        // Add some variability - 20% chance of having a different sleep quality than what readiness suggests
        if (Math.random() < 0.2) {
          const qualities = ['good', 'average', 'poor'];
          const currentIndex = qualities.indexOf(sleepQuality);
          const otherQualities = qualities.filter((_, i) => i !== currentIndex);
          sleepQuality = otherQualities[Math.floor(Math.random() * otherQualities.length)] as 'good' | 'average' | 'poor';
        }
        
        return {
          ...readiness,
          athleteId: athlete.id,
          initials,
          hasIssues,
          moodScore: Math.round(moodScore),
          recoveryScore: Math.round(recoveryScore),
          sleepQuality
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
            {mergedAthleteData.map((athlete: any) => (
              <AthleteIcon
                key={athlete.athleteId}
                athleteId={athlete.athleteId}
                name={athlete.name}
                initials={athlete.initials}
                readinessScore={athlete.readinessScore}
                moodScore={athlete.moodScore}
                recoveryScore={athlete.recoveryScore}
                sleepQuality={athlete.sleepQuality}
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