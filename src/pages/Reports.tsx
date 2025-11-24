import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, startOfYear, subMonths, parseISO } from "date-fns";
import { DollarSign, Target, TrendingUp, Users, Download, Activity, Heart } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface CampaignReport {
  id: string;
  name: string;
  group_name: string;
  goal_amount: number | null;
  amount_raised: number | null;
  status: boolean | null;
  start_date: string | null;
  end_date: string | null;
  donation_count: number;
}

interface ReportStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  totalGoal: number;
  totalDonations: number;
  avgDonation: number;
}

interface MonthlyData {
  month: string;
  donations: number;
  amount: number;
  campaigns: number;
}

interface TopCampaign {
  id: string;
  name: string;
  group_name: string;
  amount_raised: number;
  donation_count: number;
  goal_amount: number | null;
}

interface RecentDonation {
  id: string;
  customer_name: string | null;
  total_amount: number;
  created_at: string;
  campaign_name: string;
}

const Reports = () => {
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRaised: 0,
    totalGoal: 0,
    totalDonations: 0,
    avgDonation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{id: string, group_name: string}>>([]);
  const [dateRange, setDateRange] = useState<string>("all");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);

  const handleGroupClick = (groupId: string | null) => {
    setSelectedGroup(groupId);
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "month":
        return startOfMonth(now).toISOString();
      case "3months":
        return subMonths(now, 3).toISOString();
      case "year":
        return startOfYear(now).toISOString();
      case "all":
      default:
        return null;
    }
  };

  const fetchGroups = async () => {
    if (!organizationUser?.organization_id) return;
    
    const permissionLevel = organizationUser.user_type?.permission_level;
    
    if (permissionLevel === 'organization_admin' || permissionLevel === 'program_manager') {
      const { data, error } = await supabase
        .from("groups")
        .select("id, group_name")
        .eq("organization_id", organizationUser.organization_id)
        .eq("status", true)
        .order("group_name");
        
      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }
      setGroups(data || []);
    } else if (permissionLevel === 'participant' || permissionLevel === 'supporter') {
      if (organizationUser.groups) {
        setGroups([organizationUser.groups]);
      }
    }
  };

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchGroups();
      fetchReportData();
      setupRealtimeSubscriptions();
    }

    return () => {
      supabase.channel('reports-updates').unsubscribe();
    };
  }, [organizationUser?.organization_id]);

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchReportData();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchReportData();
    }
  }, [dateRange]);

  const setupRealtimeSubscriptions = () => {
    if (!organizationUser?.organization_id) return;

    const channel = supabase
      .channel('reports-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          console.log('Orders updated, refreshing reports...');
          fetchReportData();
          toast({
            title: "New Activity",
            description: "Reports updated with new donation data",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
        },
        () => {
          console.log('Campaign updated, refreshing reports...');
          fetchReportData();
        }
      )
      .subscribe();

    return channel;
  };

  const fetchReportData = async () => {
    if (!organizationUser?.organization_id) return;

    setLoading(true);
    try {
      // Fetch campaigns with donation counts
      let campaignsQuery = supabase
        .from("campaigns")
        .select(`
          id,
          name,
          goal_amount,
          amount_raised,
          status,
          start_date,
          end_date,
          group_id,
          groups!inner(
            id,
            group_name,
            organization_id
          )
        `)
        .eq("groups.organization_id", organizationUser.organization_id)
        .order("created_at", { ascending: false });

      // Filter by selected group if one is selected
      if (selectedGroup && selectedGroup !== "All") {
        campaignsQuery = campaignsQuery.eq("group_id", selectedGroup);
      }

      // Filter by date range
      const dateFilter = getDateRangeFilter();
      if (dateFilter) {
        campaignsQuery = campaignsQuery.gte("start_date", dateFilter);
      }

      const { data: campaignsData, error: campaignsError } = await campaignsQuery;

      if (campaignsError) throw campaignsError;

      // Fetch donation counts and amounts for each campaign
      const campaignReports: CampaignReport[] = await Promise.all(
        (campaignsData || []).map(async (campaign: any) => {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id)
            .in("status", ["succeeded", "completed"]);

          return {
            id: campaign.id,
            name: campaign.name,
            group_name: campaign.groups.group_name,
            goal_amount: campaign.goal_amount,
            amount_raised: campaign.amount_raised,
            status: campaign.status,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            donation_count: count || 0,
          };
        })
      );

      setCampaigns(campaignReports);

      // Fetch orders with timestamps for chart data
      let ordersWithDateQuery = supabase
        .from("orders")
        .select(`
          created_at,
          total_amount,
          campaign_id,
          campaigns!inner(
            id,
            name,
            group_id,
            groups!inner(
              school_id
            )
          )
        `)
        .eq("campaigns.groups.organization_id", organizationUser.organization_id)
        .in("status", ["succeeded", "completed"])
        .order("created_at", { ascending: true });

      // Filter by selected group if one is selected
      if (selectedGroup && selectedGroup !== "All") {
        ordersWithDateQuery = ordersWithDateQuery.eq("campaigns.group_id", selectedGroup);
      }

      // Filter by date range
      if (dateFilter) {
        ordersWithDateQuery = ordersWithDateQuery.gte("created_at", dateFilter);
      }

      const { data: ordersWithDate, error: ordersWithDateError } = await ordersWithDateQuery;

      if (ordersWithDateError) throw ordersWithDateError;

      // Process data for charts - group by month
      const monthlyMap = new Map<string, { donations: number; amount: number; campaigns: Set<string> }>();
      
      ordersWithDate?.forEach((order) => {
        const monthKey = format(parseISO(order.created_at), "MMM yyyy");
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { donations: 0, amount: 0, campaigns: new Set() });
        }
        const monthData = monthlyMap.get(monthKey)!;
        monthData.donations += 1;
        monthData.amount += order.total_amount || 0;
        monthData.campaigns.add(order.campaign_id);
      });

      // Convert to array for charts
      const chartData: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        donations: data.donations,
        amount: data.amount,
        campaigns: data.campaigns.size,
      }));

      setMonthlyData(chartData);

      // Fetch overall donation statistics
      let ordersQuery = supabase
        .from("orders")
        .select(`
          total_amount,
          campaigns!inner(
            id,
            group_id,
            groups!inner(
              school_id
            )
          )
        `)
        .eq("campaigns.groups.organization_id", organizationUser.organization_id)
        .in("status", ["succeeded", "completed"]);

      // Filter by selected group if one is selected
      if (selectedGroup && selectedGroup !== "All") {
        ordersQuery = ordersQuery.eq("campaigns.group_id", selectedGroup);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;

      if (ordersError) throw ordersError;

      // Calculate statistics
      const totalRaised = campaignReports.reduce(
        (sum, c) => sum + (c.amount_raised || 0),
        0
      );
      const totalGoal = campaignReports.reduce(
        (sum, c) => sum + (c.goal_amount || 0),
        0
      );
      const totalDonations = ordersData?.length || 0;
      const avgDonation =
        totalDonations > 0
          ? ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0) / totalDonations
          : 0;

      setStats({
        totalCampaigns: campaignReports.length,
        activeCampaigns: campaignReports.filter((c) => c.status).length,
        totalRaised,
        totalGoal,
        totalDonations,
        avgDonation,
      });

      // Fetch top performing campaigns
      const topPerformers = [...campaignReports]
        .sort((a, b) => (b.amount_raised || 0) - (a.amount_raised || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          group_name: c.group_name,
          amount_raised: c.amount_raised || 0,
          donation_count: c.donation_count,
          goal_amount: c.goal_amount,
        }));
      setTopCampaigns(topPerformers);

      // Fetch recent donations
      let recentQuery = supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          total_amount,
          created_at,
          campaigns!inner(
            name,
            groups!inner(
              organization_id
            )
          )
        `)
        .eq("campaigns.groups.organization_id", organizationUser.organization_id)
        .in("status", ["succeeded", "completed"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (selectedGroup && selectedGroup !== "All") {
        recentQuery = recentQuery.eq("campaigns.group_id", selectedGroup);
      }

      const { data: recentData } = await recentQuery;
      
      if (recentData) {
        setRecentDonations(
          recentData.map((order: any) => ({
            id: order.id,
            customer_name: order.customer_name,
            total_amount: order.total_amount,
            created_at: order.created_at,
            campaign_name: order.campaigns?.name || 'Unknown Campaign',
          }))
        );
      }

    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return "No dates set";
    if (!startDate) return `Ends ${format(new Date(endDate!), "MMM d, yyyy")}`;
    if (!endDate) return `Starts ${format(new Date(startDate), "MMM d, yyyy")}`;
    return `${format(new Date(startDate), "MMM d")} - ${format(new Date(endDate), "MMM d, yyyy")}`;
  };

  const calculateProgress = (raised: number | null, goal: number | null) => {
    if (!goal || goal === 0) return 0;
    return Math.min(Math.round(((raised || 0) / goal) * 100), 100);
  };

  const exportToCSV = () => {
    // Create header row with statistics summary
    const summaryRows = [
      ['CAMPAIGN REPORTS SUMMARY'],
      [''],
      ['Period', dateRange === 'month' ? 'This Month' : dateRange === '3months' ? 'Last 3 Months' : dateRange === 'year' ? 'This Year' : 'All Time'],
      ['Group', selectedGroup && activeGroup ? activeGroup.group_name : 'All Groups'],
      [''],
      ['OVERALL STATISTICS'],
      ['Total Campaigns', stats.totalCampaigns.toString()],
      ['Active Campaigns', stats.activeCampaigns.toString()],
      ['Total Raised', formatCurrency(stats.totalRaised)],
      ['Total Goal', formatCurrency(stats.totalGoal)],
      ['Total Donations', stats.totalDonations.toString()],
      ['Average Donation', formatCurrency(stats.avgDonation)],
      [''],
      ['CAMPAIGN DETAILS'],
      ['Campaign Name', 'Group', 'Goal', 'Amount Raised', 'Progress (%)', 'Donations', 'Status', 'Date Range']
    ];

    // Add campaign data rows
    const dataRows = campaigns.map(campaign => [
      campaign.name,
      campaign.group_name,
      formatCurrency(campaign.goal_amount),
      formatCurrency(campaign.amount_raised),
      calculateProgress(campaign.amount_raised, campaign.goal_amount).toString() + '%',
      campaign.donation_count.toString(),
      campaign.status ? 'Active' : 'Inactive',
      formatDateRange(campaign.start_date, campaign.end_date)
    ]);

    // Combine all rows
    const csvContent = [...summaryRows, ...dataRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeGroup = selectedGroup ? groups.find(g => g.id === selectedGroup) : null;

  if (organizationUserLoading || loading) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            onGroupClick={handleGroupClick} 
            activeGroup={activeGroup} 
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[350px]" />
                <Skeleton className="h-[350px]" />
              </div>
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          onGroupClick={handleGroupClick} 
          activeGroup={activeGroup} 
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                Analytics Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Live</span>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={exportToCSV}
                  disabled={campaigns.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Target className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeCampaigns} currently active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                  <DollarSign className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{formatCurrency(stats.totalRaised)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {formatCurrency(stats.totalGoal)} goal ({calculateProgress(stats.totalRaised, stats.totalGoal)}%)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.totalDonations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaigns.length > 0 
                      ? `${(stats.totalDonations / campaigns.length).toFixed(1)} avg per campaign`
                      : "No campaigns yet"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
                  <TrendingUp className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">{formatCurrency(stats.avgDonation)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    per supporter contribution
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Charts */}
            {monthlyData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Donations Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="donations" 
                          fill="hsl(var(--primary))" 
                          name="Donations" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            color: 'hsl(var(--foreground))'
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount Raised']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Amount Raised"
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Top Performing Campaigns
                  </CardTitle>
                  <CardDescription>
                    Campaigns with the highest donations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topCampaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No campaign data available yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topCampaigns.map((campaign, index) => (
                        <div key={campaign.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">{campaign.group_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(campaign.amount_raised)}
                              </span>
                              {campaign.goal_amount && (
                                <span className="text-xs text-muted-foreground">
                                  of {formatCurrency(campaign.goal_amount)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all"
                                  style={{ 
                                    width: `${calculateProgress(campaign.amount_raised, campaign.goal_amount)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {campaign.donation_count} donations
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Recent Donations
                  </CardTitle>
                  <CardDescription>
                    Latest supporter contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentDonations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No recent donations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentDonations.map((donation) => (
                        <div 
                          key={donation.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {donation.customer_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {donation.campaign_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(parseISO(donation.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-primary">
                              {formatCurrency(donation.total_amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Campaign Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">
                      No campaigns have been created yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Create your first campaign to start seeing reports!
                    </p>
                  </div>
                ) : isMobile ? (
                  // Mobile Card View
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{campaign.group_name}</p>
                            </div>
                            <Badge variant={campaign.status ? "default" : "secondary"}>
                              {campaign.status ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">
                                {formatCurrency(campaign.amount_raised)} / {formatCurrency(campaign.goal_amount)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <Progress value={calculateProgress(campaign.amount_raised, campaign.goal_amount)} />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{calculateProgress(campaign.amount_raised, campaign.goal_amount)}%</span>
                                <span>{campaign.donation_count} donations</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDateRange(campaign.start_date, campaign.end_date)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Desktop Table View
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead className="text-right">Goal</TableHead>
                        <TableHead className="text-right">Raised</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                        <TableHead className="text-right">Donations</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>{campaign.group_name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(campaign.goal_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(campaign.amount_raised)}
                          </TableCell>
                          <TableCell className="text-right">
                            {calculateProgress(campaign.amount_raised, campaign.goal_amount)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {campaign.donation_count}
                          </TableCell>
                          <TableCell>
                            <Badge variant={campaign.status ? "default" : "secondary"}>
                              {campaign.status ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateRange(campaign.start_date, campaign.end_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
