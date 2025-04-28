import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatCard from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainingEntryForm from "@/components/forms/training-entry-form";
import RecentEntries from "@/components/athlete/recent-entries";
import { Battery, HeartPulse, Clock, CalendarClock } from "lucide-react";

export default function AthleteDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (user && user.role === "coach") {
      navigate("/coach");
    }
  }, [user, navigate]);

  // Get athlete training entries
  const { data: trainingEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/training-entries"],
  });

  // Calculate weekly training load (average of effort levels in the last 7 days)
  const weeklyTrainingLoad = trainingEntries?.length
    ? (
        trainingEntries
          .filter((entry: any) => {
            const entryDate = new Date(entry.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entryDate >= weekAgo;
          })
          .reduce((sum: number, entry: any) => sum + entry.effortLevel, 0) / 
        trainingEntries
          .filter((entry: any) => {
            const entryDate = new Date(entry.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entryDate >= weekAgo;
          }).length
      ).toFixed(1)
    : "0.0";

  // Mock data for demo, would come from API in production
  const energyLevel = "87%";
  const recoveryStatus = "Good";
  const nextTraining = "2h 15m";

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Athlete Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Weekly Training Load" 
            value={weeklyTrainingLoad} 
            trend={{
              value: "0.6",
              direction: "up",
              text: "from last week"
            }}
            icon={<HeartPulse className="h-5 w-5" />}
            color="primary"
          />
          
          <StatCard 
            title="Energy Level" 
            value={energyLevel} 
            trend={{
              value: "5%",
              direction: "up",
              text: "from yesterday"
            }}
            icon={<Battery className="h-5 w-5" />}
            color="secondary"
          />
          
          <StatCard 
            title="Recovery Status" 
            value={recoveryStatus} 
            info="Based on yesterday's data"
            icon={<Clock className="h-5 w-5" />}
            color="accent"
          />
          
          <StatCard 
            title="Next Training" 
            value={nextTraining} 
            info={
              <div className="flex items-center text-xs text-gray-500">
                <CalendarClock className="h-3 w-3 mr-1" />
                Today at 4:30 PM
              </div>
            }
            icon={<Clock className="h-5 w-5" />}
            color="warning"
          />
        </div>
        
        <Tabs defaultValue="training-diary" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="training-diary" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Training Diary
            </TabsTrigger>
            <TabsTrigger 
              value="fitness-progress" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/fitness-progress")}
            >
              Fitness Progress
            </TabsTrigger>
            <TabsTrigger 
              value="smart-doctor" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/smart-doctor")}
            >
              Smart Doctor
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Feedback
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="training-diary" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TrainingEntryForm />
              </div>
              <div>
                <RecentEntries entries={trainingEntries || []} isLoading={entriesLoading} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="feedback" className="mt-0">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Coach Feedback</h3>
              <p className="text-gray-600">No feedback available yet. Your coach will provide feedback on your training entries.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
