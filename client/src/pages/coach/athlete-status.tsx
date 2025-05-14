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

export default function AthleteStatusPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
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
  
  // Filter athletes based on search term and selected tab
  const filteredAthletes = athleteReadiness
    ? athleteReadiness
        .filter((athlete: any) => {
          const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
          if (selectedTab === "all") return matchesSearch;
          if (selectedTab === "high-risk") return matchesSearch && athlete.riskScore > 7;
          if (selectedTab === "moderate-risk") return matchesSearch && athlete.riskScore > 4 && athlete.riskScore <= 7;
          if (selectedTab === "low-risk") return matchesSearch && athlete.riskScore <= 4;
          return matchesSearch;
        })
    : [];
  
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
        
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <Input
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              placeholder="Search athletes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 bg-zinc-900">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high-risk" className="text-red-500">High Risk</TabsTrigger>
              <TabsTrigger value="moderate-risk" className="text-yellow-500">Moderate</TabsTrigger>
              <TabsTrigger value="low-risk" className="text-green-500">Low Risk</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Athlete list */}
        {readinessLoading ? (
          <p className="text-center py-8">Loading athlete data...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filteredAthletes || []).map((athlete: any, index: number) => (
              <Card key={index} className="bg-zinc-900 border-zinc-700 overflow-hidden">
                <div 
                  className={`h-2 w-full ${
                    athlete.readinessScore > 75 ? 'bg-green-500' : 
                    athlete.readinessScore > 50 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} 
                />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{athlete.name}</CardTitle>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      athlete.readinessScore > 75 ? 'bg-green-500/20 text-green-300' : 
                      athlete.readinessScore > 50 ? 'bg-yellow-500/20 text-yellow-300' : 
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {athlete.readinessScore > 75 ? 'Low Risk' : 
                       athlete.readinessScore > 50 ? 'Moderate Risk' : 
                       'High Risk'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/20 mr-2">
                        <Gauge className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Readiness</p>
                        <p className="font-bold">{athlete.readinessScore}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-red-500/20 mr-2">
                        <Heart className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Risk Score</p>
                        <p className="font-bold">{athlete.riskScore}/10</p>
                      </div>
                    </div>
                  </div>
                  
                  {athlete.issues.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-zinc-400 mb-1">Concerns:</p>
                      <ul className="text-sm space-y-1">
                        {athlete.issues.map((issue: string, i: number) => (
                          <li key={i} className="text-red-300 text-xs">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={() => navigate(`/coach/athlete/${athlete.athleteId}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {filteredAthletes.length === 0 && (
              <div className="col-span-full text-center py-8 text-zinc-400">
                <User2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No athletes match your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </CoachDashboardLayout>
  );
}