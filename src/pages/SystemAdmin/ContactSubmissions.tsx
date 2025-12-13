import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare, CheckCircle, Archive, ExternalLink } from "lucide-react";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function ContactSubmissions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    checkSystemAdmin();
    fetchSubmissions();
  }, []);

  const checkSystemAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("system_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.system_admin) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  };

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load contact submissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "replied") {
        updateData.replied_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.replied_by = user?.id;
      }

      const { error } = await supabase
        .from("contact_submissions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Submission marked as ${newStatus}.`,
      });

      fetchSubmissions();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const saveNotes = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ admin_notes: notesValue })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Notes saved",
        description: "Admin notes updated successfully.",
      });

      setEditingNotes(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      new: { variant: "default", label: "New" },
      read: { variant: "secondary", label: "Read" },
      replied: { variant: "outline", label: "Replied" },
      archived: { variant: "outline", label: "Archived" },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) =>
    statusFilter === "all" ? true : sub.status === statusFilter
  );

  // Calculate stats
  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === "new").length,
    read: submissions.filter((s) => s.status === "read").length,
    replied: submissions.filter((s) => s.status === "replied").length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <SystemAdminPageLayout title="Contact Submissions">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.read}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replied</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.replied}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Submissions</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No submissions found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubmissions.map((submission) => (
                      <>
                        <TableRow
                          key={submission.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpandedRow(expandedRow === submission.id ? null : submission.id)
                          }
                        >
                          <TableCell>{format(new Date(submission.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">{submission.name}</TableCell>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell>{submission.subject || <span className="text-muted-foreground">No subject</span>}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`mailto:${submission.email}`, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              {submission.status === "new" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(submission.id, "read")}
                                >
                                  Mark Read
                                </Button>
                              )}
                              {(submission.status === "new" || submission.status === "read") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(submission.id, "replied")}
                                >
                                  Mark Replied
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateStatus(submission.id, "archived")}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRow === submission.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30">
                              <div className="p-4 space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Message:</h4>
                                  <p className="whitespace-pre-wrap text-sm">{submission.message}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Admin Notes:</h4>
                                  {editingNotes === submission.id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={notesValue}
                                        onChange={(e) => setNotesValue(e.target.value)}
                                        rows={3}
                                        placeholder="Add internal notes..."
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveNotes(submission.id)}>
                                          Save Notes
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingNotes(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {submission.admin_notes || "No notes yet"}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingNotes(submission.id);
                                          setNotesValue(submission.admin_notes || "");
                                        }}
                                      >
                                        {submission.admin_notes ? "Edit Notes" : "Add Notes"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of{" "}
                      {filteredSubmissions.length} submissions
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </SystemAdminPageLayout>
  );
}
