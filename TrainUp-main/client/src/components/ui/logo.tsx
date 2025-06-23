import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "dark";
}

export function Logo({ className, size = "md", variant = "default" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const colorScheme = {
    default: {
      primary: "#CBFF00",
      secondary: "#9AE000",
      background: "#f8f9fa",
      border: "#e9ecef"
    },
    white: {
      primary: "#CBFF00",
      secondary: "#9AE000", 
      background: "#ffffff",
      border: "#f1f3f4"
    },
    dark: {
      primary: "#CBFF00",
      secondary: "#9AE000",
      background: "transparent",
      border: "transparent"
    }
  };

  const colors = colorScheme[variant];

  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses[size], className)}
    >
      <defs>
        <linearGradient id={`mainGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity={1} />
        </linearGradient>
        <filter id={`glow-${variant}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background circle */}
      {variant !== "dark" && (
        <circle 
          cx="100" 
          cy="100" 
          r="95" 
          fill={colors.background} 
          stroke={colors.border} 
          strokeWidth="2"
        />
      )}
      
      {/* Main "T" for TrainUp */}
      <g filter={`url(#glow-${variant})`}>
        {/* Top horizontal bar */}
        <rect x="50" y="65" width="100" height="14" rx="7" fill={`url(#mainGrad-${variant})`}/>
        {/* Vertical stem */}
        <rect x="93" y="65" width="14" height="85" rx="7" fill={`url(#mainGrad-${variant})`}/>
      </g>
      
      {/* Athletic elements - barbell */}
      <g fill={`url(#mainGrad-${variant})`} opacity="0.8">
        {/* Left weight */}
        <circle cx="75" cy="160" r="10"/>
        <rect x="70" y="148" width="10" height="24" rx="3"/>
        
        {/* Right weight */}
        <circle cx="125" cy="160" r="10"/>
        <rect x="120" y="148" width="10" height="24" rx="3"/>
        
        {/* Bar connecting weights */}
        <rect x="80" y="158" width="40" height="4" rx="2"/>
      </g>
      
      {/* Accent dots for energy/movement */}
      <g fill={colors.primary} opacity="0.4">
        <circle cx="45" cy="45" r="3"/>
        <circle cx="155" cy="45" r="3"/>
        <circle cx="155" cy="155" r="3"/>
      </g>
    </svg>
  );
}

export function LogoText({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold text-lg tracking-tight", className)}>
      Train<span className="text-primary">Up</span>
    </span>
  );
}

export function LogoWithText({ 
  className, 
  logoSize = "md", 
  variant = "default" 
}: { 
  className?: string;
  logoSize?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "dark";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo size={logoSize} variant={variant} />
      <LogoText />
    </div>
  );
}