import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, KeyRound } from "lucide-react";

const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  onInvalidToken?: () => void;
  onBack?: () => void;
}

export function ResetPasswordForm({ token, onSuccess, onInvalidToken, onBack }: ResetPasswordFormProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reset-password/verify/${token}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          toast({
            title: "Invalid or expired token",
            description: "The password reset link is no longer valid. Please request a new one.",
            variant: "destructive",
          });
          onInvalidToken?.();
        }
      } catch (error) {
        setIsValidToken(false);
        toast({
          title: "Error validating token",
          description: "Could not verify your reset token. Please try again.",
          variant: "destructive",
        });
        onInvalidToken?.();
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, toast, onInvalidToken]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/reset-password/reset", data);
      return await response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to reset password",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ResetPasswordFormValues) {
    setIsSubmitting(true);
    resetPasswordMutation.mutate({
      token,
      newPassword: data.newPassword,
    });
  }

  if (isValidating) {
    return (
      <div className="space-y-4 w-full max-w-md text-center">
        <h2 className="text-xl font-semibold">Verifying your reset link...</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="space-y-4 w-full max-w-md text-center">
        <h2 className="text-xl font-semibold text-destructive">Invalid Reset Link</h2>
        <p className="text-muted-foreground">
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        {onBack && (
          <Button type="button" onClick={onBack} className="mt-4">
            Back to Forgot Password
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create New Password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your new password below
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter your new password"
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <KeyRound className="ml-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Confirm your new password"
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col space-y-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            {onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="w-full"
              >
                Back
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
