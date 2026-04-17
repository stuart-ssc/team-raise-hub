import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText, Calendar, Users, Heart, ListPlus, Megaphone, Loader2, ShoppingCart, Trash2 } from "lucide-react";
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
  assetUploadDeadline: string;
  enableRosterAttribution: boolean;
  rosterId: string;
  publicationStatus: string;
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
  });
  const [requiredAssets, setRequiredAssets] = useState<RequiredAsset[]>([]);
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
          assetUploadDeadline: data.asset_upload_deadline || "",
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

        // Fetch required assets
        const { data: assetsData } = await supabase
          .from("campaign_required_assets")
          .select("*")
          .eq("campaign_id", id)
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
        description: "You can restore it from the Deleted filter on the Campaigns page.",
      });
      setDeleteDialogOpen(false);
      navigate("/dashboard/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
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
        asset_upload_deadline: campaignData.assetUploadDeadline || null,
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

        // Save required assets
        await supabase
          .from("campaign_required_assets")
          .delete()
          .eq("campaign_id", campaignId);

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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing 
                ? `${campaignData.name || "Edit"} Campaign` 
                : "Create New Campaign"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {isEditing && (
                <Badge variant={campaignData.publicationStatus === "published" ? "default" : "secondary"}>
                  {campaignData.publicationStatus === "published" ? "Published" : "Draft"}
                </Badge>
              )}
              <p className="text-muted-foreground">
                {isEditing ? "Manage your campaign settings and orders" : "Set up your fundraising campaign step by step"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop: full button row */}
            <div className="hidden lg:flex items-center gap-2">
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
              {isEditing && id && (campaignData.publicationStatus === "draft" || campaignData.publicationStatus === "pending_verification") && (
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
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

        {/* Form Sections - Tabbed Interface */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className={`grid w-full mb-6 ${isEditing && id ? 'grid-cols-6' : 'grid-cols-5'}`}>
                <TabsTrigger value="details" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger value="experience" className="gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Experience</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="gap-2">
                  <ListPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Fields</span>
                </TabsTrigger>
                {isEditing && id && (
                  <TabsTrigger value="pitch" className="gap-2">
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Pitch</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Basic Details</h3>
                    <p className="text-sm text-muted-foreground">Campaign name, URL, and description</p>
                  </div>
                </div>
                <BasicDetailsSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                  campaignImageFile={campaignImageFile}
                  onImageFileChange={setCampaignImageFile}
                  slugExists={slugExists}
                  onSlugExistsChange={setSlugExists}
                  isEditing={isEditing}
                />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Schedule & Goals</h3>
                    <p className="text-sm text-muted-foreground">Set your campaign timeline and fundraising goal</p>
                  </div>
                </div>
                <ScheduleSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                />
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Team Settings</h3>
                    <p className="text-sm text-muted-foreground">Participant directions and roster attribution</p>
                  </div>
                </div>
                <TeamSettingsSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                  campaignId={id}
                  isPublished={campaignData.publicationStatus === 'published'}
                />
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Donor Experience</h3>
                    <p className="text-sm text-muted-foreground">Thank you message and checkout options</p>
                  </div>
                </div>
                <DonorExperienceSection
                  data={campaignData}
                  onUpdate={updateCampaignData}
                  requiredAssets={requiredAssets}
                  onRequiredAssetsChange={setRequiredAssets}
                />
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <ListPlus className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Custom Fields</h3>
                    <p className="text-sm text-muted-foreground">Add custom questions for donors at checkout</p>
                  </div>
                </div>
                <CustomFieldsSection
                  fields={customFields}
                  onFieldsChange={setCustomFields}
                />
              </TabsContent>

              {isEditing && id && (
                <TabsContent value="pitch" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">Campaign Pitch</h3>
                      <p className="text-sm text-muted-foreground">Add a message, photo, or video for your campaign</p>
                    </div>
                  </div>
                  <CampaignPitchSection
                    campaignId={id}
                    initialPitch={campaignPitch || undefined}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Campaign Items - Full width at bottom */}
        {isEditing && id && (
          <CampaignItemsSection campaignId={id} />
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
              <CampaignOrdersSection campaignId={id} organizationId={organizationUser?.organization_id} />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the campaign to the Deleted filter. You can restore it from the Campaigns page.
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
