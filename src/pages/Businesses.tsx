import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, DollarSign, Users, Handshake, Search, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BusinessProfile {
  id: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  ein: string | null;
  industry: string | null;
  website_url: string | null;
  verification_status: string;
  logo_url: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  linked_donors_count: number;
  total_donations: number;
  last_donation_date: string | null;
}

const Businesses = () => {
  const navigate = useNavigate();
  const { organizationUser, loading: orgLoading } = useOrganizationUser();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchBusinesses();
    }
  }, [organizationUser?.organization_id]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Fetch businesses linked to organization
      const { data: orgBusinesses, error: orgError } = await supabase
        .from("organization_businesses")
        .select("business_id")
        .eq("organization_id", organizationUser?.organization_id);

      if (orgError) throw orgError;

      if (!orgBusinesses || orgBusinesses.length === 0) {
        setBusinesses([]);
        return;
      }

      const businessIds = orgBusinesses.map(ob => ob.business_id);

      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds);

      if (businessError) throw businessError;

      // Fetch linked donors count for each business
      const businessesWithMetrics = await Promise.all(
        (businessData || []).map(async (business) => {
          // Count linked donors
          const { count: donorsCount } = await supabase
            .from("business_donors")
            .select("*", { count: "exact", head: true })
            .eq("business_id", business.id)
            .eq("organization_id", organizationUser?.organization_id);

          // Get linked donor emails to calculate total donations
          const { data: linkedDonors } = await supabase
            .from("business_donors")
            .select("donor_id")
            .eq("business_id", business.id)
            .eq("organization_id", organizationUser?.organization_id);

          let totalDonations = 0;
          let lastDonationDate = null;

          if (linkedDonors && linkedDonors.length > 0) {
            const donorIds = linkedDonors.map(d => d.donor_id);
            
            // Get donor emails
            const { data: donors } = await supabase
              .from("donor_profiles")
              .select("email")
              .in("id", donorIds);

            if (donors && donors.length > 0) {
              const emails = donors.map(d => d.email);
              
              // Calculate total donations from orders
              const { data: orders } = await supabase
                .from("orders")
                .select("total_amount, created_at")
                .in("customer_email", emails)
                .eq("status", "completed");

              if (orders) {
                totalDonations = orders.reduce((sum, order) => sum + order.total_amount, 0);
                const sortedOrders = orders.sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                lastDonationDate = sortedOrders[0]?.created_at || null;
              }
            }
          }

          return {
            ...business,
            linked_donors_count: donorsCount || 0,
            total_donations: totalDonations,
            last_donation_date: lastDonationDate,
          };
        })
      );

      setBusinesses(businessesWithMetrics);
    } catch (error: any) {
      console.error("Error fetching businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBusinesses = businesses
    .filter((business) => {
      const matchesSearch =
        business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.business_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.ein?.includes(searchQuery);

      const matchesVerification =
        verificationFilter === "all" || business.verification_status === verificationFilter;

      return matchesSearch && matchesVerification;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.business_name.localeCompare(b.business_name);
        case "donations":
          return b.total_donations - a.total_donations;
        case "donors":
          return b.linked_donors_count - a.linked_donors_count;
        case "recent":
          if (!a.last_donation_date) return 1;
          if (!b.last_donation_date) return -1;
          return new Date(b.last_donation_date).getTime() - new Date(a.last_donation_date).getTime();
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    totalBusinesses: businesses.length,
    totalValue: businesses.reduce((sum, b) => sum + b.total_donations, 0),
    activePartnerships: businesses.filter(
      (b) => b.last_donation_date && 
      new Date(b.last_donation_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length,
    avgDonation: businesses.length > 0 
      ? businesses.reduce((sum, b) => sum + b.total_donations, 0) / businesses.length 
      : 0,
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (orgLoading || loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Businesses" }]}>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout segments={[{ label: "Businesses" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Business Partnerships</h1>
            <p className="text-muted-foreground">Manage corporate relationships and donations</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Businesses
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalBusinesses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Partnership Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(stats.totalValue / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Partnerships
              </CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activePartnerships}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg per Business
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(stats.avgDonation / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or EIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Verification Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="donations">Total Donated</SelectItem>
                  <SelectItem value="donors">Linked Donors</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Business Cards Grid */}
        {filteredAndSortedBusinesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No businesses found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedBusinesses.map((business) => (
              <Card
                key={business.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/dashboard/businesses/${business.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.business_name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{business.business_name}</CardTitle>
                        {business.industry && (
                          <Badge variant="outline" className="mt-1">{business.industry}</Badge>
                        )}
                      </div>
                    </div>
                    {getVerificationBadge(business.verification_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Donated:</span>
                      <span className="font-semibold">${(business.total_donations / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Linked Employees:</span>
                      <span className="font-semibold">{business.linked_donors_count}</span>
                    </div>
                    {business.last_donation_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Donation:</span>
                        <span className="font-semibold">
                          {new Date(business.last_donation_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
};

export default Businesses;
