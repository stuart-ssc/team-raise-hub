import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import MessageButton from "@/components/messaging/MessageButton";
import { PaymentReceivedCard } from "@/components/PaymentReceivedCard";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  Download,
  Image,
  File,
  Send,
  FileImage,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";

interface OrderItem {
  campaign_item_id: string;
  price_at_purchase: number;
  quantity: number;
}

interface RequiredAsset {
  id: string;
  asset_name: string;
  asset_description: string | null;
  file_types: string[] | null;
  is_required: boolean;
  dimensions_hint: string | null;
}

interface AssetUpload {
  id: string;
  required_asset_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

const CampaignOrderDetail = () => {
  const { campaignId, orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sendingReminder, setSendingReminder] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploadingAssetId, setUploadingAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedAssetRef = useRef<string | null>(null);

  // Fetch order details
  const { data: order, isLoading: orderLoading, error: orderError, refetch: refetchOrder } = useQuery({
    queryKey: ["campaign-order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          customer_name,
          customer_email,
          customer_phone,
          items,
          items_total,
          status,
          files_complete,
          user_id,
          manual_entry,
          payment_received,
          payment_received_at,
          payment_received_by,
          offline_payment_type,
          payment_notes,
          campaign:campaigns (
            id,
            name,
            file_upload_deadline_days,
            asset_upload_deadline,
            requires_business_info,
            group:groups (
              group_name,
              organization_id
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch campaign items for name lookup
  const { data: campaignItems } = useQuery({
    queryKey: ["campaign-items-lookup", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_items")
        .select("id, name, cost")
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  // Fetch file custom fields (legacy)
  const { data: fileFields } = useQuery({
    queryKey: ["order-file-fields", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_custom_fields")
        .select("id, field_name, field_type, is_required")
        .eq("campaign_id", campaignId)
        .eq("field_type", "file")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  // Fetch uploaded files (legacy)
  const { data: uploadedFiles } = useQuery({
    queryKey: ["order-uploaded-files", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_custom_field_values")
        .select(`
          id,
          field_value,
          custom_field:campaign_custom_fields (
            id,
            field_name,
            field_type
          )
        `)
        .eq("order_id", orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch required sponsor assets
  const { data: requiredAssets } = useQuery({
    queryKey: ["order-required-assets", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_required_assets")
        .select("id, asset_name, asset_description, file_types, is_required, dimensions_hint")
        .eq("campaign_id", campaignId)
        .order("display_order");
      if (error) throw error;
      return data as RequiredAsset[];
    },
    enabled: !!campaignId && order?.campaign?.requires_business_info,
  });

  // Fetch uploaded sponsor assets
  const { data: assetUploads, refetch: refetchAssets } = useQuery({
    queryKey: ["order-asset-uploads", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_asset_uploads")
        .select("id, required_asset_id, file_url, file_name, file_type, uploaded_at")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as AssetUpload[];
    },
    enabled: !!orderId && order?.campaign?.requires_business_info,
  });

  // Fetch donor profile for messaging
  const { data: donorProfile } = useQuery({
    queryKey: ["order-donor-profile", order?.customer_email, order?.campaign?.group?.organization_id],
    queryFn: async () => {
      if (!order?.customer_email || !order?.campaign?.group?.organization_id) return null;
      const { data, error } = await supabase
        .from("donor_profiles")
        .select("id, user_id")
        .eq("email", order.customer_email)
        .eq("organization_id", order.campaign.group.organization_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!order?.customer_email && !!order?.campaign?.group?.organization_id,
  });

  const itemsLookup = useMemo(() => {
    const lookup: Record<string, { name: string; cost: number }> = {};
    campaignItems?.forEach((item) => {
      lookup[item.id] = { name: item.name, cost: item.cost || 0 };
    });
    return lookup;
  }, [campaignItems]);

  const parsedItems = useMemo(() => {
    if (!order?.items) return [];
    try {
      const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      return (items as OrderItem[]).map((item) => ({
        ...item,
        name: itemsLookup[item.campaign_item_id]?.name || "Unknown Item",
      }));
    } catch {
      return [];
    }
  }, [order?.items, itemsLookup]);

  const fileUploadedCount = useMemo(() => {
    if (!uploadedFiles || !fileFields) return { uploaded: 0, total: 0 };
    const uploaded = uploadedFiles.filter(
      (uf) => uf.custom_field?.field_type === "file" && uf.field_value
    ).length;
    return { uploaded, total: fileFields.length };
  }, [uploadedFiles, fileFields]);

  const assetUploadStatus = useMemo(() => {
    if (!requiredAssets) return { uploaded: 0, total: 0, requiredComplete: true };
    const uploaded = assetUploads?.length || 0;
    const required = requiredAssets.filter(a => a.is_required);
    const requiredUploaded = required.filter(a => 
      assetUploads?.some(u => u.required_asset_id === a.id)
    );
    return {
      uploaded,
      total: requiredAssets.length,
      requiredComplete: required.length === requiredUploaded.length,
    };
  }, [requiredAssets, assetUploads]);

  const getDeadlineInfo = () => {
    if (!order) return { daysRemaining: 0, deadlineDate: null };
    
    // Use asset_upload_deadline if set
    if (order.campaign?.asset_upload_deadline) {
      const deadline = parseISO(order.campaign.asset_upload_deadline);
      const daysRemaining = differenceInDays(deadline, new Date());
      return { daysRemaining, deadlineDate: deadline };
    }
    
    // Legacy: calculate from order date
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign?.file_upload_deadline_days || 30));
    const today = new Date();
    return { 
      daysRemaining: Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      deadlineDate: deadline,
    };
  };

  const handleSendReminder = async () => {
    if (!order) return;
    setSendingReminder(true);
    try {
      const { error } = await supabase.functions.invoke("send-file-upload-reminder", {
        body: { orderId: order.id },
      });
      if (error) throw error;
      toast({
        title: "Reminder Sent",
        description: `File upload reminder sent to ${order.customer_email}`,
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(false);
    }
  };

  const handleToggleFilesComplete = async (checked: boolean) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ files_complete: checked })
        .eq("id", order.id);
      
      if (error) throw error;
      
      refetchOrder();
      toast({
        title: checked ? "Marked Complete" : "Marked Incomplete",
        description: `Order files status updated`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAdminUpload = async (file: File, assetId: string, asset: RequiredAsset) => {
    if (!orderId || !order?.campaign?.group?.organization_id) return;
    
    // Validate file type if asset has restrictions
    if (asset.file_types && asset.file_types.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = asset.file_types.map(t => t.replace('.', '').toLowerCase());
      if (fileExtension && !allowedExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid File Type",
          description: `Allowed types: ${asset.file_types.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploadingAssetId(assetId);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${order.campaign.group.organization_id}/${orderId}/${assetId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sponsor-assets')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-assets')
        .getPublicUrl(filePath);

      // Check if there's an existing upload to replace
      const existingUpload = assetUploads?.find(u => u.required_asset_id === assetId);
      
      if (existingUpload) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('order_asset_uploads')
          .update({
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            uploaded_at: new Date().toISOString(),
          })
          .eq('id', existingUpload.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('order_asset_uploads')
          .insert({
            order_id: orderId,
            required_asset_id: assetId,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
          });
        
        if (insertError) throw insertError;
      }

      await refetchAssets();
      toast({
        title: "Asset Uploaded",
        description: `${asset.asset_name} has been uploaded successfully.`,
      });

      // Check if all required assets are now complete
      const updatedUploads = await supabase
        .from('order_asset_uploads')
        .select('required_asset_id')
        .eq('order_id', orderId);
      
      const uploadedAssetIds = new Set(updatedUploads.data?.map(u => u.required_asset_id) || []);
      const allRequiredComplete = requiredAssets
        ?.filter(a => a.is_required)
        .every(a => uploadedAssetIds.has(a.id));
      
      if (allRequiredComplete && !order.files_complete) {
        await supabase
          .from('orders')
          .update({ files_complete: true })
          .eq('id', orderId);
        refetchOrder();
      }
    } catch (error) {
      console.error("Error uploading asset:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload the asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAssetId(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const assetId = selectedAssetRef.current;
    if (!file || !assetId) return;
    
    const asset = requiredAssets?.find(a => a.id === assetId);
    if (!asset) return;
    
    handleAdminUpload(file, assetId, asset);
    e.target.value = ''; // Reset input
  };

  const triggerFileUpload = (assetId: string) => {
    selectedAssetRef.current = assetId;
    fileInputRef.current?.click();
  };

  const { daysRemaining, deadlineDate } = getDeadlineInfo();
  const isUrgent = daysRemaining <= 3 && daysRemaining > 0;
  const isPastDue = daysRemaining < 0;

  if (orderLoading) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "Fundraisers", path: "/dashboard/fundraisers" },
          { label: "Loading..." },
        ]}
      >
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  if (orderError || !order) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "Fundraisers", path: "/dashboard/fundraisers" },
          { label: "Order Not Found" },
        ]}
      >
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate(`/dashboard/fundraisers/${campaignId}/edit`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fundraiser
            </Button>
          </CardContent>
        </Card>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Fundraisers", path: "/dashboard/fundraisers" },
        { label: order.campaign?.name || "Fundraiser", path: `/dashboard/fundraisers/${campaignId}/edit` },
        { label: `Order #${order.id.slice(0, 8).toUpperCase()}` },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Hidden file input for admin uploads */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <MessageButton
              userId={donorProfile?.user_id || undefined}
              donorId={donorProfile?.id}
              contextType="order"
              contextId={order.id}
              contextLabel={`Order #${order.id.slice(0, 8).toUpperCase()}`}
            />
          </div>
        </div>

        {/* Customer & Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${order.customer_email}`} className="hover:underline">
                  {order.customer_email}
                </a>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${order.customer_phone}`} className="hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items Purchased</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                    </span>
                    <span className="font-medium">
                      ${(item.price_at_purchase * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${(order.items_total || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <Badge variant={order.status === 'succeeded' || order.status === 'completed' ? 'default' : 'secondary'}>
                  {(order.status === 'succeeded' || order.status === 'completed') && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <Label htmlFor="files-complete" className="text-sm text-muted-foreground">
                  Assets Complete:
                </Label>
                <Switch
                  id="files-complete"
                  checked={order.files_complete || false}
                  onCheckedChange={handleToggleFilesComplete}
                  disabled={updatingStatus}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Received Card for Manual Orders */}
        <PaymentReceivedCard
          orderId={order.id}
          manualEntry={order.manual_entry || false}
          paymentReceived={order.payment_received || false}
          paymentReceivedAt={order.payment_received_at}
          paymentReceivedBy={order.payment_received_by}
          offlinePaymentType={order.offline_payment_type}
          paymentNotes={order.payment_notes}
          onUpdate={() => refetchOrder()}
        />

        {/* Required Sponsor Assets */}
        {requiredAssets && requiredAssets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileImage className="h-5 w-5" />
                    Required Sponsor Assets
                  </CardTitle>
                  <CardDescription>
                    {deadlineDate && `Deadline: ${format(deadlineDate, 'PPP')}`}
                    {daysRemaining > 0 && ` (${daysRemaining} days remaining)`}
                    {isPastDue && ` (${Math.abs(daysRemaining)} days overdue)`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={assetUploadStatus.requiredComplete ? 'default' : isPastDue ? 'destructive' : 'secondary'}>
                    {assetUploadStatus.uploaded} / {assetUploadStatus.total} uploaded
                  </Badge>
                  {!assetUploadStatus.requiredComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendReminder}
                      disabled={sendingReminder}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendingReminder ? "Sending..." : "Send Reminder"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requiredAssets.map((asset) => {
                  const upload = assetUploads?.find(u => u.required_asset_id === asset.id);
                  const isUploaded = !!upload;
                  const isImage = upload?.file_type?.startsWith('image/');

                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">
                            {asset.asset_name}
                            {asset.is_required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {isUploaded 
                              ? `${upload.file_name} • Uploaded ${format(parseISO(upload.uploaded_at), 'PPP')}`
                              : `Pending${asset.file_types?.length ? ` • ${asset.file_types.join(', ')}` : ''}`
                            }
                          </p>
                        </div>
                      </div>
                      {isUploaded ? (
                        <div className="flex items-center gap-2">
                          {isImage && (
                            <a
                              href={upload.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={upload.file_url}
                                alt={asset.asset_name}
                                className="h-10 w-10 rounded object-cover border"
                              />
                            </a>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a href={upload.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerFileUpload(asset.id)}
                            disabled={uploadingAssetId === asset.id}
                          >
                            {uploadingAssetId === asset.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-1" />
                                Replace
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileUpload(asset.id)}
                          disabled={uploadingAssetId === asset.id}
                        >
                          {uploadingAssetId === asset.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legacy File Upload Status */}
        {fileFields && fileFields.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle className="text-base">File Upload Status</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {order.files_complete ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant={isPastDue ? "destructive" : isUrgent ? "default" : "secondary"}>
                      <Clock className="h-3 w-3 mr-1" />
                      {fileUploadedCount.uploaded} of {fileUploadedCount.total} uploaded
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {order.files_complete ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-200">
                    All Files Uploaded
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    The customer has submitted all required files.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant={isPastDue ? "destructive" : undefined}>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>
                    {isPastDue
                      ? "Deadline Passed"
                      : isUrgent
                      ? "Deadline Approaching"
                      : "Files Pending"}
                  </AlertTitle>
                  <AlertDescription>
                    {deadlineDate && (
                      isPastDue
                        ? `Deadline was ${format(deadlineDate, 'PPP')}. Consider sending a reminder.`
                        : `Due by ${format(deadlineDate, 'PPP')} (${daysRemaining} day${
                            daysRemaining !== 1 ? "s" : ""
                          } remaining)`
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Uploaded Assets (Legacy) */}
        {uploadedFiles && uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uploaded Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles
                  .filter((uf) => uf.custom_field?.field_type === "file" && uf.field_value)
                  .map((file) => {
                    const isImage = file.field_value?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <div
                        key={file.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {isImage ? (
                            <Image className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {file.custom_field?.field_name}
                          </span>
                        </div>
                        {isImage && (
                          <div className="aspect-video bg-muted rounded overflow-hidden">
                            <img
                              src={file.field_value}
                              alt={file.custom_field?.field_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a
                            href={file.field_value}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    );
                  })}
              </div>
              {uploadedFiles.filter(
                (uf) => uf.custom_field?.field_type === "file" && uf.field_value
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No files uploaded yet
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Files (Legacy) */}
        {fileFields && fileFields.length > 0 && !order.files_complete && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expected Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fileFields.map((field) => {
                  const uploaded = uploadedFiles?.find(
                    (uf) => uf.custom_field?.id === field.id && uf.field_value
                  );
                  return (
                    <div
                      key={field.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm">
                        {field.field_name}
                        {field.is_required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </span>
                      {uploaded ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/fundraisers/${campaignId}/edit`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Button>
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default CampaignOrderDetail;
