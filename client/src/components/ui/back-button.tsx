import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

export function BackButton({ fallbackPath = "/", className = "" }: BackButtonProps) {
  const [, navigate] = useLocation();
  
  const goBack = () => {
    // Try to go back in history if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to specified path
      navigate(fallbackPath);
    }
  };
  
  return (
    <Button
      onClick={goBack}
      variant="outline"
      size="sm"
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-1 border-gray-700 bg-[rgb(38,38,38)] text-white hover:bg-[rgb(45,45,45)] ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );
}