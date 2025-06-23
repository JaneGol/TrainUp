import clsx from "clsx";

const getColor = (v: number, m: number) =>
  v / m >= 0.8 ? "stroke-green-400"
  : v / m >= 0.6 ? "stroke-yellow-300"
  : "stroke-red-400";

export default function Gauge({
  value, 
  max, 
  size = 56
}: { 
  value: number; 
  max: number; 
  size?: number 
}) {
  const radius = size / 2 - 4;
  const dash = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value / max, 0), 1); // Clamp between 0 and 1
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-90 -scale-y-100">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius}
          className="stroke-gray-700" 
          strokeWidth="4" 
          fill="none"
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius}
          className={clsx("fill-none", getColor(value, max))}
          strokeWidth="4" 
          strokeDasharray={dash}
          strokeDashoffset={dash * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white/90">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}