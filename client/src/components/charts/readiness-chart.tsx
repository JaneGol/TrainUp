import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ReadinessChartProps {
  data: { date: string; value: number }[];
  isLoading: boolean;
}

export default function ReadinessChart({ data, isLoading }: ReadinessChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  // Format data for display
  const formattedData = data.map(item => {
    // Convert date string to day name (e.g., "Mon", "Tue")
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return {
      day: dayName,
      value: item.value
    };
  });
  
  return (
    <div>
      <div className="chart-bar h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Readiness']}
              contentStyle={{ borderRadius: '8px' }}
            />
            <Bar 
              dataKey="value" 
              fill="#0062cc" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 px-4 mt-2">
        <div>Low Readiness</div>
        <div>High Readiness</div>
      </div>
    </div>
  );
}
