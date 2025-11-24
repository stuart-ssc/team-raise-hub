import { useState, useEffect } from "react";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, TrendingUp, CheckCircle, Users, AlertCircle, Tag, Activity, Calculator } from "lucide-react";
import { getSegmentInfo, BUSINESS_SEGMENT_INFO } from "@/lib/businessEngagement";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { useNavigate } from "react-router-dom";

interface Business {
  id: string;
  business_name: string;
  business_email: string | null;
  industry: string | null;
  verification_status: string | null;
  tags: string[] | null;
  state: string | null;
  created_at: string;
  archived_at: string | null;
  donor_count: number;
  total_donation_value: number;
  last_activity_date: string | null;
  engagement_segment: string | null;
  engagement_score: number | null;
  total_partnership_value: number | null;
}

interface MonthlyGrowth {
  month: string;
  new_businesses: number;
  verified: number;
  pending: number;
}

interface IndustryData {
  name: string;
  value: number;
}

interface EngagementData {
  category: string;
  count: number;
}

interface StateData {
  state: string;
  count: number;
}

interface TagData {
  tag: string;
  count: number;
}

interface TimelineData {
  month: string;
  active_businesses: number;
  donation_volume: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const BusinessAnalytics = () => {
  const navigate = useNavigate();
  const { organizationUser } = useOrganizationUser();
  const { activeGroup } = useActiveGroup();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingScores, setCalculatingScores] = useState(false);

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchData();
    }
  }, [organizationUser?.organization_id, activeGroup]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch businesses with donor counts and donation values
      let businessQuery = supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          business_email,
          industry,
          verification_status,
          tags,
          state,
          created_at,
          archived_at,
          engagement_segment,
          engagement_score,
          total_partnership_value
        `)
        .is('archived_at', null);

      const { data: businessesData, error: businessError } = await businessQuery;

      if (businessError) throw businessError;

      // Fetch business_donors relationships with donation data
      const { data: donorLinks, error: donorError } = await supabase
        .from('business_donors')
        .select(`
          business_id,
          donor_id,
          created_at,
          donor_profiles!inner(
            id,
            email,
            organization_id,
            lifetime_value,
            last_donation_date
          )
        `)
        .eq('donor_profiles.organization_id', organizationUser?.organization_id);

      if (donorError) throw donorError;

      // Aggregate donor data by business
      const businessMetrics = new Map<string, { count: number; value: number; lastActivity: string | null }>();
      
      donorLinks?.forEach((link: any) => {
        if (!businessMetrics.has(link.business_id)) {
          businessMetrics.set(link.business_id, { count: 0, value: 0, lastActivity: null });
        }
        const metrics = businessMetrics.get(link.business_id)!;
        metrics.count++;
        metrics.value += link.donor_profiles.lifetime_value || 0;
        
        if (link.donor_profiles.last_donation_date) {
          if (!metrics.lastActivity || link.donor_profiles.last_donation_date > metrics.lastActivity) {
            metrics.lastActivity = link.donor_profiles.last_donation_date;
          }
        }
      });

      // Combine data
      const enrichedBusinesses: Business[] = businessesData?.map(business => {
        const metrics = businessMetrics.get(business.id) || { count: 0, value: 0, lastActivity: null };
        return {
          ...business,
          donor_count: metrics.count,
          total_donation_value: metrics.value,
          last_activity_date: metrics.lastActivity
        };
      }) || [];

      setBusinesses(enrichedBusinesses);
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      toast.error('Failed to load business analytics');
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

  // Calculate summary statistics
  const totalBusinesses = businesses.length;
  const verifiedBusinesses = businesses.filter(b => b.verification_status === 'verified').length;
  const verifiedPercentage = totalBusinesses > 0 ? Math.round((verifiedBusinesses / totalBusinesses) * 100) : 0;
  const activePartnerships = businesses.filter(b => {
    if (!b.last_activity_date) return false;
    const daysSince = (Date.now() - new Date(b.last_activity_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 90;
  }).length;
  const totalPartnershipValue = businesses.reduce((sum, b) => sum + b.total_donation_value, 0);

  // Calculate monthly growth
  const calculateMonthlyGrowth = (): MonthlyGrowth[] => {
    const months: MonthlyGrowth[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const monthBusinesses = businesses.filter(b => {
        const createdDate = new Date(b.created_at);
        return createdDate.getMonth() === date.getMonth() && 
               createdDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: monthStr,
        new_businesses: monthBusinesses.length,
        verified: monthBusinesses.filter(b => b.verification_status === 'verified').length,
        pending: monthBusinesses.filter(b => b.verification_status !== 'verified').length
      });
    }
    
    return months;
  };

  // Calculate industry distribution
  const calculateIndustryDistribution = (): IndustryData[] => {
    const industryMap = new Map<string, number>();
    
    businesses.forEach(b => {
      const industry = b.industry || 'Uncategorized';
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
    });
    
    const sorted = Array.from(industryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const top5 = sorted.map(([name, value]) => ({ name, value }));
    const otherCount = businesses.length - top5.reduce((sum, item) => sum + item.value, 0);
    
    if (otherCount > 0) {
      top5.push({ name: 'Other', value: otherCount });
    }
    
    return top5;
  };

  // Calculate engagement metrics
  const calculateEngagementMetrics = (): EngagementData[] => {
    return [
      { category: 'Dormant (0 donors)', count: businesses.filter(b => b.donor_count === 0).length },
      { category: 'Emerging (1-5)', count: businesses.filter(b => b.donor_count >= 1 && b.donor_count <= 5).length },
      { category: 'Active (6-15)', count: businesses.filter(b => b.donor_count >= 6 && b.donor_count <= 15).length },
      { category: 'Champions (16+)', count: businesses.filter(b => b.donor_count >= 16).length }
    ];
  };

  // Get top businesses
  const getTopBusinesses = () => {
    return [...businesses]
      .sort((a, b) => b.total_donation_value - a.total_donation_value)
      .slice(0, 10);
  };

  // Calculate geographic distribution
  const calculateGeographicDistribution = (): StateData[] => {
    const stateMap = new Map<string, number>();
    
    businesses.forEach(b => {
      if (b.state) {
        stateMap.set(b.state, (stateMap.get(b.state) || 0) + 1);
      }
    });
    
    return Array.from(stateMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }));
  };

  // Calculate tag analysis
  const calculateTagAnalysis = (): TagData[] => {
    const tagMap = new Map<string, number>();
    
    businesses.forEach(b => {
      b.tags?.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  };

  // Calculate engagement timeline
  const calculateEngagementTimeline = (): TimelineData[] => {
    const months: TimelineData[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const activeInMonth = businesses.filter(b => {
        if (!b.last_activity_date) return false;
        const activityDate = new Date(b.last_activity_date);
        return activityDate.getMonth() === date.getMonth() && 
               activityDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: monthStr,
        active_businesses: activeInMonth.length,
        donation_volume: activeInMonth.reduce((sum, b) => sum + b.total_donation_value, 0) / 100
      });
    }
    
    return months;
  };

  // Calculate engagement segment distribution
  const calculateEngagementSegments = () => {
    const segmentMap = new Map<string, number>();
    businesses.forEach(b => {
      const segment = b.engagement_segment || 'new';
      segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);
    });
    
    return Object.keys(BUSINESS_SEGMENT_INFO).map(segment => ({
      name: BUSINESS_SEGMENT_INFO[segment].label,
      value: segmentMap.get(segment) || 0,
      segment: segment
    }));
  };

  const handleCalculateScores = async () => {
    if (!organizationUser?.organization_id) return;
    
    setCalculatingScores(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-business-engagement', {
        body: { organizationId: organizationUser.organization_id }
      });

      if (error) throw error;

      toast.success(`Engagement scores calculated successfully! ${data.totalBusinesses} businesses processed.`);
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error calculating engagement scores:', error);
      toast.error(error.message || 'Failed to calculate engagement scores');
    } finally {
      setCalculatingScores(false);
    }
  };

  // Calculate health indicators
  const needingAttention = businesses.filter(b => {
    if (!b.last_activity_date) return true;
    const monthsSince = (Date.now() - new Date(b.last_activity_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsSince >= 6;
  }).length;

  const recentlyAdded = businesses.filter(b => {
    const daysSince = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  }).length;

  const verificationBacklog = businesses.filter(b => 
    b.verification_status === 'pending' || b.verification_status === null
  ).length;

  if (loading) {
    return (
      <DashboardPageLayout
        segments={[{ label: "Businesses", path: "/dashboard/businesses" }, { label: "Analytics" }]}
        loading={true}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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

  const monthlyGrowth = calculateMonthlyGrowth();
  const industryData = calculateIndustryDistribution();
  const engagementData = calculateEngagementMetrics();
  const topBusinesses = getTopBusinesses();
  const geographicData = calculateGeographicDistribution();
  const tagData = calculateTagAnalysis();
  const timelineData = calculateEngagementTimeline();
  const engagementSegments = calculateEngagementSegments();

  return (
    <DashboardPageLayout
      segments={[{ label: "Businesses", path: "/dashboard/businesses" }, { label: "Analytics" }]}
    >
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBusinesses}</div>
              <p className="text-xs text-muted-foreground">
                {recentlyAdded} added in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                {verifiedBusinesses} of {totalBusinesses} businesses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partnerships</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePartnerships}</div>
              <p className="text-xs text-muted-foreground">
                Active in last 90 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partnership Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPartnershipValue)}</div>
              <p className="text-xs text-muted-foreground">
                Total from linked donors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="growth">Growth Trends</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="segments">Engagement Segments</TabsTrigger>
            <TabsTrigger value="top">Top Businesses</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Growth Trends</CardTitle>
                <CardDescription>New businesses added over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="new_businesses" stroke="hsl(var(--chart-1))" name="New Businesses" />
                    <Line type="monotone" dataKey="verified" stroke="hsl(var(--chart-2))" name="Verified" />
                    <Line type="monotone" dataKey="pending" stroke="hsl(var(--chart-3))" name="Pending" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Industry Distribution</CardTitle>
                  <CardDescription>Breakdown by industry sector</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--chart-1))"
                        dataKey="value"
                      >
                        {industryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Top 10 states by business count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {geographicData.map((item, index) => (
                      <div key={item.state} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.state}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partnership Engagement Levels</CardTitle>
                <CardDescription>Businesses categorized by linked donor count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Businesses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Timeline</CardTitle>
                <CardDescription>Monthly active businesses and donation volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="active_businesses" 
                      stroke="hsl(var(--chart-1))" 
                      fill="hsl(var(--chart-1))" 
                      fillOpacity={0.6}
                      name="Active Businesses" 
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="donation_volume" 
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))" 
                      fillOpacity={0.6}
                      name="Donation Volume ($)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Partnership Engagement Segments</h3>
                <p className="text-sm text-muted-foreground">BPV scoring: Breadth, Performance, Vitality</p>
              </div>
              <Button onClick={handleCalculateScores} disabled={calculatingScores}>
                <Calculator className="h-4 w-4 mr-2" />
                {calculatingScores ? 'Calculating...' : 'Calculate Scores'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(BUSINESS_SEGMENT_INFO).map(([segment, info]) => {
                const count = engagementSegments.find(s => s.segment === segment)?.value || 0;
                const Icon = info.icon;
                return (
                  <Card key={segment} className={count > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`${info.bgColor} ${info.color} border-0`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {info.label}
                        </Badge>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Segment Distribution</CardTitle>
                <CardDescription>Partnership engagement breakdown across all businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={engagementSegments.filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="hsl(var(--chart-1))"
                      dataKey="value"
                    >
                      {engagementSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Details</CardTitle>
                <CardDescription>Average metrics per engagement segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(BUSINESS_SEGMENT_INFO).map(([segment, info]) => {
                    const segmentBusinesses = businesses.filter(b => b.engagement_segment === segment);
                    if (segmentBusinesses.length === 0) return null;
                    
                    const avgScore = segmentBusinesses.reduce((sum, b) => sum + (b.engagement_score || 0), 0) / segmentBusinesses.length;
                    const avgValue = segmentBusinesses.reduce((sum, b) => sum + (b.total_partnership_value || 0), 0) / segmentBusinesses.length;
                    const Icon = info.icon;
                    
                    return (
                      <div key={segment} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={`${info.bgColor} ${info.color} border-0`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {info.label}
                          </Badge>
                          <span className="text-sm font-medium">{segmentBusinesses.length} businesses</span>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-muted-foreground">Avg Score</p>
                            <p className="font-medium">{avgScore.toFixed(0)}/100</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Avg Value</p>
                            <p className="font-medium">${(avgValue / 100).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributing Businesses</CardTitle>
                <CardDescription>Ranked by total donation value from linked donors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topBusinesses.map((business, index) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/dashboard/businesses/${business.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{business.business_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {business.industry || 'Uncategorized'} • {business.donor_count} linked donors
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(business.total_donation_value)}</div>
                        <Badge variant={business.verification_status === 'verified' ? 'default' : 'secondary'}>
                          {business.verification_status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{needingAttention}</div>
                  <p className="text-xs text-muted-foreground">
                    No activity in 6+ months
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentlyAdded}</div>
                  <p className="text-xs text-muted-foreground">
                    In last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verification Backlog</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{verificationBacklog}</div>
                  <p className="text-xs text-muted-foreground">
                    Pending verification
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
                <CardDescription>Most frequently used business tags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tagData.map((item) => (
                    <Badge key={item.tag} variant="outline" className="text-sm">
                      <Tag className="h-3 w-3 mr-1" />
                      {item.tag} ({item.count})
                    </Badge>
                  ))}
                  {tagData.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags in use yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
};

export default BusinessAnalytics;
