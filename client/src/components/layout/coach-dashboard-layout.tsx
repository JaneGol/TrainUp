import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CoachDashboardLayoutProps {
  children: ReactNode;
}

const CoachDashboardLayout = ({ children }: CoachDashboardLayoutProps) => {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out",
        });
      },
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Top nav bar - similar to athlete interface */}
      <header className="bg-zinc-900 py-4 px-6 flex justify-between items-center border-b border-zinc-800">
        <div className="w-20">
          {/* Empty space for balance */}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium">Sport Team Performance Tracker</h2>
        </div>
        <div>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-zinc-800 flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-zinc-900 py-2 px-6 text-center text-sm text-zinc-500">
        <p>Sport Team Performance Tracker</p>
      </footer>
    </div>
  );
};

export default CoachDashboardLayout;