import { AlertTriangle, HeartPulse, Activity, Bell, CheckCircle } from "lucide-react";
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
  const { hasAlerts, isPendingData, message, alerts } = useAlerts();

  // Conditional styling based on alerts status
  const cardClass = clsx(
    "rounded-xl h-20 px-4 py-3 backdrop-blur shadow transition-colors cursor-pointer flex flex-col justify-center",
    hasAlerts ? "bg-zinc-800/90 hover:bg-zinc-700/90" : 
    isPendingData ? "bg-zinc-800/30" : "bg-green-900/20 hover:bg-green-900/30",
    className
  );
  
  const titleColor = hasAlerts ? "text-white" : isPendingData ? "text-zinc-400/60" : "text-green-400";
  const bellColor = hasAlerts ? "text-rose-400" : isPendingData ? "text-zinc-400/60" : "text-green-400";

  return (
    <button 
      className={cardClass}
      onClick={() => hasAlerts && navigate('/coach/athlete-status')}
    >
      <div className="flex items-center gap-2">
        {!hasAlerts && !isPendingData ? (
          <CheckCircle size={16} className={bellColor}/>
        ) : (
          <Bell size={16} className={bellColor}/>
        )}
        <span className={`text-sm font-medium ${titleColor}`}>Alerts</span>
      </div>

      <div className="text-[13px] mt-0.5">
        {isPendingData ? (
          <span className="text-zinc-400/70">{message}</span>
        ) : hasAlerts ? (
          <>
            <div className="flex items-center gap-1 text-left">
              {iconMap[alerts[0].type]}
              <span className="font-medium text-white">{alerts[0].name}</span>
              <span className="text-zinc-400">— {alerts[0].note}</span>
            </div>
            {alerts.length > 1 && (
              <div className="text-[11px] underline underline-offset-2 mt-0.5 self-start text-zinc-300">
                View details →
              </div>
            )}
          </>
        ) : (
          <span className="text-green-400">{message}</span>
        )}
      </div>
    </button>
  );
}