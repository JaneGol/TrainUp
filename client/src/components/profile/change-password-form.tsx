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
import { Lock, KeyRound, Check } from "lucide-react";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormValues) => {
      const response = await apiRequest("POST", "/api/user/change-password", data);
      return await response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setSuccess(true);
      
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated.",
      });
      
      // Reset form
      form.reset();
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      
      toast({
        title: "Failed to change password",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ChangePasswordFormValues) {
    setIsSubmitting(true);
    setSuccess(false);
    changePasswordMutation.mutate(data);
  }

  return (
    <div className="space-y-6 w-full max-w-md p-5 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Change Password</h1>
        <p className="text-zinc-400 mt-2">
          Enter your current password and a new one
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200">Current Password</FormLabel>
                <FormControl>
                  <div className="flex items-center border border-zinc-700 rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <Lock className="ml-2 h-4 w-4 text-zinc-500" />
                    <Input 
                      type="password"
                      placeholder="Enter your current password" 
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white" 
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
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200">New Password</FormLabel>
                <FormControl>
                  <div className="flex items-center border border-zinc-700 rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <KeyRound className="ml-2 h-4 w-4 text-zinc-500" />
                    <Input 
                      type="password"
                      placeholder="Enter your new password" 
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white" 
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
                <FormLabel className="text-zinc-200">Confirm Password</FormLabel>
                <FormControl>
                  <div className="flex items-center border border-zinc-700 rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <KeyRound className="ml-2 h-4 w-4 text-zinc-500" />
                    <Input 
                      type="password"
                      placeholder="Confirm your new password" 
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {success && (
            <div className="bg-green-900/20 text-green-400 p-3 rounded-md flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Password updated successfully
            </div>
          )}

          <div className="flex flex-col space-y-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-lime-600 hover:bg-lime-700 text-white">
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}