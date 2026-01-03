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
  DollarSign
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price_at_purchase: number;
  size?: string;
}

interface OrderDetails {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  files_complete: boolean;
  customer_name: string;
  customer_email: string;
  business_id: string | null;
  campaign: {
    id: string;
    name: string;
    file_upload_deadline_days: number;
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

export default function DonorPortalPurchaseDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

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
            total_amount,
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

  const getDaysRemaining = () => {
    if (!order) return 0;
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign.file_upload_deadline_days || 30));
    return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

  const daysRemaining = getDaysRemaining();

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
                  <span>${order.total_amount.toFixed(2)}</span>
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
                  <Badge variant={order.status === 'succeeded' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </div>

              {customFields.length > 0 && (
                <div className="flex items-center gap-3">
                  {order.files_complete ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : daysRemaining < 0 ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Files</p>
                    {order.files_complete ? (
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

        {/* File Upload Section */}
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
      </div>
    </DonorPortalLayout>
  );
}
