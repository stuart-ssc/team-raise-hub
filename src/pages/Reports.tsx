import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, startOfYear, subMonths } from "date-fns";
import { DollarSign, Target, TrendingUp, Users, Download } from "lucide-react";

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

const Reports = () => {
  const { schoolUser, loading: schoolUserLoading } = useSchoolUser();
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
    if (!schoolUser?.school_id) return;
    
    const userRole = schoolUser.user_type?.name;
    
    if (["Principal", "Athletic Director"].includes(userRole)) {
      const { data, error } = await supabase
        .from("groups")
        .select("id, group_name")
        .eq("school_id", schoolUser.school_id)
        .eq("status", true)
        .order("group_name");
        
      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }
      setGroups(data || []);
    } else if (["Coach", "Club Sponsor", "Booster Leader", "Team Player", "Club Participant", "Family Member"].includes(userRole)) {
      if (schoolUser.groups) {
        setGroups([schoolUser.groups]);
      }
    }
  };

  useEffect(() => {
    if (schoolUser?.school_id) {
      fetchGroups();
      fetchReportData();
    }
  }, [schoolUser?.school_id]);

  useEffect(() => {
    if (schoolUser?.school_id) {
      fetchReportData();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (schoolUser?.school_id) {
      fetchReportData();
    }
  }, [dateRange]);

  const fetchReportData = async () => {
    if (!schoolUser?.school_id) return;

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
            school_id
          )
        `)
        .eq("groups.school_id", schoolUser.school_id)
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
        .eq("campaigns.groups.school_id", schoolUser.school_id)
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

  if (schoolUserLoading || loading) {
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
              <h1 className="text-3xl font-bold text-foreground">Reports</h1>
              <div className="flex items-center gap-3">
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeCampaigns} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRaised)}</div>
                  <p className="text-xs text-muted-foreground">
                    of {formatCurrency(stats.totalGoal)} goal
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDonations}</div>
                  <p className="text-xs text-muted-foreground">
                    {campaigns.length > 0 
                      ? `Avg ${(stats.totalDonations / campaigns.length).toFixed(1)} per campaign`
                      : "No campaigns"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.avgDonation)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalGoal > 0 
                      ? `${calculateProgress(stats.totalRaised, stats.totalGoal)}% of total goal`
                      : "No goal set"}
                  </p>
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
                ) : (
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
