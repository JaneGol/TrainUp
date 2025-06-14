import { Slider } from "@/components/ui/slider";
import { FormLabel } from "@/components/ui/form";

interface InjuryPainSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function InjuryPainSlider({ value, onChange }: InjuryPainSliderProps) {
  return (
    <div className="space-y-2 mb-6">
      <FormLabel className="text-white">How intense is the injury pain?</FormLabel>
      <div className="py-3">
        <Slider
          min={1}
          max={5}
          step={1}
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          className="injury-pain-independent-slider"
          id="injury-pain-slider-unique"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <span key={`injury-${num}`}>{num}</span>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0">
        <span>Mild</span>
        <span className="ml-auto">Severe</span>
      </div>
    </div>
  );
}