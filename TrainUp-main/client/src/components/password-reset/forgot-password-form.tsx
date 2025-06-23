import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, AlertCircle } from "lucide-react";

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: (token?: string, username?: string) => void;
  onBack?: () => void;
}

export function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const response = await apiRequest("POST", "/api/reset-password/request", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      setError(null);
      
      // For demonstration purposes, we'll use the debug token
      // In a real app, this would be sent via email
      if (data.debug?.token) {
        setResetToken(data.debug.token);
      }
      
      if (data.error) {
        setError(data.error);
        toast({
          title: "User not found",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      
      if (onSuccess && data.username) {
        onSuccess(data.debug?.token, data.username);
      }
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      setError(error.message || "An unexpected error occurred");
      
      toast({
        title: "Failed to request password reset",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    setError(null);
    requestResetMutation.mutate(data);
  }

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <Mail className="ml-2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter your email address" 
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col space-y-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending..." : "Send Reset Instructions"}
            </Button>
            
            {onBack && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onBack}
                className="w-full"
              >
                Back to Login
              </Button>
            )}
          </div>

          {resetToken && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-1">Demo Mode:</p>
              <p>Your reset token: <span className="font-mono text-xs">{resetToken}</span></p>
              <p className="text-xs mt-1 text-muted-foreground">
                In a real application, this would be sent securely via email.
              </p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}