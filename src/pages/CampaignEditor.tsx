import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, FileText, Calendar, Users, Heart, ListPlus, Megaphone, Package, Loader2, ShoppingCart } from "lucide-react";
import { BasicDetailsSection } from "@/components/campaign-editor/BasicDetailsSection";
import { ScheduleSection } from "@/components/campaign-editor/ScheduleSection";
import { TeamSettingsSection } from "@/components/campaign-editor/TeamSettingsSection";
import { DonorExperienceSection } from "@/components/campaign-editor/DonorExperienceSection";
import { CustomFieldsSection } from "@/components/campaign-editor/CustomFieldsSection";
import { CampaignPitchSection } from "@/components/campaign-editor/CampaignPitchSection";
import { CampaignItemsSection } from "@/components/campaign-editor/CampaignItemsSection";
import { CampaignStatsCard } from "@/components/campaign-editor/CampaignStatsCard";
import { CampaignQuickActions } from "@/components/campaign-editor/CampaignQuickActions";
import { CampaignOrdersSection } from "@/components/campaign-editor/CampaignOrdersSection";

interface CampaignData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  groupId: string;
  campaignTypeId: string;
  goalAmount: string;
  startDate: string;
  endDate: string;
  groupDirections: string;
  thankYouMessage: string;
  requiresBusinessInfo: boolean;
  fileUploadDeadlineDays: string;
  enableRosterAttribution: boolean;
  rosterId: string;
  publicationStatus: string;
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
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    groupId: "",
    campaignTypeId: "",
    goalAmount: "",
    startDate: "",
    endDate: "",
    groupDirections: "",
    thankYouMessage: "",
    requiresBusinessInfo: false,
    fileUploadDeadlineDays: "",
    enableRosterAttribution: false,
    rosterId: "",
    publicationStatus: "draft",
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [campaignPitch, setCampaignPitch] = useState<CampaignPitch | null>(null);
  const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
  const [slugExists, setSlugExists] = useState(false);

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
          startDate: data.start_date || "",
          endDate: data.end_date || "",
          groupDirections: data.group_directions || "",
          thankYouMessage: data.thank_you_message || "",
          requiresBusinessInfo: data.requires_business_info || false,
          fileUploadDeadlineDays: data.file_upload_deadline_days?.toString() || "",
          enableRosterAttribution: data.enable_roster_attribution || false,
          rosterId: data.roster_id?.toString() || "",
          publicationStatus: data.publication_status || "draft",
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

  const handleSave = async () => {
    if (!organizationUser) return;

    // Validate required fields
    if (!campaignData.name || !campaignData.slug || !campaignData.groupId || !campaignData.campaignTypeId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in campaign name, slug, group, and type",
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
        start_date: campaignData.startDate || null,
        end_date: campaignData.endDate || null,
        group_directions: campaignData.groupDirections || null,
        thank_you_message: campaignData.thankYouMessage || null,
        requires_business_info: campaignData.requiresBusinessInfo,
        file_upload_deadline_days: campaignData.fileUploadDeadlineDays ? parseInt(campaignData.fileUploadDeadlineDays) : null,
        enable_roster_attribution: campaignData.enableRosterAttribution,
        roster_id: campaignData.rosterId ? parseInt(campaignData.rosterId) : null,
        status: true,
        publication_status: isEditing ? undefined : 'draft',
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
      }

      toast({
        title: "Success",
        description: isEditing ? "Campaign updated successfully" : "Campaign created successfully",
      });

      // If new campaign, redirect to edit mode
      if (!isEditing && campaignId) {
        navigate(`/dashboard/campaigns/${campaignId}/edit`, { replace: true });
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
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
          { label: "Campaigns", path: "/dashboard/campaigns" },
          { label: isEditing ? "Edit" : "New Campaign" }
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
        { label: "Campaigns", path: "/dashboard/campaigns" },
        { label: isEditing ? campaignData.name || "Edit Campaign" : "New Campaign" }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/campaigns")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditing ? campaignData.name || "Edit Campaign" : "Create New Campaign"}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? "Manage your campaign settings and orders" : "Set up your fundraising campaign step by step"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditing && id && campaignData.groupId && (
              <CampaignQuickActions
                campaignId={id}
                campaignName={campaignData.name}
                groupId={campaignData.groupId}
                slug={campaignData.slug || null}
                publicationStatus={campaignData.publicationStatus}
                onPublicationChange={() => {
                  // Refetch campaign data to get updated publication status
                  window.location.reload();
                }}
              />
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Campaign"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats Card - Only show when editing */}
        {isEditing && id && (
          <CampaignStatsCard
            campaignId={id}
            goalAmount={parseFloat(campaignData.goalAmount) || 0}
          />
        )}

        {/* Form Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Details</CardTitle>
                </div>
                <CardDescription>Campaign name, URL, and description</CardDescription>
              </CardHeader>
              <CardContent>
                <BasicDetailsSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                  campaignImageFile={campaignImageFile}
                  onImageFileChange={setCampaignImageFile}
                  slugExists={slugExists}
                  onSlugExistsChange={setSlugExists}
                  isEditing={isEditing}
                />
              </CardContent>
            </Card>

            {/* Schedule & Goals */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Schedule & Goals</CardTitle>
                </div>
                <CardDescription>Set your campaign timeline and fundraising goal</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                />
              </CardContent>
            </Card>

            {/* Team Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Team Settings</CardTitle>
                </div>
                <CardDescription>Participant directions and roster attribution</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamSettingsSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Donor Experience */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <CardTitle>Donor Experience</CardTitle>
                </div>
                <CardDescription>Thank you message and checkout options</CardDescription>
              </CardHeader>
              <CardContent>
                <DonorExperienceSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                />
              </CardContent>
            </Card>

            {/* Custom Fields */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-primary" />
                  <CardTitle>Custom Fields</CardTitle>
                </div>
                <CardDescription>Add custom questions for donors at checkout</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomFieldsSection
                  fields={customFields}
                  onFieldsChange={setCustomFields}
                />
              </CardContent>
            </Card>

            {/* Campaign Pitch - Only show when editing */}
            {isEditing && id && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <CardTitle>Campaign Pitch</CardTitle>
                  </div>
                  <CardDescription>Add a message, photo, or video for your campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <CampaignPitchSection
                    campaignId={id}
                    initialPitch={campaignPitch || undefined}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Campaign Items - Full width at bottom */}
        {isEditing && id && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>Campaign Items</CardTitle>
              </div>
              <CardDescription>Products or sponsorship levels for your campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignItemsSection campaignId={id} />
            </CardContent>
          </Card>
        )}

        {/* Orders Section - Full width at bottom */}
        {isEditing && id && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <CardTitle>Orders & File Uploads</CardTitle>
              </div>
              <CardDescription>View purchases and track pending asset uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignOrdersSection campaignId={id} />
            </CardContent>
          </Card>
        )}

        {/* Bottom Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Campaign"}
          </Button>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
