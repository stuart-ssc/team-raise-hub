import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  Check,
  Trash2,
  Download,
  Building2,
} from "lucide-react";

interface OrderDetails {
  id: string;
  campaign_id: string;
  business_id: string | null;
  customer_name: string;
  created_at: string;
}

interface CampaignDetails {
  id: string;
  name: string;
  image_url: string | null;
}

interface BusinessDetails {
  id: string;
  business_name: string;
  logo_url: string | null;
}

interface CampaignAsset {
  id: string;
  campaign_logo_url: string | null;
  additional_files: Array<{ name: string; url: string; type: string }>;
  notes: string | null;
  use_default_logo: boolean;
}

export default function DonorPortalCampaignAssets() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [assets, setAssets] = useState<CampaignAsset | null>(null);
  
  // Form state
  const [useDefaultLogo, setUseDefaultLogo] = useState(false);
  const [campaignLogoUrl, setCampaignLogoUrl] = useState<string | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [notes, setNotes] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (orderId && user) {
      fetchData();
    }
  }, [orderId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, campaign_id, business_id, customer_name, created_at")
        .eq("id", orderId)
        .eq("user_id", user?.id)
        .single();

      if (orderError) throw orderError;
      if (!orderData.business_id) {
        toast.error("This order is not linked to a business");
        navigate(`/portal/purchases/${orderId}`);
        return;
      }

      setOrder(orderData);

      // Fetch campaign
      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("id, name, image_url")
        .eq("id", orderData.campaign_id)
        .single();

      setCampaign(campaignData);

      // Fetch business
      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, business_name, logo_url")
        .eq("id", orderData.business_id)
        .single();

      setBusiness(businessData);

      // Fetch existing campaign assets
      const { data: assetsData } = await supabase
        .from("business_campaign_assets")
        .select("*")
        .eq("business_id", orderData.business_id)
        .eq("campaign_id", orderData.campaign_id)
        .single();

      if (assetsData) {
        const additionalFilesArray = Array.isArray(assetsData.additional_files) 
          ? (assetsData.additional_files as Array<{ name: string; url: string; type: string }>)
          : [];
        
        setAssets({
          id: assetsData.id,
          campaign_logo_url: assetsData.campaign_logo_url,
          additional_files: additionalFilesArray,
          notes: assetsData.notes,
          use_default_logo: assetsData.use_default_logo || false,
        });
        setUseDefaultLogo(assetsData.use_default_logo || false);
        setCampaignLogoUrl(assetsData.campaign_logo_url);
        setAdditionalFiles(additionalFilesArray);
        setNotes(assetsData.notes || "");
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load campaign assets");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business || !campaign) return;

    try {
      setUploadingLogo(true);

      const fileExt = file.name.split(".").pop();
      const filePath = `${business.id}/${campaign.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("business-campaign-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("business-campaign-assets")
        .getPublicUrl(filePath);

      setCampaignLogoUrl(urlData.publicUrl);
      setUseDefaultLogo(false);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business || !campaign) return;

    try {
      setUploadingFile(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${business.id}/${campaign.id}/files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-campaign-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("business-campaign-assets")
        .getPublicUrl(filePath);

      setAdditionalFiles([
        ...additionalFiles,
        {
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
        },
      ]);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFile = (index: number) => {
    setAdditionalFiles(additionalFiles.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!business || !campaign || !order) return;

    try {
      setSaving(true);

      // Get organization_id from the business_donors table
      const { data: businessDonor } = await supabase
        .from("business_donors")
        .select("organization_id")
        .eq("business_id", business.id)
        .limit(1)
        .single();
      
      if (!businessDonor) {
        toast.error("Could not find organization for this business");
        return;
      }

      const assetData = {
        business_id: business.id,
        campaign_id: campaign.id,
        organization_id: businessDonor.organization_id,
        campaign_logo_url: useDefaultLogo ? null : campaignLogoUrl,
        additional_files: additionalFiles,
        notes: notes || null,
        use_default_logo: useDefaultLogo,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (assets?.id) {
        // Update existing
        const { error } = await supabase
          .from("business_campaign_assets")
          .update(assetData)
          .eq("id", assets.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("business_campaign_assets")
          .insert(assetData);

        if (error) throw error;
      }

      toast.success("Campaign assets saved successfully");
      navigate(`/portal/purchases/${orderId}`);
    } catch (error: any) {
      console.error("Error saving assets:", error);
      toast.error("Failed to save campaign assets");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DonorPortalLayout title="Campaign Assets">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DonorPortalLayout>
    );
  }

  if (!order || !campaign || !business) {
    return (
      <DonorPortalLayout title="Campaign Assets">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Order or campaign not found.</p>
            <Button variant="ghost" className="mt-4" asChild>
              <Link to="/portal/purchases">Back to Purchases</Link>
            </Button>
          </CardContent>
        </Card>
      </DonorPortalLayout>
    );
  }

  const effectiveLogo = useDefaultLogo ? business.logo_url : (campaignLogoUrl || business.logo_url);

  return (
    <DonorPortalLayout
      title="Campaign Assets"
      subtitle={`Customize branding for ${campaign.name}`}
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/portal/purchases/${orderId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase
          </Link>
        </Button>

        {/* Campaign Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {campaign.image_url ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle>{campaign.name}</CardTitle>
                <CardDescription>
                  Sponsoring as{" "}
                  <span className="font-medium text-foreground">{business.business_name}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Campaign Logo
            </CardTitle>
            <CardDescription>
              Choose which logo to display for this campaign. You can use your default business logo or upload a campaign-specific one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Logo Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt="Default logo"
                    className="h-12 w-12 rounded object-contain bg-muted"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">Use Default Business Logo</p>
                  <p className="text-sm text-muted-foreground">
                    Use your standard business logo for this campaign
                  </p>
                </div>
              </div>
              <Switch
                checked={useDefaultLogo}
                onCheckedChange={(checked) => {
                  setUseDefaultLogo(checked);
                  if (checked) setCampaignLogoUrl(null);
                }}
              />
            </div>

            {/* Campaign-specific Logo */}
            {!useDefaultLogo && (
              <div className="space-y-4">
                <Label>Campaign-Specific Logo</Label>
                <div className="flex items-center gap-4">
                  {campaignLogoUrl ? (
                    <div className="relative">
                      <img
                        src={campaignLogoUrl}
                        alt="Campaign logo"
                        className="h-20 w-20 rounded-lg object-contain bg-muted"
                      />
                      <Badge className="absolute -top-2 -right-2" variant="secondary">
                        <Check className="h-3 w-3" />
                      </Badge>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or SVG. Recommended: 400x400px
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Logo Preview</p>
              <div className="flex items-center gap-3">
                {effectiveLogo ? (
                  <img
                    src={effectiveLogo}
                    alt="Preview"
                    className="h-16 w-auto max-w-32 object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{business.business_name}</p>
                  <p className="text-sm text-muted-foreground">Campaign Sponsor</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Files
            </CardTitle>
            <CardDescription>
              Upload additional branding assets like vector logos, brand guidelines, or high-resolution images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {additionalFiles.length > 0 && (
              <div className="space-y-2">
                {additionalFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="max-w-xs"
              />
              {uploadingFile && <span className="text-sm text-muted-foreground">Uploading...</span>}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes for the Organization</CardTitle>
            <CardDescription>
              Add any special instructions or notes about your branding for this campaign.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="E.g., Please use the horizontal version of our logo for banners..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to={`/portal/purchases/${orderId}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Campaign Assets"}
          </Button>
        </div>
      </div>
    </DonorPortalLayout>
  );
}
