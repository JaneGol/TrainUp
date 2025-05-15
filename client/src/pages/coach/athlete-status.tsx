import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CoachDashboardLayout from "@/components/layout/coach-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, Activity, User2, Gauge, Heart } from "lucide-react";
import HealthTrendChart from "@/components/coach/health-trend-chart";
import AthleteIconGrid from "@/components/coach/athlete-icon-grid";

export default function AthleteStatusPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Go back to dashboard
  const handleBackClick = () => {
    navigate("/coach/dashboard");
  };
  
  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get athlete readiness data
  const { data: athleteReadiness, isLoading: readinessLoading } = useQuery({
    queryKey: ["/api/analytics/athlete-recovery-readiness"],
  });
  
  return (
    <CoachDashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-2 hover:bg-zinc-800 text-white" 
            onClick={handleBackClick}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Athlete Status</h1>
        </div>
        
        {/* 7-Day Health Trends Chart */}
        <div className="mb-6">
          <HealthTrendChart 
            title="7-Day Team Wellness Trends" 
            description="Average values from athlete daily journals"
          />
        </div>
        
        {/* Filter tabs only */}
        <div className="flex mb-6 justify-center">
          <Tabs defaultValue="all" onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 bg-zinc-900">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high-risk" className="text-red-500">High Risk</TabsTrigger>
              <TabsTrigger value="moderate-risk" className="text-yellow-500">Moderate</TabsTrigger>
              <TabsTrigger value="low-risk" className="text-green-500">Low Risk</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Athlete Icon Grid - Only view */}
        <div className="mb-6">
          <AthleteIconGrid />
        </div>
      </div>
    </CoachDashboardLayout>
  );
}