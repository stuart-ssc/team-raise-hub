import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { AssetPickerDialog } from "@/components/DonorPortal/AssetPickerDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  File,
  Image as ImageIcon,
  CheckCircle,
  FolderOpen,
  Upload,
  Loader2,
} from "lucide-react";

interface RequiredAsset {
  id: string;
  asset_name: string;
  asset_description: string | null;
  file_types: string[] | null;
  max_file_size_mb: number | null;
  dimensions_hint: string | null;
  is_required: boolean;
}

interface ExistingUpload {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  business_asset_id: string | null;
}

export default function SponsorAssetUpload() {
  const { orderId, assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<RequiredAsset | null>(null);
  const [existingUpload, setExistingUpload] = useState<ExistingUpload | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!user || !orderId || !assetId) return;

      try {
        // Verify user owns this order and get business_id
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, user_id, business_id')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError || !order) {
          toast({ title: "Error", description: "Order not found", variant: "destructive" });
          navigate('/portal/purchases');
          return;
        }

        setBusinessId(order.business_id);

        // Fetch the required asset details
        const { data: assetData, error: assetError } = await supabase
          .from('campaign_required_assets')
          .select('*')
          .eq('id', assetId)
          .single();

        if (assetError || !assetData) {
          toast({ title: "Error", description: "Asset not found", variant: "destructive" });
          navigate(`/portal/purchases/${orderId}`);
          return;
        }

        setAsset(assetData);

        // Check for existing upload
        const { data: uploadData } = await supabase
          .from('order_asset_uploads')
          .select('id, file_url, file_name, file_type, uploaded_at, business_asset_id')
          .eq('order_id', orderId)
          .eq('required_asset_id', assetId)
          .maybeSingle();

        if (uploadData) {
          setExistingUpload(uploadData);
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
        toast({ title: "Error", description: "Failed to load asset details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [user, orderId, assetId, navigate, toast]);

  const handleAssetSelected = async (selectedAsset: {
    file_url: string;
    file_name: string;
    file_type: string;
    business_asset_id?: string;
  }) => {
    if (!user || !orderId || !assetId) return;

    setSaving(true);
    try {
      // Upsert the upload record
      const { error: dbError } = await supabase
        .from('order_asset_uploads')
        .upsert({
          order_id: orderId,
          required_asset_id: assetId,
          file_url: selectedAsset.file_url,
          file_name: selectedAsset.file_name,
          file_type: selectedAsset.file_type,
          uploaded_by: user.id,
          business_asset_id: selectedAsset.business_asset_id || null,
        }, {
          onConflict: 'order_id,required_asset_id',
        });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Asset uploaded successfully" });
      navigate(`/portal/purchases/${orderId}`);
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({ title: "Error", description: "Failed to save asset", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DonorPortalLayout title="Upload Asset">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DonorPortalLayout>
    );
  }

  if (!asset) {
    return (
      <DonorPortalLayout title="Upload Asset">
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold mb-2">Asset not found</h2>
          <Button asChild>
            <Link to={`/portal/purchases/${orderId}`}>Back to Order</Link>
          </Button>
        </div>
      </DonorPortalLayout>
    );
  }

  const isImage = existingUpload?.file_type?.startsWith('image/');

  return (
    <DonorPortalLayout title={`Upload ${asset.asset_name}`}>
      <div className="space-y-6 max-w-2xl">
        <Button variant="ghost" asChild>
          <Link to={`/portal/purchases/${orderId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <File className="h-5 w-5" />}
              {asset.asset_name}
            </CardTitle>
            {asset.asset_description && (
              <CardDescription>{asset.asset_description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Requirements */}
            <div className="flex flex-wrap gap-2">
              {asset.is_required && (
                <Badge variant="destructive">Required</Badge>
              )}
              {asset.file_types?.length ? (
                <Badge variant="outline">
                  {asset.file_types.join(', ')}
                </Badge>
              ) : null}
              {asset.max_file_size_mb && (
                <Badge variant="outline">Max {asset.max_file_size_mb}MB</Badge>
              )}
              {asset.dimensions_hint && (
                <Badge variant="outline">{asset.dimensions_hint}</Badge>
              )}
            </div>

            {/* Existing Upload Preview */}
            {existingUpload && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                  <CheckCircle className="h-4 w-4" />
                  Current upload
                  {existingUpload.business_asset_id && (
                    <Badge variant="secondary" className="ml-2">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      From Library
                    </Badge>
                  )}
                </div>
                {isImage ? (
                  <img
                    src={existingUpload.file_url}
                    alt="Current upload"
                    className="max-h-48 mx-auto rounded object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <File className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{existingUpload.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(existingUpload.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            {businessId ? (
              <Button 
                onClick={() => setPickerOpen(true)} 
                className="w-full"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {existingUpload ? 'Replace Asset' : 'Select Asset'}
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                No business linked to this order. Please contact support.
              </div>
            )}

            {/* Info about asset library */}
            {businessId && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>
                  <strong>Tip:</strong> Assets you upload are saved to your business library 
                  and can be reused across future sponsorships.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Asset Picker Dialog */}
      {businessId && (
        <AssetPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          businessId={businessId}
          assetName={asset.asset_name}
          acceptedTypes={asset.file_types || undefined}
          maxSizeMb={asset.max_file_size_mb || undefined}
          onSelect={handleAssetSelected}
        />
      )}
    </DonorPortalLayout>
  );
}
