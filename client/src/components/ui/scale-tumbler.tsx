import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ScaleTumblerProps {
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  className?: string;
}

export function ScaleTumbler({
  min,
  max,
  step = 1,
  defaultValue = min,
  value,
  onChange,
  lowLabel,
  highLabel,
  className,
}: ScaleTumblerProps) {
  // Always initialize with min value as default value
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Use the provided value if available, otherwise use internal state
  const actualValue = value !== undefined ? value : internalValue;
  
  // Generate steps array for the number labels
  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }
  
  // Handle slider value change
  const handleValueChange = (values: number[]) => {
    setInternalValue(values[0]);
    onChange?.(values[0]);
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Slider component - matching the Pain Intensity slider style */}
      <div className="py-3">
        <Slider
          min={min}
          max={max}
          step={step}
          value={[actualValue]}
          onValueChange={handleValueChange}
          className="py-3"
        />
      </div>
      
      {/* Number labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        {steps.map((stepValue) => (
          <span key={stepValue}>{stepValue}</span>
        ))}
      </div>
      
      {/* Min/Max labels */}
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-gray-400 mt-0">
          {lowLabel && <span>{lowLabel}</span>}
          {highLabel && <span className="ml-auto">{highLabel}</span>}
        </div>
      )}
    </div>
  );
}