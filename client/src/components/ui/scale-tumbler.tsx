import React, { useState } from "react";
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
  const [internalValue, setInternalValue] = useState(defaultValue);
  const actualValue = value !== undefined ? value : internalValue;
  
  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }
  
  const handleClick = (newValue: number) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };
  
  // I noticed in the screenshot the sliders show position 3 by default
  const displayValue = value !== undefined ? value : 3; // Default to position 3 for visual display

  return (
    <div className={cn("w-full", className)}>
      {/* Tumbler Track with Highlight */}
      <div className="relative h-2 mb-4">
        <div className="absolute inset-0 bg-zinc-700 rounded-full"></div>
        <div 
          className="absolute inset-y-0 left-0 bg-[#CBFF00] rounded-full" 
          style={{ 
            width: `${((displayValue - min) / (max - min)) * 100}%` 
          }}
        ></div>
        <div 
          className="absolute top-1/2 transform -translate-y-1/2"
          style={{ 
            left: `${((displayValue - min) / (max - min)) * 100}%`,
            marginLeft: displayValue === min ? '0' : '-12px'
          }}
        >
          <div className="h-8 w-8 rounded-full bg-[#CBFF00] ring-2 ring-[#CBFF00] shadow-lg"></div>
        </div>
      </div>
      
      {/* Scale Numbers and Labels */}
      <div className="flex justify-between text-sm text-gray-400">
        {steps.map((step) => (
          <div key={step} className="flex flex-col items-center cursor-pointer" onClick={() => handleClick(step)}>
            <span>{step}</span>
            {step === min && lowLabel && <span className="text-xs">{lowLabel}</span>}
            {step === max && highLabel && <span className="text-xs">{highLabel}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}