import { useAuth } from "@/hooks/use-auth";
import { Loader2, User } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Redirect to appropriate dashboard based on role
  // This prevents users from accessing profiles they shouldn't view
  const viewingOwnProfile = true; // Since we only support viewing own profile now
  
  if (!viewingOwnProfile) {
    // Redirect to appropriate home page based on role
    if (user.role === "coach") {
      return <Redirect to="/coach" />;
    } else {
      return <Redirect to="/" />;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-zinc-400" />
          </div>
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-zinc-400">{user.role}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-6">Account Security</h2>
            <ChangePasswordForm />
          </div>
          
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-6">Your Information</h2>
            <div className="w-full max-w-md p-5 bg-zinc-900 rounded-lg border border-zinc-800 space-y-4">
              <div>
                <p className="text-zinc-400 text-sm">Username</p>
                <p className="text-white font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Role</p>
                <p className="text-white font-medium capitalize">{user.role}</p>
              </div>
              {user.email && (
                <div>
                  <p className="text-zinc-400 text-sm">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              )}
              {user.teamPosition && (
                <div>
                  <p className="text-zinc-400 text-sm">Team Position</p>
                  <p className="text-white font-medium">{user.teamPosition}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}