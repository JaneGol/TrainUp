import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainingEntryForm from "@/components/forms/training-entry-form";
import RecentEntries from "@/components/athlete/recent-entries";
import { useLocation } from "wouter";

export default function TrainingDiary() {
  const [, navigate] = useLocation();
  
  // Get athlete training entries
  const { data: trainingEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/training-entries"],
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Training Diary</h2>
        
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
