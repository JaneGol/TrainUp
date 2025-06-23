import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2,
  FileText,
  CheckCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TrainingEntry {
  id: number;
  trainingType: string;
  date: string;
  effortLevel: number;
  mood: string;
  notes?: string;
  coachReviewed: boolean;
  createdAt: string;
}

interface RecentEntriesProps {
  entries: TrainingEntry[];
  isLoading: boolean;
}

export default function RecentEntries({ entries, isLoading }: RecentEntriesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // Helper function to format date
  const formatEntryDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };
  
  // Helper function to get badge color based on effort level
  const getEffortBadgeClass = (level: number) => {
    if (level <= 4) return "bg-green-100 text-green-800";
    if (level <= 7) return "bg-primary-light text-primary";
    return "bg-secondary-light text-secondary";
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <CardTitle>Recent Entries</CardTitle>
        <Button variant="link" size="sm" className="text-primary">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{entry.trainingType}</h4>
                    <p className="text-sm text-gray-500">{formatEntryDate(entry.date)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getEffortBadgeClass(entry.effortLevel)}`}>
                    {entry.effortLevel}/10
                  </span>
                </div>
                {entry.notes && (
                  <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center text-xs text-gray-500">
                    <span className="flex items-center mr-3">
                      <span className="flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full mr-1">
                        {entry.mood === "great" && "😃"}
                        {entry.mood === "good" && "🙂"}
                        {entry.mood === "tired" && "😴"}
                        {entry.mood === "stressed" && "😓"}
                      </span>
                      {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                    </span>
                  </span>
                  {entry.coachReviewed ? (
                    <span className="text-xs text-accent flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Coach reviewed
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center">
                      <Loader2 className="h-3 w-3 mr-1" />
                      Pending review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No training entries yet</p>
            <p className="text-xs text-gray-400 mt-1">Start by adding a training session</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
