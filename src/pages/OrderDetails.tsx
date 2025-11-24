import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, FileText, AlertCircle, Home, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SponsorshipFileUploader } from "@/components/SponsorshipFileUploader";
import DashboardPageLayout from "@/components/DashboardPageLayout";

interface OrderDetails {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  files_complete: boolean;
  user_id: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  campaign: {
    id: string;
    name: string;
    description: string;
    file_upload_deadline_days: number;
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

const OrderDetails = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [filesCompleted, setFilesCompleted] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch order with campaign info
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            customer_name,
            customer_email,
            total_amount,
            status,
            files_complete,
            user_id,
            access_token,
            token_expires_at,
            campaign:campaigns (
              id,
              name,
              description,
              file_upload_deadline_days,
              group:groups (
                group_name,
                organization:organizations (
                  name
                )
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        if (!orderData) {
          setUnauthorized(true);
          return;
        }

        // Check authorization
        if (token) {
          // Public access with token - validate against database
          if (orderData.access_token !== token) {
            console.error("Invalid access token");
            setUnauthorized(true);
            return;
          }
          
          // Check if token is expired
          if (orderData.token_expires_at && new Date(orderData.token_expires_at) < new Date()) {
            toast({
              title: "Link Expired",
              description: "This access link has expired. Please log in to continue.",
              variant: "destructive",
            });
            setUnauthorized(true);
            return;
          }
          
          console.log("Public access with valid token");
        } else if (!user || orderData.user_id !== user.id) {
          // No token and not logged in as owner
          setUnauthorized(true);
          return;
        }

        // Fetch file type custom fields for this campaign
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('campaign_custom_fields')
          .select('id, field_name, field_type, is_required, help_text')
          .eq('campaign_id', orderData.campaign.id)
          .eq('field_type', 'file')
          .order('display_order');

        if (fieldsError) throw fieldsError;

        setOrder({
          ...orderData,
          fileFields: fieldsData || []
        });
        setFilesCompleted(orderData.files_complete || false);
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
  }, [orderId, token, user, toast]);

  const handleFilesComplete = () => {
    setFilesCompleted(true);
    toast({
      title: "All files uploaded!",
      description: "Your sponsorship files have been submitted successfully.",
    });
  };

  const getDaysRemaining = () => {
    if (!order) return 0;
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign.file_upload_deadline_days || 30));
    const today = new Date();
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDeadlineDate = () => {
    if (!order) return '';
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign.file_upload_deadline_days || 30));
    return deadline.toLocaleDateString();
  };

  if (unauthorized) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
  return (
    <DashboardPageLayout segments={[{ label: 'Orders', path: '/dashboard/orders' }, { label: 'Order Details' }]}>
        <div className="space-y-6">
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

  if (!order) {
    return (
      <DashboardPageLayout segments={[{ label: 'Orders', path: '/dashboard/orders' }, { label: 'Order Not Found' }]}>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardPageLayout>
    );
  }

  const hasFileRequirements = order.fileFields.length > 0;
  const needsFileUpload = hasFileRequirements && !filesCompleted;
  const daysRemaining = getDaysRemaining();
  const isUrgent = daysRemaining <= 3 && daysRemaining > 0;
  const isPastDue = daysRemaining < 0;

  return (
    <DashboardPageLayout segments={[{ label: 'Orders', path: '/dashboard/orders' }, { label: 'Order Details' }]}>
      <div className="space-y-6 max-w-4xl">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer</h4>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Amount</h4>
                <p className="text-2xl font-bold">${(order.total_amount / 100).toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Campaign</h4>
              <p className="font-medium">{order.campaign.name}</p>
              <p className="text-sm text-muted-foreground">{order.campaign.group.group_name}</p>
              <p className="text-xs text-muted-foreground">{order.campaign.group.organization.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Status */}
        {hasFileRequirements && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>File Upload Status</CardTitle>
                </div>
                {filesCompleted ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant={isPastDue ? 'destructive' : isUrgent ? 'default' : 'secondary'}>
                    <Clock className="h-3 w-3 mr-1" />
                    {isPastDue ? 'Past Due' : 'Pending'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filesCompleted ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-200">All Files Uploaded</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Thank you! All required files have been submitted successfully.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {isPastDue ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Deadline Passed</AlertTitle>
                      <AlertDescription>
                        The upload deadline was {getDeadlineDate()}. Please upload your files as soon as possible.
                      </AlertDescription>
                    </Alert>
                  ) : isUrgent ? (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertTitle>Deadline Approaching</AlertTitle>
                      <AlertDescription>
                        Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining until {getDeadlineDate()}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertTitle>Files Required</AlertTitle>
                      <AlertDescription>
                        Please upload your files by {getDeadlineDate()} ({daysRemaining} days remaining)
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* File Uploader */}
        {needsFileUpload && (
          <Card>
            <CardContent className="pt-6">
              <SponsorshipFileUploader
                orderId={order.id}
                campaignId={order.campaign.id}
                fileFields={order.fileFields}
                deadlineDays={order.campaign.file_upload_deadline_days || 30}
                orderCreatedAt={order.created_at}
                onComplete={handleFilesComplete}
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/c/${order.campaign.id}`}>
                  View Campaign
                </Link>
              </Button>
              {user && (
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/dashboard/orders">
                    View All Orders
                  </Link>
                </Button>
              )}
              <Button asChild className="flex-1">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
};

export default OrderDetails;
