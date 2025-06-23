import { useState, useEffect } from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";
import { UsernameDisplay } from "./username-display";
import { ResetSuccess } from "./reset-success";

type PasswordResetStep = "forgot" | "username" | "reset" | "success";

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
  const [username, setUsername] = useState<string>("");

  const handleForgotPasswordSuccess = (token?: string, foundUsername?: string) => {
    if (foundUsername) {
      setUsername(foundUsername);
      setCurrentStep("username");
      
      if (token) {
        setResetToken(token);
      }
    }
  };

  const handleShowResetForm = () => {
    setCurrentStep("reset");
  };

  const handleResetSuccess = () => {
    setCurrentStep("success");
  };

  const handleGoToLogin = () => {
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
      setCurrentStep("username");
    } else if (currentStep === "username") {
      setCurrentStep("forgot");
      setUsername("");
    } else {
      onCancel();
    }
  };

  return (
    <div className="rounded-lg shadow-md p-8 bg-zinc-900 text-white border border-zinc-800 w-full max-w-md mx-auto">
      {currentStep === "forgot" && (
        <ForgotPasswordForm 
          onSuccess={handleForgotPasswordSuccess} 
          onBack={onCancel}
        />
      )}
      
      {currentStep === "username" && (
        <UsernameDisplay
          username={username}
          onContinue={handleShowResetForm}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "reset" && resetToken ? (
        <ResetPasswordForm 
          token={resetToken} 
          onSuccess={handleResetSuccess}
          onInvalidToken={handleInvalidToken}
          onBack={handleBack}
        />
      ) : currentStep === "reset" && (
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
      )}
      
      {currentStep === "success" && (
        <ResetSuccess 
          onGoToLogin={handleGoToLogin}
        />
      )}
    </div>
  );
}