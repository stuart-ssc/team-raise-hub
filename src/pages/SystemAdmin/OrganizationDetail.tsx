import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Users, 
  FolderOpen, 
  TrendingUp,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  Archive,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  verification_status: string;
  requires_verification: boolean;
  created_at: string;
}

interface GroupRecord {
  id: string;
  group_name: string;
  group_type: { name: string } | null;
  status: boolean;
  campaigns_count: number;
  created_at: string;
}

interface UserRecord {
  id: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  user_type: {
    name: string;
  };
  active_user: boolean;
  created_at: string;
}

interface CampaignRecord {
  id: string;
  name: string;
  groups: {
    group_name: string;
  };
  publication_status: string;
  goal_amount: number | null;
  amount_raised: number;
  created_at: string;
}

interface DonationRecord {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  campaigns: {
    name: string;
  };
}

interface DonorRecord {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  lifetime_value: number;
  donation_count: number;
  last_donation_date: string | null;
  rfm_segment: string;
}

const OrganizationDetail = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState({
    groupsCount: 0,
    usersCount: 0,
    campaignsCount: 0,
    totalRevenue: 0,
  });

  // Tab data states
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donors, setDonors] = useState<DonorRecord[]>([]);
  const [activeTab, setActiveTab] = useState("groups");
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    if (orgId) {
      fetchOrganizationData();
    }
  }, [orgId]);

  useEffect(() => {
    if (organization && activeTab) {
      loadTabData(activeTab);
    }
  }, [activeTab, organization]);

  const fetchOrganizationData = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData as any);

      // Fetch stats
      const [groupsCount, usersCount, campaignsCount, revenueData] = await Promise.all([
        supabase.from("groups").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("organization_user").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .in("group_id", 
            (await supabase.from("groups").select("id").eq("organization_id", orgId)).data?.map(g => g.id) || []
          ),
        supabase
          .from("orders")
          .select("total_amount")
          .in("status", ["succeeded", "completed"])
          .in("campaign_id",
            (await supabase
              .from("campaigns")
              .select("id")
              .in("group_id",
                (await supabase.from("groups").select("id").eq("organization_id", orgId)).data?.map(g => g.id) || []
              )
            ).data?.map(c => c.id) || []
          ),
      ]);

      const totalRevenue = revenueData.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        groupsCount: groupsCount.count || 0,
        usersCount: usersCount.count || 0,
        campaignsCount: campaignsCount.count || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching organization data:", error);
      toast({
        title: "Error",
        description: "Failed to load organization information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    if (!organization) return;

    setLoadingTab(true);
    try {
      switch (tab) {
        case "groups":
          const { data: groupsData, error: groupsError } = await supabase
            .from("groups")
            .select(`
              id,
              group_name,
              group_type:group_type_id(name),
              status,
              created_at
            `)
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false });

          if (groupsError) throw groupsError;

          // Get campaign counts for each group
          const groupsWithCounts = await Promise.all(
            (groupsData || []).map(async (group: any) => {
              const { count } = await supabase
                .from("campaigns")
                .select("id", { count: "exact", head: true })
                .eq("group_id", group.id);
              return { ...group, campaigns_count: count || 0 };
            })
          );

          setGroups(groupsWithCounts);
          break;

        case "users":
          const { data: usersData, error: usersError } = await supabase
            .from("organization_user")
            .select(`
              id,
              user_id,
              active_user,
              created_at,
              profiles!organization_user_user_id_fkey(
                first_name,
                last_name,
                email
              ),
              user_type:user_type_id(name)
            `)
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(50);

          if (usersError) throw usersError;
          setUsers(usersData as any || []);
          break;

        case "campaigns":
          const { data: groupIds } = await supabase
            .from("groups")
            .select("id")
            .eq("organization_id", organization.id);

          if (groupIds && groupIds.length > 0) {
            const { data: campaignsData, error: campaignsError } = await supabase
              .from("campaigns")
              .select(`
                id,
                name,
                publication_status,
                goal_amount,
                amount_raised,
                created_at,
                groups:group_id(group_name)
              `)
              .in("group_id", groupIds.map(g => g.id))
              .order("created_at", { ascending: false })
              .limit(50);

            if (campaignsError) throw campaignsError;
            setCampaigns(campaignsData || []);
          }
          break;

        case "donations":
          const { data: groupIds2 } = await supabase
            .from("groups")
            .select("id")
            .eq("organization_id", organization.id);

          if (groupIds2 && groupIds2.length > 0) {
            const { data: campaignIds } = await supabase
              .from("campaigns")
              .select("id")
              .in("group_id", groupIds2.map(g => g.id));

            if (campaignIds && campaignIds.length > 0) {
              const { data: donationsData, error: donationsError } = await supabase
                .from("orders")
                .select(`
                  id,
                  customer_name,
                  customer_email,
                  total_amount,
                  status,
                  created_at,
                  campaigns:campaign_id(name)
                `)
                .in("campaign_id", campaignIds.map(c => c.id))
                .in("status", ["succeeded", "completed"])
                .order("created_at", { ascending: false })
                .limit(50);

              if (donationsError) throw donationsError;
              setDonations(donationsData || []);
            }
          }
          break;

        case "donors":
          const { data: donorsData, error: donorsError } = await supabase
            .from("donor_profiles")
            .select("*")
            .eq("organization_id", organization.id)
            .order("lifetime_value", { ascending: false })
            .limit(50);

          if (donorsError) throw donorsError;
          setDonors(donorsData || []);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${tab} data`,
        variant: "destructive",
      });
    } finally {
      setLoadingTab(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const getVerificationBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Approved", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
      pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
      in_review: { label: "In Review", icon: Clock, className: "bg-primary/10 text-primary border-primary/20" },
      rejected: { label: "Rejected", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: boolean | string, type: "boolean" | "publication" = "boolean") => {
    if (type === "boolean") {
      return status ? (
        <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
      ) : (
        <Badge className="bg-muted text-muted-foreground border-border">Inactive</Badge>
      );
    }

    const statusStr = status as string;
    if (statusStr === "published") {
      return <Badge className="bg-success/10 text-success border-success/20">Published</Badge>;
    } else if (statusStr === "draft") {
      return <Badge className="bg-muted text-muted-foreground border-border">Draft</Badge>;
    } else {
      return <Badge className="bg-warning/10 text-warning border-warning/20">{statusStr}</Badge>;
    }
  };

  if (loading) {
    return (
      <SystemAdminPageLayout title="Loading..." subtitle="Organization details">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </SystemAdminPageLayout>
    );
  }

  if (!organization) {
    return (
      <SystemAdminPageLayout title="Not Found" subtitle="Organization details">
        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Organization not found</p>
              <Button onClick={() => navigate("/system-admin/organizations")} className="mt-4">
                Back to Organizations
              </Button>
            </CardContent>
          </Card>
        </div>
      </SystemAdminPageLayout>
    );
  }

  return (
    <SystemAdminPageLayout 
      title={organization.name}
      subtitle={`${organization.organization_type === 'school' ? 'School' : 'Non-Profit'} Organization`}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/system-admin/organizations")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url && (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name}
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {organization.organization_type === 'school' ? 'School' : 'Non-Profit'}
                  </Badge>
                  {getVerificationBadge(organization.verification_status)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.groupsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Organization members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.campaignsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All-time total</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="donations">Donations</TabsTrigger>
                <TabsTrigger value="donors">Donors</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {loadingTab ? (
                <div className="py-12 text-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <>
                  <TabsContent value="groups" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Campaigns</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No groups found
                            </TableCell>
                          </TableRow>
                        ) : (
                          groups.map((group) => (
                            <TableRow key={group.id}>
                              <TableCell className="font-medium">{group.group_name}</TableCell>
                              <TableCell>{group.group_type?.name || '-'}</TableCell>
                              <TableCell>{getStatusBadge(group.status)}</TableCell>
                              <TableCell>{group.campaigns_count}</TableCell>
                              <TableCell>{format(new Date(group.created_at), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="users" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.profiles.first_name && user.profiles.last_name
                                  ? `${user.profiles.first_name} ${user.profiles.last_name}`
                                  : '-'}
                              </TableCell>
                              <TableCell>{user.profiles.email}</TableCell>
                              <TableCell>{user.user_type.name}</TableCell>
                              <TableCell>{getStatusBadge(user.active_user)}</TableCell>
                              <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="campaigns" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Raised</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No campaigns found
                            </TableCell>
                          </TableRow>
                        ) : (
                          campaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell>{campaign.groups.group_name}</TableCell>
                              <TableCell>{getStatusBadge(campaign.publication_status, "publication")}</TableCell>
                              <TableCell>{campaign.goal_amount ? formatCurrency(campaign.goal_amount) : '-'}</TableCell>
                              <TableCell>{formatCurrency(campaign.amount_raised)}</TableCell>
                              <TableCell>{format(new Date(campaign.created_at), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="donations" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No donations found
                            </TableCell>
                          </TableRow>
                        ) : (
                          donations.map((donation) => (
                            <TableRow key={donation.id}>
                              <TableCell className="font-medium">{donation.customer_name}</TableCell>
                              <TableCell>{donation.customer_email}</TableCell>
                              <TableCell>{donation.campaigns.name}</TableCell>
                              <TableCell className="font-bold text-success">{formatCurrency(donation.total_amount)}</TableCell>
                              <TableCell>{format(new Date(donation.created_at), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="donors" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Segment</TableHead>
                          <TableHead>Donations</TableHead>
                          <TableHead>Lifetime Value</TableHead>
                          <TableHead>Last Donation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No donors found
                            </TableCell>
                          </TableRow>
                        ) : (
                          donors.map((donor) => (
                            <TableRow key={donor.id}>
                              <TableCell className="font-medium">
                                {donor.first_name && donor.last_name
                                  ? `${donor.first_name} ${donor.last_name}`
                                  : '-'}
                              </TableCell>
                              <TableCell>{donor.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{donor.rfm_segment}</Badge>
                              </TableCell>
                              <TableCell>{donor.donation_count}</TableCell>
                              <TableCell className="font-bold text-success">{formatCurrency(donor.lifetime_value)}</TableCell>
                              <TableCell>
                                {donor.last_donation_date 
                                  ? format(new Date(donor.last_donation_date), 'MMM d, yyyy')
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
                        <div className="grid gap-4">
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">{organization.email || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-muted-foreground">{organization.phone || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium">Website</p>
                              <p className="text-sm text-muted-foreground">{organization.website_url || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium">Address</p>
                              <p className="text-sm text-muted-foreground">
                                {organization.address_line1 || '-'}
                                {organization.city && organization.state && (
                                  <><br />{organization.city}, {organization.state} {organization.zip}</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium">Verification Status</p>
                              <div className="mt-1">{getVerificationBadge(organization.verification_status)}</div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Requires verification: {organization.requires_verification ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </SystemAdminPageLayout>
  );
};

export default OrganizationDetail;
