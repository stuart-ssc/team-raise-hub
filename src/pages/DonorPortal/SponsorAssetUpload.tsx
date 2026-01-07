import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Upload,
  File,
  Image as ImageIcon,
  CheckCircle,
  X,
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
}

export default function SponsorAssetUpload() {
  const { orderId, assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [asset, setAsset] = useState<RequiredAsset | null>(null);
  const [existingUpload, setExistingUpload] = useState<ExistingUpload | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!user || !orderId || !assetId) return;

      try {
        // Verify user owns this order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, user_id')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError || !order) {
          toast({ title: "Error", description: "Order not found", variant: "destructive" });
          navigate('/portal/purchases');
          return;
        }

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
          .select('id, file_url, file_name, file_type, uploaded_at')
          .eq('order_id', orderId)
          .eq('required_asset_id', assetId)
          .maybeSingle();

        if (uploadData) {
          setExistingUpload(uploadData);
          if (uploadData.file_type?.startsWith('image/')) {
            setPreviewUrl(uploadData.file_url);
          }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !asset) return;

    // Validate file size
    if (asset.max_file_size_mb && file.size > asset.max_file_size_mb * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${asset.max_file_size_mb}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (asset.file_types && asset.file_types.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowed = asset.file_types.map(t => t.toLowerCase().replace('.', ''));
      if (ext && !allowed.includes(ext)) {
        toast({
          title: "Invalid file type",
          description: `Allowed types: ${asset.file_types.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !orderId || !assetId) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${orderId}/${assetId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('sponsor-assets')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-assets')
        .getPublicUrl(fileName);

      // Upsert the upload record
      const { error: dbError } = await supabase
        .from('order_asset_uploads')
        .upsert({
          order_id: orderId,
          required_asset_id: assetId,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          uploaded_by: user.id,
        }, {
          onConflict: 'order_id,required_asset_id',
        });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Asset uploaded successfully" });
      navigate(`/portal/purchases/${orderId}`);
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast({ title: "Error", description: "Failed to upload asset", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl && !existingUpload) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(existingUpload?.file_type?.startsWith('image/') ? existingUpload.file_url : null);
  };

  const getAcceptedTypes = () => {
    if (!asset?.file_types?.length) return undefined;
    return asset.file_types.map(t => t.startsWith('.') ? t : `.${t}`).join(',');
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

  const isImage = selectedFile?.type.startsWith('image/') || existingUpload?.file_type?.startsWith('image/');

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

            {/* Preview Area */}
            {(previewUrl || selectedFile || existingUpload) && (
              <div className="relative border rounded-lg p-4 bg-muted/50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <File className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {selectedFile?.name || existingUpload?.file_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile 
                          ? `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
                          : 'Uploaded file'
                        }
                      </p>
                    </div>
                  </div>
                )}
                {selectedFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">
                {existingUpload || selectedFile ? 'Replace file' : 'Select file'}
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept={getAcceptedTypes()}
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>

            {/* Status */}
            {existingUpload && !selectedFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Uploaded on {new Date(existingUpload.uploaded_at).toLocaleDateString()}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {existingUpload ? 'Update Asset' : 'Upload Asset'}
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/portal/purchases/${orderId}`}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DonorPortalLayout>
  );
}
