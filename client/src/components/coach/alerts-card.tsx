import { AlertTriangle, HeartPulse, Activity, Bell } from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";
import { useLocation } from "wouter";

const iconMap = {
  injury: <Activity size={16} className="text-rose-400" />,
  sick: <HeartPulse size={16} className="text-rose-400" />,
  acwr: <AlertTriangle size={16} className="text-yellow-400" />,
};

interface AlertsCardProps {
  className?: string;
}

export default function AlertsCard({ className = "" }: AlertsCardProps) {
  const [, navigate] = useLocation();
  const { data: alerts = [], isLoading } = useAlerts();

  return (
    <button 
      className={`bg-zinc-800/90 rounded-xl h-20 px-4 py-3 backdrop-blur shadow hover:bg-zinc-700/90 transition-colors cursor-pointer flex flex-col justify-center ${className}`}
      onClick={() => navigate('/coach/athlete-status')}
    >
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-rose-400"/>
        <span className="text-sm font-medium text-white">Alerts</span>
      </div>

      {!isLoading && alerts.length > 0 && (
        <div className="flex items-center gap-1 text-[13px] mt-0.5 text-left">
          {iconMap[alerts[0].type]}
          <span className="font-medium text-white">{alerts[0].name}</span>
          <span className="text-zinc-400">— {alerts[0].note}</span>
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="text-[13px] mt-0.5 text-green-400">No alerts today 🎉</div>
      )}

      {!isLoading && alerts.length > 1 && (
        <div className="text-[11px] underline underline-offset-2 mt-0.5 self-start text-zinc-300">
          View details →
        </div>
      )}
    </button>
  );
}