import { ChevronRight, Users } from "lucide-react";
import { format } from "date-fns";

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
}

interface TrainingRowProps {
  session: TrainingSession;
  onOpen: (session: TrainingSession) => void;
}

export default function TrainingRow({ session, onOpen }: TrainingRowProps) {
  const formatSessionName = (type: string, sessionNumber?: number) => {
    if (sessionNumber && sessionNumber > 1) {
      return `${type} (Session ${sessionNumber})`;
    }
    return type;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM");
  };

  return (
    <div
      className="flex justify-between items-center px-4 py-3 bg-zinc-800 rounded-lg mb-2 cursor-pointer hover:bg-zinc-700 transition-colors"
      onClick={() => onOpen(session)}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {formatDate(session.date)} — {formatSessionName(session.trainingType, session.sessionNumber)}
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {session.participantCount}/{session.totalAthletes}
          </span>
          <span>RPE {session.rpe === null || session.rpe === undefined ? '—' : Number(session.rpe).toFixed(1)}</span>
          <span>Load {session.load} AU</span>
        </div>
      </div>
    </div>
  );
}