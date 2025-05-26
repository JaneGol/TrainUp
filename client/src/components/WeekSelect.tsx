import { eachWeekOfInterval, format, getISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const buildWeekOptions = () => {
  const weeks = eachWeekOfInterval({
    start: endOfISOWeek(new Date(Date.now() - 1000*60*60*24*120)), // Extended to ~17 weeks
    end  : endOfISOWeek(new Date(Date.now() + 1000*60*60*24*14))   // Include next 2 weeks
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