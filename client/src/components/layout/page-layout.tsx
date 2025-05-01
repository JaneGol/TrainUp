import React from "react";
import { BackButton } from "@/components/ui/back-button";

interface PageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  fallbackPath?: string;
}

export default function PageLayout({ 
  children, 
  showBackButton = true,
  fallbackPath = "/"
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-black relative pb-16">
      {children}
      
      {showBackButton && (
        <BackButton fallbackPath={fallbackPath} />
      )}
    </div>
  );
}