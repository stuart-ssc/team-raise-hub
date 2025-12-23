import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import DonorActivityTimeline from "@/components/DonorActivityTimeline";
import DonorCommunicationHistory from "@/components/DonorCommunicationHistory";
import DonorInsightsPanel from "@/components/DonorInsightsPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Heart,
  MessageSquare,
  Edit,
  Building2,
  CheckCircle2,
  X,
  Plus
} from "lucide-react";
import { LinkDonorToBusinessDialog } from "@/components/LinkDonorToBusinessDialog";
import { UnlinkDonorBusinessDialog } from "@/components/UnlinkDonorBusinessDialog";
import { format, parseISO } from "date-fns";
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
  notes: string | null;
  tags: string[] | null;
  preferred_communication: string;
}

interface DonationHistoryItem {
  name: string;
  price: number;
  quantity: number;
}

interface DonationHistory {
  id: string;
  total_amount: number;
  platform_fee_amount: number | null;
  created_at: string;
  campaign_name: string;
  group_name: string;
  items: DonationHistoryItem[];
}

interface BusinessAffiliation {
  id: string;
  business_id: string;
  business_name: string;
  business_logo: string | null;
  role: string | null;
  is_primary_contact: boolean;
  auto_linked: boolean;
  linked_at: string;
}

