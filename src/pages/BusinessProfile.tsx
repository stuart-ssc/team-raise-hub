import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useAuth } from "@/hooks/useAuth";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Mail, Phone, Globe, MapPin, ArrowLeft, DollarSign, Users, Calendar, Star, UserPlus, X, Edit, Archive, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LinkDonorToBusinessDialog } from "@/components/LinkDonorToBusinessDialog";
import { UnlinkDonorBusinessDialog } from "@/components/UnlinkDonorBusinessDialog";
import { EditBusinessDialog } from "@/components/EditBusinessDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BusinessDetails {
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
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
}

interface LinkedDonor {
  donor_id: string;
  donor_email: string;
  donor_name: string;
  is_primary_contact: boolean;
  role: string | null;
  linked_at: string;
  total_donations: number;
}

interface DonationHistory {
  id: string;
  created_at: string;
  total_amount: number;
  customer_name: string;
  campaign_name: string;
}

const BusinessProfile = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [linkedDonors, setLinkedDonors] = useState<LinkedDonor[]>([]);
  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [unlinkingDonor, setUnlinkingDonor] = useState<LinkedDonor | null>(null);
  const [newTag, setNewTag] = useState("");
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    if (businessId && organizationUser?.organization_id) {
      fetchBusinessDetails();
    }
  }, [businessId, organizationUser?.organization_id]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);

      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Fetch organization notes
      const { data: orgBusiness } = await supabase
        .from("organization_businesses")
        .select("notes")
        .eq("business_id", businessId)
        .eq("organization_id", organizationUser?.organization_id)
        .single();

      setNotes(orgBusiness?.notes || "");

      // Fetch linked donors
      const { data: businessDonors, error: donorsError } = await supabase
        .from("business_donors")
        .select("donor_id, is_primary_contact, role, linked_at")
        .eq("business_id", businessId)
        .eq("organization_id", organizationUser?.organization_id);

      if (donorsError) throw donorsError;

      if (businessDonors && businessDonors.length > 0) {
        const donorIds = businessDonors.map(d => d.donor_id);
        
        // Fetch donor details
        const { data: donorProfiles } = await supabase
          .from("donor_profiles")
          .select("id, email, first_name, last_name")
          .in("id", donorIds);

        // Fetch donation totals for each donor
        const linkedDonorsWithTotals = await Promise.all(
          (businessDonors || []).map(async (bd) => {
            const donor = donorProfiles?.find(d => d.id === bd.donor_id);
            
            if (!donor) return null;

            const { data: orders } = await supabase
              .from("orders")
              .select("total_amount")
              .eq("customer_email", donor.email)
              .eq("status", "completed");

            const totalDonations = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

            return {
              donor_id: bd.donor_id,
              donor_email: donor.email,
              donor_name: `${donor.first_name || ""} ${donor.last_name || ""}`.trim() || donor.email,
              is_primary_contact: bd.is_primary_contact || false,
              role: bd.role,
              linked_at: bd.linked_at,
              total_donations: totalDonations,
            };
          })
        );

        setLinkedDonors(linkedDonorsWithTotals.filter(d => d !== null) as LinkedDonor[]);

        // Fetch donation history
        const donorEmails = donorProfiles?.map(d => d.email) || [];
        
        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, created_at, total_amount, customer_name, campaign_id")
          .in("customer_email", donorEmails)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (ordersData && ordersData.length > 0) {
          const campaignIds = [...new Set(ordersData.map(o => o.campaign_id))];
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, name")
            .in("id", campaignIds);

          const donationHistory = ordersData.map(order => ({
            ...order,
            campaign_name: campaigns?.find(c => c.id === order.campaign_id)?.name || "Unknown Campaign",
          }));

          setDonations(donationHistory);
        }
      }
    } catch (error: any) {
      console.error("Error fetching business details:", error);
      toast.error("Failed to load business details");
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    try {
      setSavingNotes(true);
      const { error } = await supabase
        .from("organization_businesses")
        .update({ notes })
        .eq("business_id", businessId)
        .eq("organization_id", organizationUser?.organization_id);

      if (error) throw error;
      toast.success("Notes saved successfully");
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleArchive = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq("id", businessId);

      if (error) throw error;

      toast.success("Business archived successfully");
      setShowArchiveDialog(false);
      navigate("/dashboard/businesses");
    } catch (error: any) {
      console.error("Error archiving business:", error);
      toast.error("Failed to archive business");
    } finally {
      setIsArchiving(false);
    }
  };

  const addTag = async (tagToAdd: string) => {
    if (!tagToAdd.trim() || !business) return;
    
    const currentTags = business.tags || [];
    if (currentTags.includes(tagToAdd.trim())) {
      toast.error("Tag already exists");
      return;
    }

    setSavingTags(true);
    try {
      const updatedTags = [...currentTags, tagToAdd.trim()];
      const { error } = await supabase
        .from("businesses")
        .update({ tags: updatedTags, updated_at: new Date().toISOString() })
        .eq("id", businessId);

      if (error) throw error;

      setBusiness({ ...business, tags: updatedTags });
      setNewTag("");
      toast.success("Tag added successfully");
    } catch (error: any) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    } finally {
      setSavingTags(false);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!business) return;

    setSavingTags(true);
    try {
      const updatedTags = (business.tags || []).filter(tag => tag !== tagToRemove);
      const { error } = await supabase
        .from("businesses")
        .update({ tags: updatedTags, updated_at: new Date().toISOString() })
        .eq("id", businessId);

      if (error) throw error;

      setBusiness({ ...business, tags: updatedTags });
      toast.success("Tag removed successfully");
    } catch (error: any) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    } finally {
      setSavingTags(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const totalDonated = linkedDonors.reduce((sum, d) => sum + d.total_donations, 0);
  const employeeParticipation = linkedDonors.filter(d => d.total_donations > 0).length;
  const partnershipAge = business 
    ? Math.floor((new Date().getTime() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Businesses", path: "/dashboard/businesses" }, { label: "Loading..." }]}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
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

  if (!business) {
    return (
      <DashboardPageLayout segments={[{ label: "Businesses", path: "/dashboard/businesses" }, { label: "Not Found" }]}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Business not found</p>
          </CardContent>
        </Card>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Businesses", path: "/dashboard/businesses" },
        { label: business.business_name },
      ]}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/businesses")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Businesses
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.business_name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{business.business_name}</h1>
              <div className="flex items-center gap-2 mt-2">
                {getVerificationBadge(business.verification_status)}
                {business.industry && <Badge variant="outline">{business.industry}</Badge>}
              </div>
            </div>
          </div>
            {(organizationUser?.user_type?.permission_level === 'organization_admin' ||
              organizationUser?.user_type?.permission_level === 'program_manager') && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={() => setShowLinkDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Link Employee
                </Button>
                {organizationUser?.user_type?.permission_level === 'organization_admin' && !business?.archived_at && (
                  <Button variant="outline" onClick={() => setShowArchiveDialog(true)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                )}
              </div>
            )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Donated
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(totalDonated / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Employee Participation
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {employeeParticipation} / {linkedDonors.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Partnership Age
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{partnershipAge} days</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Linked Employees */}
            <Card>
              <CardHeader>
                <CardTitle>Linked Employees</CardTitle>
              </CardHeader>
              <CardContent>
                {linkedDonors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No employees linked yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Donated</TableHead>
                        {(organizationUser?.user_type?.permission_level === 'organization_admin' ||
                          organizationUser?.user_type?.permission_level === 'program_manager') && (
                          <TableHead className="text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedDonors.map((donor) => (
                        <TableRow
                          key={donor.donor_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/dashboard/donors/profile/${donor.donor_id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {donor.donor_name}
                              {donor.is_primary_contact && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{donor.donor_email}</TableCell>
                          <TableCell>
                            {donor.role ? (
                              <Badge variant="secondary">{donor.role}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(donor.total_donations / 100).toFixed(2)}
                          </TableCell>
                          {(organizationUser?.user_type?.permission_level === 'organization_admin' ||
                            organizationUser?.user_type?.permission_level === 'program_manager') && (
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUnlinkingDonor(donor)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Donation History */}
            <Card>
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No donations yet</p>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{donation.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{donation.campaign_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(donation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(donation.total_amount / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.ein && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">EIN</p>
                    <p className="text-sm">{business.ein}</p>
                  </div>
                )}
                {business.business_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${business.business_email}`} className="text-sm text-primary hover:underline">
                      {business.business_email}
                    </a>
                  </div>
                )}
                {business.business_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${business.business_phone}`} className="text-sm text-primary hover:underline">
                      {business.business_phone}
                    </a>
                  </div>
                )}
                {business.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={business.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {business.website_url}
                    </a>
                  </div>
                )}
                {(business.address_line1 || business.city || business.state) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {business.address_line1 && <p>{business.address_line1}</p>}
                      {business.address_line2 && <p>{business.address_line2}</p>}
                      {(business.city || business.state || business.zip) && (
                        <p>
                          {business.city && `${business.city}, `}
                          {business.state && `${business.state} `}
                          {business.zip}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {(organizationUser?.user_type?.permission_level === 'organization_admin' ||
              organizationUser?.user_type?.permission_level === 'program_manager') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {business.tags && business.tags.length > 0 ? (
                      business.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            disabled={savingTags}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags yet</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={savingTags}
                    />
                    <Button 
                      onClick={() => addTag(newTag)} 
                      disabled={savingTags || !newTag.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add notes about this business relationship..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                />
                <Button onClick={saveNotes} disabled={savingNotes} className="w-full">
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LinkDonorToBusinessDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        businessId={businessId}
        organizationId={organizationUser?.organization_id || ""}
        onSuccess={fetchBusinessDetails}
      />

      <UnlinkDonorBusinessDialog
        open={!!unlinkingDonor}
        onOpenChange={(open) => !open && setUnlinkingDonor(null)}
        donorName={unlinkingDonor?.donor_name || ""}
        businessName={business?.business_name || ""}
        donorId={unlinkingDonor?.donor_id || ""}
        businessId={businessId || ""}
        organizationId={organizationUser?.organization_id || ""}
        isPrimaryContact={unlinkingDonor?.is_primary_contact || false}
        onSuccess={fetchBusinessDetails}
      />

      {business && (
        <EditBusinessDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          business={business}
          onSuccess={fetchBusinessDetails}
        />
      )}

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{business?.business_name}</strong>? 
              This will hide it from active business lists. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? "Archiving..." : "Archive Business"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  );
};

export default BusinessProfile;
