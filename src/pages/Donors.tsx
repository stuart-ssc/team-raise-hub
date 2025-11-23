import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Mail, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Heart,
  Filter,
  ArrowUpDown,
  Zap
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface DonorProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  total_donations: number;
  donation_count: number;
  first_donation_date: string | null;
  last_donation_date: string | null;
  engagement_score: number;
  lifetime_value: number;
  tags: string[] | null;
  preferred_communication: string;
}

const Donors = () => {
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<DonorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filterBy, setFilterBy] = useState<string>("all");

  // Remove this useEffect - we'll fetch based on activeGroup from DashboardPageLayout

  useEffect(() => {
    filterAndSortDonors();
  }, [donors, searchQuery, sortBy, filterBy]);

  const setupRealtimeSubscription = () => {
    if (!organizationUser?.organization_id) return;

    const channel = supabase
      .channel('donors-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donor_profiles',
          filter: `organization_id=eq.${organizationUser.organization_id}`,
        },
        () => {
          console.log('Donor data updated, refreshing...');
          fetchDonors();
          toast({
            title: "Donors Updated",
            description: "Donor information has been refreshed",
          });
        }
      )
      .subscribe();

    return channel;
  };

  const fetchDonors = async (groupId?: string | null) => {
    if (!organizationUser?.organization_id) return;

    setLoading(true);
    try {
      let query = supabase
        .from("donor_profiles")
        .select("*")
        .eq("organization_id", organizationUser.organization_id);

      // If a specific group is selected, filter donors by group
      if (groupId) {
        // Subquery to get donor emails who have donated to campaigns in this group
        const { data: donorEmails, error: emailError } = await supabase
          .from("orders")
          .select("customer_email, campaigns!inner(group_id)")
          .eq("campaigns.group_id", groupId)
          .not("customer_email", "is", null);

        if (emailError) throw emailError;

        const uniqueEmails = [...new Set(donorEmails?.map(o => o.customer_email) || [])];
        
        if (uniqueEmails.length === 0) {
          setDonors([]);
          setLoading(false);
          return;
        }

        query = query.in("email", uniqueEmails);
      }

      const { data, error } = await query.order("last_donation_date", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setDonors(data || []);
    } catch (error) {
      console.error("Error fetching donors:", error);
      toast({
        title: "Error",
        description: "Failed to load donor information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDonors = () => {
    let result = [...donors];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (donor) =>
          donor.email.toLowerCase().includes(query) ||
          donor.first_name?.toLowerCase().includes(query) ||
          donor.last_name?.toLowerCase().includes(query)
      );
    }

    // Engagement filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "high":
          result = result.filter((d) => d.engagement_score >= 70);
          break;
        case "medium":
          result = result.filter((d) => d.engagement_score >= 40 && d.engagement_score < 70);
          break;
        case "low":
          result = result.filter((d) => d.engagement_score < 40);
          break;
      }
    }

    // Sort
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => {
          if (!a.last_donation_date) return 1;
          if (!b.last_donation_date) return -1;
          return new Date(b.last_donation_date).getTime() - new Date(a.last_donation_date).getTime();
        });
        break;
      case "amount":
        result.sort((a, b) => b.lifetime_value - a.lifetime_value);
        break;
      case "engagement":
        result.sort((a, b) => b.engagement_score - a.engagement_score);
        break;
      case "name":
        result.sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        });
        break;
    }

    setFilteredDonors(result);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return "bg-success/10 text-success border-success/20";
    if (score >= 40) return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const stats = {
    totalDonors: donors.length,
    totalLifetimeValue: donors.reduce((sum, d) => sum + d.lifetime_value, 0),
    averageEngagement: donors.length > 0
      ? Math.round(donors.reduce((sum, d) => sum + d.engagement_score, 0) / donors.length)
      : 0,
    highEngagement: donors.filter((d) => d.engagement_score >= 70).length,
  };

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Donors" }]} loading={true}>
        {() => (
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
        )}
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout segments={[{ label: "Donors" }]}>
      {(activeGroup) => {
        // Fetch donors when activeGroup changes
        useEffect(() => {
          if (organizationUser?.organization_id) {
            fetchDonors(activeGroup?.id);
            setupRealtimeSubscription();
          }

          return () => {
            supabase.channel('donors-updates').unsubscribe();
          };
        }, [organizationUser?.organization_id, activeGroup?.id]);

        return (
      <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-8 w-8 text-primary" />
                  Donor Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and engage with your supporters
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate("/dashboard/donors/segmentation")}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Donor Segments
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/dashboard/donors/nurture")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Nurture Campaigns
                </Button>
                <Button onClick={() => navigate("/dashboard/donors/templates")}>
                  <Mail className="mr-2 h-4 w-4" />
                  Manage Templates
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.totalDonors}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.highEngagement} highly engaged
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                  <DollarSign className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {formatCurrency(stats.totalLifetimeValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalDonors > 0
                      ? `${formatCurrency(stats.totalLifetimeValue / stats.totalDonors)} avg`
                      : "No donors yet"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <TrendingUp className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">{stats.averageEngagement}</div>
                  <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <Heart className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {donors.reduce((sum, d) => sum + d.donation_count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across all supporters
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by engagement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Donors</SelectItem>
                      <SelectItem value="high">High Engagement</SelectItem>
                      <SelectItem value="medium">Medium Engagement</SelectItem>
                      <SelectItem value="low">Low Engagement</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="amount">Highest Value</SelectItem>
                      <SelectItem value="engagement">Highest Engagement</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Donors List */}
            <Card>
              <CardHeader>
                <CardTitle>Donors ({filteredDonors.length})</CardTitle>
                <CardDescription>
                  Click on a donor to view detailed profile and giving history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredDonors.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      {searchQuery || filterBy !== "all"
                        ? "No donors match your filters"
                        : "No donors yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || filterBy !== "all"
                        ? "Try adjusting your search or filters"
                        : "Donors will appear here as people make donations"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDonors.map((donor) => (
                      <Card
                        key={donor.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                        onClick={() => navigate(`/dashboard/donors/${donor.id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">
                                  {donor.first_name && donor.last_name
                                    ? `${donor.first_name} ${donor.last_name}`
                                    : donor.email}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {donor.email}
                                </p>
                              </div>
                              <Badge className={getEngagementColor(donor.engagement_score)}>
                                {getEngagementLabel(donor.engagement_score)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                              <div>
                                <p className="text-xs text-muted-foreground">Donations</p>
                                <p className="font-semibold">{donor.donation_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Given</p>
                                <p className="font-semibold">
                                  {formatCurrency(donor.lifetime_value)}
                                </p>
                              </div>
                            </div>

                            {donor.last_donation_date && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Last: {format(parseISO(donor.last_donation_date), "MMM d, yyyy")}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
      </div>
        );
      }}
    </DashboardPageLayout>
  );
};

export default Donors;
