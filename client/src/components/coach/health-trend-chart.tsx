import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Color scheme for the wellness metrics with exact values from requirements
const categoryColors = {
  'Recovery': 'rgb(200, 255, 1)', // Yellow-green/lime color (CBFF00)
  'Readiness': 'rgb(59, 130, 246)', // Blue 
  'Energy': 'rgb(239, 68, 68)' // Red (rgb(239,68,68))
};

// Helper function to format dates in DD.MM format
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

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
      const uniqueDates = Array.from(
        new Set(wellnessTrends.map((item: HealthMetric) => item.date))
      );
      
      // Sort dates in ascending order
      uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      // Get the last 7 days for the chart
      const last7Days = uniqueDates.slice(-7);
      
      // Create data for the chart - ensure all three categories exist for each day
      const formattedData = last7Days.map(date => {
        // Filter metrics for this specific date
        const dataForDay = wellnessTrends.filter((item: HealthMetric) => item.date === date);
        
        // Create the data point with formatted date
        const dataPoint: any = { 
          date: date,
          formattedDate: formatDateShort(date)
        };
        
        // Process data for each metric category
        dataForDay.forEach(metric => {
          // Convert from 0-1 scale to 0-100 percentage
          const value = Math.round(metric.value * 100);
          
          // Only process the three metrics we care about
          if (['Readiness', 'Recovery', 'Energy'].includes(metric.category)) {
            dataPoint[metric.category] = value;
          }
        });
        
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

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title || "7-Day Team Wellness Trends"}</CardTitle>
        <p className="text-xs text-zinc-400 mb-2">
          {description || "Average metrics from athlete daily self-assessments"}
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
                left: 20,
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
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
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
              
              {/* Only display the 3 specified metrics: Recovery, Readiness, and Energy */}
              {['Recovery', 'Readiness', 'Energy'].map((category) => {
                // All lines now have the same thickness, dots, and active dots
                const strokeWidth = 2.5;
                const dotRadius = 4;
                const activeDotRadius = 6;
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
      {chartData && chartData.length > 0 && (
        <CardFooter className="pt-0">
          <div className="w-full mt-1 flex flex-wrap justify-center gap-5 py-1 border-t border-zinc-800 pt-3">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-[rgb(200,255,1)] mr-2"></span>
              <span className="text-zinc-400 text-sm">Recovery</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-[rgb(59,130,246)] mr-2"></span>
              <span className="text-zinc-400 text-sm">Readiness</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-[rgb(239,68,68)] mr-2"></span>
              <span className="text-zinc-400 text-sm">Energy</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}