import { useState } from "react";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface InjurySelectorProps {
  hasInjury: boolean;
  onHasInjuryChange: (value: boolean) => void;
  painLevel: number;
  onPainLevelChange: (value: number) => void;
  injuryImproving: "yes" | "no" | "unchanged";
  onInjuryImprovingChange: (value: "yes" | "no" | "unchanged") => void;
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
  return (
    <div className="space-y-6">
      {/* Injury Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg bg-secondary/10 border-l-2 border-secondary p-4 shadow-sm">
        <div className="space-y-0.5">
          <FormLabel className="text-base text-gray-200">Do you have an injury?</FormLabel>
          <FormDescription className="text-xs text-gray-400">
            Toggle on if you currently have an injury you're managing
          </FormDescription>
        </div>
        <Switch
          checked={hasInjury}
          onCheckedChange={onHasInjuryChange}
        />
      </div>
      
      {/* Conditional Injury Fields */}
      {hasInjury && (
        <div className="space-y-6 bg-secondary/5 p-4 rounded-lg border-l-2 border-secondary shadow-sm">
          {/* Pain Level Slider */}
          <div>
            <FormLabel className="text-gray-200">How severe is your pain?</FormLabel>
            <div className="space-y-2">
              <Slider
                min={0}
                max={5}
                step={1}
                value={[painLevel]}
                onValueChange={(vals) => onPainLevelChange(vals[0])}
                className="py-3"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>None (0)</span>
                <span>Severe (5)</span>
              </div>
              <div className="text-center text-gray-200">
                Selected: <span className="font-semibold">{painLevel}</span>
              </div>
            </div>
          </div>
          
          {/* Injury Improving */}
          <div>
            <FormLabel className="text-gray-200">Is your injury improving?</FormLabel>
            <Select
              value={injuryImproving}
              onValueChange={onInjuryImprovingChange}
            >
              <SelectTrigger className="bg-[rgb(30,30,30)] text-white border-gray-700">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent className="bg-[rgb(30,30,30)] text-white border-gray-700">
                <SelectItem value="yes">Yes, it's getting better</SelectItem>
                <SelectItem value="no">No, it's getting worse</SelectItem>
                <SelectItem value="unchanged">It's about the same</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Injury Notes */}
          <div>
            <FormLabel className="text-gray-200">Additional notes about your injury</FormLabel>
            <Textarea
              placeholder="Describe your injury in more detail..."
              className="bg-[rgb(30,30,30)] text-gray-200 border-gray-700 resize-none min-h-[100px]"
              value={injuryNotes}
              onChange={(e) => onInjuryNotesChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}