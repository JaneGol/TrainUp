import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { FormLabel } from "@/components/ui/form";
import { Check } from "lucide-react";

interface SorenessSelectorProps {
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
  painIntensity?: number;
  onPainIntensityChange?: (value: number) => void;
}

export function SorenessSelector({ 
  value = {}, 
  onChange, 
  painIntensity = 0, 
  onPainIntensityChange 
}: SorenessSelectorProps) {
  const hasNoSoreness = !!value._no_soreness;
  
  // Toggle "No soreness" option
  const toggleNoSoreness = () => {
    const newState = !hasNoSoreness;
    const newSelections: Record<string, boolean> = newState 
      ? { _no_soreness: true } 
      : { has_soreness: true };
    
    onChange(newSelections);

    // Set pain intensity to 0 when "No soreness" is selected
    if (newState && onPainIntensityChange) {
      onPainIntensityChange(0);
    }
  };
  
  // Handle pain intensity slider change
  const handlePainIntensityChange = (values: number[]) => {
    if (onPainIntensityChange) {
      onPainIntensityChange(values[0]);
      
      // If intensity is greater than 0, ensure "No soreness" is unchecked
      if (values[0] > 0) {
        onChange({ has_soreness: true });
      } else if (values[0] === 0) {
        onChange({ _no_soreness: true });
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-200">Do you have muscle soreness today?</h4>
      
      {/* No Soreness Option */}
      <div 
        className={`p-3 rounded-lg cursor-pointer transition-colors mb-4
          ${hasNoSoreness 
            ? "bg-primary/20 border-l-2 border-primary" 
            : "bg-secondary/30 hover:bg-gray-800/50"}`}
        onClick={toggleNoSoreness}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <Checkbox 
              id="no_soreness"
              checked={hasNoSoreness}
              className="h-5 w-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              onCheckedChange={toggleNoSoreness}
            />
            {hasNoSoreness && (
              <Check className="h-3 w-3 text-primary-foreground absolute" />
            )}
          </div>
          <label 
            htmlFor="no_soreness" 
            className="text-sm font-medium leading-none text-gray-200 flex-1 cursor-pointer"
          >
            I have no muscle soreness today
          </label>
        </div>
      </div>
      
      {/* Soreness intensity slider - show only if "No soreness" is not checked */}
      {!hasNoSoreness && (
        <div className="space-y-4">
          <div className="mt-4 space-y-2">
            <FormLabel className="text-gray-200">How intense is your muscle soreness?</FormLabel>
            <div className="py-3">
              <Slider
                min={0}
                max={5}
                step={1}
                value={[painIntensity]}
                onValueChange={handlePainIntensityChange}
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
              <span>No soreness</span>
              <span className="ml-auto">Severe soreness</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}