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
import { Switch } from "@/components/ui/switch";

interface InjurySelectorProps {
  hasInjury: boolean;
  onHasInjuryChange: (value: boolean) => void;
  painLevel: number;
  onPainLevelChange: (value: number) => void;
  injuryImproving: string;
  onInjuryImprovingChange: (value: string) => void;
  injuryNotes: string;
  onInjuryNotesChange: (value: string) => void;
}

export function InjurySelector({
  hasInjury,
  onHasInjuryChange,
  painLevel,
  onPainLevelChange,
  injuryImproving,
  onInjuryImprovingChange,
  injuryNotes,
  onInjuryNotesChange
}: InjurySelectorProps) {
  
  // Handle pain intensity slider change
  const handlePainIntensityChange = (values: number[]) => {
    onPainLevelChange(values[0]);
  };
  
  return (
    <div className="space-y-6 mt-6">
      <h4 className="text-lg font-medium text-gray-200">Do you have any injuries?</h4>
      <div className="flex items-center space-x-3">
        <Switch
          checked={hasInjury}
          onCheckedChange={onHasInjuryChange}
          className="data-[state=checked]:bg-primary"
        />
        <span className="text-sm text-gray-200">{hasInjury ? "Yes" : "No"}</span>
      </div>
      
      {/* Show additional fields only if hasInjury is true */}
      {hasInjury && (
        <div className="space-y-6 ml-6 border-l-2 border-zinc-700 pl-4 mt-4">
          {/* Pain intensity slider */}
          <div className="space-y-2">
            <FormLabel className="text-gray-200">How intense is the pain?</FormLabel>
            <div className="py-3">
              <Slider
                min={1}
                max={10}
                step={1}
                value={[painLevel]}
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
            <FormLabel className="text-gray-200">How is the pain changing?</FormLabel>
            <Select
              value={injuryImproving}
              onValueChange={onInjuryImprovingChange}
            >
              <SelectTrigger className="bg-[rgb(38,38,38)] border-gray-700 text-gray-200">
                <SelectValue placeholder="Select pain trend" />
              </SelectTrigger>
              <SelectContent className="bg-[rgb(38,38,38)] border-gray-700 text-gray-200">
                <SelectItem value="unchanged">No change</SelectItem>
                <SelectItem value="better">Getting better</SelectItem>
                <SelectItem value="worse">Getting worse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes textarea */}
          <div className="space-y-2">
            <FormLabel className="text-gray-200">Additional notes (optional):</FormLabel>
            <Textarea
              placeholder="Describe your injury in more detail..."
              className="resize-none bg-[rgb(30,30,30)] border-gray-700 text-gray-200 min-h-[80px]"
              value={injuryNotes}
              onChange={(e) => onInjuryNotesChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}