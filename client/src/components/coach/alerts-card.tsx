import { AlertTriangle, HeartPulse, Activity } from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";
import { useLocation } from "wouter";

const iconMap = {
  injury: <Activity size={16} className="text-rose-400" />,
  sick: <HeartPulse size={16} className="text-rose-400" />,
  acwr: <AlertTriangle size={16} className="text-yellow-400" />,
};

export default function AlertsCard() {
  const [, navigate] = useLocation();
  const { data: alerts = [], isLoading } = useAlerts();

  return (
    <div className="bg-zinc-800/90 rounded-xl p-4 backdrop-blur shadow">
      <h2 className="text-lg font-semibold mb-3 text-white">Alerts at a Glance</h2>

      {isLoading && (
        <p className="text-sm text-zinc-400">Loading alerts...</p>
      )}

      {!isLoading && alerts.length === 0 && (
        <p className="text-sm text-green-400 mb-3">No alerts today 🎉</p>
      )}

      {!isLoading && alerts.length > 0 && (
        <ul className="space-y-2 mb-4">
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
        className="w-full rounded-lg bg-zinc-700/60 py-2 text-sm text-white hover:bg-zinc-700/80 transition-colors"
      >
        View Details
      </button>
    </div>
  );
}