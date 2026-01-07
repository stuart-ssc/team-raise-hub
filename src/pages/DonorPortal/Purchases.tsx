import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package,
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Filter
} from "lucide-react";

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
  organization_name: string;
  fileFieldsCount: number;
}

export default function DonorPortalPurchases() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
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
              file_upload_deadline_days,
              group:groups (
                organization:organizations (
                  name
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // For each order, fetch file fields count
        const ordersWithFields = await Promise.all(
          (ordersData || []).map(async (order) => {
            const campaign = order.campaign as any;
            const { count } = await supabase
              .from('campaign_custom_fields')
              .select('*', { count: 'exact', head: true })
              .eq('campaign_id', campaign.id)
              .eq('field_type', 'file');

            return {
              ...order,
              campaign: {
                id: campaign.id,
                name: campaign.name,
                file_upload_deadline_days: campaign.file_upload_deadline_days,
              },
              organization_name: campaign?.group?.organization?.name || 'Unknown Organization',
              fileFieldsCount: count || 0
            };
          })
        );

        setOrders(ordersWithFields);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getDaysRemaining = (createdAt: string, deadlineDays: number) => {
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + deadlineDays);
    const today = new Date();
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatus = (order: Order) => {
    if (order.fileFieldsCount === 0) return null;
    if (order.files_complete) return 'complete';
    
    const daysRemaining = getDaysRemaining(order.created_at, order.campaign.file_upload_deadline_days || 30);
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 3) return 'urgent';
    return 'pending';
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending-upload") {
      return order.fileFieldsCount > 0 && !order.files_complete;
    }
    if (filterStatus === "complete") {
      return order.files_complete || order.fileFieldsCount === 0;
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pendingFiles: orders.filter(o => o.fileFieldsCount > 0 && !o.files_complete).length,
    completedFiles: orders.filter(o => o.files_complete).length,
  };

  if (loading) {
    return (
      <DonorPortalLayout title="My Purchases">
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
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout title="My Purchases" subtitle="View and manage your purchase history">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className={stats.pendingFiles > 0 ? "border-warning" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Uploads</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingFiles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedFiles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Purchase History</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purchases</SelectItem>
                <SelectItem value="pending-upload">Pending Uploads</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {filterStatus !== "all" ? "No matching purchases" : "No Purchases Yet"}
                </h3>
                <p className="text-muted-foreground">
                  {filterStatus !== "all" 
                    ? "Try changing your filter" 
                    : "Your purchases will appear here"
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="hidden md:table-cell">Organization</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const deadlineStatus = getDeadlineStatus(order);
                      const daysRemaining = order.fileFieldsCount > 0 && !order.files_complete
                        ? getDaysRemaining(order.created_at, order.campaign.file_upload_deadline_days || 30)
                        : null;

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{order.campaign.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{order.organization_name}</TableCell>
<TableCell>
                            ${(order.items_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
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
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/portal/purchases/${order.id}`}>
                                {order.fileFieldsCount > 0 && !order.files_complete ? (
                                  <>
                                    <FileText className="h-3 w-3 mr-1" />
                                    Upload
                                  </>
                                ) : (
                                  'View'
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
    </DonorPortalLayout>
  );
}
