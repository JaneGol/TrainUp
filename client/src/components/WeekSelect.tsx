import {
  eachWeekOfInterval,
  getISOWeek,
  startOfISOWeek,
  endOfISOWeek,
  format,
  isSameISOWeek
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const buildWeekOptions = () => {
  const today = new Date();
  const weeks = eachWeekOfInterval({
    start: endOfISOWeek(new Date(Date.now() - 1000*60*60*24*90)), // 13 weeks back
    end  : new Date(Date.now() + 1000*60*60*24*7) // Include next week to ensure current week is available
  }).reverse();

  return weeks.map(ws => {
    const weekNo = getISOWeek(ws);
    const s = startOfISOWeek(ws);
    const e = endOfISOWeek(ws);
    return {
      value: format(s,'yyyy-MM-dd'),
      label: `Week ${weekNo} (${format(s,'dd.MM')} – ${format(e,'dd.MM')})`,
      isCurrent: isSameISOWeek(today, s)
    };
  });
};

interface WeekSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function WeekSelect({ value, onChange }: WeekSelectProps) {
  const weekOptions = buildWeekOptions();
  const selectedOption = weekOptions.find(option => option.value === value);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-zinc-800 border-zinc-700">
        <SelectValue>
          {selectedOption?.label || weekOptions[0]?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {weekOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}