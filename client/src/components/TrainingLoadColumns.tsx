import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { WeeklyLoadRow } from '@shared/types/api';

const colors = {
  Field: '#b5f23d',   // Bright lime green for Field Training
  Gym: '#547aff',     // Blue-grey for Gym Training  
  Match: '#ff6f6f'    // Coral for Match/Game
};

interface TrainingLoadColumnsProps {
  data: WeeklyLoadRow[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function TrainingLoadColumns({ data, isLoading, isError }: TrainingLoadColumnsProps) {
  // Memoize processed data to avoid unnecessary recalculations
  const chartData = useMemo(() => {
    return data.map(item => {
      const total = (item.Field || 0) + (item.Gym || 0) + (item.Match || 0);
      return {
        ...item,
        originalDate: item.date,
        displayDate: format(parseISO(item.date), 'dd.MM'),
        total: total
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div>Loading chart data...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <div>Failed to load chart data</div>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 20, left: 10, bottom: 0 }}
          barGap={2}
          barCategoryGap="5%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="displayDate" 
            fontSize={12}
            fill="#9CA3AF"
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <YAxis 
            tickLine={false}
            fontSize={11}
            fill="#9CA3AF"
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            domain={[0, 1800]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: 'white'
            }}
            labelFormatter={(value) => value}
          />
          
          <Bar dataKey="Field" stackId="a" fill={colors.Field} />
          <Bar dataKey="Gym" stackId="a" fill={colors.Gym} />
          <Bar dataKey="Match" stackId="a" fill={colors.Match}>
            <LabelList 
              dataKey="total" 
              position="top"
              className="text-[9px] fill-zinc-100 font-medium"
              formatter={(value: number) => value > 0 ? value : ''}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}