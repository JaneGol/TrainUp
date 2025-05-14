import React from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  
  const handlePainLevelChange = (values: number[]) => {
    onPainLevelChange(values[0]);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FormLabel className="text-lg font-medium text-gray-200">
          Do you have an injury?
        </FormLabel>
        <Switch
          checked={hasInjury}
          onCheckedChange={onHasInjuryChange}
        />
      </div>
      
      {hasInjury && (
        <div className="space-y-6 pt-2">
          {/* Pain intensity slider */}
          <div className="space-y-2">
            <FormLabel className="text-gray-200">Pain intensity:</FormLabel>
            <div className="py-3">
              <Slider
                min={0}
                max={5}
                step={1}
                value={[painLevel]}
                onValueChange={handlePainLevelChange}
                className="py-3"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-0">
              <span>No Pain</span>
              <span className="ml-auto">Severe Pain</span>
            </div>
          </div>
          
          {/* Injury Progression */}
          <div className="space-y-3">
            <FormLabel className="text-gray-200">Is your injury:</FormLabel>
            <RadioGroup 
              value={injuryImproving} 
              onValueChange={(val) => onInjuryImprovingChange(val as "yes" | "no" | "unchanged")}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 rounded-md py-2 px-3 cursor-pointer transition-colors bg-[rgb(30,30,30)] hover:bg-gray-800/50">
                <RadioGroupItem value="yes" id="injury-better" className="border-primary text-primary" />
                <Label htmlFor="injury-better" className="text-gray-200 cursor-pointer">Getting better</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md py-2 px-3 cursor-pointer transition-colors bg-[rgb(30,30,30)] hover:bg-gray-800/50">
                <RadioGroupItem value="unchanged" id="injury-same" className="border-primary text-primary" />
                <Label htmlFor="injury-same" className="text-gray-200 cursor-pointer">Staying the same</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md py-2 px-3 cursor-pointer transition-colors bg-[rgb(30,30,30)] hover:bg-gray-800/50">
                <RadioGroupItem value="no" id="injury-worse" className="border-primary text-primary" />
                <Label htmlFor="injury-worse" className="text-gray-200 cursor-pointer">Getting worse</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <FormLabel className="text-gray-200">Additional notes about your injury:</FormLabel>
            <Textarea
              value={injuryNotes}
              onChange={(e) => onInjuryNotesChange(e.target.value)}
              placeholder="Describe your injury in more detail..."
              className="min-h-[100px] bg-[rgb(30,30,30)] border-gray-700 focus:border-primary text-gray-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}