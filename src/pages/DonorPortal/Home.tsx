import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { JoinOrganizationDialog } from "@/components/DonorPortal/JoinOrganizationDialog";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingBag, 
  Clock, 
  MessageSquare, 
  Building2, 
  FileText,
  AlertCircle,
  ArrowRight,
  Image as ImageIcon,
  Users,
} from "lucide-react";

interface PendingUpload {
  orderId: string;
  campaignName: string;
  daysRemaining: number;
}

interface PendingCampaignAsset {
  orderId: string;
  campaignId: string;
  campaignName: string;
  businessName: string;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  campaign_name: string;
  status: string;
}

export default function DonorPortalHome() {
  const { user } = useAuth();
  const { donorProfiles, linkedBusinesses, isLoading: portalLoading } = useDonorPortal();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingUploads: 0,
    pendingAssets: 0,
    unreadMessages: 0,
    linkedBusinesses: 0,
  });
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingCampaignAssets, setPendingCampaignAssets] = useState<PendingCampaignAsset[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Show welcome notification for users with legacy orders
  useEffect(() => {
    const state = location.state as { ordersLinked?: boolean } | null;
    if (state?.ordersLinked && !hasShownWelcome && !loading) {
      setHasShownWelcome(true);
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
      
      toast({
        title: "Welcome to your Donor Portal!",
        description: `We found ${stats.totalOrders} order${stats.totalOrders !== 1 ? 's' : ''} associated with your email.`,
      });
    }
  }, [location.state, hasShownWelcome, loading, stats.totalOrders, toast]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch orders with pending file uploads
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_amount,
            status,
            files_complete,
            business_id,
            campaign:campaigns (
              id,
              name,
              file_upload_deadline_days
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (ordersError) throw ordersError;

        const recentOrdersData = (orders || []).map(o => ({
          id: o.id,
          created_at: o.created_at,
          total_amount: o.total_amount,
          campaign_name: (o.campaign as any)?.name || 'Unknown Campaign',
          status: o.status,
        }));
        setRecentOrders(recentOrdersData.slice(0, 5));

        // Calculate pending uploads
        const pendingUploadsList: PendingUpload[] = [];
        for (const order of orders || []) {
          if (order.files_complete) continue;
          
          const campaign = order.campaign as any;
          if (!campaign?.file_upload_deadline_days) continue;

          // Check if campaign has file fields
          const { count } = await supabase
            .from('campaign_custom_fields')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('field_type', 'file');

          if (count && count > 0) {
            const deadline = new Date(order.created_at);
            deadline.setDate(deadline.getDate() + campaign.file_upload_deadline_days);
            const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            pendingUploadsList.push({
              orderId: order.id,
              campaignName: campaign.name,
              daysRemaining,
            });
          }
        }
        setPendingUploads(pendingUploadsList);

        // Find orders with linked businesses that don't have campaign assets
        const pendingAssetsList: PendingCampaignAsset[] = [];
        for (const order of orders || []) {
          if (!order.business_id) continue;
          
          const campaign = order.campaign as any;
          if (!campaign?.id) continue;

          // Check if campaign assets exist for this business/campaign combo
          const { data: existingAssets } = await supabase
            .from('business_campaign_assets')
            .select('id')
            .eq('business_id', order.business_id)
            .eq('campaign_id', campaign.id)
            .single();

          if (!existingAssets) {
            // Get business name
            const { data: businessData } = await supabase
              .from('businesses')
              .select('business_name')
              .eq('id', order.business_id)
              .single();

            pendingAssetsList.push({
              orderId: order.id,
              campaignId: campaign.id,
              campaignName: campaign.name,
              businessName: businessData?.business_name || 'Unknown Business',
            });
          }
        }
        setPendingCampaignAssets(pendingAssetsList);

        // Get unread message count
        let unreadMessages = 0;
        if (donorProfiles.length > 0) {
          const donorIds = donorProfiles.map(p => p.id);
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('conversation_id, last_read_at')
            .in('donor_profile_id', donorIds)
            .is('left_at', null);

          if (participants) {
            for (const p of participants) {
              const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', p.conversation_id)
                .gt('created_at', p.last_read_at || '1970-01-01');
              
              unreadMessages += count || 0;
            }
          }
        }

        setStats({
          totalOrders: orders?.length || 0,
          pendingUploads: pendingUploadsList.length,
          pendingAssets: pendingAssetsList.length,
          unreadMessages,
          linkedBusinesses: linkedBusinesses.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!portalLoading) {
      fetchDashboardData();
    }
  }, [user, donorProfiles, linkedBusinesses, portalLoading]);

  if (loading || portalLoading) {
    return (
      <DonorPortalLayout title="Welcome Back">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DonorPortalLayout>
    );
  }

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <DonorPortalLayout title={`Welcome back, ${userName}!`} subtitle="Here's an overview of your activity">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card className={stats.pendingUploads > 0 ? "border-warning" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Uploads</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingUploads}</div>
              {stats.pendingUploads > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Action needed</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Linked Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.linkedBusinesses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending File Uploads Alert */}
        {pendingUploads.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                Pending File Uploads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUploads.slice(0, 3).map((upload) => (
                  <div key={upload.orderId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{upload.campaignName}</p>
                      <p className="text-sm text-muted-foreground">
                        {upload.daysRemaining > 0 
                          ? `${upload.daysRemaining} days remaining`
                          : 'Overdue'
                        }
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/portal/purchases/${upload.orderId}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Upload
                      </Link>
                    </Button>
                  </div>
                ))}
                {pendingUploads.length > 3 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/portal/purchases">
                      View all {pendingUploads.length} pending uploads
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Campaign Assets */}
        {pendingCampaignAssets.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ImageIcon className="h-5 w-5" />
                Pending Campaign Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Upload custom logos or branding for your sponsored campaigns
                </p>
                {pendingCampaignAssets.slice(0, 3).map((asset) => (
                  <div key={asset.orderId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{asset.campaignName}</p>
                      <p className="text-sm text-muted-foreground">
                        Sponsored by {asset.businessName}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/portal/purchases/${asset.orderId}/assets`}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Assets
                      </Link>
                    </Button>
                  </div>
                ))}
                {pendingCampaignAssets.length > 3 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/portal/purchases">
                      View all {pendingCampaignAssets.length} pending
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Purchases</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/portal/purchases">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground text-sm">
                  When you support a campaign, your purchases will appear here.
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Browse campaigns shared with you or check back after making a purchase.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{order.campaign_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={order.status === 'succeeded' ? 'default' : 'secondary'}>
                        ${order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/portal/purchases/${order.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => {}}>
            <Link to="/portal/receipts">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Tax Receipts</h3>
                  <p className="text-sm text-muted-foreground">Download donation receipts</p>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <Link to="/portal/messages">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Messages</h3>
                  <p className="text-sm text-muted-foreground">View your conversations</p>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <Link to="/portal/profile">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Update Profile</h3>
                  <p className="text-sm text-muted-foreground">Manage your information</p>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card 
            className="hover:bg-accent/5 transition-colors cursor-pointer border-dashed"
            onClick={() => setJoinDialogOpen(true)}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-secondary/50">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Join an Organization</h3>
                <p className="text-sm text-muted-foreground">Become a parent, volunteer, or staff</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <JoinOrganizationDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
      </div>
    </DonorPortalLayout>
  );
}
