import {
  BarChart,
  Bar,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  Line,
  ComposedChart,
  ResponsiveContainer
} from 'recharts';
import { TenWeekComboData } from '@/hooks/useTenWeekCombo';
interface CombinedLoadAcwrChartProps {
  data: TenWeekComboData[];
}

export default function CombinedLoadAcwrChart({ data }: CombinedLoadAcwrChartProps) {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur p-4 md:p-6 shadow">
      <h2 className="chart-title mb-1">Weekly Load & ACWR (Last 10 Weeks)</h2>
      <p className="chart-meta mb-4">Bars = weekly load; line = ACWR. Green band = optimal 0.8–1.3</p>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={300}>
          <ComposedChart 
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="weekStart" 
              tickFormatter={(d) => d.slice(5)}
              fontSize={12}
              fill="#9CA3AF"
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              yAxisId="load" 
              orientation="left"
              domain={[0, 3000]}
              label={{ value: 'AU', angle: -90, position: 'insideLeft' }}
              fontSize={11}
              fill="#9CA3AF"
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              yAxisId="acwr" 
              orientation="right" 
              domain={[0, 2]} 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'ACWR', angle: 90, position: 'insideRight' }}
            />
            
            {/* ACWR optimal zone */}
            <ReferenceArea 
              yAxisId="acwr" 
              y1={0.8} 
              y2={1.3}
              stroke="none" 
              fill="#16a34a" 
              fillOpacity={0.08}
            />
            
            {/* Stacked bars for training load */}
            <Bar 
              yAxisId="load" 
              dataKey="Field" 
              stackId="a" 
              fill="#b5f23d" 
              name="Field"
            />
            <Bar 
              yAxisId="load" 
              dataKey="Gym" 
              stackId="a" 
              fill="#547aff" 
              name="Gym"
            />
            <Bar 
              yAxisId="load" 
              dataKey="Match" 
              stackId="a" 
              fill="#ff6f6f" 
              name="Match"
            />
            
            {/* ACWR line */}
            <Line 
              yAxisId="acwr" 
              type="monotone" 
              dataKey="acwr"
              stroke="#facc15" 
              dot={{ r: 3, fill: "#facc15" }} 
              strokeWidth={2}
              name="ACWR"
              connectNulls={false}
            />
            
            <Legend 
              payload={[
                { value: 'Field', type: 'square', color: '#b5f23d' },
                { value: 'Gym', type: 'square', color: '#547aff' },
                { value: 'Match', type: 'square', color: '#ff6f6f' },
                { value: 'ACWR', type: 'line', color: '#facc15' }
              ]}
              verticalAlign="bottom" 
              height={24}
              wrapperStyle={{ color: '#fff', fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(v, name) => name === 'acwr' ? `${v}` : `${v} AU`}
              labelFormatter={(label) => `Week ${label}`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}