import { eachWeekOfInterval, format, getISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const buildWeekOptions = () => {
  const weeks = eachWeekOfInterval({
    start: endOfISOWeek(new Date(Date.now() - 60*24*60*60*1000)), // ≈ 8 weeks back
    end  : new Date()
  }).reverse();                                                   // newest first

  return weeks.map(wStart => {
    const weekNo = getISOWeek(wStart);
    const s = startOfISOWeek(wStart);
    const e = endOfISOWeek(wStart);
    return {
      value : format(s,'yyyy-MM-dd'),
      label : `Week ${weekNo} (${format(s,'MM.dd')} – ${format(e,'MM.dd')})`
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