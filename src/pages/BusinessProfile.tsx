import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useAuth } from "@/hooks/useAuth";
import { useParticipantConnections } from "@/hooks/useParticipantConnections";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getTagColor, getTagBgColor } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Mail, Phone, Globe, MapPin, ArrowLeft, DollarSign, Users, Calendar, Star, UserPlus, X, Edit, Archive, Tag, ArchiveRestore, TrendingUp, Activity, Play, Pause, XCircle, ChevronDown, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getSegmentInfo } from "@/lib/businessEngagement";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { LinkDonorToBusinessDialog } from "@/components/LinkDonorToBusinessDialog";
import { UnlinkDonorBusinessDialog } from "@/components/UnlinkDonorBusinessDialog";
import { EditBusinessDialog } from "@/components/EditBusinessDialog";
import { BusinessActivityTimeline } from "@/components/BusinessActivityTimeline";
import { BusinessInsightsPanel } from "@/components/BusinessInsightsPanel";
import { BusinessCampaignAssetsList } from "@/components/BusinessCampaignAssetsList";
import { ManualEnrollmentDialog } from "@/components/ManualEnrollmentDialog";
import { BusinessVerificationDialog } from "@/components/BusinessVerificationDialog";
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
  engagement_breadth_score: number | null;
  engagement_performance_score: number | null;
  engagement_vitality_score: number | null;
  engagement_segment: string | null;
  engagement_score: number | null;
  total_partnership_value: number | null;
  linked_donors_count: number | null;
  last_donor_activity_date: string | null;
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

interface CampaignEnrollment {
  id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enrolled_at: string;
  completed_at: string | null;
  next_send_at: string | null;
  current_sequence_id: string | null;
  current_sequence_order: number;
  total_sequences: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
}

