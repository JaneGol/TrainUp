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
        
        return dataPoint;
      });
      
      setChartData(formattedData);
    }
  }, [wellnessTrends]);

  // Format date to DD.MM format (e.g., "15.05")
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  // Define colors for each category
  const categoryColors = {
    'Readiness': '#3b82f6', // blue
    'Recovery': '#f59e0b', // amber
    'Sleep': '#8b5cf6', // violet
    'Sick/Injured': '#ef4444', // red
    'Energy': '#22c55e', // green
    'Mood': '#ec4899', // pink
    'Motivation': '#f97316', // orange
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-xs text-zinc-400">{description}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ 
                  fill: 'rgba(156, 163, 175, 0.7)', 
                  fontSize: 9 
                }} 
                tickLine={{ stroke: '#4b5563' }}
                axisLine={{ stroke: '#4b5563' }}
                dy={8}
                height={20}
              />
              <YAxis 
                tick={{ 
                  fill: 'rgba(156, 163, 175, 0.7)', 
                  fontSize: 9
                }} 
                tickLine={{ stroke: '#4b5563' }}
                axisLine={{ stroke: '#4b5563' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                width={25}
                tickCount={5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#3f3f46',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '11px',
                  padding: '4px 8px'
                }}
                labelStyle={{ color: 'white', fontSize: '11px' }}
                formatter={(value) => [`${value}%`, '']}
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
                      activeDot={{ r: 4 }}
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