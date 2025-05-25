import Gauge from "@/components/ui/gauge";
import { useKeyMetrics } from "@/hooks/use-key-metrics";
import { ArrowUp, ArrowDown, AlertTriangle, HeartPulse } from "lucide-react";
import { useLocation } from "wouter";

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

      {/* High Risk Card */}
      <button 
        className={`rounded-xl backdrop-blur p-3 md:p-4 shadow hover:ring-2 hover:ring-white/10 transition cursor-pointer ${
          keyMetrics.highRisk > 0 ? 'bg-red-600/20 hover:bg-red-600/30' : 'bg-white/5 hover:bg-white/10'
        }`}
        onClick={() => navigate('/coach/athlete-status')}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-xs uppercase text-white/60">High Risk</p>
        </div>
        <p className="text-2xl font-extrabold text-red-400 mb-1">
          {keyMetrics.highRisk}
        </p>
        <p className="text-xs text-white/50">Tap to view</p>
      </button>

      {/* Sick / Injured Card - Refined Rose Theme */}
      {(() => {
        const sickActive = keyMetrics.sickInjured > 0;
        const sickBg = sickActive ? "bg-[var(--danger-bg)]" : "bg-[var(--danger-bg-0)]";
        const sickText = sickActive ? "text-[var(--danger-text)]" : "text-green-300";
        const sickIconColor = sickActive ? "text-rose-300" : "text-green-300";
        const sickSubtitle = sickActive ? "Tap to view" : "All clear";
        
        return (
          <button 
            className={`rounded-xl ${sickBg} shadow-inner shadow-rose-900/40 backdrop-blur p-3 md:p-4 hover:ring-2 hover:ring-white/10 transition cursor-pointer hover:opacity-90`}
            onClick={() => navigate('/coach/athlete-status?filter=sick')}
          >
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className={`h-4 w-4 ${sickIconColor}`} />
              <p className="text-xs uppercase text-white/60">Sick / Injured</p>
            </div>
            <p className={`text-2xl font-extrabold ${sickText} mb-1`} aria-live="polite">
              {keyMetrics.sickInjured}
            </p>
            <p className="text-xs text-white/50">{sickSubtitle}</p>
          </button>
        );
      })()}
    </section>
  );
}