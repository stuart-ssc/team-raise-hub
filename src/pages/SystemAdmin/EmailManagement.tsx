import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Loader2, 
  Send, 
  Eye, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  MailOpen,
  MousePointerClick,
  AlertTriangle,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  recipient_name: string | null;
  year: number | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface DeliveryStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  pending: number;
  open_rate: number;
  click_rate: number;
  delivery_rate: number;
  bounce_rate: number;
}

interface DailyMetric {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

const EmailManagement = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date()),
  });
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchEmailLogs();
    fetchStats();
    fetchDailyMetrics();
  }, [dateRange]);

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_delivery_log")
        .select("*")
        .eq("email_type", "annual_tax_summary")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching email logs:", error);
      toast({
        title: "Error",
        description: "Failed to load email logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("email_delivery_log")
        .select("status, opened_at, clicked_at, bounced_at")
        .eq("email_type", "annual_tax_summary")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const sent = data?.filter(d => d.status === "sent").length || 0;
      const pending = data?.filter(d => d.status === "pending").length || 0;
      const opened = data?.filter(d => d.opened_at).length || 0;
      const clicked = data?.filter(d => d.clicked_at).length || 0;
      const bounced = data?.filter(d => d.bounced_at).length || 0;
      const failed = data?.filter(d => d.status === "failed").length || 0;

      const deliveryRate = total > 0 ? (sent / total) * 100 : 0;
      const bounceRate = total > 0 ? (bounced / total) * 100 : 0;

      setStats({
        total,
        sent,
        pending,
        opened,
        clicked,
        bounced,
        failed,
        delivery_rate: deliveryRate,
        bounce_rate: bounceRate,
        open_rate: sent > 0 ? (opened / sent) * 100 : 0,
        click_rate: sent > 0 ? (clicked / sent) * 100 : 0,
      });

      // Calculate status distribution for pie chart
      setStatusDistribution([
        { name: "Sent", value: sent, color: "hsl(var(--chart-1))" },
        { name: "Opened", value: opened, color: "hsl(var(--chart-2))" },
        { name: "Clicked", value: clicked, color: "hsl(var(--chart-3))" },
        { name: "Bounced", value: bounced, color: "hsl(var(--chart-4))" },
        { name: "Failed", value: failed, color: "hsl(var(--chart-5))" },
        { name: "Pending", value: pending, color: "hsl(var(--muted))" },
      ].filter(item => item.value > 0));
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDailyMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("email_delivery_log")
        .select("created_at, status, opened_at, clicked_at, bounced_at")
        .eq("email_type", "annual_tax_summary")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const metricsByDate = new Map<string, DailyMetric>();

      data?.forEach((log) => {
        const date = format(new Date(log.created_at), "MMM dd");
        
        if (!metricsByDate.has(date)) {
          metricsByDate.set(date, { date, sent: 0, opened: 0, clicked: 0, bounced: 0 });
        }

        const metric = metricsByDate.get(date)!;
        if (log.status === "sent") metric.sent++;
        if (log.opened_at) metric.opened++;
        if (log.clicked_at) metric.clicked++;
        if (log.bounced_at) metric.bounced++;
      });

      setDailyMetrics(Array.from(metricsByDate.values()));
    } catch (error: any) {
      console.error("Error fetching daily metrics:", error);
    }
  };

  const handleSendSummaries = async () => {
    setSending(true);
    try {
      const year = parseInt(selectedYear);
      
      const { data, error } = await supabase.functions.invoke("schedule-annual-summaries", {
        body: { year, manual: true },
      });

      if (error) throw error;

      toast({
        title: "Batch processing started",
        description: `Sending annual summaries for ${year}. This may take several minutes.`,
      });

      // Refresh logs after 5 seconds
      setTimeout(() => {
        fetchEmailLogs();
        fetchStats();
      }, 5000);
    } catch (error: any) {
      console.error("Error sending summaries:", error);
      toast({
        title: "Error",
        description: "Failed to start batch processing",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (log: EmailLog) => {
    if (log.bounced_at) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Bounced</Badge>;
    }
    if (log.status === "failed") {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
    }
    if (log.clicked_at) {
      return <Badge className="gap-1 bg-green-500"><MousePointerClick className="h-3 w-3" /> Clicked</Badge>;
    }
    if (log.opened_at) {
      return <Badge className="gap-1 bg-blue-500"><MailOpen className="h-3 w-3" /> Opened</Badge>;
    }
    if (log.sent_at) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> Sent</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onGroupClick={() => {}} activeGroup={null} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Email Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage annual tax summary emails and track delivery
              </p>
            </div>

            {/* Date Range Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Analytics Period
                </CardTitle>
                <CardDescription>
                  Filter analytics data by date range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="secondary"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 1)),
                      to: endOfMonth(new Date()),
                    })}
                  >
                    Reset to Last Month
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="analytics" className="space-y-6">
              <TabsList>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="send">Send Emails</TabsTrigger>
                <TabsTrigger value="tracking">Delivery Tracking</TabsTrigger>
                <TabsTrigger value="preview">Preview Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="space-y-6">
                {stats && (
                  <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Total Emails
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Delivery Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.delivery_rate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">{stats.sent} delivered</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MailOpen className="h-4 w-4" />
                            Open Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.open_rate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">{stats.opened} opened</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MousePointerClick className="h-4 w-4" />
                            Click Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.click_rate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">{stats.clicked} clicked</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Bounce Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-destructive">{stats.bounce_rate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">{stats.bounced} bounced</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Failed
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
                          <p className="text-xs text-muted-foreground">delivery errors</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Engagement Trends */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Engagement Trends
                          </CardTitle>
                          <CardDescription>Email opens and clicks over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dailyMetrics}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="date" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--popover))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "6px",
                                }}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="sent"
                                stackId="1"
                                stroke="hsl(var(--chart-1))"
                                fill="hsl(var(--chart-1))"
                                name="Sent"
                              />
                              <Area
                                type="monotone"
                                dataKey="opened"
                                stackId="2"
                                stroke="hsl(var(--chart-2))"
                                fill="hsl(var(--chart-2))"
                                name="Opened"
                              />
                              <Area
                                type="monotone"
                                dataKey="clicked"
                                stackId="3"
                                stroke="hsl(var(--chart-3))"
                                fill="hsl(var(--chart-3))"
                                name="Clicked"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Status Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Status Distribution
                          </CardTitle>
                          <CardDescription>Breakdown of email statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="hsl(var(--primary))"
                                dataKey="value"
                              >
                                {statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--popover))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "6px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Daily Volume */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Daily Email Volume
                          </CardTitle>
                          <CardDescription>Number of emails sent per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyMetrics}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="date" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--popover))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "6px",
                                }}
                              />
                              <Legend />
                              <Bar dataKey="sent" fill="hsl(var(--chart-1))" name="Sent" />
                              <Bar dataKey="opened" fill="hsl(var(--chart-2))" name="Opened" />
                              <Bar dataKey="clicked" fill="hsl(var(--chart-3))" name="Clicked" />
                              <Bar dataKey="bounced" fill="hsl(var(--chart-4))" name="Bounced" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="send" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Annual Tax Summaries</CardTitle>
                    <CardDescription>
                      Manually trigger annual tax summary emails for all eligible donors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Select Tax Year</label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleSendSummaries}
                          disabled={sending}
                          className="w-full md:w-auto"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Summaries
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> This will send annual tax summaries to all donors who made 
                        tax-deductible donations in {selectedYear}. Emails are sent in batches of 50 to 
                        ensure reliable delivery. Processing may take several minutes depending on the number of recipients.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Delivery Log</CardTitle>
                    <CardDescription>
                      Track the status of sent annual tax summaries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No emails sent yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {log.recipient_name || "Unknown"}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {log.recipient_email}
                                  </p>
                                </div>
                              </div>
                              {log.sent_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Sent {format(new Date(log.sent_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                              {log.error_message && (
                                <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              {log.year && (
                                <Badge variant="outline">{log.year}</Badge>
                              )}
                              {getStatusBadge(log)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Template Preview</CardTitle>
                    <CardDescription>
                      Preview how annual tax summary emails will appear to donors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Email Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Annual Tax Summary Email Preview</DialogTitle>
                          <DialogDescription>
                            Sample email with mock donor data
                          </DialogDescription>
                        </DialogHeader>
                        <div className="border rounded-lg p-6 bg-white">
                          <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-center">Thank You for Your Generosity!</h1>
                            <p>Dear Sample Donor,</p>
                            <p>
                              As we begin a new year, we want to express our heartfelt gratitude for your generous 
                              support throughout 2023. Your contributions have made a real difference in the lives of many.
                            </p>
                            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
                              <h2 className="text-lg font-bold mb-4">Your 2023 Impact Summary</h2>
                              <div className="space-y-2">
                                <p><strong className="text-blue-600">Total Donated:</strong> $2,450.00</p>
                                <p><strong className="text-blue-600">Number of Donations:</strong> 8</p>
                                <p><strong className="text-blue-600">Organizations Supported:</strong> 3</p>
                              </div>
                            </div>
                            <h2 className="text-lg font-bold">Organizations You Supported</h2>
                            <div className="space-y-3">
                              <div className="bg-gray-50 border-l-4 border-green-500 p-4 rounded">
                                <p className="font-semibold">Sample Organization 1</p>
                                <p className="text-sm text-gray-600">$1,200.00 across 4 donations</p>
                              </div>
                              <div className="bg-gray-50 border-l-4 border-green-500 p-4 rounded">
                                <p className="font-semibold">Sample Organization 2</p>
                                <p className="text-sm text-gray-600">$850.00 across 3 donations</p>
                              </div>
                            </div>
                            <hr />
                            <p>
                              Thank you again for your incredible generosity. Your support continues to make a lasting impact.
                            </p>
                            <p>
                              With gratitude,<br />
                              <strong>The Sponsorly Team</strong>
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        The actual email includes a comprehensive PDF attachment with detailed donation breakdowns, 
                        organization information, EINs, and IRS-compliant documentation.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmailManagement;
