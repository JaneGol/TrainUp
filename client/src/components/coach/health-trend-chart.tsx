import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  CartesianGrid
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface HealthMetric {
  date: string;
  value: number;
  category: string;
}

interface HealthTrendChartProps {
  title: string;
  description?: string;
}

export default function HealthTrendChart({ title, description }: HealthTrendChartProps) {
  // Get wellness trends data
  const { data: wellnessTrends, isLoading } = useQuery({
    queryKey: ["/api/analytics/team-wellness-trends"],
  });

  // Get last 7 days data
  const [chartData, setChartData] = useState<any[]>([]);

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
        const dataPoint: any = { date: formatDate(date) };
        
        uniqueCategories.forEach(category => {
          const metricData = dataForDay.find((item: HealthMetric) => item.category === category);
          if (metricData) {
            // Convert from 0-1 scale to 0-100
            dataPoint[category] = Math.round(metricData.value * 100);
          } else {
            dataPoint[category] = 0;
          }
        });
        
        return dataPoint;
      });
      
      setChartData(formattedData);
    }
  }, [wellnessTrends]);

  // Format date to be more readable (e.g., "May 8")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  // Define colors for each category
  const categoryColors = {
    'Readiness': '#3b82f6', // blue
    'Mood': '#10b981', // green
    'Recovery': '#f59e0b', // amber
    'Sleep': '#8b5cf6', // violet
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9ca3af' }} 
                tickLine={{ stroke: '#4b5563' }}
                axisLine={{ stroke: '#4b5563' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af' }} 
                tickLine={{ stroke: '#4b5563' }}
                axisLine={{ stroke: '#4b5563' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#3f3f46',
                  color: 'white',
                  borderRadius: '4px'
                }}
                labelStyle={{ color: 'white' }}
              />
              <Legend 
                verticalAlign="bottom" 
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '10px'
                }}
              />
              {Object.keys(categoryColors).map((category) => {
                // Only render the category if it exists in the data
                if (chartData.some(item => category in item)) {
                  return (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={categoryColors[category as keyof typeof categoryColors]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: categoryColors[category as keyof typeof categoryColors] }}
                      activeDot={{ r: 5 }}
                      name={category}
                    />
                  );
                }
                return null;
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-48 text-gray-400">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}