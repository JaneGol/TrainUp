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
  sleepQuality?: 'good' | 'average' | 'poor' | undefined;
  sleepHours?: number | undefined;
  hasIssues: boolean;
  onClick?: () => void;
}

function AthleteIcon({ 
  athleteId, 
  name, 
  initials, 
  readinessScore, 
  sleepQuality, 
  sleepHours, 
  hasIssues, 
  onClick 
}: AthleteIconProps) {
  // Determine color for recovery status
  const recoveryColor = readinessScore >= 75 
    ? 'bg-green-500' 
    : readinessScore >= 50 
      ? 'bg-yellow-500' 
      : 'bg-red-500';
  
  // Determine color for sleep quality (outer ring)
  const sleepQualityColor = !sleepQuality 
    ? 'border-gray-600' // No data
    : sleepQuality === 'good' 
      ? 'border-green-500' 
      : sleepQuality === 'average' 
        ? 'border-yellow-500' 
        : 'border-red-500';
  
  // Determine sleep hours display (inner ring percentage)
  // Assuming 8 hours is optimal (100%)
  const sleepHoursPercentage = !sleepHours 
    ? 0 
    : Math.min(Math.round((sleepHours / 8) * 100), 100);
  
  return (
    <div 
      className="relative flex flex-col items-center p-2 cursor-pointer transition-all hover:bg-zinc-800 rounded-lg"
      onClick={onClick}
    >
      {/* Athlete profile with dual-ring indicator */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center relative mb-1
        border-4 ${sleepQualityColor}`}
      >
        {/* Inner circle with sleep duration indicator */}
        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
          {/* Sleep hours progress circle */}
          {sleepHours && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-blue-500/30"
              style={{ 
                height: `${sleepHoursPercentage}%`,
                borderTopLeftRadius: sleepHoursPercentage < 100 ? '50%' : '0',
                borderTopRightRadius: sleepHoursPercentage < 100 ? '50%' : '0'
              }}
            />
          )}
          
          {/* Initials displayed over sleep indicator */}
          <span className="text-sm font-semibold z-10">{initials}</span>
        </div>
      </div>
      
      {/* Recovery status vertical bar */}
      <div className="absolute bottom-10 right-2 w-1.5 h-8 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`w-full ${recoveryColor}`} 
          style={{ 
            height: `${readinessScore}%`,
            position: 'absolute',
            bottom: 0
          }}
        />
      </div>
      
      {/* Health issue indicator */}
      {hasIssues && (
        <Badge 
          variant="outline" 
          className="absolute -top-1 -right-1 p-1 min-w-0 min-h-0 h-4 w-4 flex items-center justify-center bg-red-500 border-red-500"
        >
          <HeartPulse className="h-3 w-3 text-white" />
        </Badge>
      )}
      
      {/* Athlete name */}
      <span className="text-xs font-medium text-center truncate w-full">
        {name}
      </span>
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
        
        // Generate synthetic sleep data based on readiness
        // In a real app, this would come from the morning diary entries
        let sleepQuality: 'good' | 'average' | 'poor' | undefined;
        let sleepHours: number | undefined;
        
        if (readiness.readinessScore > 75) {
          sleepQuality = 'good';
          sleepHours = 7 + Math.random();
        } else if (readiness.readinessScore > 50) {
          sleepQuality = 'average';
          sleepHours = 5.5 + Math.random() * 1.5;
        } else {
          sleepQuality = 'poor';
          sleepHours = 4 + Math.random() * 1.5;
        }
        
        // Add 20% chance of no sleep data
        if (Math.random() > 0.8) {
          sleepQuality = undefined;
          sleepHours = undefined;
        }
        
        return {
          ...readiness,
          athleteId: athlete.id,
          initials,
          hasIssues,
          sleepQuality,
          sleepHours: sleepHours ? parseFloat(sleepHours.toFixed(1)) : undefined
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
          <div className="grid grid-cols-5 gap-1">
            {mergedAthleteData.map((athlete: any) => (
              <AthleteIcon
                key={athlete.athleteId}
                athleteId={athlete.athleteId}
                name={athlete.name}
                initials={athlete.initials}
                readinessScore={athlete.readinessScore}
                sleepQuality={athlete.sleepQuality}
                sleepHours={athlete.sleepHours}
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