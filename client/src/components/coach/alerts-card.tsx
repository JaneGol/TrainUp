import { AlertTriangle, HeartPulse, Activity, Bell } from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";
import { useLocation } from "wouter";
import clsx from "clsx";

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

  // Conditional styling based on alerts availability
  const hasNoAlerts = alerts.length === 0 && !isLoading;
  const cardClass = clsx(
    "rounded-xl h-20 px-4 py-3 backdrop-blur shadow transition-colors cursor-pointer flex flex-col justify-center",
    hasNoAlerts ? "bg-zinc-800/30" : "bg-zinc-800/90 hover:bg-zinc-700/90",
    className
  );
  const titleColor = hasNoAlerts ? "text-zinc-400/60" : "text-white";
  const bellColor = hasNoAlerts ? "text-zinc-400/60" : "text-rose-400";

  return (
    <button 
      className={cardClass}
      onClick={() => !hasNoAlerts && navigate('/coach/athlete-status')}
    >
      <div className="flex items-center gap-2">
        <Bell size={16} className={bellColor}/>
        <span className={`text-sm font-medium ${titleColor}`}>Alerts</span>
      </div>

      {hasNoAlerts ? (
        <div className="text-[13px] mt-0.5 text-zinc-400/70">Awaiting today's diaries…</div>
      ) : (
        <>
          {alerts.length > 0 && (
            <div className="flex items-center gap-1 text-[13px] mt-0.5 text-left">
              {iconMap[alerts[0].type]}
              <span className="font-medium text-white">{alerts[0].name}</span>
              <span className="text-zinc-400">— {alerts[0].note}</span>
            </div>
          )}

          {alerts.length > 1 && (
            <div className="text-[11px] underline underline-offset-2 mt-0.5 self-start text-zinc-300">
              View details →
            </div>
          )}
        </>
      )}
    </button>
  );
}