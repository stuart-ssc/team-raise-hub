import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { HelpCircle, Bug, Lightbulb, HeadphonesIcon, Loader2, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HelpSubmission {
  id: string;
  user_id: string | null;
  submission_type: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  browser_info: string | null;
  page_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_email?: string;
}

const HelpSubmissions = () => {
  const [submissions, setSubmissions] = useState<HelpSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<HelpSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    
    // Fetch submissions
    const { data: submissionsData, error } = await supabase
      .from("help_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
      setLoading(false);
      return;
    }

    // Get user emails for submissions with user_id
    const userIds = [...new Set((submissionsData || []).filter(s => s.user_id).map(s => s.user_id))];
    
    let userEmails: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      
      if (profiles) {
        userEmails = Object.fromEntries(profiles.map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || "Unknown User"]));
      }
    }

    const enrichedSubmissions = (submissionsData || []).map(s => ({
      ...s,
      user_email: s.user_id ? userEmails[s.user_id] || "Unknown" : "Anonymous",
    }));

    setSubmissions(enrichedSubmissions as HelpSubmission[]);
    setLoading(false);
  };

  const handleViewSubmission = (submission: HelpSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || "");
    setNewStatus(submission.status);
    setDialogOpen(true);
  };

  const handleUpdateSubmission = async () => {
    if (!selectedSubmission) return;
    
    setUpdating(true);
    
    const updates: any = {
      status: newStatus,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "resolved" && selectedSubmission.status !== "resolved") {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("help_submissions")
      .update(updates)
      .eq("id", selectedSubmission.id);

    if (error) {
      console.error("Error updating submission:", error);
      toast.error("Failed to update submission");
    } else {
      toast.success("Submission updated");
      setDialogOpen(false);
      fetchSubmissions();
    }
    
    setUpdating(false);
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filterType !== "all" && s.submission_type !== filterType) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        s.subject.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.user_email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === "new").length,
    inProgress: submissions.filter(s => s.status === "in_progress").length,
    resolved: submissions.filter(s => s.status === "resolved").length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "support": return <HeadphonesIcon className="h-4 w-4" />;
      case "bug": return <Bug className="h-4 w-4" />;
      case "feature": return <Lightbulb className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      support: "bg-blue-100 text-blue-800",
      bug: "bg-red-100 text-red-800",
      feature: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[type] || ""} variant="outline">
        {getTypeIcon(type)}
        <span className="ml-1">
          {type === "feature" ? "Feature" : type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
      new: { variant: "default", icon: AlertCircle },
      in_progress: { variant: "secondary", icon: Clock },
      resolved: { variant: "outline", icon: CheckCircle },
      closed: { variant: "outline", icon: CheckCircle },
    };
    const { variant, icon: Icon } = config[status] || config.new;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return <Badge className={colors[priority] || ""} variant="outline">{priority}</Badge>;
  };

  return (
    <SystemAdminPageLayout title="Help Submissions" subtitle="Manage support requests, bug reports, and feature suggestions">
      <Helmet>
        <title>Help Submissions | System Admin</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{stats.new}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.resolved}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search by subject, description, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:w-80"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No submissions found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(submission.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{getTypeBadge(submission.submission_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {submission.subject}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {submission.user_email}
                        </TableCell>
                        <TableCell>{getPriorityBadge(submission.priority)}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubmission && getTypeIcon(selectedSubmission.submission_type)}
              {selectedSubmission?.subject}
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && format(new Date(selectedSubmission.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getTypeBadge(selectedSubmission.submission_type)}
                {getPriorityBadge(selectedSubmission.priority)}
                {getStatusBadge(selectedSubmission.status)}
              </div>

              <div>
                <Label className="text-muted-foreground">From</Label>
                <p>{selectedSubmission.user_email}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                  {selectedSubmission.description}
                </p>
              </div>

              {selectedSubmission.browser_info && (
                <div>
                  <Label className="text-muted-foreground">Browser Info</Label>
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md truncate">
                    {selectedSubmission.browser_info}
                  </p>
                </div>
              )}

              {selectedSubmission.page_url && (
                <div>
                  <Label className="text-muted-foreground">Page URL</Label>
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md truncate">
                    {selectedSubmission.page_url}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmission} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SystemAdminPageLayout>
  );
};

export default HelpSubmissions;
