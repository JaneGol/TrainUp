import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if coach trying to access athlete routes or vice versa
  const isCoachRoute = path.startsWith("/coach");
  const isAthleteRoute = !isCoachRoute && path !== "/";
  
  if (user.role === "coach" && isAthleteRoute) {
    return (
      <Route path={path}>
        <Redirect to="/coach" />
      </Route>
    );
  }
  
  if (user.role === "athlete" && isCoachRoute) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }
  
  // If user is on root and is a coach, redirect to coach dashboard
  if (path === "/" && user.role === "coach" && location === "/") {
    return (
      <Route path={path}>
        <Redirect to="/coach" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
