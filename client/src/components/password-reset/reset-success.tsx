import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ResetSuccessProps {
  onGoToLogin: () => void;
}

export function ResetSuccess({ onGoToLogin }: ResetSuccessProps) {
  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">Password Reset Successful</h1>
        <p className="text-muted-foreground mt-2">
          Your password has been successfully changed. You can now log in with your new password.
        </p>
      </div>

      <Button 
        onClick={onGoToLogin}
        className="w-full"
      >
        Go to Login
      </Button>
    </div>
  );
}