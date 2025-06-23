import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface ACWRStatus {
  acwr: number | null;
  status: string;
  color: string;
  zone: string;
  zones: {
    ok: string;
    caution: string;
    high_risk: string;
  };
  weeklyLoads: Array<{
    week: string;
    load: number;
  }>;
}

export function ACWRStatusCard({ athleteId }: { athleteId?: number }) {
  const { data: acwrStatus, isLoading } = useQuery<ACWRStatus>({
    queryKey: ["/api/analytics/acwr-status", athleteId],
    enabled: true
  });

  if (isLoading) {
    return (
      <div className="rounded-lg bg-zinc-800 text-white p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium">ACWR Status</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!acwrStatus || acwrStatus.acwr === null) {
    return (
      <div className="rounded-lg bg-zinc-800 text-white p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium">ACWR Status</h3>
        </div>
        <div className="text-center text-gray-500">
          <Minus className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Insufficient data</p>
          <p className="text-xs text-gray-400">Need 4+ weeks of training</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (zone: string) => {
    switch (zone) {
      case "undertraining":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "optimal":
        return "bg-green-100 text-green-800 border-green-200";
      case "caution":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "injury_risk":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (zone: string) => {
    switch (zone) {
      case "undertraining":
        return <TrendingDown className="h-4 w-4" />;
      case "optimal":
        return <TrendingUp className="h-4 w-4" />;
      case "caution":
      case "injury_risk":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div className="rounded-lg bg-zinc-800 text-white p-6">
      <div className="mb-6">
        <h3 className="text-sm font-medium">ACWR Status</h3>
      </div>
      <div className="space-y-4">
        {/* ACWR Value Display */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {acwrStatus.acwr.toFixed(2)}
          </div>
          <div className="text-xs text-zinc-300">Current ACWR</div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Based on last 7 days vs 28-day average
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={`${getStatusColor(acwrStatus.zone)} flex items-center gap-1 px-3 py-1`}
          >
            {getStatusIcon(acwrStatus.zone)}
            <span className="text-xs font-medium">{acwrStatus.zone.replace('_', ' ').toUpperCase()}</span>
          </Badge>
        </div>

        {/* Status Description */}
        <div className="text-center">
          <p className="text-sm text-zinc-300">{acwrStatus.status}</p>
        </div>

        {/* Zone Reference */}
        <div className="border-t border-zinc-700 pt-3">
          <div className="text-xs text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>Optimal:</span>
              <span className="font-medium">{acwrStatus.zones.ok}</span>
            </div>
            <div className="flex justify-between">
              <span>Caution:</span>
              <span className="font-medium">{acwrStatus.zones.caution}</span>
            </div>
            <div className="flex justify-between">
              <span>High Risk:</span>
              <span className="font-medium">{acwrStatus.zones.high_risk}</span>
            </div>
          </div>
        </div>

        {/* Recent Weekly Loads */}
        {acwrStatus.weeklyLoads && acwrStatus.weeklyLoads.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 mb-2">Recent Weekly Loads (AU)</div>
            <div className="space-y-1">
              {acwrStatus.weeklyLoads.slice(0, 4).map((week, index) => (
                <div key={week.week} className="flex justify-between text-xs">
                  <span className={index === 0 ? "font-medium" : ""}>
                    {week.week} {index === 0 ? "(current)" : ""}
                  </span>
                  <span className={index === 0 ? "font-medium" : ""}>{week.load.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}