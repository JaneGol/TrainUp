import Gauge from "@/components/ui/gauge";
import { useKeyMetrics } from "@/hooks/use-key-metrics";
import { ArrowUp, ArrowDown, Brain } from "lucide-react";
import { useLocation } from "wouter";
import AlertsCard from "@/components/coach/alerts-card";



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
            <Gauge value={keyMetrics.isPendingData ? 0 : keyMetrics.avgRecovery} max={5} size={48} />
            <div>
              <p className="text-xs uppercase text-white/60 mb-1">Recovery</p>
              <p className="text-lg font-bold">
                {keyMetrics.isPendingData ? (
                  <span className="text-[13px] text-zinc-400/70 font-normal">Awaiting data</span>
                ) : (
                  <>
                    {keyMetrics.avgRecovery.toFixed(1)}
                    <span className="text-xs text-white/60">/5</span>
                  </>
                )}
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
            <Gauge value={keyMetrics.isPendingData ? 0 : keyMetrics.avgReadiness} max={100} size={48} />
            <div>
              <p className="text-xs uppercase text-white/60 mb-1">Readiness</p>
              <p className="text-lg font-bold">
                {keyMetrics.isPendingData ? (
                  <span className="text-[13px] text-zinc-400/70 font-normal">Awaiting data</span>
                ) : (
                  `${keyMetrics.avgReadiness.toFixed(0)}%`
                )}
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* ▼ Alerts + Smart row ------------------------------------------------ */}        
      <section className="flex gap-4 mt-4 mb-8">
        <AlertsCard className="flex-[3] min-w-0" />
        <button 
          className="flex-[2] min-w-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur h-20 px-4 flex items-center gap-2 shadow hover:ring-2 hover:ring-primary/30 transition cursor-pointer hover:from-primary/30 hover:to-primary/20"
          onClick={() => navigate('/coach/training-recommendations')}
        >
          <Brain size={16} className="text-primary" />
          <span className="text-sm font-medium text-primary">Assistant&nbsp;Coach</span>
        </button>
      </section>
      {/* ▲-------------------------------------------------------------------- */}
    </>
  );
}