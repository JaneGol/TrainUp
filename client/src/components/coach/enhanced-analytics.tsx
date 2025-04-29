import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define interfaces for our component props
interface WellnessTrend {
  date: string;
  value: number;
  category: string;
}

interface AthleteRecoveryReadiness {
  athleteId: number;
  name: string;
  readinessScore: number;
  trend: string;
  issues: string[];
}

interface InjuryRiskFactor {
  athleteId: number;
  name: string;
  riskScore: number;
  factors: string[];
}

interface TeamWellnessTrendsProps {
  data: WellnessTrend[] | undefined;
  categories: string[];
  isLoading: boolean;
  error: Error | null;
}

interface RecoveryReadinessDashboardProps {
  data: AthleteRecoveryReadiness[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

interface InjuryRiskAnalysisProps {
  data: InjuryRiskFactor[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const TeamWellnessTrends: React.FC<TeamWellnessTrendsProps> = ({ 
  data, 
  categories, 
  isLoading, 
  error 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Wellness Trends</CardTitle>
        <CardDescription>
          Tracking team-wide wellness metrics over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load wellness trends data. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ 
                    value: 'Score (0-5)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                  domain={[0, 5]}
                />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                {categories.map((category, index) => {
                  // Generate a different color for each category
                  const colors = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#64748b"];
                  const color = colors[index % colors.length];
                  
                  return (
                    <Line 
                      key={category} 
                      type="monotone" 
                      dataKey={category} 
                      stroke={color} 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const RecoveryReadinessDashboard: React.FC<RecoveryReadinessDashboardProps> = ({ 
  data, 
  isLoading, 
  error 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Readiness Dashboard</CardTitle>
        <CardDescription>
          Current athlete readiness scores and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load recovery readiness data. Please try again later.
            </AlertDescription>
          </Alert>
        ) : data && data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No recovery data available
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((item) => (
              <div key={item.athleteId} className="flex items-center p-4 bg-gray-50 rounded-md">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center">
                    <h4 className="font-semibold text-base">{item.name}</h4>
                    <Badge 
                      className={`ml-2 ${
                        item.trend === "improving" 
                          ? "bg-green-100 text-green-800" 
                          : item.trend === "declining" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <span className="flex items-center">
                        {item.trend === "improving" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {item.trend === "declining" && <TrendingDown className="h-3 w-3 mr-1" />}
                        {item.trend === "stable" && <Minus className="h-3 w-3 mr-1" />}
                        {item.trend}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">Readiness Score: {item.readinessScore}/10</p>
                    <Progress 
                      value={item.readinessScore * 10} 
                      className={`h-2 w-32 ${
                        item.readinessScore >= 7 
                          ? "data-[value]:bg-green-500" 
                          : item.readinessScore >= 5 
                            ? "data-[value]:bg-amber-500" 
                            : "data-[value]:bg-red-500"
                      }`}
                    />
                  </div>
                  {item.issues.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Issues to monitor:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.issues.map((issue, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="bg-red-50 text-red-700 border-red-200 text-xs"
                          >
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const InjuryRiskAnalysis: React.FC<InjuryRiskAnalysisProps> = ({ 
  data, 
  isLoading, 
  error 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Injury Risk Factor Analysis</CardTitle>
        <CardDescription>
          Identifying athletes with potential injury risks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load injury risk data. Please try again later.
            </AlertDescription>
          </Alert>
        ) : data && data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No injury risk data available
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((item) => (
              <div key={item.athleteId} className="flex items-center p-4 bg-gray-50 rounded-md">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center">
                    <h4 className="font-semibold text-base">{item.name}</h4>
                    <Badge 
                      className={`ml-2 ${
                        item.riskScore >= 7 
                          ? "bg-red-100 text-red-800" 
                          : item.riskScore >= 4 
                            ? "bg-amber-100 text-amber-800" 
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      Risk: {item.riskScore}/10
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">Risk Level:</p>
                    <Progress 
                      value={item.riskScore * 10} 
                      className={`h-2 w-32 ${
                        item.riskScore >= 7 
                          ? "data-[value]:bg-red-500" 
                          : item.riskScore >= 4 
                            ? "data-[value]:bg-amber-500" 
                            : "data-[value]:bg-green-500"
                      }`}
                    />
                  </div>
                  {item.factors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Contributing factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.factors.map((factor, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};