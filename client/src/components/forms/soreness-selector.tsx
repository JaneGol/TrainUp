import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface SorenessSelectorProps {
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
}

export function SorenessSelector({ value = {}, onChange }: SorenessSelectorProps) {
  // We'll directly use the props value for rendering
  // This avoids state synchronization issues
  const upperBodyMuscles = ["shoulders", "chest", "arms", "back", "neck", "core"];
  const lowerBodyMuscles = ["hips", "glutes", "thighs", "hamstrings", "knees", "calves"];
  
  const hasNoSoreness = !!value._no_soreness;
  
  // Toggle "No soreness" option
  const toggleNoSoreness = () => {
    const newState = !hasNoSoreness;
    const newSelections: Record<string, boolean> = newState 
      ? { _no_soreness: true } 
      : {};
    
    // Propagate change to parent component
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
    
    // Propagate change to parent component
    onChange(newSelections);
  };
  
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-200">Select muscle groups where you feel soreness:</h4>
      
      {/* No Soreness Option with select-like styling */}
      <div className="mb-4">
        <div 
          className={`bg-[rgb(38,38,38)] border border-gray-700 rounded-md p-3 cursor-pointer ${
            hasNoSoreness ? "ring-2 ring-primary" : ""
          }`}
          onClick={toggleNoSoreness}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="no_soreness"
                checked={hasNoSoreness}
                onCheckedChange={() => toggleNoSoreness()}
              />
              <label 
                htmlFor="no_soreness" 
                className="text-sm font-medium leading-none text-white cursor-pointer"
              >
                I have no muscle soreness today
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Only show muscle groups if "No soreness" is not checked */}
      {!hasNoSoreness && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Upper Body Muscles */}
            <div className="space-y-2">
              <h5 className="text-sm text-gray-400 ml-1 mb-2">Upper Body</h5>
              {upperBodyMuscles.map((muscle) => {
                const isSelected = !!value[muscle];
                return (
                  <div 
                    key={muscle}
                    className={`bg-[rgb(38,38,38)] border border-gray-700 rounded-md p-3 cursor-pointer ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleMuscle(muscle)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`soreness-${muscle}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleMuscle(muscle)}
                        />
                        <label
                          htmlFor={`soreness-${muscle}`}
                          className="text-sm font-medium leading-none text-white cursor-pointer capitalize"
                        >
                          {muscle}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Lower Body Muscles */}
            <div className="space-y-2">
              <h5 className="text-sm text-gray-400 ml-1 mb-2">Lower Body</h5>
              {lowerBodyMuscles.map((muscle) => {
                const isSelected = !!value[muscle];
                return (
                  <div 
                    key={muscle}
                    className={`bg-[rgb(38,38,38)] border border-gray-700 rounded-md p-3 cursor-pointer ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleMuscle(muscle)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`soreness-${muscle}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleMuscle(muscle)}
                        />
                        <label
                          htmlFor={`soreness-${muscle}`}
                          className="text-sm font-medium leading-none text-white cursor-pointer capitalize"
                        >
                          {muscle}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}