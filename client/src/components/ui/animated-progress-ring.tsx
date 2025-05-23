import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedProgressRingProps {
  /** Progress value between 0 and 100 */
  progress: number;
  /** Size of the ring in pixels */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Ring color - defaults to lime green theme */
  color?: string;
  /** Background ring color */
  backgroundColor?: string;
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Show percentage text in center */
  showPercentage?: boolean;
  /** Custom label instead of percentage */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export function AnimatedProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'rgb(200, 255, 1)', // TrainUpSOTA lime green
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  animationDuration = 1.5,
  showPercentage = true,
  label,
  className = ''
}: AnimatedProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Calculate circle properties
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash offset for progress
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;
  
  // Animate progress on mount or when progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100); // Small delay for better visual effect
    
    return () => clearTimeout(timer);
  }, [progress]);
  
  // Determine text color based on progress level
  const getTextColor = (progress: number) => {
    if (progress >= 80) return 'text-green-400';
    if (progress >= 60) return 'text-yellow-400';
    if (progress >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  
  // Determine ring color based on progress level
  const getRingColor = (progress: number) => {
    if (progress >= 80) return 'rgb(200, 255, 1)'; // Lime green
    if (progress >= 60) return 'rgb(251, 191, 36)'; // Yellow
    if (progress >= 40) return 'rgb(251, 146, 60)'; // Orange
    return 'rgb(239, 68, 68)'; // Red
  };
  
  const ringColor = getRingColor(animatedProgress);
  const textColor = getTextColor(animatedProgress);
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: animationDuration,
            ease: "easeOut"
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${ringColor}40)` // Subtle glow effect
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && !label && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animationDuration * 0.6, duration: 0.3 }}
            className={`text-2xl font-bold ${textColor}`}
          >
            {Math.round(animatedProgress)}%
          </motion.div>
        )}
        
        {label && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animationDuration * 0.6, duration: 0.3 }}
            className="text-center"
          >
            <div className={`text-lg font-bold ${textColor}`}>
              {Math.round(animatedProgress)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {label}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Wellness-specific progress ring with predefined styling
export function WellnessProgressRing({
  readinessScore,
  size = 100,
  className = ''
}: {
  readinessScore: number;
  size?: number;
  className?: string;
}) {
  return (
    <AnimatedProgressRing
      progress={readinessScore}
      size={size}
      strokeWidth={6}
      animationDuration={2}
      label="Readiness"
      className={className}
    />
  );
}

// Mini progress ring for compact displays
export function MiniProgressRing({
  progress,
  size = 60,
  className = ''
}: {
  progress: number;
  size?: number;
  className?: string;
}) {
  return (
    <AnimatedProgressRing
      progress={progress}
      size={size}
      strokeWidth={4}
      animationDuration={1}
      showPercentage={true}
      className={className}
    />
  );
}