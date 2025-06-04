import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Line, ComposedChart,
  PieChart, Pie, Cell, ReferenceArea, ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";

interface WeeklyLoadData {
  date: string;
  Field: number;
  Gym: number;
  Match: number;
  total: number;
  acwr: number;
}

export default function FitnessProgressRedesigned() {
  const [, navigate] = useLocation();

  // Get 14-day weekly load data
  const { data: weeklyLoadData = [], isLoading: loadLoading } = useQuery<WeeklyLoadData[]>({
    queryKey: ["/api/athlete/weekly-load"],
  });

  // Get current fitness progress for ACWR calculation
  const { data: fitnessData, isLoading: fitnessLoading } = useQuery({
    queryKey: ["/api/athlete/fitness-progress"],
  });

  // Get latest morning diary for current metrics
  const { data: latestDiary } = useQuery({
    queryKey: ["/api/morning-diary/latest"],
  });

  // Calculate current ACWR and status
  const currentAcwr = fitnessData?.summary?.acwr || 1.0;
  const getStatusInfo = (acwr: number) => {
    if (acwr <= 1.2) return { status: "OK", color: "bg-lime-500", message: "Training load is well balanced." };
    if (acwr <= 1.29) return { status: "Caution", color: "bg-yellow-500", message: "Monitor your recovery closely." };
    return { status: "High Risk", color: "bg-red-500", message: "Reduce intensity for two days." };
  };

  const statusInfo = getStatusInfo(currentAcwr);

  // Calculate physical vs emotional load for current week
  const calculateBodyMindData = () => {
    const lastWeekData = weeklyLoadData.slice(-7);
    const totalLoad = lastWeekData.reduce((sum, day) => sum + day.total, 0);
    
    if (totalLoad === 0) return [];

    // Simplified calculation for demo
    const physicalLoad = Math.round(totalLoad * 0.6);
    const emotionalLoad = Math.round(totalLoad * 0.4);
    
    return [
      { name: "Physical", value: physicalLoad, fill: "#cbff00" },
      { name: "Emotional", value: emotionalLoad, fill: "#547aff" }
    ];
  };

  const bodyMindData = calculateBodyMindData();

  // Calculate training distribution for current week
  const calculateTrainingDistribution = () => {
    const lastWeekData = weeklyLoadData.slice(-7);
    const fieldTotal = lastWeekData.reduce((sum, day) => sum + day.Field, 0);
    const gymTotal = lastWeekData.reduce((sum, day) => sum + day.Gym, 0);
    const matchTotal = lastWeekData.reduce((sum, day) => sum + day.Match, 0);
    
    const total = fieldTotal + gymTotal + matchTotal;
    if (total === 0) return [];

    return [
      { name: "Field", value: Math.round((fieldTotal / total) * 100), fill: "#cbff00" },
      { name: "Gym", value: Math.round((gymTotal / total) * 100), fill: "#547aff" },
      { name: "Match", value: Math.round((matchTotal / total) * 100), fill: "#ff6f6f" }
    ].filter(item => item.value > 0);
  };

  const trainingDistribution = calculateTrainingDistribution();

  // Loading state
  if (loadLoading || fitnessLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading fitness progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/athlete")}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Fitness Progress</h1>
        </div>

        {/* 1. Weekly Training Load Chart */}
        <div className="bg-zinc-800/90 rounded-lg p-6 mb-8">
          <h2 className="text-base font-semibold text-center mb-4">
            Weekly Training Load (Last 14 Days)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyLoadData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => format(parseISO(value), 'dd.MM')}
                />
                <YAxis 
                  yAxisId="load"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="acwr"
                  orientation="right"
                  domain={[0, 2]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickCount={5}
                />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      `${value} ${name === 'acwr' ? '' : 'AU'}`,
                      name === 'acwr' ? 'ACWR' : name
                    ]}
                  />
                  <Bar yAxisId="load" dataKey="Field" stackId="load" fill="#cbff00" />
                  <Bar yAxisId="load" dataKey="Gym" stackId="load" fill="#547aff" />
                  <Bar yAxisId="load" dataKey="Match" stackId="load" fill="#ff6f6f" />
                  <Line 
                    yAxisId="acwr"
                    type="monotone" 
                    dataKey="acwr" 
                    stroke="#ff8c00" 
                    strokeWidth={3}
                    dot={{ fill: '#ff8c00', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  <ReferenceArea
                    yAxisId="acwr"
                    y1={0.8}
                    y2={1.3}
                    stroke="none"
                    fill="#22c55e"
                    fillOpacity={0.08}
                  />
                  <ReferenceLine
                    yAxisId="acwr"
                    y={0.8}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeOpacity={0.7}
                    strokeDasharray="2 2"
                  />
                  <ReferenceLine
                    yAxisId="acwr"
                    y={1.3}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeOpacity={0.7}
                    strokeDasharray="2 2"
                  />
                </ComposedChart>
              </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center mt-2 gap-4 text-xs">
            <span className="text-lime-400">▇ Field</span>
            <span className="text-blue-400">▇ Gym</span>
            <span className="text-red-400">▇ Match</span>
            <span className="text-orange-400">— ACWR</span>
          </div>
          {/* ACWR Zone Caption */}
          <p className="mt-1 text-[11px] text-zinc-400 text-center">
            Green band = optimal ACWR&nbsp;(0.8 – 1.3).<br className="sm:hidden"/>
            Below 🟦 0.8 ⇒ under-training, above 🟥 1.3 ⇒ elevated injury risk.
          </p>
        </div>

        {/* 2. Combined Status Card */}
        <div className="bg-zinc-800/90 rounded-lg p-6 mb-8">
          <h2 className="text-base font-semibold mb-4">Your Status</h2>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-4 h-4 rounded-full ${statusInfo.color}`}></div>
            <div>
              <div className="text-lg font-semibold">{statusInfo.status}</div>
              <div className="text-sm text-zinc-400">{statusInfo.message}</div>
            </div>
          </div>

          {/* ACWR Display */}
          {fitnessData?.summary && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-zinc-700/50 rounded-lg">
                <div className="text-sm text-zinc-400 mb-2">ACWR (Acute:Chronic Workload Ratio)</div>
                <div className={`text-4xl font-bold ${
                  currentAcwr <= 1.2 ? 'text-lime-400' : 
                  currentAcwr <= 1.3 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {currentAcwr.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-zinc-300">
                <div>
                  • <strong>Formula:</strong> 7-day training load ÷ 28-day average load
                </div>
                <div>
                  • <strong>Training Load:</strong> (Physical RPE + Emotional Load) ÷ 2 × Duration (minutes)
                </div>
                <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-zinc-700 text-sm">
                  <span><span className="text-zinc-400">OK Zone:</span> <span className="font-semibold text-lime-400">≤ 1.2</span></span>
                  <span><span className="text-zinc-400">Caution Zone:</span> <span className="font-semibold text-yellow-400">1.2 - 1.3</span></span>
                  <span><span className="text-zinc-400">High Risk:</span> <span className="font-semibold text-red-400">≥ 1.3</span></span>
                </div>
                <div className="text-xs text-zinc-400 mt-3">
                  💡 Values below 0.8 indicate you can safely increase training intensity
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Training Distribution */}
        {trainingDistribution.length > 0 && (
          <div className="bg-zinc-800/90 rounded-lg p-6 mb-8">
            <h2 className="text-base font-semibold mb-4">Training Distribution (This Week)</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trainingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {trainingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <span className="text-lime-400">▇ Field Training</span>
              <span className="text-blue-400">▇ Gym Training</span>
              <span className="text-red-400">▇ Match</span>
            </div>
          </div>
        )}

        {/* 5. Weekly Scorecard */}
        <div className="bg-zinc-800/90 rounded-lg p-6">
          <h2 className="text-base font-semibold mb-4">Weekly Scorecard</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Sleep hours</span>
              <span className="text-zinc-300">
                {latestDiary?.sleepHours ? `${latestDiary.sleepHours}h` : 'No data'} 
                {latestDiary?.sleepQuality === 'good' ? ' 😴' : latestDiary?.sleepQuality === 'poor' ? ' 😵' : ' 🙂'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Recovery level</span>
              <span className="text-zinc-300">
                {latestDiary?.recoveryLevel === 'good' ? 'Good ✅' : 
                 latestDiary?.recoveryLevel === 'moderate' ? 'Moderate ⚠️' : 
                 latestDiary?.recoveryLevel === 'poor' ? 'Poor ❌' : 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Motivation</span>
              <span className="text-zinc-300">
                {latestDiary?.motivationLevel === 'high' ? 'High 🔥' : 
                 latestDiary?.motivationLevel === 'moderate' ? 'Moderate 💪' : 
                 latestDiary?.motivationLevel === 'low' ? 'Low 😐' : 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Training load (7d)</span>
              <span className="text-zinc-300">
                {fitnessData?.summary?.acuteLoad ? `${Math.round(fitnessData.summary.acuteLoad)} AU` : 'Calculating...'}
              </span>
            </div>
            {fitnessData?.summary?.acuteLoad && (
              <div className="text-xs text-zinc-500 mt-1 pl-0">
                {Math.round(fitnessData.summary.acuteLoad) < 50 ? 
                  '📊 Light week - good for recovery' :
                  Math.round(fitnessData.summary.acuteLoad) < 80 ? 
                  '📊 Moderate load - balanced training' :
                  '📊 High intensity week - monitor recovery closely'
                }
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-400">Readiness score</span>
              <span className="text-zinc-300">
                {latestDiary?.readinessScore ? `${latestDiary.readinessScore}/100` : 'No data'}
                {latestDiary?.readinessScore >= 80 ? ' 🟢' : 
                 latestDiary?.readinessScore >= 60 ? ' 🟡' : ' 🔴'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}