const DonorProfile = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const navigate = useNavigate();
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { toast } = useToast();
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [businessAffiliations, setBusinessAffiliations] = useState<BusinessAffiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [unlinkingAffiliation, setUnlinkingAffiliation] = useState<BusinessAffiliation | null>(null);

  useEffect(() => {
    if (organizationUser?.organization_id && donorId) {
      fetchDonorData();
    }
  }, [organizationUser?.organization_id, donorId]);

  const fetchDonorData = async () => {
    if (!donorId) return;

    setLoading(true);
    try {
      // Fetch donor profile
      const { data: donorData, error: donorError } = await supabase
        .from("donor_profiles")
        .select("*")
        .eq("id", donorId)
        .single();

      if (donorError) throw donorError;
      setDonor(donorData);
      setNotes(donorData.notes || "");

      // Fetch donation history
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          platform_fee_amount,
          items,
          created_at,
          campaigns!inner(
            name,
            groups!inner(
              group_name
            )
          )
        `)
        .eq("customer_email", donorData.email)
        .in("status", ["succeeded", "completed"])
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Collect all unique campaign_item_ids from all orders
      const allItemIds = new Set<string>();
      (ordersData || []).forEach((order: any) => {
        const orderItems = order.items as Array<{ campaign_item_id: string; price_at_purchase: number; quantity: number }> || [];
        orderItems.forEach(item => allItemIds.add(item.campaign_item_id));
      });

      // Fetch item names
      let itemNamesMap: Record<string, string> = {};
      if (allItemIds.size > 0) {
        const { data: itemsData } = await supabase
          .from("campaign_items")
          .select("id, name")
          .in("id", Array.from(allItemIds));
        
        if (itemsData) {
          itemNamesMap = Object.fromEntries(itemsData.map(item => [item.id, item.name]));
        }
      }

      const formattedDonations: DonationHistory[] = (ordersData || []).map((order: any) => {
        const orderItems = order.items as Array<{ campaign_item_id: string; price_at_purchase: number; quantity: number }> || [];
        return {
          id: order.id,
          total_amount: order.total_amount,
          platform_fee_amount: order.platform_fee_amount,
          created_at: order.created_at,
          campaign_name: order.campaigns?.name || "Unknown Campaign",
          group_name: order.campaigns?.groups?.group_name || "Unknown Group",
          items: orderItems.map(item => ({
            name: itemNamesMap[item.campaign_item_id] || "Item",
            price: item.price_at_purchase,
            quantity: item.quantity,
          })),
        };
      });

      setDonations(formattedDonations);

      // Fetch business affiliations
      const { data: affiliationsData, error: affiliationsError } = await supabase
        .from("business_donors")
        .select(`
          id,
          business_id,
          role,
          is_primary_contact,
          auto_linked,
          linked_at,
          businesses!inner(
            business_name,
            logo_url
          )
        `)
        .eq("donor_id", donorId)
        .is("blocked_at", null)
        .order("linked_at", { ascending: false });

      if (affiliationsError) throw affiliationsError;

      const formattedAffiliations: BusinessAffiliation[] = (affiliationsData || []).map((aff: any) => ({
        id: aff.id,
        business_id: aff.business_id,
        business_name: aff.businesses?.business_name || "Unknown Business",
        business_logo: aff.businesses?.logo_url || null,
        role: aff.role,
        is_primary_contact: aff.is_primary_contact || false,
        auto_linked: aff.auto_linked || false,
        linked_at: aff.linked_at,
      }));

      setBusinessAffiliations(formattedAffiliations);
    } catch (error) {
      console.error("Error fetching donor data:", error);
      toast({
        title: "Error",
        description: "Failed to load donor information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!donor) return;

    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("donor_profiles")
        .update({ notes })
        .eq("id", donor.id);

      if (error) throw error;

      toast({
        title: "Notes Saved",
        description: "Donor notes have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return "bg-success/10 text-success border-success/20";
    if (score >= 40) return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 70) return "Highly Engaged";
    if (score >= 40) return "Moderately Engaged";
    return "Low Engagement";
  };

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout 
        segments={[
          { label: "Donors", path: "/dashboard/donors" }, 
          { label: "Loading..." }
        ]}
        loading={true}
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  if (!donor) {
    return (
      <DashboardPageLayout 
        segments={[
          { label: "Donors", path: "/dashboard/donors" }, 
          { label: "Not Found" }
        ]}
      >
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Donor not found</p>
              <Button onClick={() => navigate("/dashboard/donors")} className="mt-4">
                Back to Donors
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout 
      segments={[
        { label: "Donors", path: "/dashboard/donors" }, 
        { label: donor.first_name && donor.last_name ? `${donor.first_name} ${donor.last_name}` : donor.email }
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard/donors")}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Donors
              </Button>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {donor.first_name && donor.last_name
                      ? `${donor.first_name} ${donor.last_name}`
                      : "Donor Profile"}
                  </h1>
                  <p className="text-muted-foreground mt-1">{donor.email}</p>
                </div>
                <Badge className={`${getEngagementColor(donor.engagement_score)} text-base px-4 py-2`}>
                  {getEngagementLabel(donor.engagement_score)} ({donor.engagement_score})
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        Total Donations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{donor.donation_count}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        Lifetime Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success">
                        {formatCurrency(donor.lifetime_value)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-warning" />
                        Avg Donation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-warning">
                        {donor.donation_count > 0
                          ? formatCurrency(donor.lifetime_value / donor.donation_count)
                          : "$0"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights Panel */}
                <DonorInsightsPanel donorId={donor.id} />

                {/* Giving History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Giving History</CardTitle>
                    <CardDescription>All donations from this supporter</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {donations.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No donations yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {donations.map((donation) => (
                          <div
                            key={donation.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{donation.campaign_name}</p>
                              <p className="text-sm text-muted-foreground">{donation.group_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(donation.created_at), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-primary text-lg">
                                Total: {formatCurrency(donation.total_amount)}
                              </p>
                              {(donation.items || []).map((item, idx) => (
                                <p key={idx} className="text-sm text-muted-foreground">
                                  {item.name} - {formatCurrency(item.price * item.quantity)}
                                </p>
                              ))}
                              {donation.platform_fee_amount && donation.platform_fee_amount > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Sponsorly Fee {formatCurrency(donation.platform_fee_amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Timeline */}
                <DonorActivityTimeline donorId={donor.id} />

                {/* Communication History */}
                <DonorCommunicationHistory donorEmail={donor.email} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm truncate">{donor.email}</p>
                      </div>
                    </div>

                    {donor.phone && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm">{donor.phone}</p>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    {donor.first_donation_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">First Donation</p>
                          <p className="text-sm">
                            {format(parseISO(donor.first_donation_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    )}

                    {donor.last_donation_date && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Last Donation</p>
                            <p className="text-sm">
                              {format(parseISO(donor.last_donation_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Business Affiliations */}
                {businessAffiliations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Business Affiliations
                          </CardTitle>
                          <CardDescription>
                            Companies this donor is associated with
                          </CardDescription>
                        </div>
                        {(organizationUser?.user_type?.permission_level === 'organization_admin' ||
                          organizationUser?.user_type?.permission_level === 'program_manager') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLinkDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Link
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {businessAffiliations.map((affiliation) => (
                        <div
                          key={affiliation.id}
                          onClick={() => navigate(`/dashboard/businesses/${affiliation.business_id}`)}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {affiliation.business_logo ? (
                              <img
                                src={affiliation.business_logo}
                                alt={affiliation.business_name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{affiliation.business_name}</p>
                                  {affiliation.role && (
                                    <p className="text-sm text-muted-foreground">{affiliation.role}</p>
                                  )}
                                </div>
                                {(organizationUser?.user_type?.permission_level === 'organization_admin' ||
                                  organizationUser?.user_type?.permission_level === 'program_manager') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUnlinkingAffiliation(affiliation);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {affiliation.is_primary_contact && (
                                  <Badge variant="outline" className="text-xs">Primary Contact</Badge>
                                )}
                                {affiliation.auto_linked && (
                                  <Badge variant="secondary" className="text-xs">Auto-linked</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(affiliation.linked_at), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add notes about this donor..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes || notes === (donor.notes || "")}
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isSavingNotes ? "Saving..." : "Save Notes"}
                    </Button>
                  </CardContent>
                </Card>
            </div>
        </div>
      </div>

      <LinkDonorToBusinessDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        donorId={donorId}
        organizationId={organizationUser?.organization_id || ""}
        onSuccess={fetchDonorData}
      />

      <UnlinkDonorBusinessDialog
        open={!!unlinkingAffiliation}
        onOpenChange={(open) => !open && setUnlinkingAffiliation(null)}
        donorName={donor?.first_name && donor?.last_name ? `${donor.first_name} ${donor.last_name}` : donor?.email || ""}
        businessName={unlinkingAffiliation?.business_name || ""}
        donorId={donorId || ""}
        businessId={unlinkingAffiliation?.business_id || ""}
        organizationId={organizationUser?.organization_id || ""}
        isPrimaryContact={unlinkingAffiliation?.is_primary_contact || false}
        onSuccess={fetchDonorData}
      />
    </DashboardPageLayout>
  );
};

export default DonorProfile;
