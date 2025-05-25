import Gauge from "@/components/ui/gauge";
import { useKeyMetrics } from "@/hooks/use-key-metrics";
import { ArrowUp, ArrowDown, AlertTriangle, HeartPulse, Brain } from "lucide-react";
import { useLocation } from "wouter";

// Utility for unified danger card styling
const dangerClasses = (count: number) => ({
  bg: count > 0 
    ? "bg-rose-900/35" 
    : "bg-zinc-700",
  icon: count > 0 
    ? "text-rose-400" 
    : "text-zinc-400",
  num: count > 0 
    ? "text-rose-400" 
    : "text-zinc-300",
  subtitle: count > 0 ? "Tap to view" : "All clear"
});

export default function MainMetrics() {
  const [, navigate] = useLocation();
  const keyMetrics = useKeyMetrics();

  if (keyMetrics.isLoading) {
    return (
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl bg-white/5 backdrop-blur p-3 md:p-4 shadow">
            <div className="animate-pulse">
              <div className="h-12 bg-zinc-700 rounded"></div>
            </div>
          </div>
        ))}
      </section>
    );
  }

  const trend = (delta: number) => delta === 0 ? null :
    delta > 0 ? <ArrowUp size={12} className="inline text-green-400 ml-1" /> :
    <ArrowDown size={12} className="inline text-red-400 ml-1" />;

  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Recovery Card */}
        <button 
          className="rounded-xl bg-white/5 backdrop-blur p-3 md:p-4 shadow hover:ring-2 hover:ring-white/10 transition cursor-pointer hover:bg-white/10"
          onClick={() => navigate('/coach/athlete-status')}
        >
          <div className="flex items-center gap-3">
            <Gauge value={keyMetrics.avgRecovery} max={5} size={48} />
            <div>
              <p className="text-xs uppercase text-white/60 mb-1">Recovery</p>
              <p className="text-lg font-bold">
                {keyMetrics.avgRecovery.toFixed(1)}
                <span className="text-xs text-white/60">/5</span>
              </p>
            </div>
          </div>
        </button>

        {/* Readiness Card */}
        <button 
          className="rounded-xl bg-white/5 backdrop-blur p-3 md:p-4 shadow hover:ring-2 hover:ring-white/10 transition cursor-pointer hover:bg-white/10"
          onClick={() => navigate('/coach/athlete-status')}
        >
          <div className="flex items-center gap-3">
            <Gauge value={keyMetrics.avgReadiness} max={100} size={48} />
            <div>
              <p className="text-xs uppercase text-white/60 mb-1">Readiness</p>
              <p className="text-lg font-bold">
                {keyMetrics.avgReadiness.toFixed(0)}%
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* One-row metric bar: 2 squares + 1 flexible card */}
      <section className="w-full flex gap-4 pt-2 mb-6">
        {/* High Risk Card (square) */}
        <button 
          className={`flex-none aspect-square w-28 md:w-32 rounded-xl backdrop-blur shadow hover:ring-2 hover:ring-white/10 transition cursor-pointer flex flex-col items-center justify-center ${dangerClasses(keyMetrics.highRisk).bg}`}
          onClick={() => navigate('/coach/athlete-status')}
        >
          <AlertTriangle size={16} className={dangerClasses(keyMetrics.highRisk).icon} />
          <p className="text-[10px] uppercase text-zinc-200 mt-0.5">
            High&nbsp;Risk
          </p>
          <p className={`text-xl font-medium ${dangerClasses(keyMetrics.highRisk).num} my-0.5`}>
            {keyMetrics.highRisk}
          </p>
          <p className="text-[10px] text-zinc-400">{dangerClasses(keyMetrics.highRisk).subtitle}</p>
        </button>

        {/* Sick / Injured Card (square) */}
        <button 
          className={`flex-none aspect-square w-28 md:w-32 rounded-xl backdrop-blur shadow hover:ring-2 hover:ring-white/10 transition cursor-pointer flex flex-col items-center justify-center ${dangerClasses(keyMetrics.sickInjured).bg}`}
          onClick={() => navigate('/coach/athlete-status?filter=sick')}
        >
          <HeartPulse size={16} className={dangerClasses(keyMetrics.sickInjured).icon} />
          <p className="text-[10px] uppercase text-zinc-200 mt-0.5">
            Sick&nbsp;/&nbsp;Injured
          </p>
          <p className={`text-xl font-medium ${dangerClasses(keyMetrics.sickInjured).num} my-0.5`}>
            {keyMetrics.sickInjured}
          </p>
          <p className="text-[10px] text-zinc-400">{dangerClasses(keyMetrics.sickInjured).subtitle}</p>
        </button>

        {/* AI Recommendations Card (flexible) */}
        <button 
          className="flex-1 min-w-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur p-3 md:p-4 shadow hover:ring-2 hover:ring-primary/30 transition cursor-pointer hover:from-primary/30 hover:to-primary/20"
          onClick={() => navigate('/coach/training-recommendations')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase text-white/60">AI Recommendations</p>
          </div>
          <p className="text-2xl font-extrabold text-primary mb-1">
            Smart
          </p>
          <p className="text-xs text-white/50">Get training guidance</p>
        </button>
      </section>
    </>
  );
}