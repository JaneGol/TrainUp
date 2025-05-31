import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DownloadCloud, FileText, CheckCircle, Info } from "lucide-react";
import CoachDashboardLayout from "@/components/layout/coach-dashboard-layout";

export default function DataExportPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("wellness");
  const [isDownloading, setIsDownloading] = useState(false);

  // Mutation for exporting wellness data
  const exportWellnessMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/export/wellness", {
        spreadsheetId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setLastExportResults(data);
      if (data.success) {
        toast({
          title: "Export Successful",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Export Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for exporting training data
  const exportTrainingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/export/training", {
        spreadsheetId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setLastExportResults(data);
      if (data.success) {
        toast({
          title: "Export Successful",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Export Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for exporting feedback data
  const exportFeedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/export/feedback", {
        spreadsheetId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setLastExportResults(data);
      if (data.success) {
        toast({
          title: "Export Successful",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Export Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for exporting all data
  const exportAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/export/all", {
        spreadsheetId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setLastExportResults(data);
      if (data.success) {
        toast({
          title: "Export Successful",
          description: "Data successfully exported to Google Sheets",
          variant: "default",
        });
      } else {
        toast({
          title: "Export Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle the export button click based on the current tab
  const handleExport = () => {
    if (!spreadsheetId) {
      toast({
        title: "Export Failed",
        description: "Please enter a Google Spreadsheet ID",
        variant: "destructive",
      });
      return;
    }

    switch (currentTab) {
      case "wellness":
        exportWellnessMutation.mutate();
        break;
      case "training":
        exportTrainingMutation.mutate();
        break;
      case "feedback":
        exportFeedbackMutation.mutate();
        break;
      case "all":
        exportAllMutation.mutate();
        break;
    }
  };

  // Check if any export operation is in progress
  const isLoading = 
    exportWellnessMutation.isPending || 
    exportTrainingMutation.isPending || 
    exportFeedbackMutation.isPending || 
    exportAllMutation.isPending;

  return (
    <CoachDashboardLayout>
      <div className="p-6 bg-zinc-950 min-h-screen text-white">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <FileSpreadsheet className="h-6 w-6 mr-2 text-[rgb(200,255,1)]" />
            Data Export
          </h1>
          <p className="text-zinc-400 mt-1">
            Export athlete data and coach feedback to Google Sheets
          </p>
        </div>

        {/* Instructions and information */}
        <Alert className="mb-6 bg-zinc-900 border-zinc-800">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle>How to use Google Sheets export</AlertTitle>
          <AlertDescription className="text-sm text-zinc-400">
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Create a new Google Spreadsheet or use an existing one</li>
              <li>Copy the spreadsheet ID from the URL (the long string after /d/ and before /edit)</li>
              <li>Paste the ID in the input field below</li>
              <li>Share your spreadsheet with the service account email: <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded">{process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}</span></li>
              <li>Select the data you want to export and click "Export to Google Sheets"</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Export interface */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DownloadCloud className="h-5 w-5 mr-2 text-[rgb(200,255,1)]" />
                  Export Team Data
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Export athlete and coach data to Google Sheets for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="spreadsheet-id">Google Spreadsheet ID</Label>
                  <Input
                    id="spreadsheet-id"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="Enter your Google Spreadsheet ID"
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Example: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
                  </p>
                </div>

                <Tabs 
                  defaultValue="wellness" 
                  className="mt-4"
                  onValueChange={setCurrentTab}
                >
                  <TabsList className="bg-zinc-800 border-b border-zinc-700">
                    <TabsTrigger value="wellness" className="data-[state=active]:bg-zinc-700">
                      Athlete Wellness
                    </TabsTrigger>
                    <TabsTrigger value="training" className="data-[state=active]:bg-zinc-700">
                      Training Data
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-zinc-700">
                      Coach Feedback
                    </TabsTrigger>
                    <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
                      All Data
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="wellness" className="mt-4 text-zinc-400 text-sm">
                    <p>Export all athlete wellness data including:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Sleep quality & duration</li>
                      <li>Mood and stress levels</li>
                      <li>Recovery and readiness metrics</li>
                      <li>Reported symptoms and injuries</li>
                    </ul>
                  </TabsContent>
                  <TabsContent value="training" className="mt-4 text-zinc-400 text-sm">
                    <p>Export all training session data including:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Training type and date</li>
                      <li>Effort and emotional load levels</li>
                      <li>Athlete mood and notes</li>
                      <li>Coach review status</li>
                    </ul>
                  </TabsContent>
                  <TabsContent value="feedback" className="mt-4 text-zinc-400 text-sm">
                    <p>Export all coach feedback provided to athletes including:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Coach and athlete information</li>
                      <li>Feedback type and content</li>
                      <li>Related training entries</li>
                      <li>Timestamps and other metadata</li>
                    </ul>
                  </TabsContent>
                  <TabsContent value="all" className="mt-4 text-zinc-400 text-sm">
                    <p>Export all available data to separate sheets in one spreadsheet:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Athlete Wellness Data</li>
                      <li>Training Data</li>
                      <li>Coach Feedback</li>
                    </ul>
                    <Alert className="mt-4 bg-zinc-800 border-zinc-700">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-xs text-zinc-400">
                        Exporting all data may take longer depending on the amount of data stored in the system.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleExport}
                  disabled={isLoading || !spreadsheetId}
                  className="bg-[rgb(200,255,1)] hover:bg-[rgb(180,235,0)] text-black font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black border-opacity-50 border-t-black"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Export to Google Sheets
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            {/* Export Status */}
            <Card className="bg-zinc-900 border-zinc-800 text-white h-full">
              <CardHeader>
                <CardTitle className="text-lg">Export Status</CardTitle>
                <CardDescription className="text-zinc-400">
                  Results from your last export operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastExportResults ? (
                  <div>
                    <div className="flex items-center mb-3">
                      {lastExportResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      )}
                      <span className={lastExportResults.success ? "text-green-500" : "text-yellow-500"}>
                        {lastExportResults.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{lastExportResults.message}</p>
                    {lastExportResults.wellness || lastExportResults.training || lastExportResults.feedback ? (
                      <div className="mt-4 space-y-2 text-xs text-zinc-500">
                        {lastExportResults.wellness && (
                          <div className="flex justify-between">
                            <span>Wellness Data:</span>
                            <span>{lastExportResults.wellness.success ? "Success" : "Failed"}</span>
                          </div>
                        )}
                        {lastExportResults.training && (
                          <div className="flex justify-between">
                            <span>Training Data:</span>
                            <span>{lastExportResults.training.success ? "Success" : "Failed"}</span>
                          </div>
                        )}
                        {lastExportResults.feedback && (
                          <div className="flex justify-between">
                            <span>Feedback Data:</span>
                            <span>{lastExportResults.feedback.success ? "Success" : "Failed"}</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-600">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No export operations performed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CoachDashboardLayout>
  );
}