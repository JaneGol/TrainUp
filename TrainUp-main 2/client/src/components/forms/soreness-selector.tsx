import React from "react";
import { Slider } from "@/components/ui/slider";
import { FormLabel } from "@/components/ui/form";

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
  // Handle soreness intensity slider change
  const handleSorenessIntensityChange = (values: number[]) => {
    if (onPainIntensityChange) {
      onPainIntensityChange(values[0]);
      
      // Update soreness map state based on intensity
      if (values[0] === 0) {
        onChange({ _no_soreness: true });
      } else {
        onChange({ has_soreness: true });
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-200">How intense is your muscle soreness?</h4>
      <div className="space-y-2">
        <div className="py-3">
          <Slider
            min={0}
            max={5}
            step={1}
            value={[painIntensity]}
            onValueChange={handleSorenessIntensityChange}
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
  );
}