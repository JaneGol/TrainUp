import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import LegendChips from './LegendChips';

const colors = {
  Field: '#b5f23d',   // Bright lime green for Field Training
  Gym: '#547aff',     // Blue-grey for Gym Training  
  Match: '#ff6f6f'    // Coral for Match/Game
};

interface TrainingLoadColumnsProps {
  data: Array<{
    date: string;
    Field: number;
    Gym: number;
    Match: number;
    total: number;
    double?: boolean;
  }>;
}

export default function TrainingLoadColumns({ data }: TrainingLoadColumnsProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeOpacity={0.15} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(d) => format(parseISO(d), 'dd.MM')}
            tick={{ className: 'tick-font' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <YAxis 
            tickLine={false}
            tick={{ className: 'tick-font' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: 'white'
            }}
            labelFormatter={(value) => format(parseISO(value as string), 'd MMM yyyy')}
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
      </ResponsiveContainer>
      
      <LegendChips keys={['Field','Gym','Match']} />
    </div>
  );
}