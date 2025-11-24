import { useState, useEffect } from "react";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, TrendingUp, Users, CheckCircle, MousePointerClick, BarChart3, RefreshCw } from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { format, subDays } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  created_at: string;
}

interface EnrollmentStats {
  campaign_id: string;
  campaign_name: string;
  total: number;
  active: number;
  completed: number;
  paused: number;
}

interface EmailMetrics {
  campaign_id: string | null;
  template_key: string | null;
  sent: number;
  opened: number;
  clicked: number;
  open_rate: number;
  click_rate: number;
  click_through_rate: number;
}

interface TimelineData {
  date: string;
  enrollments: number;
  emails_sent: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

const BusinessCampaignAnalytics = () => {
  const { organizationUser } = useOrganizationUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats[]>([]);
  const [emailMetrics, setEmailMetrics] = useState<EmailMetrics[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchData();
    }
  }, [organizationUser?.organization_id, selectedCampaign, dateRange]);

  const fetchData = async () => {
    if (!organizationUser?.organization_id) return;

    try {
      setLoading(true);

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('business_nurture_campaigns')
        .select('*')
        .eq('organization_id', organizationUser.organization_id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch enrollment stats
      let enrollmentQuery = supabase
        .from('business_nurture_enrollments')
        .select(`
          campaign_id,
          status,
          business_nurture_campaigns!inner(name, organization_id)
        `)
        .eq('business_nurture_campaigns.organization_id', organizationUser.organization_id);

      if (selectedCampaign !== "all") {
        enrollmentQuery = enrollmentQuery.eq('campaign_id', selectedCampaign);
      }

      const { data: enrollmentsData, error: enrollmentsError } = await enrollmentQuery;
      if (enrollmentsError) throw enrollmentsError;

      // Aggregate enrollment stats
      const statsMap = new Map<string, EnrollmentStats>();
      enrollmentsData?.forEach((e: any) => {
        const campaignId = e.campaign_id;
        const campaignName = e.business_nurture_campaigns.name;
        
        if (!statsMap.has(campaignId)) {
          statsMap.set(campaignId, {
            campaign_id: campaignId,
            campaign_name: campaignName,
            total: 0,
            active: 0,
            completed: 0,
            paused: 0
          });
        }
        
        const stats = statsMap.get(campaignId)!;
        stats.total++;
        if (e.status === 'active') stats.active++;
        else if (e.status === 'completed') stats.completed++;
        else if (e.status === 'paused') stats.paused++;
      });

      setEnrollmentStats(Array.from(statsMap.values()));

      // Fetch email metrics
      const daysAgo = parseInt(dateRange);
      const startDate = subDays(new Date(), daysAgo).toISOString();

      let emailQuery = supabase
        .from('email_delivery_log')
        .select('*')
        .eq('email_type', 'business_outreach_automated')
        .gte('created_at', startDate);

      const { data: emailsData, error: emailsError } = await emailQuery;
      if (emailsError) throw emailsError;

      // Filter by campaign if selected
      const filteredEmails = selectedCampaign !== "all" 
        ? emailsData?.filter((e: any) => e.metadata?.campaign_id === selectedCampaign) || []
        : emailsData || [];

      // Aggregate email metrics by campaign and template
      const metricsMap = new Map<string, EmailMetrics>();
      
      filteredEmails.forEach((email: any) => {
        const campaignId = email.metadata?.campaign_id || null;
        const templateKey = email.metadata?.template_key || null;
        const key = `${campaignId}_${templateKey}`;
        
        if (!metricsMap.has(key)) {
          metricsMap.set(key, {
            campaign_id: campaignId,
            template_key: templateKey,
            sent: 0,
            opened: 0,
            clicked: 0,
            open_rate: 0,
            click_rate: 0,
            click_through_rate: 0
          });
        }
        
        const metrics = metricsMap.get(key)!;
        if (email.sent_at) metrics.sent++;
        if (email.opened_at) metrics.opened++;
        if (email.clicked_at) metrics.clicked++;
      });

      // Calculate rates
      const metricsArray = Array.from(metricsMap.values()).map(m => ({
        ...m,
        open_rate: m.sent > 0 ? (m.opened / m.sent) * 100 : 0,
        click_rate: m.sent > 0 ? (m.clicked / m.sent) * 100 : 0,
        click_through_rate: m.opened > 0 ? (m.clicked / m.opened) * 100 : 0
      }));

      setEmailMetrics(metricsArray);

      // Fetch timeline data
      const { data: enrollmentTimeline, error: timelineError } = await supabase
        .from('business_nurture_enrollments')
        .select('enrolled_at, campaign_id')
        .eq('business_nurture_campaigns.organization_id', organizationUser.organization_id)
        .gte('enrolled_at', startDate)
        .order('enrolled_at');

      if (timelineError) throw timelineError;

      // Aggregate by date
      const timelineMap = new Map<string, { enrollments: number; emails: number }>();
      const emailsByDate = new Map<string, number>();
      
      filteredEmails.forEach((email: any) => {
        if (email.sent_at) {
          const date = format(new Date(email.sent_at), 'MMM dd');
          emailsByDate.set(date, (emailsByDate.get(date) || 0) + 1);
        }
      });

      enrollmentTimeline?.forEach((e: any) => {
        if (e.enrolled_at) {
          const date = format(new Date(e.enrolled_at), 'MMM dd');
          if (!timelineMap.has(date)) {
            timelineMap.set(date, { enrollments: 0, emails: 0 });
          }
          timelineMap.get(date)!.enrollments++;
        }
      });

      emailsByDate.forEach((count, date) => {
        if (!timelineMap.has(date)) {
          timelineMap.set(date, { enrollments: 0, emails: 0 });
        }
        timelineMap.get(date)!.emails = count;
      });

      const timeline = Array.from(timelineMap.entries())
        .map(([date, data]) => ({
          date,
          enrollments: data.enrollments,
          emails_sent: data.emails
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTimelineData(timeline);

    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      toast.error('Failed to load campaign analytics');
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall metrics
  const totalEnrollments = enrollmentStats.reduce((sum, s) => sum + s.total, 0);
  const activeEnrollments = enrollmentStats.reduce((sum, s) => sum + s.active, 0);
  const completedEnrollments = enrollmentStats.reduce((sum, s) => sum + s.completed, 0);
  const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

  const totalEmailsSent = emailMetrics.reduce((sum, m) => sum + m.sent, 0);
  const totalOpened = emailMetrics.reduce((sum, m) => sum + m.opened, 0);
  const totalClicked = emailMetrics.reduce((sum, m) => sum + m.clicked, 0);
  const overallOpenRate = totalEmailsSent > 0 ? (totalOpened / totalEmailsSent) * 100 : 0;
  const overallClickRate = totalEmailsSent > 0 ? (totalClicked / totalEmailsSent) * 100 : 0;

  // Campaign comparison data
  const campaignComparison = enrollmentStats.map(stat => {
    const campaignEmails = emailMetrics.filter(m => m.campaign_id === stat.campaign_id);
    const sent = campaignEmails.reduce((sum, m) => sum + m.sent, 0);
    const opened = campaignEmails.reduce((sum, m) => sum + m.opened, 0);
    
    return {
      name: stat.campaign_name,
      enrollments: stat.total,
      emails_sent: sent,
      open_rate: sent > 0 ? (opened / sent) * 100 : 0
    };
  });

  // Template performance data
  const templatePerformance = emailMetrics
    .filter(m => m.template_key)
    .map(m => ({
      template: m.template_key,
      sent: m.sent,
      open_rate: m.open_rate,
      click_rate: m.click_rate
    }));

  if (loading) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "Businesses", path: "/dashboard/businesses" },
          { label: "Campaign Analytics" }
        ]}
        loading={true}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Businesses", path: "/dashboard/businesses" },
        { label: "Campaign Analytics" }
      ]}
    >
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Campaign Analytics</h2>
            <p className="text-muted-foreground">Track email performance and enrollment metrics</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmailsSent}</div>
              <p className="text-xs text-muted-foreground">
                Sent across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallOpenRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {totalOpened} emails opened
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallClickRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {totalClicked} links clicked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEnrollments}</div>
              <p className="text-xs text-muted-foreground">
                of {totalEnrollments} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {completedEnrollments} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
            <TabsTrigger value="emails">Email Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>Enrollments and emails sent over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="enrollments" 
                        stackId="1"
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))"
                        name="Enrollments"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="emails_sent" 
                        stackId="2"
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))"
                        name="Emails Sent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Status</CardTitle>
                  <CardDescription>Distribution of enrollment states</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: activeEnrollments },
                          { name: 'Completed', value: completedEnrollments },
                          { name: 'Paused', value: totalEnrollments - activeEnrollments - completedEnrollments }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Comparison</CardTitle>
                <CardDescription>Enrollments and email metrics by campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={campaignComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Open Rate') return [`${value.toFixed(1)}%`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="enrollments" fill="hsl(var(--chart-1))" name="Enrollments" />
                    <Bar yAxisId="left" dataKey="emails_sent" fill="hsl(var(--chart-2))" name="Emails Sent" />
                    <Bar yAxisId="right" dataKey="open_rate" fill="hsl(var(--chart-3))" name="Open Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Campaign Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-4">
              {enrollmentStats.map(stat => {
                const campaignEmails = emailMetrics.filter(m => m.campaign_id === stat.campaign_id);
                const sent = campaignEmails.reduce((sum, m) => sum + m.sent, 0);
                const opened = campaignEmails.reduce((sum, m) => sum + m.opened, 0);
                const clicked = campaignEmails.reduce((sum, m) => sum + m.clicked, 0);
                const openRate = sent > 0 ? (opened / sent) * 100 : 0;
                const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;

                return (
                  <Card key={stat.campaign_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{stat.campaign_name}</CardTitle>
                        <Badge variant="outline">{stat.total} enrollments</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Active</p>
                          <p className="text-2xl font-bold">{stat.active}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{stat.completed}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Emails Sent</p>
                          <p className="text-2xl font-bold">{sent}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Open Rate</p>
                          <p className="text-2xl font-bold">{openRate.toFixed(1)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Click Rate</p>
                          <p className="text-2xl font-bold">{clickRate.toFixed(1)}%</p>
                        </div>
                      </div>

                      {campaignEmails.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Email Sequence Performance</h4>
                          <div className="space-y-2">
                            {campaignEmails.map((email, idx) => (
                              <div 
                                key={`${email.campaign_id}_${email.template_key}_${idx}`}
                                className="flex items-center justify-between p-3 border border-border rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{email.template_key || 'Unknown Template'}</p>
                                  <p className="text-xs text-muted-foreground">{email.sent} sent</p>
                                </div>
                                <div className="flex gap-4 text-sm">
                                  <div className="text-center">
                                    <p className="font-medium">{email.open_rate.toFixed(1)}%</p>
                                    <p className="text-xs text-muted-foreground">Opens</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-medium">{email.click_rate.toFixed(1)}%</p>
                                    <p className="text-xs text-muted-foreground">Clicks</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {enrollmentStats.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No campaign data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create and activate campaigns to see analytics here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Email Performance Tab */}
          <TabsContent value="emails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Performance</CardTitle>
                <CardDescription>Email engagement by template type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={templatePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="template" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name.includes('Rate')) return [`${value.toFixed(1)}%`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="open_rate" fill="hsl(var(--chart-2))" name="Open Rate (%)" />
                    <Bar dataKey="click_rate" fill="hsl(var(--chart-3))" name="Click Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Email Metrics</CardTitle>
                <CardDescription>Complete breakdown of all email templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emailMetrics.map((metric, idx) => (
                    <div 
                      key={`${metric.campaign_id}_${metric.template_key}_${idx}`}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{metric.template_key || 'Unknown Template'}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric.sent} sent · {metric.opened} opened · {metric.clicked} clicked
                        </p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-lg">{metric.open_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Open Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg">{metric.click_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Click Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg">{metric.click_through_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">CTR</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {emailMetrics.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No email data available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Email metrics will appear here once campaigns start sending
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
};

export default BusinessCampaignAnalytics;
