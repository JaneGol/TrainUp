import { Link, useLocation } from "wouter";
import { ChevronLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  showBack?: boolean;
  customBackPath?: string;
}

export default function Navigation({ showBack = true, customBackPath }: NavigationProps) {
  const [location] = useLocation();
  
  return (
    <nav className="flex gap-3 text-sm pt-6 pb-4">
      {showBack && (
        <Button variant="ghost" size="sm" asChild>
          <Link to={customBackPath || ".."} className="flex items-center gap-1 hover:text-primary">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      )}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/" className="flex items-center gap-1 hover:text-primary">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </Button>
    </nav>
  );
}