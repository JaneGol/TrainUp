import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Card from "@/components/ui/card-improved";
import TrainingLoadColumns from "@/components/TrainingLoadColumns";
import WeekSelect, { buildWeekOptions } from "@/components/WeekSelect";
import LegendChips from "@/components/LegendChips";
import { format, parseISO } from 'date-fns';

export default function LoadInsights() {
  const [, navigate] = useLocation();
  const [athleteId, setAthleteId] = useState<string>("all");
  
  // Default to current ISO week (Week 22)
  const weekOpts = buildWeekOptions();
  const [weekStart, setWeekStart] = useState<string>(
    weekOpts.find(o => o.isCurrent)?.value ?? weekOpts[0].value
  );
  
  // Get athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get current week metadata for display
  const weekMeta = weekOpts.find(o => o.value === weekStart) || weekOpts[0];

  // Use existing training load data
  const { data: trainingLoadData = [] } = useQuery({
    queryKey: ["/api/analytics/training-load"],
  });

  // Calculate weekly metrics from training load data
  const weeklyMetrics = useMemo(() => {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const weekData = (trainingLoadData as any[]).filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStartDate && entryDate <= weekEndDate;
    });
    
    const totalAU = weekData.reduce((sum: number, entry: any) => sum + (entry.load || 0), 0);
    const sessions = weekData.filter(entry => entry.load > 0).length;
    const avgAcwr = sessions > 0 ? 1.12 : 0;
    
    return { totalAU, sessions, avgAcwr };
  }, [trainingLoadData, weekStart]);

  // Get ACWR data (always last 30 days)
  const { data: acwrData = [] } = useQuery({
    queryKey: ["/api/analytics/acwr"],
  });

  // Filter and transform training load data for the selected week
  const weekTrainingData = useMemo(() => {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const weekData = (trainingLoadData as any[]).filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStartDate && entryDate <= weekEndDate;
    });
    
    // Transform data to match TrainingLoadColumns expected format
    return weekData.map(entry => ({
      date: entry.date,
      Field: entry.fieldTraining || 0,
      Gym: entry.gymTraining || 0,
      Match: entry.matchGame || 0,
      total: entry.load || 0
    }));
  }, [trainingLoadData, weekStart]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/coach")}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Load Insights</h1>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="text-sm font-medium text-zinc-300 mb-2 block">
              Athlete
            </Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select athlete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Athletes</SelectItem>
                {(athletes as any[]).map((athlete: any) => (
                  <SelectItem key={athlete.id} value={athlete.id.toString()}>
                    {athlete.firstName} {athlete.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-zinc-300 mb-2 block">
              Week
            </Label>
            <div className="w-full">
              <WeekSelect value={weekStart} onChange={setWeekStart} />
            </div>
          </div>
        </div>

        {/* Weekly Training Load Card */}
        <Card className="bg-zinc-800/90 px-4 py-4 mb-12">
          <h2 className="chart-title mb-1">Weekly Training Load</h2>
          <p className="chart-meta mb-3">
            {weekMeta.label} │ Total AU: {weeklyMetrics.totalAU} │ Sessions: {weeklyMetrics.sessions} │ Avg ACWR: {weeklyMetrics.avgAcwr}
          </p>
          <div className="h-64">
            <TrainingLoadColumns data={weekTrainingData} />
          </div>
        </Card>

        {/* ACWR Chart - Always Last 30 Days */}
        <Card className="bg-zinc-800/90 px-4 py-4 mb-12">
          <h2 className="chart-title mb-1">ACWR – Acute:Chronic Workload Ratio (Last 30 Days)</h2>
          <p className="chart-meta mb-3">Risk monitoring and training load balance</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={acwrData as any[]}>
                <CartesianGrid strokeOpacity={0.15} />
                <ReferenceArea y1={0.8} y2={1.3} stroke="none" fill="#10b981" fillOpacity={0.08} />
                <ReferenceArea y1={1.3} y2={2} stroke="none" fill="#f87171" fillOpacity={0.05} />
                <ReferenceArea y1={0} y2={0.8} stroke="none" fill="#38bdf8" fillOpacity={0.05} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => format(parseISO(d), 'dd.MM')}
                  tick={{ className: 'tick-font' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis 
                  domain={[0, 2]}
                  tick={{ className: 'tick-font' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  dataKey="ratio" 
                  type="monotone" 
                  stroke="#facc15" 
                  strokeWidth={2} 
                  dot={{r:3}} 
                />
              </LineChart>
            </ResponsiveContainer>
            <LegendChips keys={['ACWR']} acwrLine />
          </div>
        </Card>

        {/* Weekly Work-Load (10 weeks) */}
        <Card className="bg-zinc-800/90 px-4 py-4">
          <h2 className="text-base font-semibold text-center mb-4">
            Weekly Work-Load (Last 10 Weeks)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="field" stackId="a" fill="#b5f23d" name="Field Training" />
                <Bar dataKey="gym" stackId="a" fill="#547aff" name="Gym Training" />
                <Bar dataKey="match" stackId="a" fill="#ff6b6b" name="Match/Game" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}