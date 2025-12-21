import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  Calendar,
  DollarSign,
  Users,
  Target
} from "lucide-react";
import { format, subMonths, startOfMonth, parseISO, differenceInMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DonorProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  total_donations: number;
  donation_count: number;
  first_donation_date: string | null;
  last_donation_date: string | null;
  engagement_score: number;
  lifetime_value: number;
}

interface Order {
  id: string;
  customer_email: string;
  total_amount: number;
  created_at: string;
  campaign_id: string;
  campaigns?: {
    group_id: string;
  };
}

interface CohortData {
  cohort: string;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
}

interface ChurnRiskDonor extends DonorProfile {
  daysSinceLastDonation: number;
  riskScore: number;
  riskLevel: 'High' | 'Medium' | 'Low';
}

const DonorAnalytics = () => {
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { activeGroup } = useActiveGroup();
  const { toast } = useToast();
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationUser) {
      fetchData();
    }
  }, [organizationUser, activeGroup?.id]);

  const fetchData = async () => {
    if (!organizationUser?.organization_id) return;

    setLoading(true);
    try {
      // Fetch donors
      let donorQuery = supabase
        .from("donor_profiles")
        .select("*")
        .eq("organization_id", organizationUser.organization_id);

      // Fetch orders
      let orderQuery = supabase
        .from("orders")
        .select("*, campaigns!inner(group_id)")
        .in("status", ["succeeded", "completed"])
        .not("customer_email", "is", null);

      // Apply group filtering
      if (activeGroup?.id) {
        orderQuery = orderQuery.eq("campaigns.group_id", activeGroup.id);

        // Get donor emails from filtered orders
        const { data: filteredOrders } = await orderQuery;
        const uniqueEmails = [...new Set(filteredOrders?.map(o => o.customer_email) || [])];
        
        if (uniqueEmails.length > 0) {
          donorQuery = donorQuery.in("email", uniqueEmails);
        }
      }

      const [donorsResult, ordersResult] = await Promise.all([
        donorQuery,
        orderQuery
      ]);

      if (donorsResult.error) throw donorsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      setDonors(donorsResult.data || []);
      setOrders(ordersResult.data || []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate retention cohorts
  const calculateCohorts = (): CohortData[] => {
    if (orders.length === 0) return [];

    const cohorts: { [key: string]: { [key: number]: Set<string> } } = {};
    const now = new Date();

    orders.forEach(order => {
      const orderDate = parseISO(order.created_at);
      const cohortMonth = format(startOfMonth(orderDate), 'MMM yyyy');
      const monthsSinceCohort = differenceInMonths(now, startOfMonth(orderDate));

      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {};
      }
      if (!cohorts[cohortMonth][monthsSinceCohort]) {
        cohorts[cohortMonth][monthsSinceCohort] = new Set();
      }
      cohorts[cohortMonth][monthsSinceCohort].add(order.customer_email);
    });

    const cohortData: CohortData[] = Object.entries(cohorts)
      .slice(-6)
      .map(([cohort, months]) => {
        const baseCount = months[0]?.size || 0;
        return {
          cohort,
          month0: 100,
          month1: baseCount ? Math.round(((months[1]?.size || 0) / baseCount) * 100) : 0,
          month2: baseCount ? Math.round(((months[2]?.size || 0) / baseCount) * 100) : 0,
          month3: baseCount ? Math.round(((months[3]?.size || 0) / baseCount) * 100) : 0,
          month4: baseCount ? Math.round(((months[4]?.size || 0) / baseCount) * 100) : 0,
          month5: baseCount ? Math.round(((months[5]?.size || 0) / baseCount) * 100) : 0,
        };
      });

    return cohortData;
  };

  // Calculate giving trends
  const calculateGivingTrends = () => {
    const monthlyData: { [key: string]: { amount: number; count: number } } = {};
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return format(startOfMonth(date), 'MMM yyyy');
    });

    last12Months.forEach(month => {
      monthlyData[month] = { amount: 0, count: 0 };
    });

    orders.forEach(order => {
      const orderMonth = format(startOfMonth(parseISO(order.created_at)), 'MMM yyyy');
      if (monthlyData[orderMonth]) {
        monthlyData[orderMonth].amount += order.total_amount;
        monthlyData[orderMonth].count += 1;
      }
    });

    return last12Months.map(month => ({
      month,
      amount: monthlyData[month].amount / 100,
      count: monthlyData[month].count,
      avgDonation: monthlyData[month].count > 0 
        ? (monthlyData[month].amount / monthlyData[month].count) / 100 
        : 0
    }));
  };

  // Calculate churn risk
  const calculateChurnRisk = (): ChurnRiskDonor[] => {
    const now = new Date();
    const riskyDonors: ChurnRiskDonor[] = [];

    donors.forEach(donor => {
      if (!donor.last_donation_date) return;

      const daysSinceLastDonation = Math.floor(
        (now.getTime() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Risk score based on days inactive and engagement
      let riskScore = 0;
      if (daysSinceLastDonation > 180) riskScore += 40;
      else if (daysSinceLastDonation > 90) riskScore += 25;
      else if (daysSinceLastDonation > 60) riskScore += 10;

      if (donor.engagement_score < 40) riskScore += 30;
      else if (donor.engagement_score < 60) riskScore += 15;

      if (donor.donation_count === 1) riskScore += 30;
      else if (donor.donation_count === 2) riskScore += 15;

      const riskLevel: 'High' | 'Medium' | 'Low' = 
        riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';

      if (riskScore >= 30) {
        riskyDonors.push({
          ...donor,
          daysSinceLastDonation,
          riskScore,
          riskLevel
        });
      }
    });

    return riskyDonors.sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);
  };

  // Calculate LTV segments
  const calculateLTVSegments = () => {
    const segments = {
      '$0-$100': 0,
      '$100-$500': 0,
      '$500-$1,000': 0,
      '$1,000-$5,000': 0,
      '$5,000+': 0
    };

    donors.forEach(donor => {
      const ltv = donor.lifetime_value / 100;
      if (ltv < 100) segments['$0-$100']++;
      else if (ltv < 500) segments['$100-$500']++;
      else if (ltv < 1000) segments['$500-$1,000']++;
      else if (ltv < 5000) segments['$1,000-$5,000']++;
      else segments['$5,000+']++;
    });

    const COLORS = ['hsl(var(--muted))', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

    return Object.entries(segments).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index]
    }));
  };

  // Top donors
  const getTopDonors = () => {
    return [...donors]
      .sort((a, b) => b.lifetime_value - a.lifetime_value)
      .slice(0, 10);
  };

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Donors", path: "/dashboard/donors" }, { label: "Analytics" }]} loading={true}>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardPageLayout>
    );
  }

  const cohortData = calculateCohorts();
  const givingTrends = calculateGivingTrends();
  const churnRiskDonors = calculateChurnRisk();
  const ltvSegments = calculateLTVSegments();
  const topDonors = getTopDonors();

  return (
    <DashboardPageLayout segments={[{ label: "Donors", path: "/dashboard/donors" }, { label: "Analytics" }]}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Donor Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into donor behavior and trends
            </p>
          </div>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trends">Giving Trends</TabsTrigger>
            <TabsTrigger value="cohorts">Retention Cohorts</TabsTrigger>
            <TabsTrigger value="churn">Churn Risk</TabsTrigger>
            <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
            <TabsTrigger value="leaderboard">Top Donors</TabsTrigger>
          </TabsList>

          {/* Giving Trends */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue (12mo)</CardTitle>
                  <DollarSign className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(givingTrends.reduce((sum, m) => sum + m.amount * 100, 0))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations (12mo)</CardTitle>
                  <Target className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {givingTrends.reduce((sum, m) => sum + m.count, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
                  <Calendar className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">
                    {formatCurrency(
                      (givingTrends.reduce((sum, m) => sum + m.amount, 0) / 
                      Math.max(1, givingTrends.reduce((sum, m) => sum + m.count, 0))) * 100
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Giving Trends</CardTitle>
                <CardDescription>Donation volume and revenue over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={givingTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
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
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'amount') return [formatCurrency(value * 100), 'Revenue'];
                        if (name === 'avgDonation') return [formatCurrency(value * 100), 'Avg Donation'];
                        return [value, 'Count'];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Count"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="avgDonation" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Avg Donation ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retention Cohorts */}
          <TabsContent value="cohorts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Donor Retention Cohorts</CardTitle>
                <CardDescription>
                  Percentage of donors from each cohort who continue giving in subsequent months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cohortData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Not enough data to calculate cohorts. Need at least 6 months of donation history.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={cohortData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="cohort" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value}%`, 'Retention']}
                      />
                      <Legend />
                      <Bar dataKey="month0" stackId="a" fill="hsl(var(--primary))" name="Month 0" />
                      <Bar dataKey="month1" stackId="a" fill="hsl(var(--primary) / 0.8)" name="Month 1" />
                      <Bar dataKey="month2" stackId="a" fill="hsl(var(--primary) / 0.6)" name="Month 2" />
                      <Bar dataKey="month3" stackId="a" fill="hsl(var(--primary) / 0.4)" name="Month 3" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Average Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {cohortData.length > 0 
                      ? Math.round(
                          cohortData.reduce((sum, c) => sum + (c.month1 + c.month2 + c.month3) / 3, 0) / cohortData.length
                        )
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Across all cohorts over 3 months
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Best Performing Cohort</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {cohortData.length > 0 ? cohortData[0].cohort : 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {cohortData.length > 0 
                      ? `${Math.round((cohortData[0].month1 + cohortData[0].month2 + cohortData[0].month3) / 3)}% avg retention`
                      : 'No data available'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Churn Risk */}
          <TabsContent value="churn" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    {churnRiskDonors.filter(d => d.riskLevel === 'High').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">donors at high risk</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">
                    {churnRiskDonors.filter(d => d.riskLevel === 'Medium').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">donors at medium risk</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At Risk Value</CardTitle>
                  <DollarSign className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {formatCurrency(churnRiskDonors.reduce((sum, d) => sum + d.lifetime_value, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">total lifetime value</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>At-Risk Donors</CardTitle>
                <CardDescription>
                  Donors showing signs of disengagement - prioritize for re-engagement campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {churnRiskDonors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No donors currently at risk of churning. Great retention!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {churnRiskDonors.map((donor) => (
                      <div 
                        key={donor.id} 
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {donor.first_name && donor.last_name
                                ? `${donor.first_name} ${donor.last_name}`
                                : donor.email}
                            </h3>
                            <Badge variant={
                              donor.riskLevel === 'High' ? 'destructive' : 
                              donor.riskLevel === 'Medium' ? 'default' : 
                              'secondary'
                            }>
                              {donor.riskLevel} Risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {donor.daysSinceLastDonation} days since last donation • 
                            {donor.donation_count} total donations • 
                            Engagement: {donor.engagement_score}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-success">
                            {formatCurrency(donor.lifetime_value)}
                          </div>
                          <div className="text-sm text-muted-foreground">LTV</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lifetime Value Analysis */}
          <TabsContent value="ltv" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lifetime Value Distribution</CardTitle>
                  <CardDescription>How donors are distributed across value segments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ltvSegments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {ltvSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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

              <Card>
                <CardHeader>
                  <CardTitle>Value Segment Breakdown</CardTitle>
                  <CardDescription>Number of donors in each value tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ltvSegments}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))">
                        {ltvSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
                  <DollarSign className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {donors.length > 0 
                      ? formatCurrency(donors.reduce((sum, d) => sum + d.lifetime_value, 0) / donors.length)
                      : '$0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest LTV</CardTitle>
                  <Award className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {donors.length > 0 
                      ? formatCurrency(Math.max(...donors.map(d => d.lifetime_value)))
                      : '$0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top 10%</CardTitle>
                  <Users className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">
                    {formatCurrency(
                      donors
                        .sort((a, b) => b.lifetime_value - a.lifetime_value)
                        .slice(0, Math.ceil(donors.length * 0.1))
                        .reduce((sum, d) => sum + d.lifetime_value, 0)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">combined value</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Donors Leaderboard */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Donors</CardTitle>
                <CardDescription>
                  Your most valuable supporters ranked by lifetime value
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topDonors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No donors yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topDonors.map((donor, index) => (
                      <div 
                        key={donor.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {donor.first_name && donor.last_name
                              ? `${donor.first_name} ${donor.last_name}`
                              : donor.email}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {donor.donation_count} donations • 
                            Engagement: {donor.engagement_score}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-success">
                            {formatCurrency(donor.lifetime_value)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(donor.lifetime_value / Math.max(1, donor.donation_count))} avg
                          </div>
                        </div>
                        {index < 3 && (
                          <Award 
                            className={`h-6 w-6 ${
                              index === 0 ? 'text-warning' : 
                              index === 1 ? 'text-muted-foreground' : 
                              'text-[#CD7F32]'
                            }`} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Top 10 Combined Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(topDonors.reduce((sum, d) => sum + d.lifetime_value, 0))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {donors.length > 0 
                      ? `${Math.round((topDonors.reduce((sum, d) => sum + d.lifetime_value, 0) / 
                          donors.reduce((sum, d) => sum + d.lifetime_value, 0)) * 100)}% of total value`
                      : '0% of total value'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Average Top 10 Donation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {topDonors.length > 0
                      ? formatCurrency(
                          topDonors.reduce((sum, d) => sum + d.lifetime_value, 0) / 
                          topDonors.reduce((sum, d) => sum + d.donation_count, 0)
                        )
                      : '$0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    per transaction
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
};

export default DonorAnalytics;
