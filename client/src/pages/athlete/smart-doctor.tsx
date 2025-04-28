import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Activity, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";

const bodyParts = [
  "Head", "Neck", "Shoulder", "Arm", "Elbow", "Wrist", "Hand", 
  "Chest", "Back", "Abdomen", "Hip", "Thigh", "Knee", "Calf", "Ankle", "Foot"
];

const symptomsFormSchema = z.object({
  symptom: z.string().min(3, {
    message: "Symptom must be at least 3 characters.",
  }),
  severity: z.number().min(1).max(10),
  bodyPart: z.string().min(1, {
    message: "Please select a body part.",
  }),
  notes: z.string().optional(),
});

type SymptomsFormValues = z.infer<typeof symptomsFormSchema>;

export default function SmartDoctor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [result, setResult] = useState<string | null>(null);
  
  // Get health reports
  const { data: healthReports, isLoading: healthReportsLoading } = useQuery({
    queryKey: ["/api/health-reports"],
  });
  
  const form = useForm<SymptomsFormValues>({
    resolver: zodResolver(symptomsFormSchema),
    defaultValues: {
      symptom: "",
      severity: 5,
      bodyPart: "",
      notes: "",
    },
  });
  
  const reportMutation = useMutation({
    mutationFn: async (data: SymptomsFormValues) => {
      const res = await apiRequest("POST", "/api/health-reports", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-reports"] });
      toast({
        title: "Symptom reported",
        description: "Your health report has been submitted.",
      });
      
      // Generate advice based on the symptom
      const symptom = form.getValues("symptom").toLowerCase();
      const severity = form.getValues("severity");
      const bodyPart = form.getValues("bodyPart");
      
      let advice = "";
      
      if (severity >= 8) {
        advice = `Your ${symptom} in the ${bodyPart} area is severe. Please consult with a medical professional immediately. Avoid training until cleared by a doctor.`;
      } else if (severity >= 5) {
        advice = `For moderate ${symptom} in the ${bodyPart}, consider rest, ice, compression, and elevation (RICE). Reduce training intensity for the next few days and monitor your symptoms.`;
      } else {
        advice = `Your ${symptom} in the ${bodyPart} area appears to be mild. Monitor the condition, ensure proper warm-up before training, and consider light stretching exercises.`;
      }
      
      setResult(advice);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit report: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: SymptomsFormValues) {
    reportMutation.mutate(data);
  }
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Smart Doctor</h2>
        
        <Tabs defaultValue="smart-doctor" className="w-full">
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="training-diary" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/training-diary")}
            >
              Training Diary
            </TabsTrigger>
            <TabsTrigger 
              value="fitness-progress" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
              onClick={() => navigate("/fitness-progress")}
            >
              Fitness Progress
            </TabsTrigger>
            <TabsTrigger 
              value="smart-doctor" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Smart Doctor
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none py-4 px-1 font-medium"
            >
              Feedback
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="smart-doctor" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Symptoms</CardTitle>
                    <CardDescription>
                      Describe any pain, discomfort, or health concerns you're experiencing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="symptom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Symptom</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Pain, Soreness, Stiffness" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bodyPart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Part</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select body part" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bodyParts.map((part) => (
                                    <SelectItem key={part} value={part.toLowerCase()}>
                                      {part}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="severity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Severity (1-10)</FormLabel>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500 px-2">
                                  <span>Mild</span>
                                  <span>Moderate</span>
                                  <span>Severe</span>
                                </div>
                                <FormControl>
                                  <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    defaultValue={[field.value]}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </FormControl>
                                <div className="text-center">
                                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                                    {field.value}/10
                                  </span>
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide any additional details about your symptoms..."
                                  className="resize-none"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={reportMutation.isPending}
                        >
                          {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                {result && (
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Activity className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle>Health Advice</CardTitle>
                        <CardDescription>Based on your reported symptoms</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{result}</p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-gray-500 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        This is general advice. For persistent or severe symptoms, please consult a healthcare professional.
                      </p>
                    </CardFooter>
                  </Card>
                )}
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Health Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {healthReportsLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : healthReports?.length > 0 ? (
                      <div className="space-y-4">
                        {healthReports.map((report: any) => (
                          <div key={report.id} className="border-b border-gray-100 pb-4">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-800">{report.symptom}</h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(report.createdAt).toLocaleDateString()} - {report.bodyPart}
                                </p>
                              </div>
                              <span className={`bg-${
                                report.severity > 7 ? "red" : report.severity > 4 ? "yellow" : "green"
                              }-100 text-${
                                report.severity > 7 ? "red" : report.severity > 4 ? "yellow" : "green"
                              }-800 text-xs px-2 py-1 rounded-full`}>
                                {report.severity}/10
                              </span>
                            </div>
                            {report.notes && (
                              <p className="mt-1 text-sm text-gray-600">{report.notes}</p>
                            )}
                            <div className="mt-2 flex items-center text-xs">
                              {report.status === "reviewed" ? (
                                <span className="text-accent flex items-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Reviewed
                                </span>
                              ) : (
                                <span className="text-gray-400 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending review
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No health reports yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
