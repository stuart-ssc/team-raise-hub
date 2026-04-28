import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, AlertTriangle, CheckCircle, Send, RefreshCw } from "lucide-react";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { format, formatDistanceToNow } from "date-fns";

interface SignupAttempt {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  user_agent: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  invite_sent_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

type FilterValue = "abandoned" | "completed" | "all";

export default function AbandonedSignups() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SignupAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("abandoned");
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    void check();
  }, []);

  const check = async () => {
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
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    void fetchRows();
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("signup_attempts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows((data as any) || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load signup attempts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (id: string) => {
    setSendingId(id);
    try {
      const { error } = await supabase.functions.invoke("invite-abandoned-signup", {
        body: { attemptId: id },
      });
      if (error) throw error;
      toast({ title: "Invite sent", description: "They'll receive a Sponsorly email shortly." });
      void fetchRows();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to send invite",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "completed") return !!r.completed_at;
    return !r.completed_at; // abandoned
  });

  const stats = {
    total: rows.length,
    abandoned: rows.filter((r) => !r.completed_at).length,
    completed: rows.filter((r) => !!r.completed_at).length,
    invitesSent: rows.filter((r) => !!r.invite_sent_at).length,
  };

  return (
    <SystemAdminPageLayout
      title="Abandoned Signups"
      subtitle="Leads who started signup but never completed account creation"
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                <Mail className="text-muted-foreground" style={{ height: "1rem", width: "1rem" }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
                <AlertTriangle className="text-amber-500" style={{ height: "1rem", width: "1rem" }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.abandoned}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="text-green-600" style={{ height: "1rem", width: "1rem" }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invites Sent</CardTitle>
                <Send className="text-primary" style={{ height: "1rem", width: "1rem" }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.invitesSent}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Signup Attempts</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => void fetchRows()}>
                    <RefreshCw style={{ height: "1rem", width: "1rem" }} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No signup attempts in this view.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "—";
                      const source =
                        r.utm_source ||
                        (r.referrer ? new URL(r.referrer, "https://sponsorly.io").hostname : "Direct");
                      return (
                        <TableRow key={r.id}>
                          <TableCell title={format(new Date(r.created_at), "PPpp")}>
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{r.email}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{source}</span>
                            {r.utm_campaign && (
                              <div className="text-xs text-muted-foreground">{r.utm_campaign}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.completed_at ? (
                              <Badge variant="outline" className="border-green-600 text-green-700">
                                Completed
                              </Badge>
                            ) : r.invite_sent_at ? (
                              <Badge variant="secondary">Invite sent</Badge>
                            ) : r.error_message ? (
                              <Badge variant="destructive" title={r.error_message}>
                                Error
                              </Badge>
                            ) : (
                              <Badge>Abandoned</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`mailto:${r.email}`, "_blank")}
                              >
                                <Mail style={{ height: "1rem", width: "1rem" }} />
                              </Button>
                              {!r.completed_at && (
                                <Button
                                  size="sm"
                                  onClick={() => sendInvite(r.id)}
                                  disabled={sendingId === r.id}
                                >
                                  <Send style={{ height: "1rem", width: "1rem" }} />
                                  <span className="ml-1">
                                    {sendingId === r.id
                                      ? "Sending…"
                                      : r.invite_sent_at
                                      ? "Resend"
                                      : "Send invite"}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SystemAdminPageLayout>
  );
}
