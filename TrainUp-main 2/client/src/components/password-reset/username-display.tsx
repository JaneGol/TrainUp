import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface UsernameDisplayProps {
  username: string;
  onContinue: () => void;
  onBack: () => void;
}

export function UsernameDisplay({ username, onContinue, onBack }: UsernameDisplayProps) {
  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Account Found</h1>
        <p className="text-muted-foreground mt-2">
          We've found your account. You can now reset your password.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-zinc-800 rounded-lg border border-zinc-700 gap-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Your username</p>
          <p className="text-lg font-medium">{username}</p>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <Button onClick={onContinue} className="w-full">
          Reset Password
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onBack} 
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
}