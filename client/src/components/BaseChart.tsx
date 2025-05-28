import { ReactNode } from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

interface BaseChartProps {
  children: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  height?: number;
  className?: string;
}

interface ErrorMessageProps {
  children: ReactNode;
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center h-64 text-red-400 bg-gray-800/50 rounded-lg border border-red-400/20">
      <div className="text-center">
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ height = 64 }: { height?: number }) {
  return (
    <div className={`flex items-center justify-center h-${height} text-gray-400`}>
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function BaseChart({ 
  children, 
  isLoading, 
  isError, 
  height = 400,
  className = ""
}: BaseChartProps) {
  if (isLoading) {
    return <LoadingSpinner height={height} />;
  }

  if (isError) {
    return <ErrorMessage>Failed to load chart data</ErrorMessage>;
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// Common chart styling constants
export const CHART_STYLES = {
  grid: {
    strokeDasharray: "3 3",
    stroke: "#374151",
    opacity: 0.3
  },
  axis: {
    fontSize: 12,
    fill: "#9CA3AF",
    fontFamily: "Inter, sans-serif"
  },
  colors: {
    field: "#b5f23d",
    gym: "#547aff", 
    match: "#ff6f6f",
    acwr: "#fbbf24"
  }
} as const;