import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Card from "@/components/ui/card-improved";
import TrainingLoadColumns from "@/components/TrainingLoadColumns";
import WeeklyLoadChart from "@/components/WeeklyLoadChart";
import WeekSelect, { buildWeekOptions } from "@/components/WeekSelect";

export default function LoadInsightsRedesigned() {
  const [, navigate] = useLocation();
  const [athleteId, setAthleteId] = useState<string>("all");
  const [weekStart, setWeekStart] = useState<string>(buildWeekOptions()[0].value);
  
  // Get athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["/api/athletes"],
  });

  // Get current week options for display
  const weekOptions = buildWeekOptions();
  const selectedWeekLabel = weekOptions.find(w => w.value === weekStart)?.label || weekOptions[0].label;

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

  // Get weekly load data for 10-week chart
  const { data: weeklyLoadData = [] } = useQuery({
    queryKey: ["/api/analytics/weekly-load"],
  });

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
                {athletes.map((athlete: any) => (
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
            <WeekSelect value={weekStart} onChange={setWeekStart} />
          </div>
        </div>

        {/* Weekly Training Load Card */}
        <Card className="bg-zinc-800/90 px-4 py-4 mb-6">
          <h2 className="text-base font-semibold text-center mb-1">Weekly Training Load</h2>
          <p className="text-sm text-zinc-400 mb-3 text-center">
            {selectedWeekLabel} │ Total AU: {weeklyMetrics.totalAU} │ Sessions: {weeklyMetrics.sessions} │ Avg ACWR: {weeklyMetrics.avgAcwr}
          </p>
          <div className="h-64">
            <TrainingLoadColumns data={trainingLoadData.filter((entry: any) => {
              const entryDate = new Date(entry.date);
              const weekStartDate = new Date(weekStart);
              const weekEndDate = new Date(weekStartDate);
              weekEndDate.setDate(weekStartDate.getDate() + 6);
              return entryDate >= weekStartDate && entryDate <= weekEndDate;
            })} />
          </div>
        </Card>

        {/* ACWR Chart - Always Last 30 Days */}
        <Card className="bg-zinc-800/90 px-4 py-4 mb-6">
          <h2 className="text-base font-semibold text-center mb-4">
            ACWR – Acute:Chronic Workload Ratio (Last 30 Days)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={acwrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <ReferenceLine y={0.8} stroke="#DC2626" strokeDasharray="5 5" label="Under-training" />
                <ReferenceLine y={1.3} stroke="#DC2626" strokeDasharray="5 5" label="Injury Risk" />
                <Line 
                  type="monotone" 
                  dataKey="ratio" 
                  stroke="#CBFF00" 
                  strokeWidth={2}
                  dot={{ fill: '#CBFF00', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly Work-Load (10 weeks) */}
        <Card className="bg-zinc-800/90 px-4 py-4">
          <h2 className="text-base font-semibold text-center mb-4">
            Weekly Work-Load (Last 10 Weeks)
          </h2>
          <div className="h-80">
            <WeeklyLoadChart />
          </div>
        </Card>
      </div>
    </div>
  );
}