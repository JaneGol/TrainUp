import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
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
  const upperBodyMuscles = ["shoulders", "chest", "arms", "back", "neck", "core"];
  const lowerBodyMuscles = ["hips", "glutes", "thighs", "hamstrings", "knees", "calves"];
  
  const hasNoSoreness = !!value._no_soreness;
  const hasSoreness = Object.keys(value).some(key => key !== '_no_soreness' && value[key]);
  
  // Toggle "No soreness" option
  const toggleNoSoreness = () => {
    const newState = !hasNoSoreness;
    const newSelections: Record<string, boolean> = newState 
      ? { _no_soreness: true } 
      : {};
    
    onChange(newSelections);
  };
  
  // Toggle individual muscle selection
  const toggleMuscle = (muscle: string) => {
    // Create a new object to avoid mutating current state
    const newSelections: Record<string, boolean> = { ...value };
    
    // If "No soreness" is selected, clear it first
    if (newSelections._no_soreness) {
      delete newSelections._no_soreness;
    }
    
    // Toggle the selected muscle
    if (newSelections[muscle]) {
      delete newSelections[muscle];
    } else {
      newSelections[muscle] = true;
    }
    
    onChange(newSelections);
  };
  
  // Handle pain intensity slider change
  const handlePainIntensityChange = (values: number[]) => {
    if (onPainIntensityChange) {
      onPainIntensityChange(values[0]);
    }
  };
  
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-200">Select muscle groups where you feel soreness:</h4>
      
      {/* No Soreness Option */}
      <div 
        className={`p-3 rounded-lg cursor-pointer transition-colors mb-4
          ${hasNoSoreness 
            ? "bg-primary/20" 
            : "bg-secondary/30 hover:bg-gray-800/50"}`}
        onClick={toggleNoSoreness}
      >
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="no_soreness"
            checked={hasNoSoreness}
            className="h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            onCheckedChange={toggleNoSoreness}
          />
          <label 
            htmlFor="no_soreness" 
            className="text-sm font-medium leading-none text-gray-200 flex-1 cursor-pointer"
          >
            I have no muscle soreness today
          </label>
        </div>
      </div>
      
      {/* Muscle groups grid - only show if "No soreness" is not checked */}
      {!hasNoSoreness && (
        <div className="space-y-4">
          <div className="bg-[rgb(22,22,22)] border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex flex-wrap">
              {/* Column 1 - Upper body muscles */}
              <div className="w-1/2">
                {upperBodyMuscles.map((muscle) => {
                  const isSelected = !!value[muscle];
                  return (
                    <div 
                      key={muscle}
                      className={`p-3 cursor-pointer border-b border-gray-800 transition-colors
                        ${isSelected 
                          ? "bg-primary/20" 
                          : "hover:bg-gray-800/30"}`}
                      onClick={() => toggleMuscle(muscle)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`soreness-${muscle}`}
                          className="h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          checked={isSelected}
                          onCheckedChange={() => toggleMuscle(muscle)}
                        />
                        <label 
                          htmlFor={`soreness-${muscle}`}
                          className="text-sm font-medium leading-none text-gray-200 flex-1 cursor-pointer capitalize"
                        >
                          {muscle}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Column 2 - Lower body muscles */}
              <div className="w-1/2 border-l border-gray-800">
                {lowerBodyMuscles.map((muscle) => {
                  const isSelected = !!value[muscle];
                  return (
                    <div 
                      key={muscle}
                      className={`p-3 cursor-pointer border-b border-gray-800 transition-colors
                        ${isSelected 
                          ? "bg-primary/20" 
                          : "hover:bg-gray-800/30"}`}
                      onClick={() => toggleMuscle(muscle)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`soreness-${muscle}`}
                          className="h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          checked={isSelected}
                          onCheckedChange={() => toggleMuscle(muscle)}
                        />
                        <label 
                          htmlFor={`soreness-${muscle}`}
                          className="text-sm font-medium leading-none text-gray-200 flex-1 cursor-pointer capitalize"
                        >
                          {muscle}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Pain intensity slider - show only if any muscle is selected */}
          {hasSoreness && onPainIntensityChange && (
            <div className="mt-4 space-y-2">
              <FormLabel className="text-gray-200">Pain intensity:</FormLabel>
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
                <span>No Pain</span>
                <span className="ml-auto">Severe Pain</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}