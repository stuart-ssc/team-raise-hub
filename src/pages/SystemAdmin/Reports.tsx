import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Building2, Users, Target, Briefcase, Heart, TrendingUp, TrendingDown } from "lucide-react";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface Stats {
  totalRevenue: number;
  totalOrganizations: number;
  activeUsers: number;
  activeCampaigns: number;
  totalBusinesses: number;
  totalDonors: number;
  revenueGrowth: number;
  orgGrowth: number;
}

interface MonthlyData {
  month: string;
  users: number;
  campaigns: number;
  revenue: number;
}

interface OrgDistribution {
  name: string;
  value: number;
}

interface TopOrganization {
  name: string;
  type: string;
  totalRaised: number;
  activeCampaigns: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const SystemAdminReports = () => {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrganizations: 0,
    activeUsers: 0,
    activeCampaigns: 0,
    totalBusinesses: 0,
    totalDonors: 0,
    revenueGrowth: 0,
    orgGrowth: 0
  });
  
  const [dateRange, setDateRange] = useState<string>("3months");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [orgDistribution, setOrgDistribution] = useState<OrgDistribution[]>([]);
  const [topOrganizations, setTopOrganizations] = useState<TopOrganization[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const getDateRangeMonths = () => {
    switch (dateRange) {
      case "1month": return 1;
      case "3months": return 3;
      case "6months": return 6;
      case "12months": return 12;
      case "all": return 24; // 2 years for all-time
      default: return 3;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const months = getDateRangeMonths();
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      
      // Fetch all data in parallel
      const [
        ordersResult,
        orgsResult,
        usersResult,
        campaignsResult,
        businessesResult,
        donorsResult,
        monthlyUsersResult,
        monthlyCampaignsResult,
        monthlyRevenueResult,
        orgTypesResult,
        topOrgsResult,
        recentOrdersResult,
        recentCampaignsResult,
        recentUsersResult
      ] = await Promise.all([
        // Total stats
        supabase.from('orders').select('total_amount').in('status', ['succeeded', 'completed']),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('publication_status', 'published'),
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('donor_profiles').select('id', { count: 'exact', head: true }),
        
        // Monthly trends
        supabase.from('profiles').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('campaigns').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('orders').select('created_at, total_amount').in('status', ['succeeded', 'completed']).gte('created_at', startDate.toISOString()),
        
        // Organization distribution
        supabase.from('organizations').select('organization_type'),
        
        // Top organizations by revenue - fetch all orgs for manual calculation
        supabase.from('organizations').select('id, name, organization_type').limit(50),
        
        // Recent activity
        supabase.from('orders').select('created_at, customer_name, total_amount').in('status', ['succeeded', 'completed']).order('created_at', { ascending: false }).limit(5),
        supabase.from('campaigns').select('created_at, name').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('created_at, first_name, last_name').order('created_at', { ascending: false }).limit(5)
      ]);

      // Calculate total revenue
      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // Calculate growth (comparing to previous period)
      const prevMonthStart = startOfMonth(subMonths(new Date(), months));
      const prevOrgsResult = await supabase.from('organizations')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', prevMonthStart.toISOString());
      
      const prevRevenueResult = await supabase.from('orders')
        .select('total_amount')
        .in('status', ['succeeded', 'completed'])
        .lt('created_at', prevMonthStart.toISOString());
      
      const prevRevenue = prevRevenueResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const orgGrowth = (prevOrgsResult.count || 0) > 0 ? 
        (((orgsResult.count || 0) - (prevOrgsResult.count || 0)) / (prevOrgsResult.count || 0)) * 100 : 0;

      setStats({
        totalRevenue,
        totalOrganizations: orgsResult.count || 0,
        activeUsers: usersResult.count || 0,
        activeCampaigns: campaignsResult.count || 0,
        totalBusinesses: businessesResult.count || 0,
        totalDonors: donorsResult.count || 0,
        revenueGrowth,
        orgGrowth
      });

      // Process monthly data
      const monthlyMap = new Map<string, { users: number; campaigns: number; revenue: number }>();
      
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(new Date(), months - 1 - i);
        const monthKey = format(monthDate, 'MMM yyyy');
        monthlyMap.set(monthKey, { users: 0, campaigns: 0, revenue: 0 });
      }

      monthlyUsersResult.data?.forEach(user => {
        const monthKey = format(new Date(user.created_at), 'MMM yyyy');
        const existing = monthlyMap.get(monthKey);
        if (existing) monthlyMap.set(monthKey, { ...existing, users: existing.users + 1 });
      });

      monthlyCampaignsResult.data?.forEach(campaign => {
        const monthKey = format(new Date(campaign.created_at), 'MMM yyyy');
        const existing = monthlyMap.get(monthKey);
        if (existing) monthlyMap.set(monthKey, { ...existing, campaigns: existing.campaigns + 1 });
      });

      monthlyRevenueResult.data?.forEach(order => {
        const monthKey = format(new Date(order.created_at), 'MMM yyyy');
        const existing = monthlyMap.get(monthKey);
        if (existing) monthlyMap.set(monthKey, { ...existing, revenue: existing.revenue + (order.total_amount || 0) });
      });

      const monthlyDataArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data
      }));
      
      setMonthlyData(monthlyDataArray);

      // Process organization distribution
      const typeCounts = new Map<string, number>();
      orgTypesResult.data?.forEach(org => {
        const type = org.organization_type || 'Unknown';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      setOrgDistribution(
        Array.from(typeCounts.entries()).map(([name, value]) => ({
          name: name === 'school' ? 'Schools' : name === 'nonprofit' ? 'Non-Profits' : name,
          value
        }))
      );

      // Process top organizations - calculate revenue for each
      const topOrgsData: TopOrganization[] = [];
      if (topOrgsResult.data && Array.isArray(topOrgsResult.data)) {
        // For each organization, get their campaign revenue
        const orgRevenuePromises = topOrgsResult.data.map(async (org) => {
          // Get all campaigns for this org's groups
          const { data: groups } = await supabase
            .from('groups')
            .select('id')
            .eq('organization_id', org.id);
          
          if (!groups || groups.length === 0) {
            return {
              name: org.name || 'Unknown',
              type: org.organization_type || 'unknown',
              totalRaised: 0,
              activeCampaigns: 0
            };
          }
          
          const groupIds = groups.map(g => g.id);
          
          // Get campaigns for these groups
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, publication_status')
            .in('group_id', groupIds);
          
          if (!campaigns || campaigns.length === 0) {
            return {
              name: org.name || 'Unknown',
              type: org.organization_type || 'unknown',
              totalRaised: 0,
              activeCampaigns: 0
            };
          }
          
          const campaignIds = campaigns.map(c => c.id);
          const activeCampaigns = campaigns.filter(c => c.publication_status === 'published').length;
          
          // Get order revenue for these campaigns
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .in('status', ['succeeded', 'completed'])
            .in('campaign_id', campaignIds);
          
          const totalRaised = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
          
          return {
            name: org.name || 'Unknown',
            type: org.organization_type || 'unknown',
            totalRaised,
            activeCampaigns
          };
        });
        
        topOrgsData.push(...await Promise.all(orgRevenuePromises));
      }
      
      setTopOrganizations(topOrgsData.sort((a, b) => b.totalRaised - a.totalRaised).slice(0, 10));

      // Process recent activity
      const activities: RecentActivity[] = [];
      
      recentOrdersResult.data?.forEach(order => {
        activities.push({
          type: 'donation',
          description: `${order.customer_name || 'Anonymous'} donated $${((order.total_amount || 0) / 100).toFixed(2)}`,
          timestamp: order.created_at
        });
      });

      recentCampaignsResult.data?.forEach(campaign => {
        activities.push({
          type: 'campaign',
          description: `New campaign: ${campaign.name}`,
          timestamp: campaign.created_at
        });
      });

      recentUsersResult.data?.forEach(user => {
        activities.push({
          type: 'user',
          description: `${user.first_name || ''} ${user.last_name || 'New user'} joined`,
          timestamp: user.created_at
        });
      });

      setRecentActivity(
        activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
      );

    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <SystemAdminPageLayout title="Platform Reports" subtitle="Comprehensive analytics and insights">
        <div className="p-6">
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </SystemAdminPageLayout>
    );
  }

  return (
    <SystemAdminPageLayout title="Platform Reports" subtitle="Comprehensive analytics and insights">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Date Range Filter */}
          <div className="flex justify-end">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stats.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatPercentage(stats.revenueGrowth)}
                  </span>
                  from previous period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stats.orgGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stats.orgGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatPercentage(stats.orgGrowth)}
                  </span>
                  growth rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Platform-wide</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">Currently published</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                <p className="text-xs text-muted-foreground">In advertising network</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDonors}</div>
                <p className="text-xs text-muted-foreground">Unique supporters</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Signups Over Time</CardTitle>
                <CardDescription>Monthly new user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Creation Over Time</CardTitle>
                <CardDescription>Monthly campaign launches</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="campaigns" fill="hsl(var(--primary))" name="New Campaigns" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly donation revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Distribution</CardTitle>
                <CardDescription>By organization type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orgDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orgDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Organizations by Revenue</CardTitle>
                <CardDescription>Highest fundraising organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topOrganizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      topOrganizations.map((org, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {org.type === 'school' ? 'School' : org.type === 'nonprofit' ? 'Non-Profit' : org.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(org.totalRaised)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
                <CardDescription>Latest signups, campaigns, and donations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <Badge variant={
                          activity.type === 'donation' ? 'default' :
                          activity.type === 'campaign' ? 'secondary' : 'outline'
                        }>
                          {activity.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SystemAdminPageLayout>
  );
};

export default SystemAdminReports;
