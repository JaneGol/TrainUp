import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface SorenessSelectorProps {
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
}

export function SorenessSelector({ value, onChange }: SorenessSelectorProps) {
  const upperBodyMuscles = ["shoulders", "chest", "arms", "back", "neck", "core"];
  const lowerBodyMuscles = ["hips", "glutes", "thighs", "hamstrings", "knees", "calves"];
  
  const handleNoSorenessChange = (checked: boolean) => {
    if (checked) {
      onChange({ _no_soreness: true });
    } else {
      onChange({});
    }
  };
  
  const handleMuscleChange = (muscle: string, checked: boolean) => {
    const updatedMap = { ...value };
    
    // Remove _no_soreness if selecting a muscle
    if (checked && updatedMap._no_soreness) {
      delete updatedMap._no_soreness;
    }
    
    // Update the muscle
    if (checked) {
      updatedMap[muscle] = true;
    } else {
      delete updatedMap[muscle];
    }
    
    onChange(updatedMap);
  };
  
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-200">Select muscle groups where you feel soreness:</h4>
      
      {/* No Soreness Option */}
      <div 
        className="flex items-center space-x-2 p-4 mb-4 bg-[rgb(30,30,30)] rounded-md border border-gray-700 cursor-pointer"
        onClick={() => handleNoSorenessChange(!value._no_soreness)}
      >
        <Checkbox 
          id="no_soreness"
          checked={!!value._no_soreness}
          onCheckedChange={(checked) => handleNoSorenessChange(!!checked)}
        />
        <label 
          htmlFor="no_soreness" 
          className="text-base font-medium leading-none text-gray-200 flex-1 cursor-pointer"
        >
          I have no muscle soreness today
        </label>
      </div>
      
      {/* Only show muscle groups if "No soreness" is not checked */}
      {!value._no_soreness && (
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            {/* Two-column layout for muscle groups */}
            <div className="grid grid-cols-2">
              {/* Column 1 */}
              <div className="border-r border-gray-800">
                {upperBodyMuscles.map((muscle) => (
                  <div 
                    key={muscle}
                    className="flex items-center p-3 cursor-pointer hover:bg-gray-800/30 border-b border-gray-800"
                    onClick={() => handleMuscleChange(muscle, !value[muscle])}
                  >
                    <Checkbox 
                      id={`soreness-${muscle}`}
                      className="mr-3"
                      checked={!!value[muscle]}
                      onCheckedChange={(checked) => handleMuscleChange(muscle, !!checked)}
                    />
                    <span className="flex-1 text-gray-200 capitalize cursor-pointer">
                      {muscle}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Column 2 */}
              <div>
                {lowerBodyMuscles.map((muscle) => (
                  <div 
                    key={muscle}
                    className="flex items-center p-3 cursor-pointer hover:bg-gray-800/30 border-b border-gray-800"
                    onClick={() => handleMuscleChange(muscle, !value[muscle])}
                  >
                    <Checkbox 
                      id={`soreness-${muscle}`}
                      className="mr-3"
                      checked={!!value[muscle]}
                      onCheckedChange={(checked) => handleMuscleChange(muscle, !!checked)}
                    />
                    <span className="flex-1 text-gray-200 capitalize cursor-pointer">
                      {muscle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}