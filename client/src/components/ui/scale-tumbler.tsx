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
  // Always initialize with at least 1 as default value
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Use the provided value if available, otherwise use internal state
  const actualValue = value !== undefined ? value : internalValue;
  
  // Generate steps array for display
  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }
  
  const handleClick = (newValue: number) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };
  
  // Calculate the width for the highlighted part of the slider
  const trackWidth = `${((actualValue - min) / (max - min)) * 100}%`;
  
  // Calculate the left position for the thumb
  const thumbLeft = `${((actualValue - min) / (max - min)) * 100}%`;
  
  return (
    <div className={cn("w-full relative", className)}>
      {/* Tumbler Track with Highlight */}
      <div className="relative h-2 mb-4">
        {/* Background track */}
        <div className="absolute inset-0 bg-zinc-700 rounded-full"></div>
        
        {/* Highlight track */}
        <div 
          className="absolute inset-y-0 left-0 bg-[#CBFF00] rounded-full transition-all duration-300" 
          style={{ width: trackWidth }} 
        ></div>
        
        {/* Thumb */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-out"
          style={{ 
            left: thumbLeft,
            marginLeft: actualValue === min ? '0' : '-12px'
          }}
        >
          <div className="h-8 w-8 rounded-full bg-[#CBFF00] ring-2 ring-[#CBFF00] shadow-lg"></div>
        </div>
      </div>
      
      {/* Scale Numbers and Labels */}
      <div className="flex justify-between text-sm text-gray-400 mt-2">
        {steps.map((step) => (
          <div 
            key={step} 
            className={cn(
              "flex flex-col items-center cursor-pointer transition-all", 
              actualValue === step ? "text-[#CBFF00] font-medium" : ""
            )}
            onClick={() => handleClick(step)}
          >
            <span>{step}</span>
            {step === min && lowLabel && <span className="text-xs">{lowLabel}</span>}
            {step === max && highLabel && <span className="text-xs">{highLabel}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}