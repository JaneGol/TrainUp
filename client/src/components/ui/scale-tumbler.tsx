import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

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
  name?: string;
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
  name,
}: ScaleTumblerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isResetting, setIsResetting] = useState(false);
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
  
  const resetValue = () => {
    // Trigger reset animation
    setIsResetting(true);
    
    // Reset value with a slight delay
    setTimeout(() => {
      setInternalValue(0);
      if (onChange) {
        onChange(0);
      }
      // End animation
      setIsResetting(false);
    }, 300);
  };
  
  // Calculate the width for the highlighted part of the slider
  const trackWidth = isResetting 
    ? "0%" // During reset animation, set to 0%
    : `${((displayValue - min) / (max - min)) * 100}%`;
  
  // Calculate the left position for the thumb
  const thumbLeft = isResetting 
    ? "0%" // During reset animation, set to 0%
    : `${((displayValue - min) / (max - min)) * 100}%`;
  
  return (
    <div className={cn("w-full relative", className)}>
      {/* Reset Button */}
      <button 
        type="button"
        onClick={resetValue}
        className={cn(
          "absolute -right-7 -top-1 p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all",
          isResetting ? "animate-spin" : ""
        )}
        aria-label={`Reset ${name || 'slider'} value`}
      >
        <RotateCcw size={16} className="text-[#CBFF00]" />
      </button>
      
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
          <div className={cn(
            "h-8 w-8 rounded-full bg-[#CBFF00] ring-2 ring-[#CBFF00] shadow-lg transition-transform",
            isResetting ? "scale-75" : "scale-100"
          )}></div>
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