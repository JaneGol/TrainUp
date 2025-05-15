import { useState } from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";

type PasswordResetStep = "forgot" | "reset";

interface PasswordResetProps {
  onCancel: () => void;
  onResetComplete: () => void;
  token?: string;
  initialStep?: PasswordResetStep;
}

export function PasswordReset({ 
  onCancel, 
  onResetComplete, 
  token: initialToken,
  initialStep = "forgot" 
}: PasswordResetProps) {
  const [currentStep, setCurrentStep] = useState<PasswordResetStep>(initialToken ? "reset" : initialStep);
  const [resetToken, setResetToken] = useState<string | undefined>(initialToken);

  const handleForgotPasswordSuccess = (token?: string) => {
    if (token) {
      setResetToken(token);
      setCurrentStep("reset");
    }
  };

  const handleResetSuccess = () => {
    if (onResetComplete) {
      onResetComplete();
    }
  };

  const handleInvalidToken = () => {
    setCurrentStep("forgot");
    setResetToken(undefined);
  };

  const handleBack = () => {
    if (currentStep === "reset") {
      setCurrentStep("forgot");
      setResetToken(undefined);
    } else {
      onCancel();
    }
  };

  return (
    <div className="rounded-lg shadow-md p-8 bg-zinc-900 text-white border border-zinc-800 w-full max-w-md mx-auto">
      {currentStep === "forgot" ? (
        <ForgotPasswordForm 
          onSuccess={handleForgotPasswordSuccess} 
          onBack={onCancel}
        />
      ) : (
        resetToken ? (
          <ResetPasswordForm 
            token={resetToken} 
            onSuccess={handleResetSuccess}
            onInvalidToken={handleInvalidToken}
            onBack={handleBack}
          />
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Missing Token</h2>
            <p className="text-muted-foreground mt-2">
              No reset token was provided. Please request a new password reset.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
              onClick={handleBack}
            >
              Back to Forgot Password
            </button>
          </div>
        )
      )}
    </div>
  );
}