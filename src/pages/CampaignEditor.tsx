import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  FileText,
  Calendar,
  Users,
  Heart,
  ListPlus,
  Megaphone,
  Loader2,
  ShoppingCart,
  Trash2,
  MoreVertical,
  Package,
  Image as ImageIcon,
  ChevronDown,
  Plus,
  DollarSign,
  HandCoins,
  ClipboardCheck,
  CalendarClock,
  Truck,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { BasicDetailsSection } from "@/components/campaign-editor/BasicDetailsSection";
import { ScheduleSection } from "@/components/campaign-editor/ScheduleSection";
import { TeamSettingsSection } from "@/components/campaign-editor/TeamSettingsSection";
import { DonorExperienceSection } from "@/components/campaign-editor/DonorExperienceSection";
import { PlatformFeeSection } from "@/components/campaign-editor/PlatformFeeSection";
import { CustomFieldsSection } from "@/components/campaign-editor/CustomFieldsSection";
import { CampaignPitchSection } from "@/components/campaign-editor/CampaignPitchSection";
import { CampaignItemsSection } from "@/components/campaign-editor/CampaignItemsSection";
import { CampaignQuickActions } from "@/components/campaign-editor/CampaignQuickActions";
import { CampaignOrdersSection } from "@/components/campaign-editor/CampaignOrdersSection";
import { CampaignAssetsSection } from "@/components/campaign-editor/CampaignAssetsSection";
import { PledgeSettingsSection } from "@/components/campaign-editor/PledgeSettingsSection";
import { PledgeResultsSection } from "@/components/campaign-editor/PledgeResultsSection";
import { EventDetailsSection, type AgendaItem } from "@/components/campaign-editor/EventDetailsSection";
import { MerchandiseFulfillmentSection } from "@/components/campaign-editor/MerchandiseFulfillmentSection";
import { CampaignSectionNav, type SectionKey } from "@/components/campaign-editor/CampaignSectionNav";
import { CampaignAtAGlanceCard } from "@/components/campaign-editor/CampaignAtAGlanceCard";
import { CampaignRecentOrdersCard } from "@/components/campaign-editor/CampaignRecentOrdersCard";
import { CampaignShareCard } from "@/components/campaign-editor/CampaignShareCard";

const SECTION_META: Record<SectionKey, { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; showSave: boolean }> = {
  details: { icon: FileText, title: "Basic Details", subtitle: "Fundraiser name, URL, and description", showSave: true },
  schedule: { icon: Calendar, title: "Schedule & Goals", subtitle: "Set your fundraiser timeline and fundraising goal", showSave: true },
  items: { icon: Package, title: "Fundraiser Items", subtitle: "Manage what supporters can purchase", showSave: false },
  experience: { icon: Heart, title: "Donor Experience", subtitle: "Thank you message and checkout options", showSave: true },
  fees: { icon: DollarSign, title: "Platform Fees", subtitle: "Choose who pays Sponsorly's 10% platform fee for this fundraiser.", showSave: true },
  team: { icon: Users, title: "Team Settings", subtitle: "Participant directions and roster attribution", showSave: true },
  fields: { icon: ListPlus, title: "Custom Fields", subtitle: "Add custom questions for donors at checkout", showSave: true },
  pitch: { icon: Megaphone, title: "Fundraiser Pitch", subtitle: "Add a message, photo, or video for your fundraiser", showSave: false },
  orders: { icon: ShoppingCart, title: "Orders", subtitle: "View purchases and track pending file uploads", showSave: false },
  assets: { icon: ImageIcon, title: "Assets", subtitle: "Track required asset uploads from supporters", showSave: false },
  pledgeSettings: { icon: HandCoins, title: "Pledge Setup", subtitle: "Configure unit, scope, event date and suggested amounts", showSave: true },
  pledgeResults: { icon: ClipboardCheck, title: "Pledge Results", subtitle: "Record event results and charge supporters", showSave: false },
  eventDetails: { icon: CalendarClock, title: "Event Details", subtitle: "Date, location, format, includes, and day-of agenda", showSave: true },
  eventLocation: { icon: CalendarClock, title: "Location & Details", subtitle: "Date, venue, format, and what's included", showSave: true },
  eventAgenda: { icon: CalendarClock, title: "Day-of Agenda", subtitle: "Build the schedule donors see on the landing page", showSave: true },
  merchFulfillment: { icon: Truck, title: "Fulfillment", subtitle: "Ship-by date, shipping rate, and pickup options", showSave: true },
};

