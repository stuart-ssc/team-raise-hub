import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Eye, Users, TrendingUp, MapPin, ArrowRight, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type DateRange = "7d" | "30d" | "90d" | "all";

interface PageViewStats {
  totalViews: number;
  uniqueSessions: number;
  homeViews: number;
  stateViews: number;
  districtViews: number;
  schoolViews: number;
}

interface StateViewData {
  state: string;
  views: number;
}

interface DailyViewData {
  date: string;
  views: number;
  sessions: number;
}

interface TopSchool {
  id: string;
  name: string;
  state: string;
  views: number;
}

interface TopDistrict {
  id: string;
  name: string;
  state: string;
  views: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const MarketingAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PageViewStats>({
    totalViews: 0,
    uniqueSessions: 0,
    homeViews: 0,
    stateViews: 0,
    districtViews: 0,
    schoolViews: 0,
  });
  const [stateViews, setStateViews] = useState<StateViewData[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyViewData[]>([]);
  const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
  const [topDistricts, setTopDistricts] = useState<TopDistrict[]>([]);
  const [signupConversions, setSignupConversions] = useState(0);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "7d":
        return subDays(now, 7).toISOString();
      case "30d":
        return subDays(now, 30).toISOString();
      case "90d":
        return subDays(now, 90).toISOString();
      default:
        return null;
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    const dateFilter = getDateFilter();

    try {
      // Build base query
      let query = supabase.from("landing_page_views").select("*");
      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      const { data: views, error } = await query;
      if (error) throw error;

      // Calculate stats
      const totalViews = views?.length || 0;
      const uniqueSessions = new Set(views?.map((v) => v.session_id).filter(Boolean)).size;
      const homeViews = views?.filter((v) => v.page_type === "home").length || 0;
      const stateViews = views?.filter((v) => v.page_type === "state").length || 0;
      const districtViews = views?.filter((v) => v.page_type === "district").length || 0;
      const schoolViews = views?.filter((v) => v.page_type === "school").length || 0;

      setStats({
        totalViews,
        uniqueSessions,
        homeViews,
        stateViews,
        districtViews,
        schoolViews,
      });

      // Calculate views by state
      const stateMap = new Map<string, number>();
      views?.forEach((v) => {
        if (v.state) {
          stateMap.set(v.state, (stateMap.get(v.state) || 0) + 1);
        }
      });
      const stateViewsData = Array.from(stateMap.entries())
        .map(([state, views]) => ({ state, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);
      setStateViews(stateViewsData);

      // Calculate daily views
      const dailyMap = new Map<string, { views: number; sessions: Set<string> }>();
      views?.forEach((v) => {
        const date = format(new Date(v.created_at), "MMM dd");
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { views: 0, sessions: new Set() });
        }
        const entry = dailyMap.get(date)!;
        entry.views++;
        if (v.session_id) entry.sessions.add(v.session_id);
      });
      const dailyData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          views: data.views,
          sessions: data.sessions.size,
        }))
        .slice(-30);
      setDailyViews(dailyData);

      // Get top schools
      const schoolIds = views?.filter((v) => v.school_id).map((v) => v.school_id) || [];
      const schoolCountMap = new Map<string, number>();
      schoolIds.forEach((id) => {
        if (id) schoolCountMap.set(id, (schoolCountMap.get(id) || 0) + 1);
      });
      const topSchoolIds = Array.from(schoolCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      if (topSchoolIds.length > 0) {
        const { data: schools } = await supabase
          .from("schools")
          .select("id, school_name, state")
          .in(
            "id",
            topSchoolIds.map((s) => s[0])
          );

        const schoolsWithViews =
          schools?.map((s) => ({
            id: s.id,
            name: s.school_name,
            state: s.state || "",
            views: schoolCountMap.get(s.id) || 0,
          })) || [];
        setTopSchools(schoolsWithViews.sort((a, b) => b.views - a.views));
      }

      // Get top districts
      const districtIds = views?.filter((v) => v.district_id).map((v) => v.district_id) || [];
      const districtCountMap = new Map<string, number>();
      districtIds.forEach((id) => {
        if (id) districtCountMap.set(id, (districtCountMap.get(id) || 0) + 1);
      });
      const topDistrictIds = Array.from(districtCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      if (topDistrictIds.length > 0) {
        const { data: districts } = await supabase
          .from("school_districts")
          .select("id, name, state")
          .in(
            "id",
            topDistrictIds.map((d) => d[0])
          );

        const districtsWithViews =
          districts?.map((d) => ({
            id: d.id,
            name: d.name,
            state: d.state || "",
            views: districtCountMap.get(d.id) || 0,
          })) || [];
        setTopDistricts(districtsWithViews.sort((a, b) => b.views - a.views));
      }

      // Calculate conversion rate (sessions that signed up)
      let signupQuery = supabase.from("profiles").select("id, created_at");
      if (dateFilter) {
        signupQuery = signupQuery.gte("created_at", dateFilter);
      }
      const { data: signups } = await signupQuery;
      setSignupConversions(signups?.length || 0);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const conversionRate = stats.uniqueSessions > 0 ? ((signupConversions / stats.uniqueSessions) * 100).toFixed(2) : "0.00";

  const pageTypeData = [
    { name: "Home", value: stats.homeViews },
    { name: "State", value: stats.stateViews },
    { name: "District", value: stats.districtViews },
    { name: "School", value: stats.schoolViews },
  ].filter((d) => d.value > 0);

  return (
    <SystemAdminPageLayout title="Marketing Analytics" subtitle="Track landing page performance and conversions">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Controls */}
          <div className="flex items-center gap-3 justify-end">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueSessions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Signups</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signupConversions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="locations">By Location</TabsTrigger>
              <TabsTrigger value="flow">User Flow</TabsTrigger>
              <TabsTrigger value="top">Top Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Daily Views Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Page Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyViews}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                            name="Views"
                          />
                          <Area
                            type="monotone"
                            dataKey="sessions"
                            stroke="hsl(var(--chart-2))"
                            fill="hsl(var(--chart-2))"
                            fillOpacity={0.3}
                            name="Sessions"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Page Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Views by Page Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pageTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="hsl(var(--primary))"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {pageTypeData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Views by State</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stateViews} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="state" type="category" width={40} className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flow" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Journey Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Homepage Views", value: stats.homeViews, pct: 100 },
                      {
                        label: "State Page Views",
                        value: stats.stateViews,
                        pct: stats.homeViews > 0 ? (stats.stateViews / stats.homeViews) * 100 : 0,
                      },
                      {
                        label: "District Page Views",
                        value: stats.districtViews,
                        pct: stats.homeViews > 0 ? (stats.districtViews / stats.homeViews) * 100 : 0,
                      },
                      {
                        label: "School Page Views",
                        value: stats.schoolViews,
                        pct: stats.homeViews > 0 ? (stats.schoolViews / stats.homeViews) * 100 : 0,
                      },
                      {
                        label: "Signups",
                        value: signupConversions,
                        pct: stats.homeViews > 0 ? (signupConversions / stats.homeViews) * 100 : 0,
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-40 text-sm font-medium">{step.label}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-muted rounded-md overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(step.pct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm">
                          {step.value.toLocaleString()} ({step.pct.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Schools */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Schools by Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topSchools.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No school page views yet</p>
                      ) : (
                        topSchools.slice(0, 10).map((school, i) => (
                          <div key={school.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                              <div>
                                <p className="font-medium text-sm">{school.name}</p>
                                <p className="text-xs text-muted-foreground">{school.state}</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium">{school.views.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Districts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Districts by Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topDistricts.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No district page views yet</p>
                      ) : (
                        topDistricts.slice(0, 10).map((district, i) => (
                          <div key={district.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                              <div>
                                <p className="font-medium text-sm">{district.name}</p>
                                <p className="text-xs text-muted-foreground">{district.state}</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium">{district.views.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SystemAdminPageLayout>
  );
};

export default MarketingAnalytics;
