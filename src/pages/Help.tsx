import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { HelpCircle, Bug, Lightbulb, HeadphonesIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface HelpSubmission {
  id: string;
  submission_type: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

const Help = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");

  const [activeTab, setActiveTab] = useState("support");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<HelpSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("help_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubmissions(data as HelpSubmission[]);
    }
    setLoadingSubmissions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const browserInfo = `${navigator.userAgent}`;
      const pageUrl = window.location.href;

      const { data, error } = await supabase
        .from("help_submissions")
        .insert({
          user_id: user.id,
          submission_type: activeTab,
          subject,
          description,
          priority: activeTab === "bug" ? priority : "medium",
          browser_info: browserInfo,
          page_url: pageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to admins
      await supabase.functions.invoke("send-help-notification", {
        body: {
          submissionId: data.id,
          type: activeTab,
          subject,
          description,
          userEmail: user.email,
          priority: activeTab === "bug" ? priority : "medium",
        },
      });

      toast.success("Your submission has been received! We'll get back to you soon.");
      setSubject("");
      setDescription("");
      setPriority("medium");
      fetchSubmissions();
    } catch (error: any) {
      console.error("Error submitting help request:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      new: "default",
      in_progress: "secondary",
      resolved: "outline",
      closed: "outline",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      support: "bg-blue-100 text-blue-800",
      bug: "bg-red-100 text-red-800",
      feature: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[type] || ""} variant="outline">
        {type === "feature" ? "Feature Request" : type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const content = (
    <>
      <Helmet>
        <title>Help & Support | Sponsorly</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Help & Support
          </h1>
          <p className="text-muted-foreground mt-1">
            Get help, report issues, or suggest new features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How can we help?</CardTitle>
            <CardDescription>
              Choose the type of request that best matches your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="support" className="flex items-center gap-2">
                  <HeadphonesIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Request Support</span>
                  <span className="sm:hidden">Support</span>
                </TabsTrigger>
                <TabsTrigger value="bug" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  <span className="hidden sm:inline">Report Bug</span>
                  <span className="sm:hidden">Bug</span>
                </TabsTrigger>
                <TabsTrigger value="feature" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Suggest Feature</span>
                  <span className="sm:hidden">Feature</span>
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <TabsContent value="support" className="mt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Need help with something? Describe your question or issue and we'll get back to you.
                  </p>
                </TabsContent>
                <TabsContent value="bug" className="mt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Found a bug? Please provide as much detail as possible so we can fix it quickly.
                  </p>
                </TabsContent>
                <TabsContent value="feature" className="mt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    Have an idea to make Sponsorly better? We'd love to hear it!
                  </p>
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder={
                      activeTab === "support"
                        ? "e.g., How do I export donor data?"
                        : activeTab === "bug"
                        ? "e.g., Button not working on campaign page"
                        : "e.g., Add recurring donation option"
                    }
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder={
                      activeTab === "support"
                        ? "Describe what you need help with..."
                        : activeTab === "bug"
                        ? "Describe the bug, steps to reproduce, and what you expected to happen..."
                        : "Describe your feature idea and how it would help you..."
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                {activeTab === "bug" && (
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                        <SelectItem value="medium">Medium - Affects my workflow</SelectItem>
                        <SelectItem value="high">High - Blocking my work</SelectItem>
                        <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit {activeTab === "support" ? "Request" : activeTab === "bug" ? "Bug Report" : "Suggestion"}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
            <CardDescription>
              Track the status of your previous submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubmissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                You haven't submitted any requests yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(submission.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{getTypeBadge(submission.submission_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {submission.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (isPortal) {
    return <DonorPortalLayout>{content}</DonorPortalLayout>;
  }

  return <DashboardPageLayout>{content}</DashboardPageLayout>;
};

export default Help;