interface CampaignData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  groupId: string;
  campaignTypeId: string;
  goalAmount: string;
  heroAccentWord: string;
  startDate: string;
  endDate: string;
  groupDirections: string;
  thankYouMessage: string;
  requiresBusinessInfo: boolean;
  fileUploadDeadlineDays: string;
  assetUploadDeadline: string;
  enableRosterAttribution: boolean;
  rosterId: string;
  publicationStatus: string;
  previewToken: string | null;
  feeModel: 'donor_covers' | 'org_absorbs';
  pledgeUnitLabel: string;
  pledgeUnitLabelPlural: string;
  pledgeScope: 'team' | 'participant';
  pledgeEventDate: string;
  pledgeMinPerUnit: string;
  pledgeSuggestedUnitAmounts: number[];
  eventStartAt: string;
  eventLocationName: string;
  eventLocationAddress: string;
  eventFormat: string;
  eventFormatSubtitle: string;
  eventIncludes: string[];
  eventIncludesSubtitle: string;
  eventAgenda: AgendaItem[];
  eventDetailsHeading?: string;
  eventDetailsHeadingAccent?: string;
  eventAgendaHeading?: string;
  eventAgendaHeadingAccent?: string;
  eventIncludesHeading?: string;
  merchShipsByDate: string;
  merchPickupAvailable: boolean;
  merchPickupNote: string;
  merchShippingFlatRate: string;
  merchItemsHeading: string;
  merchItemsSubheading: string;
}

interface RequiredAsset {
  id?: string;
  asset_name: string;
  asset_description: string;
  file_types: string[];
  max_file_size_mb: number;
  dimensions_hint: string;
  is_required: boolean;
  display_order: number;
}

interface CustomField {
  id?: string;
  field_name: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'email' | 'phone' | 'file' | 'checkbox' | 'select';
  field_options?: string[];
  is_required: boolean;
  help_text?: string;
  display_order: number;
}

interface CampaignPitch {
  message: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  recordedVideoUrl: string | null;
}

