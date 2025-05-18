import React from "react";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormLabel } from "@/components/ui/form";

interface InjurySelectorProps {
  painIntensity: number;
  onPainIntensityChange: (value: number) => void;
  painTrend: string;
  onPainTrendChange: (value: string) => void;
  injuryNotes: string;
  onInjuryNotesChange: (value: string) => void;
}

export function InjurySelector({
  painIntensity,
  onPainIntensityChange,
  painTrend,
  onPainTrendChange,
  injuryNotes,
  onInjuryNotesChange
}: InjurySelectorProps) {
  
  // Handle pain intensity slider change
  const handlePainIntensityChange = (values: number[]) => {
    onPainIntensityChange(values[0]);
  };
  
  return (
    <div className="space-y-6 ml-6 border-l-2 border-zinc-700 pl-4">
      {/* Pain intensity slider */}
      <div className="space-y-2">
        <FormLabel className="text-white">Pain intensity:</FormLabel>
        <div className="py-3">
          <Slider
            min={1}
            max={10}
            step={1}
            value={[painIntensity]}
            onValueChange={handlePainIntensityChange}
            className="py-3"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <span key={num}>{num}</span>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-0">
          <span>Mild</span>
          <span className="ml-auto">Severe</span>
        </div>
      </div>
      
      {/* Pain trend dropdown */}
      <div className="space-y-2">
        <FormLabel className="text-white">How has the pain changed?</FormLabel>
        <Select
          value={painTrend}
          onValueChange={onPainTrendChange}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Select pain trend" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="unchanged">No change</SelectItem>
            <SelectItem value="better">Getting better</SelectItem>
            <SelectItem value="worse">Getting worse</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Notes textarea */}
      <div className="space-y-2">
        <FormLabel className="text-white">Additional notes (optional):</FormLabel>
        <Textarea
          placeholder="Describe your injury in more detail..."
          className="resize-none bg-zinc-800 border-zinc-700 text-white"
          value={injuryNotes}
          onChange={(e) => onInjuryNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}