const BusinessProfile = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const { connectedBusinessIds, loading: connectionsLoading, isParticipantView } = useParticipantConnections();
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
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [unlinkingDonor, setUnlinkingDonor] = useState<LinkedDonor | null>(null);
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [enrollments, setEnrollments] = useState<CampaignEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [enrollmentToCancel, setEnrollmentToCancel] = useState<CampaignEnrollment | null>(null);
  const [engagementExpanded, setEngagementExpanded] = useState(false);
  const [enrollmentsExpanded, setEnrollmentsExpanded] = useState(true);
  const [donationsExpanded, setDonationsExpanded] = useState(true);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  useEffect(() => {
    if (businessId && organizationUser?.organization_id && !connectionsLoading) {
      // Access check for participants
      if (isParticipantView && !connectedBusinessIds.includes(businessId)) {
        toast.error("You can only view businesses connected to your fundraising");
        navigate("/dashboard/businesses");
        return;
      }
      fetchBusinessDetails();
      fetchEnrollments();
    }
  }, [businessId, organizationUser?.organization_id, connectionsLoading]);

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
              .select("total_amount, platform_fee_amount")
              .eq("customer_email", donor.email)
              .eq("status", "succeeded");

            const totalDonations = orders?.reduce((sum, o) => sum + (o.total_amount - (o.platform_fee_amount || 0)), 0) || 0;

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
          .select("id, created_at, total_amount, platform_fee_amount, customer_name, campaign_id")
          .in("customer_email", donorEmails)
          .eq("status", "succeeded")
          .order("created_at", { ascending: false });

        if (ordersData && ordersData.length > 0) {
          const campaignIds = [...new Set(ordersData.map(o => o.campaign_id))];
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, name")
            .in("id", campaignIds);

          const donationHistory = ordersData.map(order => ({
            ...order,
            total_amount: order.total_amount - (order.platform_fee_amount || 0),
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

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          archived_at: null,
          archived_by: null,
        })
        .eq("id", businessId);

      if (error) throw error;

      toast.success("Business restored successfully");
      setShowRestoreDialog(false);
      fetchBusinessDetails();
    } catch (error: any) {
      console.error("Error restoring business:", error);
      toast.error("Failed to restore business");
    } finally {
      setIsRestoring(false);
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

  const fetchEnrollments = async () => {
    if (!businessId || !organizationUser?.organization_id) return;
    
    try {
      setLoadingEnrollments(true);
      
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("business_nurture_enrollments")
        .select(`
          id,
          campaign_id,
          status,
          enrolled_at,
          completed_at,
          next_send_at,
          current_sequence_id,
          business_nurture_campaigns!inner(name, campaign_type),
          business_nurture_sequences(sequence_order)
        `)
        .eq("business_id", businessId)
        .order("enrolled_at", { ascending: false });
      
      if (enrollmentError) throw enrollmentError;
      
      const enrichedEnrollments = await Promise.all(
        (enrollmentData || []).map(async (enrollment: any) => {
          const { data: sequences } = await supabase
            .from("business_nurture_sequences")
            .select("id")
            .eq("campaign_id", enrollment.campaign_id);
            
          const { data: emailStats } = await supabase
            .from("email_delivery_log")
            .select("status, opened_at, clicked_at")
            .eq("email_type", "business_outreach_automated")
            .filter("metadata->>enrollment_id", "eq", enrollment.id);
          
          const emailsSent = emailStats?.length || 0;
          const emailsOpened = emailStats?.filter(e => e.opened_at).length || 0;
          const emailsClicked = emailStats?.filter(e => e.clicked_at).length || 0;
          
          return {
            ...enrollment,
            campaign_name: enrollment.business_nurture_campaigns.name,
            campaign_type: enrollment.business_nurture_campaigns.campaign_type,
            current_sequence_order: enrollment.business_nurture_sequences?.sequence_order || 0,
            total_sequences: sequences?.length || 0,
            emails_sent: emailsSent,
            emails_opened: emailsOpened,
            emails_clicked: emailsClicked,
          };
        })
      );
      
      setEnrollments(enrichedEnrollments);
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load campaign enrollments");
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handlePauseEnrollment = async (enrollment: CampaignEnrollment) => {
    try {
      setPausingId(enrollment.id);
      const { error } = await supabase
        .from("business_nurture_enrollments")
        .update({ status: "paused" })
        .eq("id", enrollment.id);
        
      if (error) throw error;
      
      await supabase.from("business_activity_log").insert({
        business_id: businessId,
        activity_type: "campaign_paused",
        activity_data: {
          enrollment_id: enrollment.id,
          campaign_name: enrollment.campaign_name,
          action_by: user?.id,
        },
      });
      
      toast.success("Campaign enrollment paused");
      fetchEnrollments();
    } catch (error: any) {
      console.error("Error pausing enrollment:", error);
      toast.error("Failed to pause enrollment");
    } finally {
      setPausingId(null);
    }
  };

  const handleResumeEnrollment = async (enrollment: CampaignEnrollment) => {
    try {
      setResumingId(enrollment.id);
      
      if (enrollment.current_sequence_id) {
        const { data: sequence } = await supabase
          .from("business_nurture_sequences")
          .select("send_delay_days")
          .eq("id", enrollment.current_sequence_id)
          .single();
          
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + (sequence?.send_delay_days || 1));
        
        const { error } = await supabase
          .from("business_nurture_enrollments")
          .update({ 
            status: "active",
            next_send_at: nextSendAt.toISOString()
          })
          .eq("id", enrollment.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_nurture_enrollments")
          .update({ status: "active" })
          .eq("id", enrollment.id);
          
        if (error) throw error;
      }
      
      await supabase.from("business_activity_log").insert({
        business_id: businessId,
        activity_type: "campaign_resumed",
        activity_data: {
          enrollment_id: enrollment.id,
          campaign_name: enrollment.campaign_name,
          action_by: user?.id,
        },
      });
      
      toast.success("Campaign enrollment resumed");
      fetchEnrollments();
    } catch (error: any) {
      console.error("Error resuming enrollment:", error);
      toast.error("Failed to resume enrollment");
    } finally {
      setResumingId(null);
    }
  };

  const confirmCancelEnrollment = (enrollment: CampaignEnrollment) => {
    setEnrollmentToCancel(enrollment);
    setShowCancelDialog(true);
  };

  const handleCancelEnrollment = async () => {
    if (!enrollmentToCancel) return;
    
    try {
      setCancellingId(enrollmentToCancel.id);
      const { error } = await supabase
        .from("business_nurture_enrollments")
        .update({ 
          status: "cancelled",
          completed_at: new Date().toISOString()
        })
        .eq("id", enrollmentToCancel.id);
        
      if (error) throw error;
      
      await supabase.from("business_activity_log").insert({
        business_id: businessId,
        activity_type: "campaign_cancelled",
        activity_data: {
          enrollment_id: enrollmentToCancel.id,
          campaign_name: enrollmentToCancel.campaign_name,
          action_by: user?.id,
        },
      });
      
      toast.success("Campaign enrollment cancelled");
      setShowCancelDialog(false);
      setEnrollmentToCancel(null);
      fetchEnrollments();
    } catch (error: any) {
      console.error("Error cancelling enrollment:", error);
      toast.error("Failed to cancel enrollment");
    } finally {
      setCancellingId(null);
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      health_check: "Health Check",
      expansion: "Expansion",
      re_engagement: "Re-engagement",
      cultivation: "Cultivation",
      reactivation: "Reactivation",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <span className="animate-pulse mr-1">●</span> Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
            <Pause className="h-3 w-3 mr-1" /> Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
            ✓ Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            ✖ Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const formatNextSend = (nextSendAt: string | null) => {
    if (!nextSendAt) return "Not scheduled";
    
    const date = new Date(nextSendAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === 1) return "Tomorrow";
    if (diffHours > 0) return `In ${diffHours} hours`;
    if (diffMs > 0) return "Soon";
    return "Overdue";
  };

  const canManageEnrollments = 
    organizationUser?.user_type?.permission_level === 'organization_admin' ||
    organizationUser?.user_type?.permission_level === 'program_manager';

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
            <ShieldX className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
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

        {/* Blocked Warning Banner */}
        {business.verification_status === 'blocked' && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <ShieldX className="h-5 w-5" />
                <div>
                  <p className="font-semibold">This business is blocked</p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Blocked businesses cannot participate in campaigns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Archived Warning Banner */}
        {business.archived_at && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Archive className="h-5 w-5" />
                <div>
                  <p className="font-semibold">This business is archived</p>
                  <p className="text-sm text-orange-600 dark:text-orange-500">
                    Archived on {new Date(business.archived_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground">{business.business_name}</h1>
                {business.archived_at && (
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                    Archived
                  </Badge>
                )}
              </div>
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
                {!business.archived_at && (
                  <Button variant="outline" onClick={() => setShowEnrollmentDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll in Campaign
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setShowVerificationDialog(true)}
                  className={business.verification_status === 'blocked' ? 'text-red-600 hover:text-red-700' : ''}
                >
                  {business.verification_status === 'verified' ? (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verified
                    </>
                  ) : business.verification_status === 'blocked' ? (
                    <>
                      <ShieldX className="h-4 w-4 mr-2" />
                      Blocked
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
                {organizationUser?.user_type?.permission_level === 'organization_admin' && (
                  business?.archived_at ? (
                    <Button variant="outline" onClick={() => setShowRestoreDialog(true)}>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setShowArchiveDialog(true)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  )
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
                ${totalDonated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            ${donor.total_donations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            {/* Campaign Enrollments - Collapsible */}
            <Collapsible open={enrollmentsExpanded} onOpenChange={setEnrollmentsExpanded}>
              <Card>
                <CollapsibleTrigger className="w-full text-left">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">Campaign Enrollments</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {enrollments.filter(e => e.status === 'active').length} Active
                        </Badge>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${enrollmentsExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {loadingEnrollments ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-8 w-32" />
                          </div>
                        ))}
                      </div>
                    ) : enrollments.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">
                          This business is not enrolled in any campaigns yet
                        </p>
                        {canManageEnrollments && !business.archived_at && (
                          <Button onClick={() => setShowEnrollmentDialog(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Enroll in Campaign
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {enrollments.map((enrollment) => (
                          <div key={enrollment.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{enrollment.campaign_name}</h4>
                                  {getStatusBadge(enrollment.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {getCampaignTypeLabel(enrollment.campaign_type)} • Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                </p>
                                {enrollment.status === 'completed' && enrollment.completed_at && (
                                  <p className="text-sm text-muted-foreground">
                                    Completed {new Date(enrollment.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {enrollment.current_sequence_order} of {enrollment.total_sequences} emails
                                </span>
                              </div>
                              <Progress 
                                value={getProgressPercentage(enrollment.current_sequence_order, enrollment.total_sequences)} 
                                className="h-2"
                              />
                              {enrollment.status === 'active' && enrollment.next_send_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Next email: {formatNextSend(enrollment.next_send_at)}
                                </p>
                              )}
                              {enrollment.status === 'paused' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Campaign is paused
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{enrollment.emails_sent} sent</span>
                              </div>
                              {enrollment.emails_sent > 0 && (
                                <>
                                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <span>👁</span>
                                    <span>{enrollment.emails_opened} opened ({Math.round((enrollment.emails_opened / enrollment.emails_sent) * 100)}%)</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <span>🖱</span>
                                    <span>{enrollment.emails_clicked} clicked ({Math.round((enrollment.emails_clicked / enrollment.emails_sent) * 100)}%)</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {canManageEnrollments && (enrollment.status === 'active' || enrollment.status === 'paused') && (
                              <div className="flex gap-2 pt-2">
                                {enrollment.status === 'active' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePauseEnrollment(enrollment)}
                                    disabled={pausingId === enrollment.id}
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    {pausingId === enrollment.id ? "Pausing..." : "Pause"}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResumeEnrollment(enrollment)}
                                    disabled={resumingId === enrollment.id}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    {resumingId === enrollment.id ? "Resuming..." : "Resume"}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => confirmCancelEnrollment(enrollment)}
                                  disabled={cancellingId === enrollment.id}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Partnership Engagement - Collapsible */}
            {(business.engagement_score !== null || business.engagement_segment) && (
              <Collapsible open={engagementExpanded} onOpenChange={setEngagementExpanded}>
                <Card>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">Partnership Engagement</CardTitle>
                          <span className="text-xl font-bold">{business.engagement_score}/100</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {business.engagement_segment && (
                            <Badge className={`${getSegmentInfo(business.engagement_segment).bgColor} ${getSegmentInfo(business.engagement_segment).color} border-0`}>
                              {(() => {
                                const Icon = getSegmentInfo(business.engagement_segment).icon;
                                return <Icon className="h-3 w-3 mr-1" />;
                              })()}
                              {getSegmentInfo(business.engagement_segment).label}
                            </Badge>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${engagementExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {business.engagement_segment && (
                        <p className="text-sm text-muted-foreground">
                          {getSegmentInfo(business.engagement_segment).description}
                        </p>
                      )}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Breadth (Linked Donors)</p>
                            <Badge variant="outline">{business.engagement_breadth_score}/5</Badge>
                          </div>
                          <Progress value={(business.engagement_breadth_score || 0) * 20} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {business.linked_donors_count || 0} linked donors
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Performance (Total Value)</p>
                            <Badge variant="outline">{business.engagement_performance_score}/5</Badge>
                          </div>
                          <Progress value={(business.engagement_performance_score || 0) * 20} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            ${((business.total_partnership_value || 0) / 100).toLocaleString()} total value
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Vitality (Recent Activity)</p>
                            <Badge variant="outline">{business.engagement_vitality_score}/5</Badge>
                          </div>
                          <Progress value={(business.engagement_vitality_score || 0) * 20} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {business.last_donor_activity_date
                              ? `Last activity: ${new Date(business.last_donor_activity_date).toLocaleDateString()}`
                              : "No activity recorded"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Donation History - Collapsible */}
            <Collapsible open={donationsExpanded} onOpenChange={setDonationsExpanded}>
              <Card>
                <CollapsibleTrigger className="w-full text-left">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">Donation History</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {donations.length} {donations.length === 1 ? 'donation' : 'donations'}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${donationsExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
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
                              <p className="font-semibold">${donation.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Campaign Assets */}
            <BusinessCampaignAssetsList 
              businessId={businessId}
              businessLogoUrl={business.logo_url}
            />

            {/* Activity Timeline */}
            <BusinessActivityTimeline businessId={businessId} />
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

            {/* Partnership Insights Panel */}
            {organizationUser?.organization_id && (
              <BusinessInsightsPanel 
                businessId={businessId}
                organizationId={organizationUser.organization_id}
              />
            )}

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
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="gap-1 border"
                          style={{
                            backgroundColor: getTagBgColor(tag),
                            color: getTagColor(tag),
                            borderColor: getTagColor(tag)
                          }}
                        >
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

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore <strong>{business?.business_name}</strong>? 
              It will be moved back to active status and will appear in your active businesses list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? "Restoring..." : "Restore Business"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Campaign Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the enrollment in "{enrollmentToCancel?.campaign_name}"? 
              This action cannot be undone and the business will not receive any further emails from this campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEnrollmentToCancel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelEnrollment} 
              disabled={cancellingId === enrollmentToCancel?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingId === enrollmentToCancel?.id ? "Cancelling..." : "Cancel Enrollment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManualEnrollmentDialog
        open={showEnrollmentDialog}
        onOpenChange={setShowEnrollmentDialog}
        organizationId={organizationUser.organization_id}
        preSelectedBusinessIds={businessId ? [businessId] : []}
        onSuccess={() => {
          fetchEnrollments();
          setShowEnrollmentDialog(false);
        }}
      />

      <BusinessVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        business={{
          id: business.id,
          business_name: business.business_name,
          verification_status: business.verification_status,
        }}
        onSuccess={fetchBusinessDetails}
      />
    </DashboardPageLayout>
  );
};

export default BusinessProfile;