export default function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationUser, loading: orgLoading } = useOrganizationUser();
  
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    groupId: "",
    campaignTypeId: "",
    goalAmount: "",
    heroAccentWord: "",
    startDate: "",
    endDate: "",
    groupDirections: "",
    thankYouMessage: "",
    requiresBusinessInfo: false,
    fileUploadDeadlineDays: "",
    assetUploadDeadline: "",
    enableRosterAttribution: false,
    rosterId: "",
    publicationStatus: "draft",
    previewToken: null,
    feeModel: 'donor_covers',
    pledgeUnitLabel: "",
    pledgeUnitLabelPlural: "",
    pledgeScope: 'team',
    pledgeEventDate: "",
    pledgeMinPerUnit: "",
    pledgeSuggestedUnitAmounts: [0.5, 1, 2, 5],
    eventStartAt: "",
    eventLocationName: "",
    eventLocationAddress: "",
    eventFormat: "",
    eventFormatSubtitle: "",
    eventIncludes: [],
    eventIncludesSubtitle: "",
    eventAgenda: [],
    eventDetailsHeading: "",
    eventDetailsHeadingAccent: "",
    eventAgendaHeading: "",
    eventAgendaHeadingAccent: "",
    eventIncludesHeading: "",
    merchShipsByDate: "",
    merchPickupAvailable: false,
    merchPickupNote: "",
    merchShippingFlatRate: "",
    merchItemsHeading: "",
    merchItemsSubheading: "",
  });
  const [requiredAssets, setRequiredAssets] = useState<RequiredAsset[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [campaignPitch, setCampaignPitch] = useState<CampaignPitch | null>(null);
  const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
  const [slugExists, setSlugExists] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("details");
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [pledgeTypeId, setPledgeTypeId] = useState<string | null>(null);
  const [eventTypeId, setEventTypeId] = useState<string | null>(null);
  const [merchandiseTypeId, setMerchandiseTypeId] = useState<string | null>(null);
  const [sponsorshipTypeId, setSponsorshipTypeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campaign_type")
        .select("id, name")
        .ilike("name", "Pledge")
        .maybeSingle();
      if (data) setPledgeTypeId(data.id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campaign_type")
        .select("id, name")
        .ilike("name", "Event")
        .maybeSingle();
      if (data) setEventTypeId(data.id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campaign_type")
        .select("id, name")
        .ilike("name", "Merchandise Sale")
        .maybeSingle();
      if (data) setMerchandiseTypeId(data.id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campaign_type")
        .select("id, name")
        .ilike("name", "Sponsorship")
        .maybeSingle();
      if (data) setSponsorshipTypeId(data.id);
    })();
  }, []);

  const isPledgeCampaign = !!pledgeTypeId && campaignData.campaignTypeId === pledgeTypeId;
  const isEventCampaign = !!eventTypeId && campaignData.campaignTypeId === eventTypeId;
  const isMerchandiseCampaign =
    !!merchandiseTypeId && campaignData.campaignTypeId === merchandiseTypeId;
  const isSponsorshipCampaign =
    !!sponsorshipTypeId && campaignData.campaignTypeId === sponsorshipTypeId;

  // Counts for nav badges
  const { data: itemsCount = 0 } = useQuery({
    queryKey: ["campaign-items-count", id],
    enabled: !!id,
    queryFn: async () => {
      const { count } = await supabase
        .from("campaign_items")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", id!);
      return count || 0;
    },
  });

  const { data: ordersCounts = { total: 0, pending: 0 } } = useQuery({
    queryKey: ["campaign-orders-counts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("files_complete")
        .eq("campaign_id", id!)
        .eq("status", "succeeded");
      const total = data?.length || 0;
      const pending = data?.filter((o) => o.files_complete === false).length || 0;
      return { total, pending };
    },
  });

  // Fetch campaign data if editing
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select(`
            *,
            groups!inner(id, group_name)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        setCampaignData({
          id: data.id,
          name: data.name,
          slug: data.slug || "",
          description: data.description || "",
          imageUrl: data.image_url || "",
          groupId: data.group_id,
          campaignTypeId: data.campaign_type_id || "",
          goalAmount: data.goal_amount?.toString() || "",
          heroAccentWord: (data as any).hero_accent_word || "",
          startDate: data.start_date || "",
          endDate: data.end_date || "",
          groupDirections: data.group_directions || "",
          thankYouMessage: data.thank_you_message || "",
          requiresBusinessInfo: data.requires_business_info || false,
          fileUploadDeadlineDays: data.file_upload_deadline_days?.toString() || "",
          assetUploadDeadline: data.asset_upload_deadline || "",
          enableRosterAttribution: data.enable_roster_attribution || false,
          rosterId: data.roster_id?.toString() || "",
          publicationStatus: data.publication_status || "draft",
          previewToken: (data as any).preview_token || null,
          feeModel: (data.fee_model as 'donor_covers' | 'org_absorbs') || 'donor_covers',
          pledgeUnitLabel: (data as any).pledge_unit_label || "",
          pledgeUnitLabelPlural: (data as any).pledge_unit_label_plural || "",
          pledgeScope: ((data as any).pledge_scope as 'team' | 'participant') || 'team',
          pledgeEventDate: (data as any).pledge_event_date || "",
          pledgeMinPerUnit:
            (data as any).pledge_min_per_unit != null
              ? String((data as any).pledge_min_per_unit)
              : "",
          pledgeSuggestedUnitAmounts:
            ((data as any).pledge_suggested_unit_amounts as number[] | null) || [0.5, 1, 2, 5],
          eventStartAt: (data as any).event_start_at
            ? new Date((data as any).event_start_at).toISOString().slice(0, 16)
            : "",
          eventLocationName: (data as any).event_location_name || "",
          eventLocationAddress: (data as any).event_location_address || "",
          eventFormat: (data as any).event_format || "",
          eventFormatSubtitle: (data as any).event_format_subtitle || "",
          eventIncludes: ((data as any).event_includes as string[] | null) || [],
          eventIncludesSubtitle: (data as any).event_includes_subtitle || "",
          eventAgenda: ((data as any).event_agenda as AgendaItem[] | null) || [],
          eventDetailsHeading: (data as any).event_details_heading || "",
          eventDetailsHeadingAccent: (data as any).event_details_heading_accent || "",
          eventAgendaHeading: (data as any).event_agenda_heading || "",
          eventAgendaHeadingAccent: (data as any).event_agenda_heading_accent || "",
          eventIncludesHeading: (data as any).event_includes_heading || "",
          merchShipsByDate: (data as any).merch_ships_by_date || "",
          merchPickupAvailable: !!(data as any).merch_pickup_available,
          merchPickupNote: (data as any).merch_pickup_note || "",
          merchShippingFlatRate:
            (data as any).merch_shipping_flat_rate != null
              ? String((data as any).merch_shipping_flat_rate)
              : "",
          merchItemsHeading: (data as any).merch_items_heading || "",
          merchItemsSubheading: (data as any).merch_items_subheading || "",
        });

        // Fetch pitch data
        if (data.pitch_message || data.pitch_image_url || data.pitch_video_url || data.pitch_recorded_video_url) {
          setCampaignPitch({
            message: data.pitch_message,
            imageUrl: data.pitch_image_url,
            videoUrl: data.pitch_video_url,
            recordedVideoUrl: data.pitch_recorded_video_url,
          });
        }

        // Fetch custom fields
        const { data: fieldsData } = await supabase
          .from("campaign_custom_fields")
          .select("*")
          .eq("campaign_id", id)
          .order("display_order");

        if (fieldsData) {
          setCustomFields(fieldsData.map((f: any) => ({
            id: f.id,
            field_name: f.field_name,
            field_type: f.field_type,
            field_options: f.field_options || [],
            is_required: f.is_required,
            help_text: f.help_text || "",
            display_order: f.display_order,
          })));
        }

        // Fetch required assets
        const { data: assetsData } = await supabase
          .from("campaign_required_assets")
          .select("*")
          .eq("campaign_id", id)
          .is("campaign_item_id", null)
          .order("display_order");

        if (assetsData) {
          setRequiredAssets(assetsData.map((a: any) => ({
            id: a.id,
            asset_name: a.asset_name,
            asset_description: a.asset_description || "",
            file_types: a.file_types || [],
            max_file_size_mb: a.max_file_size_mb || 10,
            dimensions_hint: a.dimensions_hint || "",
            is_required: a.is_required,
            display_order: a.display_order,
          })));
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast({
          title: "Error",
          description: "Failed to load campaign data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!orgLoading) {
      fetchCampaign();
    }
  }, [id, orgLoading]);

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Campaign deleted",
        description: "You can restore it from the Deleted filter on the Fundraisers page.",
      });
      setDeleteDialogOpen(false);
      navigate("/dashboard/fundraisers");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete fundraiser",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!organizationUser) return;

    // Validate required fields
    if (!campaignData.name || !campaignData.slug || !campaignData.groupId || !campaignData.campaignTypeId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in fundraiser name, slug, group, and type",
        variant: "destructive",
      });
      return;
    }

    if (slugExists) {
      toast({
        title: "Slug already exists",
        description: "Please choose a different URL slug",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Upload image if selected
      let imageUrl = campaignData.imageUrl;
      if (campaignImageFile) {
        const fileExt = campaignImageFile.name.split('.').pop();
        const fileName = `campaigns/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('campaign-item-images')
          .upload(fileName, campaignImageFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('campaign-item-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const saveData = {
        name: campaignData.name,
        slug: campaignData.slug,
        description: campaignData.description || null,
        image_url: imageUrl || null,
        group_id: campaignData.groupId,
        campaign_type_id: campaignData.campaignTypeId,
        goal_amount: campaignData.goalAmount ? parseFloat(campaignData.goalAmount) : null,
        hero_accent_word: campaignData.heroAccentWord || null,
        start_date: campaignData.startDate || null,
        end_date: campaignData.endDate || null,
        group_directions: campaignData.groupDirections || null,
        thank_you_message: campaignData.thankYouMessage || null,
        requires_business_info: campaignData.requiresBusinessInfo,
        file_upload_deadline_days: campaignData.fileUploadDeadlineDays ? parseInt(campaignData.fileUploadDeadlineDays) : null,
        asset_upload_deadline: campaignData.assetUploadDeadline || null,
        enable_roster_attribution: campaignData.enableRosterAttribution,
        roster_id: campaignData.rosterId ? parseInt(campaignData.rosterId) : null,
        status: true,
        publication_status: isEditing ? undefined : 'draft',
        fee_model: campaignData.feeModel || 'donor_covers',
        pledge_unit_label: campaignData.pledgeUnitLabel || null,
        pledge_unit_label_plural: campaignData.pledgeUnitLabelPlural || null,
        pledge_scope: campaignData.pledgeScope || null,
        pledge_event_date: campaignData.pledgeEventDate || null,
        pledge_min_per_unit: campaignData.pledgeMinPerUnit
          ? parseFloat(campaignData.pledgeMinPerUnit)
          : null,
        pledge_suggested_unit_amounts: campaignData.pledgeSuggestedUnitAmounts || null,
        event_start_at: campaignData.eventStartAt
          ? new Date(campaignData.eventStartAt).toISOString()
          : null,
        event_location_name: campaignData.eventLocationName || null,
        event_location_address: campaignData.eventLocationAddress || null,
        event_format: campaignData.eventFormat || null,
        event_format_subtitle: campaignData.eventFormatSubtitle || null,
        event_includes: campaignData.eventIncludes && campaignData.eventIncludes.length ? campaignData.eventIncludes : null,
        event_includes_subtitle: campaignData.eventIncludesSubtitle || null,
        event_agenda: campaignData.eventAgenda && campaignData.eventAgenda.length
          ? (campaignData.eventAgenda as any)
          : null,
        event_details_heading: campaignData.eventDetailsHeading || null,
        event_details_heading_accent: campaignData.eventDetailsHeadingAccent || null,
        event_agenda_heading: campaignData.eventAgendaHeading || null,
        event_agenda_heading_accent: campaignData.eventAgendaHeadingAccent || null,
        event_includes_heading: campaignData.eventIncludesHeading || null,
        merch_ships_by_date: campaignData.merchShipsByDate || null,
        merch_pickup_available: campaignData.merchPickupAvailable,
        merch_pickup_note: campaignData.merchPickupNote || null,
        merch_shipping_flat_rate: campaignData.merchShippingFlatRate
          ? parseFloat(campaignData.merchShippingFlatRate)
          : null,
        merch_items_heading: campaignData.merchItemsHeading || null,
        merch_items_subheading: campaignData.merchItemsSubheading || null,
      };

      let campaignId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("campaigns")
          .update(saveData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("campaigns")
          .insert([saveData])
          .select()
          .single();

        if (error) throw error;
        campaignId = data.id;
      }

      // Save custom fields
      if (campaignId) {
        await supabase
          .from("campaign_custom_fields")
          .delete()
          .eq("campaign_id", campaignId);

        if (customFields.length > 0) {
          await supabase
            .from("campaign_custom_fields")
            .insert(customFields.map((field, index) => ({
              campaign_id: campaignId,
              field_name: field.field_name,
              field_type: field.field_type,
              field_options: field.field_options || null,
              is_required: field.is_required,
              help_text: field.help_text || null,
              display_order: index,
            })));
        }

        // Save required assets (campaign-wide only — per-item assets are managed in the Items section)
        await supabase
          .from("campaign_required_assets")
          .delete()
          .eq("campaign_id", campaignId)
          .is("campaign_item_id", null);

        if (requiredAssets.length > 0) {
          await supabase
            .from("campaign_required_assets")
            .insert(requiredAssets.map((asset, index) => ({
              campaign_id: campaignId,
              asset_name: asset.asset_name,
              asset_description: asset.asset_description || null,
              file_types: asset.file_types,
              max_file_size_mb: asset.max_file_size_mb,
              dimensions_hint: asset.dimensions_hint || null,
              is_required: asset.is_required,
              display_order: index,
            })));
        }
      }

      // Sync local state with persisted values so the AtAGlance checklist
      // and image preview reflect the freshly uploaded image.
      setCampaignData((prev) => ({ ...prev, imageUrl: imageUrl || "" }));
      setCampaignImageFile(null);

      toast({
        title: "Success",
        description: isEditing ? "Campaign updated successfully" : "Campaign created successfully",
      });

      // If new campaign, redirect to edit mode
      if (!isEditing && campaignId) {
        navigate(`/dashboard/fundraisers/${campaignId}/edit`, { replace: true });
      }
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Failed to save fundraiser",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (orgLoading || loading) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "Fundraisers", path: "/dashboard/fundraisers" },
          { label: isEditing ? "Edit" : "New Fundraiser" }
        ]}
        loading={true}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Fundraisers", path: "/dashboard/fundraisers" },
        { label: isEditing ? campaignData.name || "Edit Fundraiser" : "New Fundraiser" }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing 
                ? `${campaignData.name || "Edit"} Fundraiser` 
                : "Create New Fundraiser"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {isEditing && (
                <Badge variant={campaignData.publicationStatus === "published" ? "default" : "secondary"}>
                  {campaignData.publicationStatus === "published" ? "Published" : "Draft"}
                </Badge>
              )}
              <p className="text-muted-foreground">
                {isEditing ? "Manage your fundraiser settings and orders" : "Set up your fundraiser step by step"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop: full button row */}
            <div className="hidden lg:flex items-center gap-2">
              {isEditing && id && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  aria-label="Delete fundraiser"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {isEditing && id && campaignData.groupId && (
                <CampaignQuickActions
                  campaignId={id}
                  campaignName={campaignData.name}
                  groupId={campaignData.groupId}
                  slug={campaignData.slug || null}
                  publicationStatus={campaignData.publicationStatus}
                  onPublicationChange={() => {
                    window.location.reload();
                  }}
                />
              )}
            </div>

            {/* Mobile / tablet: collapsed dropdown */}
            {isEditing && id && campaignData.groupId && (
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="More actions">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <CampaignQuickActions
                      compact
                      campaignId={id}
                      campaignName={campaignData.name}
                      groupId={campaignData.groupId}
                      slug={campaignData.slug || null}
                      publicationStatus={campaignData.publicationStatus}
                      onPublicationChange={() => {
                        window.location.reload();
                      }}
                    />
                    {(campaignData.publicationStatus === "draft" || campaignData.publicationStatus === "pending_verification") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => { e.preventDefault(); setDeleteDialogOpen(true); }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Fundraiser"}
            </Button>
          </div>
        </div>

        {/* 3-column layout: nav | content | sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left nav - desktop only */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card>
              <CardContent className="p-3">
                <CampaignSectionNav
                  active={activeSection}
                  onChange={setActiveSection}
                  counts={{
                    items: itemsCount,
                    fields: customFields.length,
                    orders: ordersCounts.total,
                    assets: ordersCounts.pending,
                  }}
                  showManage={!!(isEditing && id)}
                  showPitch={!!(isEditing && id)}
                  showItems={!!(isEditing && id) && !isPledgeCampaign}
                  isPledge={isPledgeCampaign}
                  showPledgeResults={!!(isEditing && id) && isPledgeCampaign}
                  isEvent={isEventCampaign}
                  isMerchandise={isMerchandiseCampaign}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Middle: active section */}
          <main className="lg:col-span-6">
            {/* Mobile/tablet section nav trigger */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setNavSheetOpen(true)}
              >
                <span className="flex items-center gap-2">
                  {(() => {
                    const Icon = SECTION_META[activeSection].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <span>{SECTION_META[activeSection].title}</span>
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {(() => {
                  const meta = SECTION_META[activeSection];
                  const Icon = meta.icon;
                  return (
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{meta.title}</h3>
                          <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
                        </div>
                      </div>
                      {activeSection === "items" && isEditing && id && itemsCount > 0 && (
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => window.dispatchEvent(new CustomEvent("campaign-items:add"))}
                        >
                          <Plus className="h-4 w-4" /> Add Item
                        </Button>
                      )}
                    </div>
                  );
                })()}

                {activeSection === "details" && (
                  <BasicDetailsSection
                    data={campaignData}
                    onUpdate={updateCampaignData}
                    campaignImageFile={campaignImageFile}
                    onImageFileChange={setCampaignImageFile}
                    slugExists={slugExists}
                    onSlugExistsChange={setSlugExists}
                    isEditing={isEditing}
                  />
                )}

                {activeSection === "schedule" && (
                  <ScheduleSection data={campaignData} onUpdate={updateCampaignData} />
                )}

                {activeSection === "items" && isEditing && id && (
                  <CampaignItemsSection campaignId={id} forceSponsorship={isSponsorshipCampaign} />
                )}

                {activeSection === "experience" && (
                  <DonorExperienceSection
                    data={campaignData}
                    onUpdate={updateCampaignData}
                    requiredAssets={requiredAssets}
                    onRequiredAssetsChange={setRequiredAssets}
                  />
                )}

                {activeSection === "fees" && (
                  <PlatformFeeSection
                    feeModel={campaignData.feeModel}
                    onUpdate={updateCampaignData}
                  />
                )}

                {activeSection === "team" && (
                  <TeamSettingsSection
                    data={campaignData}
                    onUpdate={updateCampaignData}
                    campaignId={id}
                    isPublished={campaignData.publicationStatus === "published"}
                  />
                )}

                {activeSection === "fields" && (
                  <CustomFieldsSection fields={customFields} onFieldsChange={setCustomFields} />
                )}

                {activeSection === "pitch" && isEditing && id && (
                  <CampaignPitchSection campaignId={id} initialPitch={campaignPitch || undefined} />
                )}

                {activeSection === "orders" && isEditing && id && (
                  <CampaignOrdersSection
                    campaignId={id}
                    organizationId={organizationUser?.organization_id}
                  />
                )}

                {activeSection === "assets" && isEditing && id && (
                  <CampaignAssetsSection campaignId={id} />
                )}

                {activeSection === "pledgeSettings" && (
                  <PledgeSettingsSection
                    data={{
                      pledgeUnitLabel: campaignData.pledgeUnitLabel,
                      pledgeUnitLabelPlural: campaignData.pledgeUnitLabelPlural,
                      pledgeScope: campaignData.pledgeScope,
                      pledgeEventDate: campaignData.pledgeEventDate,
                      pledgeMinPerUnit: campaignData.pledgeMinPerUnit,
                      pledgeSuggestedUnitAmounts: campaignData.pledgeSuggestedUnitAmounts,
                      enableRosterAttribution: campaignData.enableRosterAttribution,
                    }}
                    onUpdate={updateCampaignData}
                  />
                )}

                {activeSection === "pledgeResults" && isEditing && id && (
                  <PledgeResultsSection
                    campaignId={id}
                    pledgeScope={campaignData.pledgeScope}
                    pledgeUnitLabel={campaignData.pledgeUnitLabel}
                    pledgeUnitLabelPlural={campaignData.pledgeUnitLabelPlural}
                  />
                )}

                {(activeSection === "eventDetails" || activeSection === "eventLocation" || activeSection === "eventAgenda") && (
                  <EventDetailsSection
                    mode={
                      activeSection === "eventLocation"
                        ? "location"
                        : activeSection === "eventAgenda"
                        ? "agenda"
                        : "all"
                    }
                    data={{
                      eventStartAt: campaignData.eventStartAt,
                      eventLocationName: campaignData.eventLocationName,
                      eventLocationAddress: campaignData.eventLocationAddress,
                      eventFormat: campaignData.eventFormat,
                      eventFormatSubtitle: campaignData.eventFormatSubtitle,
                      eventIncludes: campaignData.eventIncludes,
                      eventIncludesSubtitle: campaignData.eventIncludesSubtitle,
                      eventAgenda: campaignData.eventAgenda,
                      eventDetailsHeading: campaignData.eventDetailsHeading,
                      eventDetailsHeadingAccent: campaignData.eventDetailsHeadingAccent,
                      eventAgendaHeading: campaignData.eventAgendaHeading,
                      eventAgendaHeadingAccent: campaignData.eventAgendaHeadingAccent,
                      eventIncludesHeading: campaignData.eventIncludesHeading,
                    }}
                    onUpdate={updateCampaignData}
                  />
                )}

                {activeSection === "merchFulfillment" && (
                  <MerchandiseFulfillmentSection
                    data={{
                      merchShipsByDate: campaignData.merchShipsByDate,
                      merchPickupAvailable: campaignData.merchPickupAvailable,
                      merchPickupNote: campaignData.merchPickupNote,
                      merchShippingFlatRate: campaignData.merchShippingFlatRate,
                      merchItemsHeading: campaignData.merchItemsHeading,
                      merchItemsSubheading: campaignData.merchItemsSubheading,
                    }}
                    onUpdate={updateCampaignData}
                  />
                )}
              </CardContent>
            </Card>

            {/* Section-level Save (only for campaign-level editable sections) */}
            {SECTION_META[activeSection].showSave && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Fundraiser"}
                </Button>
              </div>
            )}
            </div>
          </main>

          {/* Right sidebar: only when editing, desktop only */}
          {isEditing && id && (
            <aside className="hidden lg:block lg:col-span-3 space-y-4">
              <CampaignAtAGlanceCard
                campaignId={id}
                goalAmount={parseFloat(campaignData.goalAmount) || 0}
                endDate={campaignData.endDate}
                publicationStatus={campaignData.publicationStatus}
                name={campaignData.name}
                description={campaignData.description}
                imageUrl={campaignData.imageUrl}
                startDate={campaignData.startDate}
                pitch={campaignPitch}
                itemsCount={itemsCount}
                isPledge={isPledgeCampaign}
                pledgeUnitLabel={campaignData.pledgeUnitLabel}
                pledgeScope={campaignData.pledgeScope}
                pledgeEventDate={campaignData.pledgeEventDate}
              />
              {campaignData.publicationStatus === "published" && (
                <CampaignRecentOrdersCard
                  campaignId={id}
                  onViewAll={() => setActiveSection("orders")}
                />
              )}
              <CampaignShareCard
                slug={campaignData.slug || null}
                campaignName={campaignData.name}
                isPublished={campaignData.publicationStatus === "published"}
                previewToken={campaignData.previewToken}
              />
            </aside>
          )}
        </div>

        {/* Mobile/tablet section nav sheet */}
        <Sheet open={navSheetOpen} onOpenChange={setNavSheetOpen}>
          <SheetContent side="left" className="w-72 p-4">
            <div className="mt-6">
              <CampaignSectionNav
                active={activeSection}
                onChange={(s) => {
                  setActiveSection(s);
                  setNavSheetOpen(false);
                }}
                counts={{
                  items: itemsCount,
                  fields: customFields.length,
                  orders: ordersCounts.total,
                  assets: ordersCounts.pending,
                }}
                showManage={!!(isEditing && id)}
                showPitch={!!(isEditing && id)}
                showItems={!!(isEditing && id) && !isPledgeCampaign}
                isPledge={isPledgeCampaign}
                showPledgeResults={!!(isEditing && id) && isPledgeCampaign}
                isEvent={isEventCampaign}
                isMerchandise={isMerchandiseCampaign}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this fundraiser?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the fundraiser to the Deleted filter. You can restore it from the Fundraisers page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  );
}
