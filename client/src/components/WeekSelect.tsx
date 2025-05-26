import { eachWeekOfInterval, format, getISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';

export const buildWeekOptions = () => {
  const weeks = eachWeekOfInterval({
    start: endOfISOWeek(new Date(Date.now() - 1000*60*60*24*70)),
    end  : new Date()
  }).reverse();

  return weeks.map(wStart => {
    const weekNo = getISOWeek(wStart);
    const start  = startOfISOWeek(wStart);
    const end    = endOfISOWeek(wStart);
    return {
      value : format(start,'yyyy-MM-dd'),
      label : `W${weekNo} (${format(start,'dd.MM')}–${format(end,'dd.MM')})`
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
      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
    >
      {weekOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}