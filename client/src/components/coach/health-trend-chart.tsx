import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface HealthMetric {
  date: string;
  value: number;
  category: string;
}

interface TrendData {
  trend: 'improving' | 'stable' | 'declining';
  changePercentage: number;
}

interface HealthTrendChartProps {
  title: string;
  description?: string;
}

export default function HealthTrendChart({ title, description }: HealthTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<TrendData>({
    trend: 'stable',
    changePercentage: 0
  });
  
  const { data: wellnessTrends, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/team-wellness-trends'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (wellnessTrends && Array.isArray(wellnessTrends)) {
      // Process data for chart
      const uniqueCategories = Array.from(
        new Set(wellnessTrends.map((item: HealthMetric) => item.category))
      );
      const uniqueDates = Array.from(
        new Set(wellnessTrends.map((item: HealthMetric) => item.date))
      );
      
      // Sort dates in ascending order
      uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      // Get the last 7 days
      const last7Days = uniqueDates.slice(-7);
      
      // Create data for the chart
      const formattedData = last7Days.map(date => {
        const dataForDay = wellnessTrends.filter((item: HealthMetric) => item.date === date);
        const dataPoint: any = { 
          date: date,
          formattedDate: formatDateShort(date),
        };
        
        // First collect all category values
        const categoryValues: Record<string, number> = {};
        
        uniqueCategories.forEach(category => {
          const metricData = dataForDay.find((item: HealthMetric) => item.category === category);
          if (metricData) {
            // Convert from 0-1 scale to 0-100
            const value = Math.round(metricData.value * 100);
            dataPoint[category] = value;
            categoryValues[category] = value;
          } else {
            dataPoint[category] = 0;
            categoryValues[category] = 0;
          }
        });
        
        // Calculate Energy as average of Motivation and Mood if they exist
        const hasMood = 'Mood' in categoryValues;
        const hasMotivation = 'Motivation' in categoryValues;
        
        if (hasMood || hasMotivation) {
          const moodValue = hasMood ? categoryValues['Mood'] : 0;
          const motivationValue = hasMotivation ? categoryValues['Motivation'] : 0;
          
          // If both metrics exist, average them; otherwise use the one that exists
          const divisor = (hasMood && hasMotivation) ? 2 : 1;
          const energyValue = Math.round((moodValue + motivationValue) / divisor);
          
          // Add Energy as a new parameter
          dataPoint['Energy'] = energyValue;
        }
        
        // Ensure all three required metrics are present
        if (!('Recovery' in dataPoint)) dataPoint['Recovery'] = 0;
        if (!('Readiness' in dataPoint)) dataPoint['Readiness'] = 0;
        if (!('Energy' in dataPoint)) dataPoint['Energy'] = 0;
        
        return dataPoint;
      });
      
      // Analyze trends (focus on Readiness as it's most important)
      const readinessValues = formattedData
        .filter(d => 'Readiness' in d && d.Readiness !== undefined)
        .map(d => d.Readiness);
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      let changePercentage = 0;
      
      if (readinessValues.length >= 2) {
        const firstHalf = readinessValues.slice(0, Math.floor(readinessValues.length / 2));
        const secondHalf = readinessValues.slice(Math.floor(readinessValues.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        changePercentage = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
        
        if (changePercentage > 5) {
          trend = 'improving';
        } else if (changePercentage < -5) {
          trend = 'declining';
        }
      }
      
      setChartData(formattedData);
      setTrendData({
        trend,
        changePercentage
      });
    }
  }, [wellnessTrends]);
  
  // Helper function to format date in a more compact format (DD.MM)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  // Define colors for each category with specific requirements
  const categoryColors = {
    'Readiness': '#3b82f6', // consistent blue tone matching app's palette
    'Recovery': 'rgb(200, 255, 1)', // specified yellow color with RGB value (200, 255, 1)
    'Energy': '#22c55e', // green color for Energy (average of Motivation and Mood)
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title || "7-Day Team Wellness Trends"}</CardTitle>
        <p className="text-xs text-zinc-400">
          {description || "Tracking team Recovery, Readiness, and Energy metrics over the past week"}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-48 text-red-500">
            Error loading data
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 35,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.1)" 
                vertical={false}
              />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(23,23,23,0.9)', 
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px'
                }}
                itemStyle={{ 
                  padding: '2px 0', 
                  margin: 0,
                }}
                labelStyle={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '5px',
                  fontSize: '10px',
                  opacity: 0.7
                }}
                iconSize={8}
              />
              
              {/* Only display the 3 specified metrics: Recovery, Readiness, and Energy */}
              {['Recovery', 'Readiness', 'Energy'].map((category) => {
                const strokeWidth = category === 'Energy' ? 3 : 2;
                const dotRadius = category === 'Energy' ? 4 : 3;
                const activeDotRadius = category === 'Energy' ? 5 : 4;
                const color = categoryColors[category as keyof typeof categoryColors];
                
                return (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    dot={{ r: dotRadius, fill: color, strokeWidth: 1, stroke: "#111" }}
                    activeDot={{ r: activeDotRadius, fill: color, stroke: "#111" }}
                    name={category}
                    connectNulls={true}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-48 text-gray-400">
            No wellness data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}