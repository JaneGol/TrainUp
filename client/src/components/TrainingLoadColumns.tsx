import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  CartesianGrid,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import BaseChart, { CHART_STYLES } from './BaseChart';
import LegendChips from './LegendChips';
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
    return data.map(item => ({
      ...item,
      originalDate: item.date,
      displayDate: format(parseISO(item.date), 'dd.MM')
    }));
  }, [data]);

  return (
    <BaseChart isLoading={isLoading} isError={isError} height={400}>
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeOpacity={0.15} />
        <XAxis 
          dataKey="displayDate" 
          tick={CHART_STYLES.axis}
          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
        />
        <YAxis 
          tickLine={false}
          tick={CHART_STYLES.axis}
          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          domain={[0, 'dataMax']}
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
        
        {(['Field', 'Gym', 'Match'] as const).map((type) => (
          <Bar key={type} dataKey={type} stackId="a" fill={colors[type]} />
        ))}
        
        <LabelList 
          dataKey="total" 
          position="center"
          className="text-[10px] fill-zinc-100 font-medium"
          formatter={(value: number) => value > 0 ? value : ''}
        />
      </BarChart>
    </BaseChart>
  );
}