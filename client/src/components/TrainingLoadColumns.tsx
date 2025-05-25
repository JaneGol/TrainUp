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
  Field: '#b5f23d',
  Gym: '#547aff', 
  Match: '#ff6f6f'
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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart 
        data={data} 
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <defs>
          <pattern 
            id="dotsPattern" 
            patternUnits="userSpaceOnUse" 
            width="4" 
            height="4"
          >
            <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.6" />
          </pattern>
        </defs>

        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(d) => format(parseISO(d), 'd MMM')}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
        />
        <YAxis 
          tickLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
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
          <Bar key={type} dataKey={type} stackId="a" fill={colors[type]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.double ? `url(#dotsPattern)` : colors[type]}
                stroke={entry.double ? colors[type] : 'none'}
                strokeWidth={entry.double ? 2 : 0}
              />
            ))}
          </Bar>
        ))}
        
        <LabelList 
          dataKey="total" 
          position="center"
          className="text-[10px] fill-zinc-100 font-medium"
          formatter={(value: number) => value > 0 ? value : ''}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}