import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardPageLayout from "@/components/DashboardPageLayout";

interface Order {
  id: string;
  created_at: string;
  items_total: number;
  status: string;
  files_complete: boolean;
  campaign: {
    id: string;
    name: string;
    file_upload_deadline_days: number;
  };
  fileFieldsCount: number;
}

const MyOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        // Fetch all orders for the user
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            items_total,
            status,
            files_complete,
            campaign:campaigns (
              id,
              name,
              file_upload_deadline_days
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // For each order, fetch file fields count
        const ordersWithFields = await Promise.all(
          (ordersData || []).map(async (order) => {
            const { count } = await supabase
              .from('campaign_custom_fields')
              .select('*', { count: 'exact', head: true })
              .eq('campaign_id', order.campaign.id)
              .eq('field_type', 'file');

            return {
              ...order,
              fileFieldsCount: count || 0
            };
          })
        );

        setOrders(ordersWithFields);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);

  const getDaysRemaining = (createdAt: string, deadlineDays: number) => {
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + deadlineDays);
    const today = new Date();
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDeadlineStatus = (order: Order) => {
    if (order.fileFieldsCount === 0) return null;
    if (order.files_complete) return 'complete';
    
    const daysRemaining = getDaysRemaining(order.created_at, order.campaign.file_upload_deadline_days || 30);
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 3) return 'urgent';
    return 'pending';
  };

  const stats = {
    total: orders.length,
    pendingFiles: orders.filter(o => o.fileFieldsCount > 0 && !o.files_complete).length,
    completedFiles: orders.filter(o => o.files_complete).length,
  };

  if (loading) {
    return (
      <DashboardPageLayout segments={[{ label: 'Orders' }]}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout segments={[{ label: 'Orders' }]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending File Uploads</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingFiles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Files</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedFiles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't placed any orders yet.
                </p>
                <Button asChild>
                  <Link to="/dashboard/fundraisers">Browse Fundraisers</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const deadlineStatus = getDeadlineStatus(order);
                      const daysRemaining = order.fileFieldsCount > 0 && !order.files_complete
                        ? getDaysRemaining(order.created_at, order.campaign.file_upload_deadline_days || 30)
                        : null;

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>{order.campaign.name}</TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${(order.items_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            {order.fileFieldsCount === 0 ? (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            ) : deadlineStatus === 'complete' ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            ) : deadlineStatus === 'overdue' ? (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : deadlineStatus === 'urgent' ? (
                              <Badge variant="default">
                                <Clock className="h-3 w-3 mr-1" />
                                {daysRemaining}d left
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                {daysRemaining}d left
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/dashboard/orders/${order.id}`}>
                                {order.fileFieldsCount > 0 && !order.files_complete ? (
                                  <>
                                    <FileText className="h-3 w-3 mr-1" />
                                    Upload Files
                                  </>
                                ) : (
                                  'View Details'
                                )}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
};

export default MyOrders;
