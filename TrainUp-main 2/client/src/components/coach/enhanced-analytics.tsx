import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
} from "recharts";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Pie,
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Download } from "lucide-react";

/**
 * Types for Enhanced Analytics
 */

export interface TrainingLoad {
  date: string;
  load: number;
  trainingType: string;
  effortLevel?: number;
  emotionalLoad?: number;
}

export interface AcuteChronicWorkloadRatio {
  date: string;
  acute: number;
  chronic: number;
  ratio: number;
}

export interface WellnessTrend {
  date: string;
  value: number;
  category: string;
}

export interface AthleteRecoveryReadiness {
  athleteId: number;
  name: string;
  readinessScore: number;
  trend: string;
  issues: string[];
}

export interface InjuryRiskFactor {
  athleteId: number;
  name: string;
  riskScore: number;
  factors: string[];
}

/**
 * Training Load Chart Component
 */
export function TrainingLoadChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: TrainingLoad[],
  loading?: boolean,
  error?: Error | null
}) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load training load data</p>
      </div>
    );
  }

  // Group data by training type for stacked view
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Training Load Analysis</CardTitle>
        <CardDescription>
          Training load over time based on RPE (Rate of Perceived Exertion)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                border: 'none',
                borderRadius: '4px',
                color: 'white'
              }}
              itemStyle={{ color: 'white' }}
              formatter={(value, name) => [`${value}`, `${name}`]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Bar dataKey="load" name="Training Load" fill="#6d28d9">
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={COLORS[formattedData.findIndex(d => d.trainingType === entry.trainingType) % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {Array.from(new Set(formattedData.map(item => item.trainingType))).map((type, index) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs">{type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Emotional Load Analysis Component
 * This component visualizes the relationship between physical effort and emotional load
 */
export function EmotionalLoadAnalysisChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: TrainingLoad[],
  loading?: boolean,
  error?: Error | null
}) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load emotional load data</p>
      </div>
    );
  }

  // Filter to only include entries that have both effort level and emotional load
  const filteredData = data.filter(entry => 
    entry.effortLevel !== undefined && 
    entry.emotionalLoad !== undefined
  );

  if (filteredData.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>No emotional load data available yet</p>
      </div>
    );
  }

  // Prepare scatter plot data
  const scatterData = filteredData.map(entry => ({
    effortLevel: entry.effortLevel,
    emotionalLoad: entry.emotionalLoad,
    trainingType: entry.trainingType,
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Calculate correlation for the visualization
  const correlationData = [
    { name: 'High Physical/Low Emotional', value: 0 },
    { name: 'High Physical/High Emotional', value: 0 },
    { name: 'Low Physical/Low Emotional', value: 0 },
    { name: 'Low Physical/High Emotional', value: 0 },
  ];

  filteredData.forEach(entry => {
    const physicalHigh = (entry.effortLevel || 0) > 5;
    const emotionalHigh = (entry.emotionalLoad || 0) > 5;

    if (physicalHigh && !emotionalHigh) {
      correlationData[0].value++;
    } else if (physicalHigh && emotionalHigh) {
      correlationData[1].value++;
    } else if (!physicalHigh && !emotionalHigh) {
      correlationData[2].value++;
    } else if (!physicalHigh && emotionalHigh) {
      correlationData[3].value++;
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Emotional Load Analysis</CardTitle>
        <CardDescription>
          Relationship between physical effort and emotional impact of training
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scatter">
          <TabsList className="mb-4 w-[250px]">
            <TabsTrigger value="scatter">Correlation</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scatter">
            <ResponsiveContainer width="100%" height={350}>
              <div className="lg:grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={filteredData.slice(-14)} // Show last 14 days
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }} 
                      />
                      <YAxis yAxisId="left" orientation="left" name="Effort Level" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" name="Emotional Load" stroke="#82ca9d" />
                      <Tooltip 
                        formatter={(value, name) => [value, name === "effortLevel" ? "Physical Effort" : "Emotional Load"]}
                        labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="effortLevel"
                        name="Physical Effort"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="emotionalLoad"
                        name="Emotional Load"
                        stroke="#82ca9d"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={correlationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {correlationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} sessions`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="distribution">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={filteredData.slice(-10)} // Show last 10 sessions
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).getDate().toString()} />
                <YAxis domain={[0, 10]} />
                <Tooltip 
                  formatter={(value, name) => [value, name === "effortLevel" ? "Physical Effort" : "Emotional Load"]}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Bar dataKey="effortLevel" name="Physical Effort" fill="#8884d8" />
                <Bar dataKey="emotionalLoad" name="Emotional Load" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ACWRChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: AcuteChronicWorkloadRatio[],
  loading?: boolean,
  error?: Error | null
}) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load ACWR data</p>
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Add danger zone reference areas
  const dangerZone = {
    low: 0.8,
    high: 1.3,
    veryHigh: 1.5
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Acute:Chronic Workload Ratio</CardTitle>
        <CardDescription>
          Tracking acute vs chronic load to predict injury risk (optimal range: 0.8-1.3)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                border: 'none',
                borderRadius: '4px',
                color: 'white'
              }}
              itemStyle={{ color: 'white' }}
              formatter={(value, name) => {
                const numValue = typeof value === 'number' ? value.toFixed(2) : value;
                return [`${numValue}`, `${name}`];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="acute" 
              name="Acute Load (7 days)" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="chronic" 
              name="Chronic Load (28 days)" 
              stroke="#82ca9d" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="ratio" 
              name="ACWR" 
              stroke="#ff8042" 
              strokeWidth={3}
            />
            {/* Add reference lines for danger zones */}
            <CartesianGrid strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-green-100/10 p-2 text-center border border-green-500/20">
            <p className="text-xs font-medium text-green-500">Safe Zone</p>
            <p className="text-xs text-gray-300">0.8 - 1.3</p>
          </div>
          <div className="rounded-md bg-yellow-100/10 p-2 text-center border border-yellow-500/20">
            <p className="text-xs font-medium text-yellow-400">Warning Zone</p>
            <p className="text-xs text-gray-300">1.3 - 1.5</p>
          </div>
          <div className="rounded-md bg-red-100/10 p-2 text-center border border-red-500/20">
            <p className="text-xs font-medium text-red-500">Danger Zone</p>
            <p className="text-xs text-gray-300">{"< 0.8 or > 1.5"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Team Wellness Trends Chart Component
 */
export function WellnessTrendsChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: WellnessTrend[],
  loading?: boolean,
  error?: Error | null
}) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load wellness trends data</p>
      </div>
    );
  }

  // Format data for visualization
  const categories = Array.from(new Set(data.map(item => item.category)));
  
  // Group by date to create a proper dataset for the line chart
  const groupedData: Record<string, Record<string, number | string>> = {};
  
  data.forEach(({ date, category, value }) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groupedData[formattedDate]) {
      groupedData[formattedDate] = { date: formattedDate };
    }
    groupedData[formattedDate][category] = value;
  });
  
  const formattedData = Object.values(groupedData);
  
  // Colors for each category
  const categoryColors: Record<string, string> = {
    'sleep': '#8884d8',
    'mood': '#82ca9d',
    'stress': '#ffc658',
    'soreness': '#ff8042',
    'energy': '#0088fe',
    'recovery': '#00C49F',
    'motivation': '#FFBB28'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Wellness Trends</CardTitle>
        <CardDescription>
          Tracking key wellness metrics across the team over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Tabs defaultValue="line" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="radar">Radar</TabsTrigger>
            </TabsList>
            <TabsContent value="line" className="pt-2">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={formattedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Legend />
                  {categories.map(category => (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      name={category.charAt(0).toUpperCase() + category.slice(1)}
                      stroke={categoryColors[category] || '#fff'}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="radar" className="pt-2">
              <ResponsiveContainer width="100%" height={320}>
                <RechartsRadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={categories.map(category => {
                    // Calculate average value for each category
                    const values = data.filter(d => d.category === category).map(d => d.value);
                    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                    return {
                      subject: category.charAt(0).toUpperCase() + category.slice(1),
                      A: avg,
                      fullMark: 10
                    };
                  })}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar
                    name="Team Average"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RechartsRadarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recovery Readiness Dashboard Component
 */
export function RecoveryReadinessDashboard({ 
  data, 
  loading, 
  error 
}: { 
  data?: AthleteRecoveryReadiness[],
  loading?: boolean,
  error?: Error | null
}) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load recovery readiness data</p>
      </div>
    );
  }

  // Sort data by readiness score (ascending - worst first)
  const sortedData = [...data].sort((a, b) => a.readinessScore - b.readinessScore);

  // Get trend icons and colors
  const getTrendStyle = (trend: string) => {
    switch(trend) {
      case 'improving':
        return { icon: '↗️', color: 'text-green-500' };
      case 'declining':
        return { icon: '↘️', color: 'text-red-500' };
      default: // stable
        return { icon: '→', color: 'text-yellow-400' };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recovery Readiness Dashboard</CardTitle>
        <CardDescription>
          Current recovery status for all athletes with potential risk areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2 text-xs font-medium text-gray-400">Athlete</th>
                <th className="text-center p-2 text-xs font-medium text-gray-400">Readiness</th>
                <th className="text-center p-2 text-xs font-medium text-gray-400">Trend</th>
                <th className="text-left p-2 text-xs font-medium text-gray-400">Issues</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((athlete) => {
                const { icon, color } = getTrendStyle(athlete.trend);
                
                // Get readiness color
                let readinessColor = 'text-green-500';
                if (athlete.readinessScore < 50) readinessColor = 'text-red-500';
                else if (athlete.readinessScore < 70) readinessColor = 'text-yellow-400';
                
                return (
                  <tr key={athlete.athleteId} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-sm">{athlete.name}</td>
                    <td className="p-2 text-center">
                      <span className={`font-semibold ${readinessColor}`}>
                        {athlete.readinessScore}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`font-semibold ${color}`}>{icon}</span>
                    </td>
                    <td className="p-2 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {athlete.issues.map((issue, index) => (
                          <span 
                            key={index} 
                            className="inline-block px-2 py-1 rounded-md text-xs bg-red-500/20 text-red-300"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Injury Risk Factor Analysis Component
 */
export function InjuryRiskFactorAnalysis({ 
  data, 
  loading, 
  error 
}: { 
  data?: InjuryRiskFactor[],
  loading?: boolean,
  error?: Error | null
}) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load injury risk data</p>
      </div>
    );
  }

  // Sort data by risk score (descending - highest risk first)
  const sortedData = [...data].sort((a, b) => b.riskScore - a.riskScore);

  // Prepare data for pie chart - count athletes by risk level
  const riskLevelDistribution = [
    { name: 'High Risk', value: data.filter(a => a.riskScore >= 75).length, color: '#ef4444' },
    { name: 'Medium Risk', value: data.filter(a => a.riskScore >= 50 && a.riskScore < 75).length, color: '#f59e0b' },
    { name: 'Low Risk', value: data.filter(a => a.riskScore < 50).length, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Count of each risk factor
  const riskFactorCounts: Record<string, number> = {};
  data.forEach(athlete => {
    athlete.factors.forEach(factor => {
      riskFactorCounts[factor] = (riskFactorCounts[factor] || 0) + 1;
    });
  });

  // Convert to array and sort
  const topRiskFactors = Object.entries(riskFactorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 factors

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Injury Risk Factor Analysis</CardTitle>
        <CardDescription>
          Assessment of injury risk factors across the team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4">Risk Level Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskLevelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {riskLevelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} athletes`, `${name}`]}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 17, 17, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4">Top Risk Factors</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={topRiskFactors}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip
                  formatter={(value) => [`${value} athletes`, 'Affected']}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 17, 17, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="value" fill="#6d28d9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Athletes at Risk</h3>
          <div className="w-full overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-xs font-medium text-gray-400">Athlete</th>
                  <th className="text-center p-2 text-xs font-medium text-gray-400">Risk Score</th>
                  <th className="text-left p-2 text-xs font-medium text-gray-400">Risk Factors</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((athlete) => {
                  // Get risk color
                  let riskColor = 'text-green-500';
                  if (athlete.riskScore >= 75) riskColor = 'text-red-500';
                  else if (athlete.riskScore >= 50) riskColor = 'text-yellow-400';
                  
                  return (
                    <tr key={athlete.athleteId} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="p-2 text-sm">{athlete.name}</td>
                      <td className="p-2 text-center">
                        <span className={`font-semibold ${riskColor}`}>
                          {athlete.riskScore}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {athlete.factors.map((factor, index) => (
                            <span 
                              key={index} 
                              className="inline-block px-2 py-1 rounded-md text-xs bg-gray-700/40 text-gray-300"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}