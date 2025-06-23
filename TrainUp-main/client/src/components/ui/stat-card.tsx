import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TrendProps {
  value: string;
  direction: "up" | "down";
  text: string;
}

interface StatCardProps {
  title: string;
  value: string;
  trend?: TrendProps;
  info?: React.ReactNode;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent" | "warning" | "destructive";
}

export default function StatCard({ title, value, trend, info, icon, color }: StatCardProps) {
  const borderColorClass = `border-l-4 border-${color}`;
  const iconBgClass = `bg-${color}-light`;
  const iconTextClass = `text-${color}`;
  
  return (
    <Card className={`${borderColorClass}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {trend ? (
              <p className={`text-xs ${trend.direction === "up" ? "text-accent" : "text-destructive"} flex items-center`}>
                {trend.direction === "up" ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {trend.value} {trend.text}
              </p>
            ) : info ? (
              <div className="text-xs text-gray-500">{info}</div>
            ) : null}
          </div>
          <div className={`${iconBgClass} p-2 rounded-lg`}>
            <div className={`${iconTextClass}`}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
