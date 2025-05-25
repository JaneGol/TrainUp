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
    <div className={`bg-zinc-800/90 rounded-xl px-4 py-3 backdrop-blur shadow ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Bell size={14} className="text-rose-400"/>
        <h2 className="text-[14px] font-medium text-white">Alerts</h2>
      </div>

      {isLoading && (
        <p className="text-sm text-zinc-400">Loading alerts...</p>
      )}

      {!isLoading && alerts.length === 0 && (
        <p className="text-sm text-green-400 mb-2">No alerts today 🎉</p>
      )}

      {!isLoading && alerts.length > 0 && (
        <ul className="space-y-0.5 mb-2">
          {alerts.map((alert) => (
            <li key={`${alert.athleteId}-${alert.type}`} className="flex items-center gap-2 text-sm">
              {iconMap[alert.type]}
              <span className="font-medium text-white">{alert.name}</span>
              <span className="text-zinc-400">— {alert.note}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => navigate('/coach/athlete-status')}
        className="mt-2 text-[13px] underline underline-offset-2 text-zinc-300 hover:text-white transition-colors"
      >
        View details →
      </button>
    </div>
  );
}