import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import RoleSwitcher from "@/components/layout/role-switcher";
import { 
  Home, 
  FileText, 
  BarChart, 
  HeartPulse, 
  MessageSquare, 
  ChevronLeft, 
  LogOut,
  Users,
  List,
  LineChart,
  CalendarClock,
  UserCircle,
  SunMoon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };
  
  // Define navigation items based on user role
  const athleteNavItems = [
    { label: "Self-Monitoring Diary", icon: <SunMoon className="h-5 w-5" />, href: "/morning-diary" },
    { label: "Training Evaluation", icon: <FileText className="h-5 w-5" />, href: "/training-diary" },
    { label: "Fitness Progress", icon: <BarChart className="h-5 w-5" />, href: "/fitness-progress" },
    { label: "Smart Doctor", icon: <HeartPulse className="h-5 w-5" />, href: "/smart-doctor" },
  ];
  
  const coachNavItems = [
    { label: "Dashboard", icon: <Home className="h-5 w-5" />, href: "/coach" },
    { label: "Team Overview", icon: <Users className="h-5 w-5" />, href: "/coach/team-overview" },
    { label: "Athlete Logs", icon: <List className="h-5 w-5" />, href: "/coach/athlete-logs" },
    { label: "Performance Analytics", icon: <LineChart className="h-5 w-5" />, href: "/coach/performance-analytics" },
    { label: "Training Plans", icon: <CalendarClock className="h-5 w-5" />, href: "/coach/training-plans" },
  ];
  
  const navItems = user?.role === "coach" ? coachNavItems : athleteNavItems;
  
  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href === "/coach" && location === "/coach") return true;
    return location.startsWith(href) && href !== "/" && href !== "/coach";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="py-6 px-4 border-b">
        <h2 className="text-xl font-bold text-primary">SportSync</h2>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            onClick={() => setSidebarOpen(false)}
          >
            <a
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary-light text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
      
      <div className="px-4 py-4 border-t">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
        <SidebarContent />
      </div>
      
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
            <div className="flex items-center">
              {isMobile && (
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setSidebarOpen(true)}>
                    <List className="h-5 w-5" />
                    <span className="sr-only">Open sidebar</span>
                  </Button>
                </SheetTrigger>
              )}
              <h1 className="md:hidden font-bold text-xl text-primary">SportSync</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <RoleSwitcher />
              
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
          <div className="grid grid-cols-4">
            {navItems.slice(0, 4).map((item) => (
              <Link key={item.href} href={item.href}>
                <a className={`flex flex-col items-center py-2 ${
                  isActive(item.href) ? "text-primary" : "text-gray-500"
                }`}>
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
