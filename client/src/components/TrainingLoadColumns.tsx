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
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeOpacity={0.15} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(d) => format(parseISO(d), 'dd.MM')}
            tick={{ fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <YAxis 
            tickLine={false}
            tick={{ fontSize: 12 }}
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
      
      {/* Compact Legend */}
      <div className="flex justify-center gap-3 mt-1 text-[11px] font-medium">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-[#b5f23d]"></span>Field
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-[#547aff]"></span>Gym
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-[#ff6f6f]"></span>Match
        </span>
      </div>
    </div>
  );
}