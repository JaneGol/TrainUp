import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle2, Search, Calendar, FileText, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function AthleteLogsPage() {
  const [, navigate] = useLocation();
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Get all athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/athletes"],
  });
  
  // Get selected athlete's training entries if an athlete is selected
  const { data: trainingEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/athletes", selectedAthlete, "training-entries"],
    enabled: !!selectedAthlete,
  });
  
  // Filter athletes based on search query
  const filteredAthletes = athletes?.filter((athlete: any) => {
    if (!searchQuery) return true;
    
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }) || [];
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Athlete Logs</h2>
        
        <Tabs defaultValue="athlete-logs" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="team-overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/coach")}
            >
              Team Overview
            </TabsTrigger>
            <TabsTrigger 
              value="athlete-logs" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Athlete Logs
            </TabsTrigger>
            <TabsTrigger 
              value="performance-analytics" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/coach/performance-analytics")}
            >
              Performance Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="training-plans" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Training Plans
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="athlete-logs" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Athletes</span>
                      <Button variant="outline" size="sm">
                        <UserCircle2 className="h-4 w-4 mr-1" />
                        <span>View All</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search athlete"
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {athletesLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredAthletes.length > 0 ? (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {filteredAthletes.map((athlete: any) => (
                          <div 
                            key={athlete.id} 
                            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                              selectedAthlete === athlete.id.toString() 
                                ? "bg-primary-light text-primary" 
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => setSelectedAthlete(athlete.id.toString())}
                          >
                            <Avatar>
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {athlete.firstName[0]}{athlete.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{athlete.firstName} {athlete.lastName}</p>
                              <p className="text-xs text-gray-500">{athlete.teamPosition}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <UserCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No athletes found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-3">
                {selectedAthlete ? (
                  <>
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Training Logs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {entriesLoading ? (
                          <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : trainingEntries?.length > 0 ? (
                          <div className="space-y-6">
                            {trainingEntries.map((entry: any) => (
                              <div key={entry.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">{entry.trainingType}</h4>
                                    <p className="text-sm text-gray-500 flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <Badge variant={
                                    entry.effortLevel > 7 ? "destructive" : 
                                    entry.effortLevel > 5 ? "secondary" : "outline"
                                  }>
                                    Effort: {entry.effortLevel}/10
                                  </Badge>
                                </div>
                                
                                {entry.notes && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-600">{entry.notes}</p>
                                  </div>
                                )}
                                
                                <div className="mt-3 flex items-center text-xs text-gray-500">
                                  <span className="flex items-center mr-3">
                                    <span className="flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full mr-1">
                                      {entry.mood === "great" && "😃"}
                                      {entry.mood === "good" && "🙂"}
                                      {entry.mood === "tired" && "😴"}
                                      {entry.mood === "stressed" && "😓"}
                                    </span>
                                    {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                                  </span>
                                  <Badge variant={entry.coachReviewed ? "success" : "outline"} className="text-xs">
                                    {entry.coachReviewed ? "Reviewed" : "Pending Review"}
                                  </Badge>
                                </div>
                                
                                {!entry.coachReviewed && (
                                  <div className="mt-3">
                                    <Textarea 
                                      placeholder="Add feedback for this entry..."
                                      className="text-sm resize-none"
                                      rows={2}
                                    />
                                    <div className="flex justify-end mt-2">
                                      <Button size="sm" className="flex items-center">
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Send Feedback
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No training logs yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Health Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">View athlete health reports and symptoms</p>
                          {/* Content would be loaded based on selected athlete */}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Fitness Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">View athlete fitness metrics and improvement</p>
                          {/* Content would be loaded based on selected athlete */}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-8">
                      <UserCircle2 className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Select an Athlete</h3>
                      <p className="text-gray-600 text-center">
                        Choose an athlete from the list to view their training logs, health reports, and fitness progress.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
