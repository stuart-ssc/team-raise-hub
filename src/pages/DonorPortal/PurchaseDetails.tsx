import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  ArrowRight,
  Upload,
  FileImage,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface OrderItem {
  name: string;
  quantity: number;
  price_at_purchase: number;
  size?: string;
}

interface OrderDetails {
  id: string;
  created_at: string;
  status: string;
  files_complete: boolean;
  customer_name: string;
  customer_email: string;
  business_id: string | null;
  campaign: {
    id: string;
    name: string;
    file_upload_deadline_days: number;
    asset_upload_deadline: string | null;
    requires_business_info: boolean;
  };
  organization_name: string;
  items: OrderItem[];
}

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  help_text: string | null;
  field_options: any;
}

interface CampaignAssets {
  id: string;
  campaign_logo_url: string | null;
  use_default_logo: boolean;
  additional_files: Array<{ name: string; url: string; type: string }>;
}

interface BusinessInfo {
  id: string;
  business_name: string;
  logo_url: string | null;
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
  uploaded_at: string;
}

export default function DonorPortalPurchaseDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [campaignAssets, setCampaignAssets] = useState<CampaignAssets | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [requiredAssets, setRequiredAssets] = useState<RequiredAsset[]>([]);
  const [assetUploads, setAssetUploads] = useState<AssetUpload[]>([]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) return;

      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            files_complete,
            customer_name,
            customer_email,
            business_id,
            items,
            campaign:campaigns (
              id,
              name,
              file_upload_deadline_days,
              asset_upload_deadline,
              requires_business_info,
              group:groups (
                organization:organizations (
                  name
                )
              )
            )
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError) throw orderError;

        const campaign = orderData.campaign as any;
        setOrder({
          ...orderData,
          campaign: {
            id: campaign.id,
            name: campaign.name,
            file_upload_deadline_days: campaign.file_upload_deadline_days,
            asset_upload_deadline: campaign.asset_upload_deadline,
            requires_business_info: campaign.requires_business_info,
          },
          organization_name: campaign?.group?.organization?.name || 'Unknown Organization',
          items: (orderData.items as unknown as OrderItem[]) || [],
        });

        // Fetch custom fields for the campaign (file fields)
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('campaign_custom_fields')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('field_type', 'file')
          .order('display_order');

        if (fieldsError) throw fieldsError;
        setCustomFields(fieldsData || []);

        // Fetch existing field values
        const { data: valuesData, error: valuesError } = await supabase
          .from('order_custom_field_values')
          .select('*')
          .eq('order_id', orderId);

        if (valuesError) throw valuesError;

        const values: Record<string, any> = {};
        for (const v of valuesData || []) {
          values[(v as any).field_id] = (v as any).field_value;
        }
        setFieldValues(values);

        // Determine whether this order requires sponsor asset uploads
        const orderItems = (orderData.items as unknown as OrderItem[]) || [];
        const lineItemIds = orderItems
          .map((li: any) => li?.campaign_item_id || li?.id)
          .filter((v: any) => typeof v === 'string');

        let sponsorshipItemIds: string[] = [];
        if (lineItemIds.length > 0) {
          const { data: sponsorshipItems } = await supabase
            .from('campaign_items')
            .select('id')
            .in('id', lineItemIds)
            .eq('is_sponsorship_item', true);
          sponsorshipItemIds = (sponsorshipItems || []).map((r: any) => r.id);
        }

        const needsAssets = campaign.requires_business_info || sponsorshipItemIds.length > 0;

        if (needsAssets) {
          // Fetch campaign-wide assets (null campaign_item_id) plus per-item assets for sponsorship items in this order
          let query = supabase
            .from('campaign_required_assets')
            .select('id, asset_name, asset_description, file_types, is_required, dimensions_hint, campaign_item_id')
            .eq('campaign_id', campaign.id)
            .order('display_order');

          if (sponsorshipItemIds.length > 0) {
            query = query.or(
              `campaign_item_id.is.null,campaign_item_id.in.(${sponsorshipItemIds.join(',')})`,
            );
          } else {
            query = query.is('campaign_item_id', null);
          }

          const { data: assetsData } = await query;
          setRequiredAssets(assetsData || []);

          const { data: uploadsData } = await supabase
            .from('order_asset_uploads')
            .select('id, required_asset_id, file_url, file_name, uploaded_at')
            .eq('order_id', orderId);

          setAssetUploads(uploadsData || []);
        }

        // Fetch campaign assets if order is linked to a business
        if (orderData.business_id) {
          const { data: businessData } = await supabase
            .from('businesses')
            .select('id, business_name, logo_url')
            .eq('id', orderData.business_id)
            .single();
          
          setBusinessInfo(businessData);

          const { data: assetsData } = await supabase
            .from('business_campaign_assets')
            .select('id, campaign_logo_url, use_default_logo, additional_files')
            .eq('business_id', orderData.business_id)
            .eq('campaign_id', campaign.id)
            .single();
          
          if (assetsData) {
            setCampaignAssets({
              id: assetsData.id,
              campaign_logo_url: assetsData.campaign_logo_url,
              use_default_logo: assetsData.use_default_logo || false,
              additional_files: Array.isArray(assetsData.additional_files) 
                ? (assetsData.additional_files as Array<{ name: string; url: string; type: string }>)
                : [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [user, orderId, toast]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveFields = async () => {
    if (!orderId) return;

    setSaving(true);
    try {
      // Upsert field values
      for (const [fieldId, value] of Object.entries(fieldValues)) {
        const { error } = await supabase
          .from('order_custom_field_values')
          .upsert({
            order_id: orderId,
            field_id: fieldId,
            field_value: value,
          }, {
            onConflict: 'order_id,field_id',
          });

        if (error) throw error;
      }

      // Check if all required fields are complete
      const allComplete = customFields.every(field => {
        if (!field.is_required) return true;
        const value = fieldValues[field.id];
        return value && (typeof value === 'string' ? value.trim() !== '' : true);
      });

      if (allComplete && customFields.length > 0) {
        // Mark order as files complete
        const { error: updateError } = await supabase
          .from('orders')
          .update({ files_complete: true })
          .eq('id', orderId);

        if (updateError) throw updateError;

        setOrder(prev => prev ? { ...prev, files_complete: true } : null);
      }

      toast({
        title: "Saved",
        description: "Your files have been uploaded successfully",
      });
    } catch (error) {
      console.error('Error saving fields:', error);
      toast({
        title: "Error",
        description: "Failed to save files",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getDeadlineInfo = () => {
    if (!order) return { daysRemaining: 0, deadlineDate: null };
    
    // Use asset_upload_deadline if set, otherwise fall back to legacy calculation
    if (order.campaign.asset_upload_deadline) {
      const deadline = parseISO(order.campaign.asset_upload_deadline);
      const daysRemaining = differenceInDays(deadline, new Date());
      return { daysRemaining, deadlineDate: deadline };
    }
    
    // Legacy: calculate from order date
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign.file_upload_deadline_days || 30));
    const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { daysRemaining, deadlineDate: deadline };
  };

  const getAssetUploadStatus = () => {
    const required = requiredAssets.filter(a => a.is_required);
    const uploadedRequired = required.filter(a => 
      assetUploads.some(u => u.required_asset_id === a.id)
    );
    return {
      total: requiredAssets.length,
      uploaded: assetUploads.length,
      requiredTotal: required.length,
      requiredUploaded: uploadedRequired.length,
      allRequiredComplete: required.length === uploadedRequired.length,
    };
  };

  if (loading) {
    return (
      <DonorPortalLayout title="Purchase Details">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DonorPortalLayout>
    );
  }

  if (!order) {
    return (
      <DonorPortalLayout title="Purchase Details">
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold mb-2">Order not found</h2>
          <Button asChild>
            <Link to="/portal/purchases">Back to Purchases</Link>
          </Button>
        </div>
      </DonorPortalLayout>
    );
  }

  const { daysRemaining, deadlineDate } = getDeadlineInfo();
  const assetStatus = getAssetUploadStatus();

  return (
    <DonorPortalLayout title={`Order #${order.id.slice(0, 8).toUpperCase()}`}>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/portal/purchases">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchases
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Purchased on {new Date(order.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{order.organization_name}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Items</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name}
                      {item.size && ` (${item.size})`}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </span>
                    <span>${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${order.items.reduce((sum: number, item: OrderItem) => sum + (item.price_at_purchase * item.quantity), 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <Badge variant={order.status === 'succeeded' || order.status === 'completed' ? 'default' : 'secondary'}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {(customFields.length > 0 || requiredAssets.length > 0) && (
                <div className="flex items-center gap-3">
                  {order.files_complete || assetStatus.allRequiredComplete ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : daysRemaining < 0 ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Assets</p>
                    {order.files_complete || assetStatus.allRequiredComplete ? (
                      <Badge className="bg-green-500">Complete</Badge>
                    ) : daysRemaining < 0 ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="secondary">{daysRemaining} days left</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Required Sponsor Assets Section */}
        {requiredAssets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    Required Sponsor Assets
                  </CardTitle>
                  <CardDescription>
                    {deadlineDate && (
                      <>
                        Deadline: {format(deadlineDate, 'PPP')}
                        {daysRemaining > 0 && ` (${daysRemaining} days remaining)`}
                        {daysRemaining < 0 && ` (${Math.abs(daysRemaining)} days overdue)`}
                        {daysRemaining === 0 && ' (Due today)'}
                      </>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={assetStatus.allRequiredComplete ? 'default' : 'secondary'}>
                  {assetStatus.uploaded} / {assetStatus.total} uploaded
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requiredAssets.map((asset) => {
                  const upload = assetUploads.find(u => u.required_asset_id === asset.id);
                  const isUploaded = !!upload;
                  
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">
                            {asset.asset_name}
                            {asset.is_required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isUploaded 
                              ? `Uploaded ${format(parseISO(upload.uploaded_at), 'PPP')}`
                              : asset.asset_description || `${asset.file_types?.join(', ') || 'Any file type'}${asset.dimensions_hint ? ` • ${asset.dimensions_hint}` : ''}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isUploaded ? 'outline' : 'default'}
                        size="sm"
                        asChild
                      >
                        <Link to={`/portal/purchases/${orderId}/assets/${asset.id}`}>
                          {isUploaded ? (
                            <>Change</>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legacy File Upload Section */}
        {customFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Required Files</CardTitle>
              <CardDescription>
                {order.files_complete 
                  ? "All files have been uploaded successfully"
                  : `Please upload the following files within ${order.campaign.file_upload_deadline_days || 30} days of your purchase`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomFieldsRenderer
                fields={customFields}
                values={fieldValues}
                onChange={handleFieldChange}
              />

              {!order.files_complete && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveFields} disabled={saving}>
                    {saving ? "Saving..." : "Save Files"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Campaign Assets Section - Only show if order is linked to a business */}
        {order.business_id && businessInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Campaign Branding
              </CardTitle>
              <CardDescription>
                Customize your business logo and branding for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {campaignAssets?.campaign_logo_url && !campaignAssets?.use_default_logo ? (
                    <img
                      src={campaignAssets.campaign_logo_url}
                      alt="Campaign logo"
                      className="h-12 w-12 rounded object-contain bg-muted"
                    />
                  ) : businessInfo.logo_url ? (
                    <img
                      src={businessInfo.logo_url}
                      alt="Business logo"
                      className="h-12 w-12 rounded object-contain bg-muted"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{businessInfo.business_name}</p>
                    {campaignAssets ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Assets configured
                        </Badge>
                        {(campaignAssets.additional_files?.length || 0) > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {campaignAssets.additional_files.length} file(s)
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No campaign-specific assets uploaded
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/portal/purchases/${orderId}/assets`}>
                    {campaignAssets ? "Edit Assets" : "Add Assets"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DonorPortalLayout>
  );
}