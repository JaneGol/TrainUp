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
      className={`bg-zinc-800/90 rounded-xl h-14 px-4 flex items-center gap-2 backdrop-blur shadow hover:bg-zinc-700/90 transition-colors cursor-pointer ${className}`}
      onClick={() => navigate('/coach/athlete-status')}
    >
      <Bell size={16} className="text-rose-400"/>
      <span className="text-sm font-medium text-white">Alerts</span>
    </button>
  );
}