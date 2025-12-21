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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Users, 
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
  XCircle,
  Save,
  X,
  TrendingUp,
  ArchiveRestore
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getSegmentInfo } from "@/lib/businessEngagement";
import { BusinessActivityTimeline } from "@/components/BusinessActivityTimeline";

interface Business {
  id: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  industry: string | null;
  ein: string | null;
  tags: string[] | null;
  verification_status: string;
  engagement_score: number;
  engagement_segment: string;
  total_partnership_value: number;
  linked_donors_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface OrganizationRecord {
  id: string;
  name: string;
  organization_type: string;
  relationship_status: string | null;
  notes: string | null;
  created_at: string;
}

interface DonorRecord {
  id: string;
  donor_id: string;
  role: string | null;
  is_primary_contact: boolean;
  linked_at: string;
  organization_id: string;
  organizations: {
    name: string;
  };
  donor_profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
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
    groups: {
      group_name: string;
      organization_id: string;
      organizations: {
        name: string;
      };
    };
  };
}

export default function BusinessDetail() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState({
    organizationsCount: 0,
    donorsCount: 0,
    totalPartnershipValue: 0,
    engagementScore: 0,
  });

  // Tab data states
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [donors, setDonors] = useState<DonorRecord[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [activeTab, setActiveTab] = useState("organizations");
  const [loadingTab, setLoadingTab] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    website_url: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    industry: '',
    ein: '',
    tags: [] as string[],
    verification_status: '',
  });

  useEffect(() => {
    if (businessId) {
      fetchBusinessData();
    }
  }, [businessId]);

  useEffect(() => {
    if (business && activeTab) {
      loadTabData(activeTab);
    }
  }, [activeTab, business]);

  const fetchBusinessData = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      // Fetch business details
      const { data: bizData, error: bizError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (bizError) throw bizError;
      setBusiness(bizData as Business);

      // Fetch stats
      const [orgCount, donorCount] = await Promise.all([
        supabase
          .from("organization_businesses")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId),
        supabase
          .from("business_donors")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .is("blocked_at", null),
      ]);

      setStats({
        organizationsCount: orgCount.count || 0,
        donorsCount: donorCount.count || 0,
        totalPartnershipValue: bizData.total_partnership_value || 0,
        engagementScore: bizData.engagement_score || 0,
      });

      // Set edit form initial values
      setEditForm({
        business_name: bizData.business_name || '',
        business_email: bizData.business_email || '',
        business_phone: bizData.business_phone || '',
        website_url: bizData.website_url || '',
        address_line1: bizData.address_line1 || '',
        address_line2: bizData.address_line2 || '',
        city: bizData.city || '',
        state: bizData.state || '',
        zip: bizData.zip || '',
        country: bizData.country || '',
        industry: bizData.industry || '',
        ein: bizData.ein || '',
        tags: bizData.tags || [],
        verification_status: bizData.verification_status || 'pending',
      });
    } catch (error) {
      console.error("Error fetching business data:", error);
      toast({
        title: "Error",
        description: "Failed to load business information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    if (!business) return;

    setLoadingTab(true);
    try {
      switch (tab) {
        case "organizations":
          const { data: orgData, error: orgError } = await supabase
            .from("organization_businesses")
            .select(`
              id,
              organization_id,
              relationship_status,
              notes,
              created_at,
              organizations:organization_id(
                name,
                organization_type
              )
            `)
            .eq("business_id", business.id)
            .order("created_at", { ascending: false });

          if (orgError) throw orgError;
          
          const mappedOrgs = (orgData || []).map((record: any) => ({
            id: record.organization_id,
            name: record.organizations?.name || 'Unknown',
            organization_type: record.organizations?.organization_type || 'unknown',
            relationship_status: record.relationship_status,
            notes: record.notes,
            created_at: record.created_at,
          }));
          
          setOrganizations(mappedOrgs);
          break;

        case "donors":
          // Step 1: Get business_donors records
          const { data: businessDonorsData, error: donorsError } = await supabase
            .from("business_donors")
            .select(`
              id,
              donor_id,
              role,
              is_primary_contact,
              linked_at,
              organization_id,
              organizations:organization_id(name)
            `)
            .eq("business_id", business.id)
            .is("blocked_at", null)
            .order("is_primary_contact", { ascending: false })
            .order("linked_at", { ascending: false })
            .limit(50);

          if (donorsError) throw donorsError;

          // Step 2: Fetch donor profiles separately
          const donorIds = (businessDonorsData || []).map(d => d.donor_id);
          let donorProfilesMap: Record<string, any> = {};
          
          if (donorIds.length > 0) {
            const { data: profilesData } = await supabase
              .from("donor_profiles")
              .select("id, first_name, last_name, email")
              .in("id", donorIds);
            
            (profilesData || []).forEach(p => {
              donorProfilesMap[p.id] = p;
            });
          }

          // Step 3: Merge the data
          const mergedDonors = (businessDonorsData || []).map(d => ({
            ...d,
            donor_profiles: donorProfilesMap[d.donor_id] || { first_name: null, last_name: null, email: 'Unknown' }
          }));

          setDonors(mergedDonors as any);
          break;

        case "donations":
          // Get all linked donor emails
          const { data: linkedDonors } = await supabase
            .from("business_donors")
            .select("donor_profiles:donor_id(email)")
            .eq("business_id", business.id)
            .is("blocked_at", null);

          const donorEmails = (linkedDonors || [])
            .map((d: any) => d.donor_profiles?.email)
            .filter(Boolean);

          if (donorEmails.length > 0) {
            const { data: donationsData, error: donationsError } = await supabase
              .from("orders")
              .select(`
                id,
                customer_name,
                customer_email,
                total_amount,
                status,
                created_at,
                campaigns:campaign_id(
                  name,
                  groups:group_id(
                    group_name,
                    organization_id,
                    organizations:organization_id(name)
                  )
                )
              `)
              .in("customer_email", donorEmails)
              .in("status", ["succeeded", "completed"])
              .order("created_at", { ascending: false })
              .limit(50);

            if (donationsError) throw donationsError;
            setDonations(donationsData || []);
          }
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
    }).format(amount);
  };

  const getVerificationBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Verified", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
      pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
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

  const handleEdit = () => {
    setIsEditing(true);
    setActiveTab("settings");
  };

  const handleSave = async () => {
    if (!business) return;
    
    try {
      const { error } = await supabase
        .from('businesses')
        .update(editForm)
        .eq('id', business.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Business updated successfully",
      });
      
      setIsEditing(false);
      fetchBusinessData();
    } catch (error) {
      console.error("Error updating business:", error);
      toast({
        title: "Error",
        description: "Failed to update business",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async () => {
    if (!business) return;
    
    const isArchiving = !business.archived_at;
    
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          archived_at: isArchiving ? new Date().toISOString() : null 
        })
        .eq('id', business.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Business ${isArchiving ? 'archived' : 'restored'} successfully`,
      });
      
      fetchBusinessData();
    } catch (error) {
      console.error("Error archiving business:", error);
      toast({
        title: "Error",
        description: `Failed to ${isArchiving ? 'archive' : 'restore'} business`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <SystemAdminPageLayout title="Loading..." subtitle="Business details">
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

  if (!business) {
    return (
      <SystemAdminPageLayout title="Not Found" subtitle="Business details">
        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Business not found</p>
              <Button onClick={() => navigate("/system-admin/businesses")} className="mt-4">
                Back to Businesses
              </Button>
            </CardContent>
          </Card>
        </div>
      </SystemAdminPageLayout>
    );
  }

  const segmentInfo = getSegmentInfo(business.engagement_segment);

  return (
    <SystemAdminPageLayout 
      title={business.business_name}
      subtitle="Business Partnership Details"
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/system-admin/businesses")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Businesses
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {business.logo_url && (
                <img 
                  src={business.logo_url} 
                  alt={business.business_name}
                  className="h-16 w-16 object-contain rounded-lg border"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{business.business_name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {getVerificationBadge(business.verification_status)}
                  <Badge className={`${segmentInfo.bgColor} ${segmentInfo.color} gap-1`}>
                    <segmentInfo.icon className="h-3 w-3" />
                    {segmentInfo.label}
                  </Badge>
                  {business.archived_at && (
                    <Badge variant="outline" className="bg-muted">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant={business.archived_at ? "default" : "outline"}
                onClick={handleArchive}
              >
                {business.archived_at ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partnership Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPartnershipValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.organizationsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.donorsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.engagementScore}</div>
              <Progress value={stats.engagementScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Business Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {business.business_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a href={`mailto:${business.business_email}`} className="text-sm text-primary hover:underline">
                        {business.business_email}
                      </a>
                    </div>
                  </div>
                )}

                {business.business_phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <a href={`tel:${business.business_phone}`} className="text-sm text-primary hover:underline">
                        {business.business_phone}
                      </a>
                    </div>
                  </div>
                )}

                {business.website_url && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Website</p>
                      <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {business.website_url}
                      </a>
                    </div>
                  </div>
                )}

                {business.industry && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Industry</p>
                      <p className="text-sm text-muted-foreground">{business.industry}</p>
                    </div>
                  </div>
                )}

                {business.ein && (
                  <div>
                    <p className="text-sm font-medium">EIN</p>
                    <p className="text-sm text-muted-foreground">{business.ein}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {(business.address_line1 || business.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <div className="text-sm text-muted-foreground">
                        {business.address_line1 && <p>{business.address_line1}</p>}
                        {business.address_line2 && <p>{business.address_line2}</p>}
                        {(business.city || business.state || business.zip) && (
                          <p>
                            {[business.city, business.state, business.zip].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {business.country && business.country !== 'US' && <p>{business.country}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {business.tags && business.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {business.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Created: {format(new Date(business.created_at), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated: {format(new Date(business.updated_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Organizations</CardTitle>
                <CardDescription>
                  Organizations this business has relationships with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTab ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : organizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No organizations found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {org.organization_type === 'school' ? 'School' : 'Non-Profit'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {org.relationship_status ? (
                              <Badge variant="secondary" className="capitalize">
                                {org.relationship_status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {org.notes || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(org.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Linked Donors</CardTitle>
                <CardDescription>
                  People connected to this business across all organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTab ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : donors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No linked donors found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Linked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donors.map((donor) => {
                        const fullName = `${donor.donor_profiles.first_name || ''} ${donor.donor_profiles.last_name || ''}`.trim() || 'Unnamed';
                        return (
                          <TableRow key={donor.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {fullName}
                                {donor.is_primary_contact && (
                                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {donor.donor_profiles.email}
                            </TableCell>
                            <TableCell>{donor.role || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {donor.organizations.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(donor.linked_at), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
                <CardDescription>
                  Donations made by linked donors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTab ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No donations found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(donation.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {donation.customer_name || donation.customer_email}
                          </TableCell>
                          <TableCell>{donation.campaigns.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {donation.campaigns.groups.organizations.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(donation.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <BusinessActivityTimeline businessId={business.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
                <CardDescription>
                  Update business information and verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name</Label>
                        <Input
                          id="business_name"
                          value={editForm.business_name}
                          onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_email">Email</Label>
                        <Input
                          id="business_email"
                          type="email"
                          value={editForm.business_email}
                          onChange={(e) => setEditForm({ ...editForm, business_email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_phone">Phone</Label>
                        <Input
                          id="business_phone"
                          value={editForm.business_phone}
                          onChange={(e) => setEditForm({ ...editForm, business_phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website_url">Website</Label>
                        <Input
                          id="website_url"
                          value={editForm.website_url}
                          onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={editForm.industry}
                          onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ein">EIN</Label>
                        <Input
                          id="ein"
                          value={editForm.ein}
                          onChange={(e) => setEditForm({ ...editForm, ein: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_line1">Address Line 1</Label>
                        <Input
                          id="address_line1"
                          value={editForm.address_line1}
                          onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_line2">Address Line 2</Label>
                        <Input
                          id="address_line2"
                          value={editForm.address_line2}
                          onChange={(e) => setEditForm({ ...editForm, address_line2: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={editForm.state}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          value={editForm.zip}
                          onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verification_status">Verification Status</Label>
                        <Select
                          value={editForm.verification_status}
                          onValueChange={(value) => setEditForm({ ...editForm, verification_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Click Edit to modify business information
                    </p>
                    <Button onClick={handleEdit} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SystemAdminPageLayout>
  );
}
