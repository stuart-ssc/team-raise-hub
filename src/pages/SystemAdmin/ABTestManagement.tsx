import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Plus,
  Play,
  Trophy,
  BarChart3,
  FlaskConical,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ABTest {
  id: string;
  name: string;
  description: string | null;
  status: string;
  minimum_sample_size: number;
  start_date: string | null;
  end_date: string | null;
  winner_variant_id: string | null;
  created_at: string;
}

interface ABVariant {
  id: string;
  name: string;
  subject_line: string;
  is_control: boolean;
  template_data: any;
}

interface ABTestResults {
  variant_id: string;
  variant_name: string;
  subject_line: string;
  is_control: boolean;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  open_rate: number;
  click_rate: number;
  click_through_rate: number;
}

const ABTestManagement = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<ABTestResults[]>([]);

  // Form state
  const [testName, setTestName] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [minSampleSize, setMinSampleSize] = useState(100);
  const [controlSubject, setControlSubject] = useState("");
  const [controlStyle, setControlStyle] = useState("default");
  const [variantSubject, setVariantSubject] = useState("");
  const [variantStyle, setVariantStyle] = useState("enthusiastic");

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchTestResults(selectedTest);
    }
  }, [selectedTest]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_ab_tests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      console.error("Error fetching A/B tests:", error);
      toast({
        title: "Error",
        description: "Failed to load A/B tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async (testId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_ab_test_results", {
        test_uuid: testId,
      });

      if (error) throw error;
      setTestResults(data || []);
    } catch (error: any) {
      console.error("Error fetching test results:", error);
    }
  };

  const handleCreateTest = async () => {
    try {
      const { error } = await supabase.functions.invoke("manage-ab-tests", {
        body: {
          action: "create",
          testData: {
            name: testName,
            description: testDescription,
            minimum_sample_size: minSampleSize,
            variants: [
              {
                name: "Control",
                subject_line: controlSubject,
                template_data: { variant_style: controlStyle },
              },
              {
                name: "Variant A",
                subject_line: variantSubject,
                template_data: { variant_style: variantStyle },
              },
            ],
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "A/B test created successfully",
      });

      setCreateDialogOpen(false);
      fetchTests();
      
      // Reset form
      setTestName("");
      setTestDescription("");
      setControlSubject("");
      setVariantSubject("");
    } catch (error: any) {
      console.error("Error creating test:", error);
      toast({
        title: "Error",
        description: "Failed to create A/B test",
        variant: "destructive",
      });
    }
  };

  const handleActivateTest = async (testId: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-ab-tests", {
        body: {
          action: "activate",
          testId,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "A/B test activated",
      });

      fetchTests();
    } catch (error: any) {
      console.error("Error activating test:", error);
      toast({
        title: "Error",
        description: "Failed to activate test",
        variant: "destructive",
      });
    }
  };

  const handleCalculateWinner = async (testId: string) => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-ab-tests", {
        body: {
          action: "calculate_winner",
          testId,
        },
      });

      if (error) throw error;

      if (data.winner) {
        toast({
          title: "Winner Determined",
          description: data.reason,
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: data.message || data.reason,
        });
      }

      fetchTests();
      fetchTestResults(testId);
    } catch (error: any) {
      console.error("Error calculating winner:", error);
      toast({
        title: "Error",
        description: "Failed to calculate winner",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "active":
        return <Badge className="bg-blue-500">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onGroupClick={() => {}} activeGroup={null} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <FlaskConical className="h-8 w-8" />
                  A/B Test Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Create and manage email A/B tests with statistical analysis
                </p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New A/B Test</DialogTitle>
                    <DialogDescription>
                      Set up a new A/B test to compare email subject lines and styles
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Test Name</Label>
                      <Input
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="e.g., Annual Summary Subject Test"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={testDescription}
                        onChange={(e) => setTestDescription(e.target.value)}
                        placeholder="Describe the goal of this test..."
                      />
                    </div>
                    <div>
                      <Label>Minimum Sample Size</Label>
                      <Input
                        type="number"
                        value={minSampleSize}
                        onChange={(e) => setMinSampleSize(parseInt(e.target.value))}
                        min={50}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Control (A)</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Subject Line</Label>
                          <Input
                            value={controlSubject}
                            onChange={(e) => setControlSubject(e.target.value)}
                            placeholder="Your 2024 Annual Giving Summary"
                          />
                        </div>
                        <div>
                          <Label>Email Style</Label>
                          <Select value={controlStyle} onValueChange={setControlStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="grateful">Grateful</SelectItem>
                              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Variant (B)</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Subject Line</Label>
                          <Input
                            value={variantSubject}
                            onChange={(e) => setVariantSubject(e.target.value)}
                            placeholder="🌟 Your Amazing Impact in 2024!"
                          />
                        </div>
                        <div>
                          <Label>Email Style</Label>
                          <Select value={variantStyle} onValueChange={setVariantStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="grateful">Grateful</SelectItem>
                              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleCreateTest} className="w-full">
                      Create A/B Test
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="tests" className="space-y-6">
              <TabsList>
                <TabsTrigger value="tests">All Tests</TabsTrigger>
                <TabsTrigger value="results">Results & Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="tests" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : tests.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No A/B tests created yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  tests.map((test) => (
                    <Card key={test.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{test.name}</CardTitle>
                            <CardDescription>{test.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(test.status)}
                            {test.status === "draft" && (
                              <Button
                                size="sm"
                                onClick={() => handleActivateTest(test.id)}
                              >
                                <Play className="mr-1 h-3 w-3" />
                                Activate
                              </Button>
                            )}
                            {test.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTest(test.id)}
                              >
                                <BarChart3 className="mr-1 h-3 w-3" />
                                View Results
                              </Button>
                            )}
                            {test.winner_variant_id && (
                              <Badge className="bg-yellow-500">
                                <Trophy className="mr-1 h-3 w-3" />
                                Winner Declared
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Sample Size</p>
                            <p className="font-semibold">{test.minimum_sample_size}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Started</p>
                            <p className="font-semibold">
                              {test.start_date ? new Date(test.start_date).toLocaleDateString() : "Not started"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ended</p>
                            <p className="font-semibold">
                              {test.end_date ? new Date(test.end_date).toLocaleDateString() : "Ongoing"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                {selectedTest ? (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Test Results</CardTitle>
                          <Button
                            onClick={() => handleCalculateWinner(selectedTest)}
                            disabled={calculating}
                          >
                            {calculating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculating...
                              </>
                            ) : (
                              <>
                                <Trophy className="mr-2 h-4 w-4" />
                                Calculate Winner
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {testResults.map((result) => (
                            <div key={result.variant_id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {result.variant_name}
                                    {result.is_control && (
                                      <Badge variant="outline" className="ml-2">Control</Badge>
                                    )}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {result.subject_line}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">{result.emails_sent}</p>
                                  <p className="text-xs text-muted-foreground">emails sent</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-muted-foreground">Open Rate</span>
                                    <span className="font-semibold">{result.open_rate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={Number(result.open_rate)} />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {result.emails_opened} opened
                                  </p>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-muted-foreground">Click Rate</span>
                                    <span className="font-semibold">{result.click_rate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={Number(result.click_rate)} />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {result.emails_clicked} clicked
                                  </p>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-muted-foreground">CTR</span>
                                    <span className="font-semibold">{result.click_through_rate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={Number(result.click_through_rate)} />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    of opens
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Select a test to view results</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ABTestManagement;
