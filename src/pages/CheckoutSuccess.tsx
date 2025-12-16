import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Upload, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SponsorshipFileUploader } from "@/components/SponsorshipFileUploader";
import SponsorlyLogo from "@/components/SponsorlyLogo";
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

// Stored format in database
interface StoredOrderItem {
  campaign_item_id: string;
  price_at_purchase: number;
  quantity: number;
}

// Display format for UI
interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderDetails {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  files_complete: boolean;
  items: OrderItem[];
  campaign: {
    id: string;
    name: string;
    slug: string;
    requires_business_info: boolean;
    file_upload_deadline_days: number;
    thank_you_message: string | null;
    group: {
      group_name: string;
      organization: {
        name: string;
      };
    };
  };
  fileFields: Array<{
    id: string;
    field_name: string;
    field_type: string;
    is_required: boolean;
    help_text: string;
  }>;
}

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [showUploadLaterDialog, setShowUploadLaterDialog] = useState(false);
  const [filesCompleted, setFilesCompleted] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch order with campaign and file field requirements
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            customer_name,
            customer_email,
            total_amount,
            files_complete,
            items,
            campaign:campaigns (
              id,
              name,
              slug,
              requires_business_info,
              file_upload_deadline_days,
              thank_you_message,
              group:groups (
                group_name,
                organization:organizations (
                  name
                )
              )
            )
          `)
          .eq('processor_session_id', sessionId)
          .single();

        if (orderError) throw orderError;

        if (orderData) {
          // Fetch file type custom fields for this campaign
          const { data: fieldsData, error: fieldsError } = await supabase
            .from('campaign_custom_fields')
            .select('id, field_name, field_type, is_required, help_text')
            .eq('campaign_id', orderData.campaign.id)
            .eq('field_type', 'file')
            .order('display_order');

          if (fieldsError) throw fieldsError;

          // Parse items from JSON (stored format)
          const storedItems = Array.isArray(orderData.items) 
            ? (orderData.items as unknown as StoredOrderItem[])
            : [];

          // Fetch item names from campaign_items table
          let enrichedItems: OrderItem[] = [];
          if (storedItems.length > 0) {
            const itemIds = storedItems.map(item => item.campaign_item_id).filter(Boolean);
            
            if (itemIds.length > 0) {
              const { data: campaignItemsData } = await supabase
                .from('campaign_items')
                .select('id, name')
                .in('id', itemIds);

              enrichedItems = storedItems.map(item => {
                const itemDetails = campaignItemsData?.find(i => i.id === item.campaign_item_id);
                return {
                  name: itemDetails?.name || 'Item',
                  quantity: item.quantity || 1,
                  unitPrice: item.price_at_purchase || 0,
                  totalPrice: (item.price_at_purchase || 0) * (item.quantity || 1)
                };
              });
            }
          }

          setOrder({
            ...orderData,
            items: enrichedItems,
            fileFields: fieldsData || []
          });
          setFilesCompleted(orderData.files_complete || false);
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
  }, [sessionId, toast]);

  const handleFilesComplete = () => {
    setFilesCompleted(true);
    toast({
      title: "All files uploaded!",
      description: "Your sponsorship files have been submitted successfully.",
    });
  };

  const handleUploadLater = () => {
    setShowUploadLaterDialog(false);
    toast({
      title: "Reminder set",
      description: "We'll send you email reminders about your file upload deadline.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasFileRequirements = order && order.fileFields.length > 0;
  const needsFileUpload = hasFileRequirements && !filesCompleted;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl space-y-6">
        {/* Sponsorly Logo */}
        <div className="flex justify-center">
          <SponsorlyLogo theme="light" className="h-16" />
        </div>

        {/* Success Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            <p className="text-muted-foreground">
              {order ? (
                <>Thank you{order.customer_name ? `, ${order.customer_name}` : ''}! Your donation to <span className="font-semibold">{order.campaign.group?.organization?.name} {order.campaign.group?.group_name}</span> has been confirmed.</>
              ) : (
                <>Thank you for your donation. Your payment has been processed successfully.</>
              )}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Custom Thank You Message */}
            {order?.campaign.thank_you_message && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-center italic">
                  "{order.campaign.thank_you_message}"
                </p>
              </div>
            )}

            {/* Order Summary */}
            {order && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Order Total:</span>
                  <span className="text-lg font-bold">${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Campaign:</span>
                  <span>{order.campaign.name}</span>
                </div>
                
                {/* Items Purchased */}
                {order.items && order.items.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} × {item.quantity}
                          </span>
                          <span>${item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success Checklist */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Order Status:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Payment processed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Order confirmed</span>
                </div>
                {hasFileRequirements && (
                  <div className="flex items-center gap-2 text-sm">
                    {filesCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Files uploaded</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Files pending upload</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            {!needsFileUpload && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You will receive an email confirmation shortly</li>
                  <li>• Your items will be processed and delivered as specified</li>
                  <li>• Contact support if you have any questions</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload Section */}
        {needsFileUpload && order && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <CardTitle>Upload Sponsorship Files</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                This campaign requires file submissions. Please upload the required files below.
              </p>
            </CardHeader>
            <CardContent>
              <SponsorshipFileUploader
                orderId={order.id}
                campaignId={order.campaign.id}
                fileFields={order.fileFields}
                deadlineDays={order.campaign.file_upload_deadline_days || 30}
                orderCreatedAt={order.created_at}
                onComplete={handleFilesComplete}
              />

              <div className="mt-6 pt-6 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowUploadLaterDialog(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  I'll Upload Files Later
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files Completed Success */}
        {filesCompleted && hasFileRequirements && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              All required files have been uploaded successfully! You're all set.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {user && (
                <Button variant="outline" asChild className="w-full">
                  <Link to="/dashboard/orders">
                    View My Orders
                  </Link>
                </Button>
              )}
              
              {order && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/c/${order.campaign.slug || order.campaign.id}`}>
                    View Campaign Details
                  </Link>
                </Button>
              )}
              
              <Button asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Later Confirmation Dialog */}
      <AlertDialog open={showUploadLaterDialog} onOpenChange={setShowUploadLaterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Files Later?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You can upload your sponsorship files at any time before the deadline.
              </p>
              {order && (
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Deadline:</span>
                    <span>
                      {new Date(new Date(order.created_at).getTime() + (order.campaign.file_upload_deadline_days || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    We'll send you reminder emails with a link to upload your files.
                  </div>
                </div>
              )}
              <p className="text-sm">
                You can also return to this page anytime using the link in your confirmation email or by visiting "My Orders" in your dashboard.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadLater}>
              Confirm - I'll Upload Later
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CheckoutSuccess;