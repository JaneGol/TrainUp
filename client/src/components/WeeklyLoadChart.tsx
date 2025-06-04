import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceArea,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

const colors = {
  Field: '#b5f23d',   // Bright lime green for Field Training
  Gym: '#547aff',     // Blue-grey for Gym Training
  Match: '#ff6f6f'    // Coral for Match/Game
};

interface WeeklyLoadData {
  week: string;
  weekLabel: string;
  field: number;
  gym: number;
  match: number;
  total: number;
  acwr: number;
}

interface WeeklyLoadChartProps {
  data: WeeklyLoadData[];
}

export default function WeeklyLoadChart({ data }: WeeklyLoadChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fieldValue = payload.find((p: any) => p.dataKey === 'field')?.value || 0;
      const gymValue = payload.find((p: any) => p.dataKey === 'gym')?.value || 0;
      const matchValue = payload.find((p: any) => p.dataKey === 'match')?.value || 0;
      const acwrValue = payload.find((p: any) => p.dataKey === 'acwr')?.value || 0;
      const total = fieldValue + gymValue + matchValue;

      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs">
          <p className="text-zinc-300 font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {fieldValue > 0 && (
              <p className="text-[#b5f23d]">Field: {fieldValue} AU</p>
            )}
            {gymValue > 0 && (
              <p className="text-[#547aff]">Gym: {gymValue} AU</p>
            )}
            {matchValue > 0 && (
              <p className="text-[#ff6f6f]">Match: {matchValue} AU</p>
            )}
            <p className="text-white font-medium border-t border-zinc-700 pt-1 mt-2">
              Total: {total} AU
            </p>
            <p className="text-yellow-400">ACWR: {acwrValue ? acwrValue.toFixed(2) : "—"}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart 
          data={data} 
          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
        >
          {/* Reference areas for ACWR zones */}
          <ReferenceArea y1={0.5} y2={0.79} fill="#1e3a8a" fillOpacity={0.08} yAxisId="acwr" />
          <ReferenceArea y1={0.8} y2={1.19} fill="#15803d" fillOpacity={0.08} yAxisId="acwr" />
          <ReferenceArea y1={1.2} y2={1.49} fill="#fbbf24" fillOpacity={0.08} yAxisId="acwr" />
          <ReferenceArea y1={1.5} y2={2.0} fill="#dc2626" fillOpacity={0.08} yAxisId="acwr" />

          <CartesianGrid strokeOpacity={0.15} />
          
          <XAxis 
            dataKey="weekLabel" 
            tick={{ fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          
          <YAxis 
            yAxisId="load"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickLine={false}
            label={{ value: 'AU', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#9ca3af' } }}
          />
          
          <YAxis 
            yAxisId="acwr" 
            orientation="right" 
            domain={[0.5, 2]} 
            tick={{ fontSize: 11, fill: '#facc15' }}
            axisLine={{ stroke: 'rgba(250, 204, 21, 0.4)' }}
            tickLine={{ stroke: 'rgba(250, 204, 21, 0.3)' }}
            label={{ value: 'ACWR', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 11, fill: '#facc15' } }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Stacked bars for training load */}
          <Bar yAxisId="load" dataKey="field" stackId="a" fill={colors.Field} name="Field" />
          <Bar yAxisId="load" dataKey="gym" stackId="a" fill={colors.Gym} name="Gym" />
          <Bar yAxisId="load" dataKey="match" stackId="a" fill={colors.Match} name="Match" />
          
          {/* ACWR line */}
          <Line 
            yAxisId="acwr"
            type="monotone" 
            dataKey="acwr" 
            stroke="#facc15" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#facc15', stroke: '#facc15', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#facc15', stroke: '#ffffff', strokeWidth: 2 }}
            connectNulls={false}
            name="ACWR"
          />
        </ComposedChart>
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
        <span className="flex items-center gap-1">
          <span className="w-3 h-px bg-[#facc15] inline-block"></span>ACWR
        </span>
      </div>
      
      {/* ACWR Caption */}
      <div className="text-center mt-2 text-[11px] text-zinc-400">
        ACWR compares this week's load to your 4-week average. 0.8–1.2 = balanced; &gt;1.5 = spike (higher risk).
      </div>
    </div>
  );
}