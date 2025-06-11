import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { insertUserSchema } from "@shared/schema";
import { PasswordReset } from "@/components/password-reset";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

// Registration form schema
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  teamName: z.string().min(1, {
    message: "Team name is required.",
  }),
  teamPin: z.string().length(4, {
    message: "PIN must be exactly 4 digits.",
  }).regex(/^\d{4}$/, {
    message: "PIN must contain only numbers.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === "coach" ? "/coach" : "/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "athlete",
      teamPosition: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Submitting login data:", data);
    loginMutation.mutate(data, {
      onError: (error: any) => {
        console.error("Login error:", error);
        
        // Show error in the form
        if (error.response && error.response.data && error.response.data.error) {
          loginForm.setError("root", { 
            type: "manual", 
            message: error.response.data.error 
          });
        } else {
          loginForm.setError("root", { 
            type: "manual", 
            message: "Invalid username or password" 
          });
        }
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Remove confirmPassword as it's not in the schema
    const { confirmPassword, ...registrationData } = data;
    console.log("Submitting registration data:", registrationData);
    
    registerMutation.mutate(registrationData, {
      onError: (error: any) => {
        console.error("Registration error:", error);
        
        // Show error in the form
        if (error.response && error.response.data && error.response.data.error) {
          registerForm.setError("root", { 
            type: "manual", 
            message: error.response.data.error 
          });
        } else {
          registerForm.setError("root", { 
            type: "manual", 
            message: "Registration failed. Please try again." 
          });
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[rgb(18,18,18)] flex flex-col items-center justify-center p-4">
      {showPasswordReset ? (
        <PasswordReset 
          onCancel={() => setShowPasswordReset(false)} 
          onResetComplete={() => {
            setShowPasswordReset(false);
            setActiveTab("login");
          }} 
        />
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">TrainUp</h1>
              <p className="text-gray-300">Performance tracking for athletes & coaches</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-[rgb(38,38,38)] border border-gray-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-black">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-black">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="border border-gray-800 bg-[rgb(28,28,28)]">
                  <CardHeader>
                    <CardTitle className="text-white">Login</CardTitle>
                    <CardDescription className="text-gray-300">
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="username" 
                                  className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Show any form errors */}
                        {loginForm.formState.errors.root && (
                          <div className="text-sm text-red-500 bg-red-100/10 rounded-md p-2 mb-3">
                            {loginForm.formState.errors.root.message}
                          </div>
                        )}

                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90 text-black" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-gray-300 text-center w-full">
                      <Button 
                        variant="link" 
                        className="text-primary p-0 h-auto"
                        onClick={() => setShowPasswordReset(true)}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <div className="text-sm text-gray-300 text-center w-full">
                      Don't have an account? 
                      <Button variant="link" className="text-primary" onClick={() => setActiveTab("register")}>
                        Register here
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="border border-gray-800 bg-[rgb(28,28,28)]">
                  <CardHeader>
                    <CardTitle className="text-white">Create an account</CardTitle>
                    <CardDescription className="text-gray-300">
                      Enter your details to create your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">First Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="John" 
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Last Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Doe" 
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="john.doe@example.com" 
                                  className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="johndoe" 
                                  className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Confirm Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Role</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-[rgb(38,38,38)] text-white border-gray-700">
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-[rgb(38,38,38)] text-white border-gray-700">
                                    <SelectItem value="athlete">Athlete</SelectItem>
                                    <SelectItem value="coach">Coach</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="teamPosition"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Team Position</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Forward, Coach" 
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="teamName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Team Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Warriors FC" 
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="teamPin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200">Team PIN (4 digits)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="1234" 
                                    maxLength={4}
                                    className="bg-[rgb(38,38,38)] border-gray-700 text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Show any form errors */}
                        {registerForm.formState.errors.root && (
                          <div className="text-sm text-red-500 bg-red-100/10 rounded-md p-2 mb-3">
                            {registerForm.formState.errors.root.message}
                          </div>
                        )}
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90 text-black" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Register"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-gray-300 text-center w-full">
                      Already have an account? 
                      <Button variant="link" className="text-primary" onClick={() => setActiveTab("login")}>
                        Login here
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:flex items-center justify-center bg-primary rounded-xl p-8 text-black">
            <div className="max-w-md">
              <h2 className="text-3xl font-bold mb-4">Track Your Athletic Journey</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Training Diary</h3>
                    <p className="text-black">Log your daily training sessions, mood, and energy levels.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Fitness Progress</h3>
                    <p className="text-black">Track your performance with visual charts and metrics.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-pulse"><path d="M19 14V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v9"/><path d="M3 14h18"/><path d="M8 19h8"/><path d="M12 19v-5"/><path d="M9 9h1"/><path d="M14 9h1"/><path d="m8 13 2-2c.3-.3.7-.3 1 0l2 2c.3.3.7.3 1 0l2-2"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Health Monitoring</h3>
                    <p className="text-black">Keep track of your health and get personalized advice.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Coach Feedback</h3>
                    <p className="text-black">Receive personalized feedback and guidance from your coach.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}