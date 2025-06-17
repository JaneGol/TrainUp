import {
  BarChart,
  Bar,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
  Line,
  ComposedChart,
  ResponsiveContainer
} from 'recharts';
import { TenWeekComboData } from '@/hooks/useTenWeekCombo';
import { getAcwrSmoothed, formatAcwrDisplay } from '@/utils/getAcwrSmoothed';
interface CombinedLoadAcwrChartProps {
  data: TenWeekComboData[];
}

export default function CombinedLoadAcwrChart({ data }: CombinedLoadAcwrChartProps) {
  // Add data validation to prevent rendering issues
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-white/5 backdrop-blur p-4 md:p-6 shadow">
        <h2 className="chart-title mb-1">Weekly Load & ACWR (Last 10 Weeks)</h2>
        <p className="chart-meta mb-4">Bars = weekly load; line = ACWR. Green band = optimal 0.8–1.3</p>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-zinc-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  // Find the first 3 weeks that have actual training data
  const weeksWithData = data.filter(item => item.total > 0);
  const firstThreeDataWeeks = weeksWithData.slice(0, 3).map(week => week.weekStart);
  
  // Process data to hide ACWR line for first 3 weeks WITH DATA AND weeks without sufficient data
  const processedData = data.map((item, index) => ({
    ...item,
    acwr: (firstThreeDataWeeks.includes(item.weekStart) || item.acwr === null) ? null : item.acwr // Hide ACWR for first 3 data weeks OR if server says insufficient data
  }));
  
  // Check if we have any valid ACWR values (after hiding first 3 weeks)
  const hasValidAcwr = processedData.some(item => item.acwr !== null && item.acwr !== undefined);

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur p-4 md:p-6 shadow">
      <h2 className="chart-title mb-1">Weekly Load & ACWR (Last 10 Weeks)</h2>
      <p className="chart-meta mb-4">
        {hasValidAcwr 
          ? "Bars = weekly load; line = ACWR. Green band = optimal 0.8–1.3"
          : "Bars = weekly load. ACWR requires 4+ weeks of data to display."
        }
      </p>
      <div className="w-full h-80" style={{ minWidth: '400px', minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="weekStart" 
              tickFormatter={(iso) => {
                // Extract week number from ISO week format (e.g., "2025-W22" -> "Week 22")
                if (typeof iso === 'string' && iso.includes('-W')) {
                  const weekNum = iso.split('-W')[1];
                  return `Week ${weekNum}`;
                }
                return iso;
              }}
              fontSize={12}
              fill="#9CA3AF"
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              yAxisId="load" 
              orientation="left"
              domain={[0, 8000]}
              label={{ value: 'AU', angle: -90, position: 'insideLeft' }}
              fontSize={11}
              fill="#9CA3AF"
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              yAxisId="acwr" 
              orientation="right" 
              type="number"
              domain={[0, 2.0]} 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'ACWR', angle: 90, position: 'insideRight' }}
            />
            
            {/* Green zone band for optimal ACWR (0.8-1.3) - only show if ACWR data exists */}
            {hasValidAcwr && (
              <ReferenceArea 
                yAxisId="acwr" 
                y1={0.8} 
                y2={1.3}
                stroke="none" 
                fill="#16a34a" 
                fillOpacity={0.15}
              />
            )}
            

            
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
            
            {/* ACWR line - only show if valid data exists */}
            {hasValidAcwr && (
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
            )}
            
            <Legend 
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
              formatter={(v, name) => {
                if (name === 'acwr') {
                  return v === null ? '—' : typeof v === 'number' ? v.toFixed(2) : '—';
                }
                return `${v} AU`;
              }}
              labelFormatter={(label) => `Week ${label}`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* ACWR Zone Labels - only show if ACWR data exists */}
      {hasValidAcwr ? (
        <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-400">
          <span>Below 0.8: <span className="text-blue-400">Underload</span></span>
          <span>0.8–1.3: <span className="text-green-400">Optimal Zone</span></span>
          <span>Above 1.3: <span className="text-red-400">High Risk</span></span>
        </div>
      ) : (
        <div className="flex justify-center mt-3 text-sm text-zinc-400">
          Not enough data yet to assess ACWR – keep logging your training
        </div>
      )}
    </div>
  );
}