import { Slider } from "@/components/ui/slider";
import { FormLabel } from "@/components/ui/form";

interface MuscleSorenessSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function MuscleSorenessSlider({ value, onChange }: MuscleSorenessSliderProps) {
  return (
    <div className="mb-4 ml-6 border-l-2 border-zinc-700 pl-4">
      <FormLabel className="text-white">How intense is your muscle soreness?</FormLabel>
      <div className="space-y-2 mt-3">
        <div className="py-3">
          <Slider
            min={1}
            max={10}
            step={1}
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            className="muscle-soreness-independent-slider"
            id="muscle-soreness-slider-unique"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <span key={`muscle-${num}`}>{num}</span>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-0">
          <span>Mild</span>
          <span className="ml-auto">Severe</span>
        </div>
      </div>
    </div>
  );
}