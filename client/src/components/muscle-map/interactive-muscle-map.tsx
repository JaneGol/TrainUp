import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Type definitions for muscle views and groups
export type MuscleView = 'front' | 'back';
export type FrontMuscleGroup = 'shoulders' | 'chest' | 'abs' | 'legs' | 'neck';
export type BackMuscleGroup = 'hamstrings' | 'back' | 'glutes' | 'calves';
export type MuscleGroup = FrontMuscleGroup | BackMuscleGroup;

// Define props interface
interface InteractiveMuscleMapProps {
  selectedMuscles: Partial<Record<MuscleGroup, boolean>>;
  onChange: (muscles: Partial<Record<MuscleGroup, boolean>>) => void;
}

export default function InteractiveMuscleMap({ 
  selectedMuscles = {}, 
  onChange 
}: InteractiveMuscleMapProps) {
  // Default state for muscle view (front or back)
  const [currentView, setCurrentView] = useState<MuscleView>('front');
  
  // Define muscle group lists
  const frontMuscleGroups: FrontMuscleGroup[] = ['shoulders', 'chest', 'abs', 'legs', 'neck'];
  const backMuscleGroups: BackMuscleGroup[] = ['hamstrings', 'back', 'glutes', 'calves'];
  
  // Labels for muscle groups
  const muscleLabels: Record<MuscleGroup, string> = {
    shoulders: 'Shoulders',
    chest: 'Chest',
    abs: 'Abs',
    legs: 'Legs',
    neck: 'Neck',
    hamstrings: 'Hamstrings',
    back: 'Back',
    glutes: 'Glutes',
    calves: 'Calves'
  };
  
  // Handle muscle selection
  const handleMuscleToggle = (muscle: MuscleGroup) => {
    const updatedMuscles = {
      ...selectedMuscles,
      [muscle]: !selectedMuscles[muscle]
    };
    onChange(updatedMuscles);
  };

  // SVG Definitions for front and back view
  const FrontView = () => (
    <svg 
      viewBox="0 0 260 580" 
      className="h-full max-h-[360px] w-auto mx-auto" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base body outline */}
      <g stroke="white" strokeWidth="2" fill="none">
        <path d="M130,24 C105,24 100,35 98,47 C96,59 98,71 98,71 L98,77 C91,81 87,94 87,101 C87,108 91,116 93,118 C93,118 91,139 91,146 C91,153 92,156 96,163 C100,170 110,175 110,175 L109,192 C89,198 74,222 73,244 C72,266 73,280 70,309 C67,338 57,360 57,360 L58,441 C58,441 64,456 67,469 C70,482 67,504 67,517 C67,530 58,546 58,546 L101,546 C101,546 105,528 105,518 C105,508 105,482 105,482 C105,482 112,510 116,518 C120,526 129,546 129,546 L130,546" />
        <path d="M130,24 C155,24 160,35 162,47 C164,59 162,71 162,71 L162,77 C169,81 173,94 173,101 C173,108 169,116 167,118 C167,118 169,139 169,146 C169,153 168,156 164,163 C160,170 150,175 150,175 L151,192 C171,198 186,222 187,244 C188,266 187,280 190,309 C193,338 203,360 203,360 L202,441 C202,441 196,456 193,469 C190,482 193,504 193,517 C193,530 202,546 202,546 L159,546 C159,546 155,528 155,518 C155,508 155,482 155,482 C155,482 148,510 144,518 C140,526 131,546 131,546 L130,546" />
        
        {/* Face details */}
        <path d="M115,45 C115,45 120,52 130,52 C140,52 145,45 145,45" />
        <ellipse cx="115" cy="40" rx="3" ry="2" />
        <ellipse cx="145" cy="40" rx="3" ry="2" />
        
        {/* Neck - highlight on select */}
        <path 
          d="M116,63 C116,63 123,73 130,73 C137,73 144,63 144,63" 
          fill={selectedMuscles.neck ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Shoulders - highlight on select */}
        <path 
          d="M96,100 C96,100 83,105 78,115 C73,125 71,135 71,135" 
          fill={selectedMuscles.shoulders ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M164,100 C164,100 177,105 182,115 C187,125 189,135 189,135" 
          fill={selectedMuscles.shoulders ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Chest - highlight on select */}
        <path 
          d="M105,120 C105,120 115,140 130,140 C145,140 155,120 155,120 C155,120 150,100 130,100 C110,100 105,120 105,120Z" 
          fill={selectedMuscles.chest ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Abs - highlight on select */}
        <path 
          d="M115,150 C115,150 115,155 130,155 C145,155 145,150 145,150 C145,150 145,200 130,200 C115,200 115,150 115,150Z" 
          fill={selectedMuscles.abs ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M115,210 C115,210 115,225 130,225 C145,225 145,210 145,210"
          fill={selectedMuscles.abs ? "#98FB98" : "none"} 
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M115,235 C115,235 115,255 130,255 C145,255 145,235 145,235"
          fill={selectedMuscles.abs ? "#98FB98" : "none"} 
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Arms */}
        <path d="M70,135 C70,135 65,160 65,180 C65,200 70,240 70,240" />
        <path d="M190,135 C190,135 195,160 195,180 C195,200 190,240 190,240" />
        
        <path d="M69,170 C69,170 60,180 60,200 C60,220 65,230 65,230" />
        <path d="M191,170 C191,170 200,180 200,200 C200,220 195,230 195,230" />
        
        {/* Legs - highlight on select */}
        <path 
          d="M90,320 C90,320 85,400 85,450 C85,500 90,546 90,546" 
          fill={selectedMuscles.legs ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M170,320 C170,320 175,400 175,450 C175,500 170,546 170,546"
          fill={selectedMuscles.legs ? "#98FB98" : "none"} 
          style={{ transition: "fill 0.3s ease" }}
        />
        
        <path 
          d="M110,280 C110,280 105,330 105,380 C105,430 110,480 110,480"
          fill={selectedMuscles.legs ? "#98FB98" : "none"} 
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M150,280 C150,280 155,330 155,380 C155,430 150,480 150,480"
          fill={selectedMuscles.legs ? "#98FB98" : "none"} 
          style={{ transition: "fill 0.3s ease" }}
        />
      </g>
    </svg>
  );
  
  const BackView = () => (
    <svg 
      viewBox="0 0 260 580" 
      className="h-full max-h-[360px] w-auto mx-auto" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base body outline */}
      <g stroke="white" strokeWidth="2" fill="none">
        <path d="M130,24 C105,24 100,35 98,47 C96,59 98,71 98,71 L98,77 C91,81 87,94 87,101 C87,108 91,116 93,118 C93,118 91,139 91,146 C91,153 92,156 96,163 C100,170 110,175 110,175 L109,192 C89,198 74,222 73,244 C72,266 73,280 70,309 C67,338 57,360 57,360 L58,441 C58,441 64,456 67,469 C70,482 67,504 67,517 C67,530 58,546 58,546 L101,546 C101,546 105,528 105,518 C105,508 105,482 105,482 C105,482 112,510 116,518 C120,526 129,546 129,546 L130,546" />
        <path d="M130,24 C155,24 160,35 162,47 C164,59 162,71 162,71 L162,77 C169,81 173,94 173,101 C173,108 169,116 167,118 C167,118 169,139 169,146 C169,153 168,156 164,163 C160,170 150,175 150,175 L151,192 C171,198 186,222 187,244 C188,266 187,280 190,309 C193,338 203,360 203,360 L202,441 C202,441 196,456 193,469 C190,482 193,504 193,517 C193,530 202,546 202,546 L159,546 C159,546 155,528 155,518 C155,508 155,482 155,482 C155,482 148,510 144,518 C140,526 131,546 131,546 L130,546" />
        
        {/* Back - highlight when selected */}
        <path 
          d="M110,100 C110,100 120,110 130,110 C140,110 150,100 150,100 C150,100 150,180 130,180 C110,180 110,100 110,100Z" 
          fill={selectedMuscles.back ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M110,190 C110,190 120,200 130,200 C140,200 150,190 150,190 C150,190 150,240 130,240 C110,240 110,190 110,190Z" 
          fill={selectedMuscles.back ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Arms */}
        <path d="M70,135 C70,135 65,160 65,180 C65,200 70,240 70,240" />
        <path d="M190,135 C190,135 195,160 195,180 C195,200 190,240 190,240" />
        
        <path d="M69,170 C69,170 60,180 60,200 C60,220 65,230 65,230" />
        <path d="M191,170 C191,170 200,180 200,200 C200,220 195,230 195,230" />
        
        {/* Glutes - highlight when selected */}
        <path 
          d="M115,260 C115,260 115,280 130,280 C145,280 145,260 145,260 C145,260 150,270 150,280 C150,290 145,300 140,305 C135,310 125,310 120,305 C115,300 110,290 110,280 C110,270 115,260 115,260Z" 
          fill={selectedMuscles.glutes ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Hamstrings - highlight when selected */}
        <path 
          d="M110,310 C110,310 105,350 105,370 C105,390 110,410 110,410 C110,410 120,410 130,410 C140,410 150,410 150,410 C150,410 155,390 155,370 C155,350 150,310 150,310 C150,310 140,320 130,320 C120,320 110,310 110,310Z" 
          fill={selectedMuscles.hamstrings ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        
        {/* Calves - highlight when selected */}
        <path 
          d="M105,420 C105,420 100,450 100,470 C100,490 105,520 105,520 C105,520 110,520 120,520 C130,520 130,520 130,520" 
          fill={selectedMuscles.calves ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <path 
          d="M155,420 C155,420 160,450 160,470 C160,490 155,520 155,520 C155,520 150,520 140,520 C130,520 130,520 130,520" 
          fill={selectedMuscles.calves ? "#98FB98" : "none"}
          style={{ transition: "fill 0.3s ease" }}
        />
      </g>
    </svg>
  );

  return (
    <div className="flex flex-col md:flex-row gap-5 py-2">
      {/* Muscle group selection */}
      <div className="w-full md:w-1/3 bg-[rgb(30,30,30)] p-4 rounded-md min-h-[360px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Muscle Groups</h3>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
            className="text-gray-300 hover:text-white flex items-center gap-1 px-2 py-1 text-sm"
          >
            {currentView === 'front' ? 'Show Back' : 'Show Front'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {/* Display appropriate muscle groups based on view */}
          {currentView === 'front' ? (
            <>
              <p className="text-gray-400 font-medium text-sm">Front View</p>
              {frontMuscleGroups.map((muscle) => (
                <div key={muscle} className="flex items-center space-x-2">
                  <Checkbox 
                    id={muscle} 
                    checked={selectedMuscles[muscle] || false}
                    onCheckedChange={() => handleMuscleToggle(muscle)}
                  />
                  <label 
                    htmlFor={muscle} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200"
                  >
                    {muscleLabels[muscle]}
                  </label>
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="text-gray-400 font-medium text-sm">Back View</p>
              {backMuscleGroups.map((muscle) => (
                <div key={muscle} className="flex items-center space-x-2">
                  <Checkbox 
                    id={muscle} 
                    checked={selectedMuscles[muscle] || false}
                    onCheckedChange={() => handleMuscleToggle(muscle)}
                  />
                  <label 
                    htmlFor={muscle} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200"
                  >
                    {muscleLabels[muscle]}
                  </label>
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Show selected muscles list */}
        {Object.entries(selectedMuscles).some(([_, isSelected]) => isSelected) && (
          <div className="mt-6">
            <p className="text-gray-400 font-medium text-sm mb-2">Selected Areas:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedMuscles)
                .filter(([key, isSelected]) => isSelected && key !== '_no_soreness')
                .map(([key]) => (
                  <div 
                    key={key}
                    className="bg-primary bg-opacity-20 text-primary text-xs px-2 py-1 rounded-full"
                  >
                    {muscleLabels[key as MuscleGroup] || key}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Body visualization */}
      <div className="w-full md:w-2/3 relative">
        <div className="bg-[rgb(30,30,30)] p-4 rounded-md h-full">
          {/* Display the appropriate view */}
          {currentView === 'front' ? <FrontView /> : <BackView />}
          
          {/* Color legend */}
          <div className="flex justify-center mt-4 space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#98FB98] mr-1"></div>
              <span className="text-gray-300">Selected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}