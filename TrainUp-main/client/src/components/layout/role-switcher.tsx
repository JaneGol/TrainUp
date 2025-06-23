import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { User, Users } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function RoleSwitcher() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // No need to show role switcher if user isn't logged in
  if (!user) return null;
  
  const handleSwitchRole = (role: string) => {
    if (role === user.role) return;
    
    // Navigate to appropriate dashboard based on role
    if (role === "athlete") {
      navigate("/");
      toast({
        title: "View switched to Athlete",
        description: "You are now viewing the athlete dashboard",
      });
    } else {
      navigate("/coach");
      toast({
        title: "View switched to Coach",
        description: "You are now viewing the coach dashboard",
      });
    }
  };
  
  const isAthlete = user.role === "athlete";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={isAthlete ? "bg-primary-light text-primary" : "bg-secondary-light text-secondary"}
        >
          {isAthlete ? (
            <>
              <User className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Athlete View</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Coach View</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSwitchRole("athlete")}>
          <User className="h-4 w-4 mr-2" />
          <span>Athlete View</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSwitchRole("coach")}>
          <Users className="h-4 w-4 mr-2" />
          <span>Coach View</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
