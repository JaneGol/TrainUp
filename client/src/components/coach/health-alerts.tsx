import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";

interface HealthAlert {
  id: number;
  userId: number;
  symptom: string;
  severity: number;
  bodyPart: string;
  notes?: string;
  status: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface HealthAlertsProps {
  alerts: HealthAlert[];
  isLoading: boolean;
}

export default function HealthAlerts({ alerts, isLoading }: HealthAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Alerts</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return "Just now";
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
    return `${Math.floor(secondsAgo / 86400)} days ago`;
  };
  
  // Mock athlete names when not provided
  const getMockedAthleteName = (alert: HealthAlert) => {
    const mockNames = ["Sarah Chen", "Jamal Brown", "Emma Wilson", "Alex Morgan"];
    if (alert.user) return `${alert.user.firstName} ${alert.user.lastName}`;
    return mockNames[alert.id % mockNames.length];
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`flex p-3 rounded-lg ${
                  alert.severity > 7 
                    ? "bg-red-50 border-l-4 border-destructive" 
                    : "bg-yellow-50 border-l-4 border-warning"
                }`}
              >
                <div className="flex-shrink-0 mr-3">
                  <AlertTriangle className={`${
                    alert.severity > 7 ? "text-destructive" : "text-warning"
                  } text-xl`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{getMockedAthleteName(alert)}</h4>
                  <p className="text-sm text-gray-600">
                    Reported {alert.symptom} ({alert.severity}/10) in {alert.bodyPart} area
                  </p>
                  {alert.notes && (
                    <p className="text-xs text-gray-500 mt-1">{alert.notes}</p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {getTimeAgo(alert.createdAt)}
                    </span>
                    <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 flex flex-col items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-gray-300 mb-2" />
            <p>No health alerts at this time</p>
            <p className="text-xs text-gray-400 mt-1">All athletes are doing well</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
