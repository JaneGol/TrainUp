import React, { useState, useEffect } from "react";
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
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // The actual selected value (from controlled component or internal state)
  const actualValue = value !== undefined ? value : internalValue;
  
  // At initial render, always show position 0
  const displayValue = isInitialRender ? 0 : actualValue;
  
  // Mark as not initial render after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }
  
  const handleClick = (newValue: number) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };
  
  // Calculate the width for the highlighted part of the slider
  const trackWidth = `${((displayValue - min) / (max - min)) * 100}%`;
  
  // Calculate the left position for the thumb
  const thumbLeft = `${((displayValue - min) / (max - min)) * 100}%`;
  
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
            marginLeft: displayValue === min ? '0' : '-12px'
          }}
        >
          <div className="h-8 w-8 rounded-full bg-[#CBFF00] ring-2 ring-[#CBFF00] shadow-lg"></div>
        </div>
      </div>
      
      {/* Scale Numbers and Labels */}
      <div className="flex justify-between text-sm text-gray-400">
        {steps.map((step) => (
          <div 
            key={step} 
            className={cn(
              "flex flex-col items-center cursor-pointer transition-all", 
              displayValue === step ? "text-[#CBFF00] font-medium" : ""
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