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

    const fieldPercentage = (lastWeekData.reduce((sum, day) => sum + day.Field, 0) / totalLoad) * 100;
    const gymPercentage = (lastWeekData.reduce((sum, day) => sum + day.Gym, 0) / totalLoad) * 100;
    const matchPercentage = (lastWeekData.reduce((sum, day) => sum + day.Match, 0) / totalLoad) * 100;

    return [
      { name: 'Field', value: fieldPercentage, color: '#cbff00' },
      { name: 'Gym', value: gymPercentage, color: '#547aff' },
      { name: 'Match', value: matchPercentage, color: '#ff6f6f' }
    ].filter(item => item.value > 0);
  };

  const bodyMindData = calculateBodyMindData();

  // Get recent training sessions (last 5)
  const getRecentSessions = () => {
    return weeklyLoadData
      .filter(day => day.total > 0)
      .slice(-5)
      .map(day => ({
        date: format(parseISO(day.date), 'dd MMM'),
        types: [
          ...(day.Field > 0 ? [{ type: 'Field', load: day.Field }] : []),
          ...(day.Gym > 0 ? [{ type: 'Gym', load: day.Gym }] : []),
          ...(day.Match > 0 ? [{ type: 'Match', load: day.Match }] : [])
        ],
        total: day.total
      }));
  };

  const recentSessions = getRecentSessions();
  const maxSessionLoad = Math.max(...recentSessions.map(s => s.total), 1);

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
              <ComposedChart data={weeklyLoadData}>
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
                  hide
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
          </div>
          {/* ACWR Zone Caption */}
          <p className="mt-1 text-[11px] text-zinc-400 text-center">
            Green band = optimal ACWR&nbsp;(0.8 – 1.3).<br className="sm:hidden"/>
            Below 🟦 0.8 ⇒ under-training, above 🟥 1.3 ⇒ elevated injury risk.
          </p>
        </div>

        {/* 2. Status Card */}
        <div className="bg-zinc-800/90 rounded-lg p-6 mb-8">
          <h2 className="text-base font-semibold mb-4">Your Status</h2>
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${statusInfo.color}`}></div>
            <div>
              <div className="font-medium">
                {statusInfo.status} ({currentAcwr.toFixed(2)})
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                {statusInfo.message}
              </div>
            </div>
          </div>
          
          {/* Explanation */}
          <div className="mt-4 p-3 bg-zinc-700/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">How your status is calculated:</h3>
            <div className="text-xs text-zinc-400 space-y-1">
              <p>• <strong>ACWR</strong> = Your last 7 days training load ÷ Your 28-day average</p>
              <p>• <strong>Training Load</strong> = (Physical RPE + Emotional Load) ÷ 2 × Session Duration</p>
              <p>• <strong>Status zones:</strong> OK (≤1.2), Caution (1.2-1.3), High Risk (≥1.3)</p>
              <p>• Values below 0.8 suggest you can safely increase training intensity</p>
            </div>
          </div>
        </div>

        {/* 3. Body vs Mind Load Distribution */}
        {bodyMindData.length > 0 && (
          <div className="bg-zinc-800/90 rounded-lg p-6 mb-8">
            <h2 className="text-base font-semibold text-center mb-4">
              Training Type Distribution
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bodyMindData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bodyMindData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${Math.round(value as number)}%`, 'Contribution']}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-4 text-sm mt-2">
              {bodyMindData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-zinc-300">
                    {entry.name} ({Math.round(entry.value)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Recent Training Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-zinc-800/90 rounded-lg p-6 mb-8">
            <h2 className="text-base font-semibold mb-4">Recent Sessions</h2>
            <div className="space-y-3">
              {recentSessions.map((session, index) => (
                <div key={index} className="bg-zinc-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{session.date}</span>
                    <span className="text-zinc-400">{session.total} AU</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    {session.types.map((type, i) => (
                      <span key={i} className="text-zinc-300">
                        {type.type} {type.load}AU
                      </span>
                    ))}
                  </div>
                  {/* Relative load bar */}
                  <div className="mt-2 bg-zinc-600 rounded-full h-1">
                    <div 
                      className="bg-lime-400 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${(session.total / maxSessionLoad) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Weekly Scorecard Placeholder */}
        <div className="bg-zinc-800/90 rounded-lg p-6">
          <h2 className="text-base font-semibold mb-4">Weekly Scorecard</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Sleep avg</span>
              <span className="text-zinc-300">7.2h 👍</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Stress avg</span>
              <span className="text-zinc-300">2.1 ↑</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Motivation avg</span>
              <span className="text-zinc-300">3.8 ↓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}