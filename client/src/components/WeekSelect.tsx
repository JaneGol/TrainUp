import { eachWeekOfInterval, format, getISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';

export const buildWeekOptions = () => {
  const last12 = eachWeekOfInterval({
    start: endOfISOWeek(new Date(Date.now() - 1000*60*60*24*70)),  // ~10 weeks back
    end:   new Date()
  }).reverse();

  return last12.map(d => {
    const w      = getISOWeek(d);
    const start  = startOfISOWeek(d);
    const end    = endOfISOWeek(d);
    const label  = `W${w} (${format(start,'d MMM')}–${format(end,'d MMM')})`;
    return { 
      value: format(start,'yyyy-MM-dd'), 
      label,
      weekNumber: w
    };
  });
};

interface WeekSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function WeekSelect({ value, onChange }: WeekSelectProps) {
  const weekOptions = buildWeekOptions();
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
    >
      {weekOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}