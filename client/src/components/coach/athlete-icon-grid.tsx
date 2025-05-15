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
  // Helper function to determine heart color based on symptoms
  // Check if athlete has symptoms and return appropriate heart style
  const hasSymptoms = hasIssues;
  
  // Helper function to determine heart color based on symptoms
  const getHeartStyles = () => {
    // Return heart color based on presence of symptoms
    if (hasSymptoms) {
      // At least one symptom - bright red outline
      return {
        heart: 'text-red-500' // rgb(239, 68, 68)
      };
    } else {
      // No symptoms - transparent/colorless outline
      return {
        heart: 'text-transparent stroke-zinc-400'
      };
    }
  };
  
  // Helper function to simulate both sleep quality and quantity as a percentage for donut chart
  const getSleepQualityInfo = () => {
    // Base sleep percentage from quality
    let basePercentage = sleepQuality === 'good' 
      ? 90 
      : sleepQuality === 'average' 
        ? 65 
        : 40;
    
    // Add some slight variation
    const variation = Math.random() * 10 - 5; // +/- 5%
    const percentage = Math.min(100, Math.max(5, basePercentage + variation));
    
    return {
      percentage,
      color: sleepQuality === 'good' 
        ? '#CBFF00' // Bright yellow-green from app design
        : sleepQuality === 'average' 
          ? 'rgba(203, 255, 0, 0.7)' // Same bright yellow with reduced opacity
          : 'rgba(203, 255, 0, 0.5)' // Same bright yellow with even more reduced opacity
    };
  };
  
  // Get readiness level (1-3) based on readiness score
  const getReadinessLevel = (): number => {
    if (readinessScore >= 75) {
      return 3; // Fully ready - 3 segments filled
    } else if (readinessScore >= 50) {
      return 2; // Moderately ready - 2 segments filled
    } else {
      return 1; // Low readiness - 1 segment filled
    }
  };
  
  const readinessLevel = getReadinessLevel();
  
  const sleepInfo = getSleepQualityInfo();
  
  // Calculate the circumference and the dash offset for the donut chart
  const radius = 18; // Slightly smaller than half the width
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - sleepInfo.percentage / 100);
  
  return (
    <div 
      className="p-1 cursor-pointer transition-all hover:bg-zinc-800 rounded-lg flex flex-col items-center"
      onClick={onClick}
    >
      {/* Athlete icon with indicators */}
      <div className="relative w-20 h-20 mb-1">
        {/* Outer circle - Sleep quality as donut chart */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
            {/* Dark gray base ring */}
            <circle 
              cx="32" 
              cy="32" 
              r={radius * 1.35} 
              fill="transparent" 
              stroke="#333" 
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Colored progress ring */}
            <circle 
              cx="32" 
              cy="32" 
              r={radius * 1.35} 
              fill="transparent" 
              stroke={sleepInfo.color} 
              strokeWidth="4"
              strokeDasharray={circumference * 1.35}
              strokeDashoffset={dashoffset * 1.35}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
        </div>
        
        {/* Readiness indicator - Battery with segments */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="relative w-10 h-5 flex items-center">
            {/* Battery outline */}
            <div className="flex items-center">
              {/* Battery body */}
              <div className="w-8 h-4 border border-zinc-500 rounded-sm bg-zinc-800 flex overflow-hidden p-0.5">
                {/* Battery segments */}
                <div className="h-full flex gap-0.5">
                  {/* Segment 1 - always filled if readiness >= 1 */}
                  <div className={`w-2 h-full rounded-sm ${readinessLevel >= 1 ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
                  
                  {/* Segment 2 - filled if readiness >= 2 */}
                  <div className={`w-2 h-full rounded-sm ${readinessLevel >= 2 ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
                  
                  {/* Segment 3 - filled if readiness = 3 */}
                  <div className={`w-2 h-full rounded-sm ${readinessLevel >= 3 ? 'bg-zinc-400' : 'bg-zinc-700'}`}></div>
                </div>
              </div>
              
              {/* Battery tip */}
              <div className="w-1 h-2 bg-zinc-500 rounded-r-sm"></div>
            </div>
          </div>
        </div>
        
        {/* Recovery status - Top right corner with light gray background and red/transparent heart based on symptoms */}
        <div 
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-zinc-800/40 flex items-center justify-center z-20 shadow-md"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={getHeartStyles().heart}
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        
        {/* Health issue indicator - Bottom left */}
        {hasIssues && (
          <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center z-20 shadow-md">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
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
      <div className="text-[10px] font-medium text-center truncate w-full mt-0.5">
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
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1">
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