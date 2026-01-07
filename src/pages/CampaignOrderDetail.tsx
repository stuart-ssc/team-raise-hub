import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import MessageButton from "@/components/messaging/MessageButton";
import { calculateItemsTotal } from "@/lib/orderUtils";
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
} from "lucide-react";

interface OrderItem {
  campaign_item_id: string;
  price_at_purchase: number;
  quantity: number;
}

const CampaignOrderDetail = () => {
  const { campaignId, orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sendingReminder, setSendingReminder] = useState(false);

  // Fetch order details
  const { data: order, isLoading: orderLoading, error: orderError } = useQuery({
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
          status,
          files_complete,
          user_id,
          campaign_id,
          campaign:campaigns (
            id,
            name,
            file_upload_deadline_days,
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

  // Fetch file custom fields
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

  // Fetch uploaded files for this order
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
    const fileFieldIds = fileFields.map(f => f.id);
    const uploaded = uploadedFiles.filter(
      (uf) => uf.custom_field?.field_type === "file" && uf.field_value
    ).length;
    return { uploaded, total: fileFields.length };
  }, [uploadedFiles, fileFields]);

  const getDaysRemaining = () => {
    if (!order) return 0;
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign?.file_upload_deadline_days || 30));
    const today = new Date();
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineDate = () => {
    if (!order) return "";
    const deadline = new Date(order.created_at);
    deadline.setDate(deadline.getDate() + (order.campaign?.file_upload_deadline_days || 30));
    return deadline.toLocaleDateString();
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

  const daysRemaining = getDaysRemaining();
  const isUrgent = daysRemaining <= 3 && daysRemaining > 0;
  const isPastDue = daysRemaining < 0;

  if (orderLoading) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "Campaigns", path: "/dashboard/campaigns" },
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
          { label: "Campaigns", path: "/dashboard/campaigns" },
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
            <Button onClick={() => navigate(`/dashboard/campaigns/${campaignId}/edit`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaign
            </Button>
          </CardContent>
        </Card>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Campaigns", path: "/dashboard/campaigns" },
        { label: order.campaign?.name || "Campaign", path: `/dashboard/campaigns/${campaignId}/edit` },
        { label: `Order #${order.id.slice(0, 8).toUpperCase()}` },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
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
                  <span>${calculateItemsTotal(order.items).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Upload Status */}
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
                  {!order.files_complete && (
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
                    {isPastDue
                      ? `Deadline was ${getDeadlineDate()}. Consider sending a reminder.`
                      : `Due by ${getDeadlineDate()} (${daysRemaining} day${
                          daysRemaining !== 1 ? "s" : ""
                        } remaining)`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Uploaded Assets */}
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

        {/* Pending Files */}
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
            onClick={() => navigate(`/dashboard/campaigns/${campaignId}/edit`)}
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
