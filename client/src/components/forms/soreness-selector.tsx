import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";

interface SorenessSelectorProps {
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
}

export function SorenessSelector({ value = {}, onChange }: SorenessSelectorProps) {
  // Use prop values directly to avoid state synchronization issues
  const upperBodyMuscles = ["shoulders", "chest", "arms", "back", "neck", "core"];
  const lowerBodyMuscles = ["hips", "glutes", "thighs", "hamstrings", "knees", "calves"];
  
  const hasNoSoreness = !!value._no_soreness;
  
  // Toggle "No soreness" option
  const toggleNoSoreness = () => {
    const newState = !hasNoSoreness;
    const newSelections: Record<string, boolean> = newState 
      ? { _no_soreness: true } 
      : {};
    
    // Propagate change to parent component only
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
    
    // Propagate change to parent component only
    onChange(newSelections);
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
      
      {/* Only show muscle groups if "No soreness" is not checked */}
      {!hasNoSoreness && (
        <div className="space-y-4">
          <div className="bg-[rgb(22,22,22)] border border-gray-800 rounded-lg overflow-hidden">
            {/* Two-column layout for muscle groups without grid styling */}
            <div className="flex flex-wrap">
              {/* Column 1 */}
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
              
              {/* Column 2 */}
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
        </div>
      )}
    </div>
  );
}