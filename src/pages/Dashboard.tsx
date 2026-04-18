import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal } from "lucide-react";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { OrganizationSetupModal } from "@/components/OrganizationSetupModal";
import { AddCampaignForm } from "@/components/AddCampaignForm";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { getPermissionLevel } from "@/lib/permissions";
import PlayerDashboard from "@/components/PlayerDashboard";
const Dashboard = () => {
  const { user } = useAuth();
  const { organizationUser, loading } = useOrganizationUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { activeGroup, groups } = useActiveGroup();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
  const [donors, setDonors] = useState<any[]>([]);
  const [donorCount, setDonorCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Check if user needs to complete organization setup
  useEffect(() => {
    if (loading) return;
    
    if (user && !organizationUser) {
      // Double-check with a direct query before showing the modal
      // This handles race conditions where the hook hasn't settled yet (e.g., invited users)
      const verifyNoOrgUser = async () => {
        const { data } = await supabase
          .from('organization_user')
          .select('id')
          .eq('user_id', user.id)
          .eq('active_user', true)
          .limit(1)
          .maybeSingle();

        if (data) {
          // Record exists but hook missed it — reload to re-fetch
          window.location.reload();
        } else {
          setShowSetupModal(true);
        }
      };
      verifyNoOrgUser();
    } else {
      setShowSetupModal(false);
    }
  }, [user, loading, organizationUser]);

  const handleSetupComplete = (organizationUserData: any) => {
    setShowSetupModal(false);
    // This will trigger a refresh in the useOrganizationUser hook
  };

  const fetchCampaigns = async () => {
    if (!organizationUser?.organization_id) return;

    try {
      // First, get total campaigns (all campaigns) for this organization/group to check if any exist
      let totalQuery = supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(id, group_name, organization_id)
        `)
        .eq("groups.organization_id", organizationUser.organization_id);

      // Filter by selected group if one is selected
      if (activeGroup) {
        totalQuery = totalQuery.eq("group_id", activeGroup.id);
      }

      const { data: totalData, error: totalError } = await totalQuery;

      if (totalError) {
        console.error("Error fetching total campaigns:", totalError);
        return;
      }

      setTotalCampaigns(totalData?.length || 0);

      // Then get published campaigns (active + recently expired within 30 days)
      let publishedQuery = supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(id, group_name, organization_id),
          campaign_type(id, name)
        `)
        .eq("groups.organization_id", organizationUser.organization_id)
        .eq("publication_status", "published");

      // Filter by selected group if one is selected
      if (activeGroup) {
        publishedQuery = publishedQuery.eq("group_id", activeGroup.id);
      }

      const { data: publishedData, error: publishedError } = await publishedQuery;

      if (publishedError) {
        console.error("Error fetching published campaigns:", publishedError);
        return;
      }

      // Filter to active or recently expired (within last 30 days)
      const today = new Date(new Date().toDateString());
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filtered = (publishedData || []).filter((c) => {
        if (!c.end_date) return true;
        const end = new Date(c.end_date);
        return end >= thirtyDaysAgo;
      });

      // Sort: active first (by end_date asc), then expired (most recently ended first)
      filtered.sort((a, b) => {
        const aActive = !a.end_date || new Date(a.end_date) >= today;
        const bActive = !b.end_date || new Date(b.end_date) >= today;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        if (aActive) {
          // both active: nulls last, then earliest end first
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        }
        // both expired: most recent first
        return new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime();
      });

      setCampaigns(filtered);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  // Fetch campaigns when component mounts or dependencies change
  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchCampaigns();
    }
  }, [organizationUser?.organization_id]);

  useEffect(() => {
    fetchCampaigns();
  }, [activeGroup?.id]);

  // Fetch donors from database
  const fetchDonors = async (groupId?: string | null) => {
    if (!organizationUser?.organization_id) return;

    try {
      let donorEmailsForGroup: string[] | null = null;

      // If a specific group is selected, filter donors by group via orders -> campaigns
      if (groupId) {
        const { data: donorEmails, error: emailError } = await supabase
          .from("orders")
          .select("customer_email, campaigns!inner(group_id)")
          .eq("campaigns.group_id", groupId)
          .not("customer_email", "is", null);

        if (emailError) {
          console.error('Error fetching donor emails for group:', emailError);
          return;
        }

        donorEmailsForGroup = [...new Set(donorEmails?.map(o => o.customer_email).filter(Boolean) || [])];
        
        if (donorEmailsForGroup.length === 0) {
          setDonors([]);
          setDonorCount(0);
          return;
        }
      }

      // Get donors for this organization
      let query = supabase
        .from('donor_profiles')
        .select('*')
        .eq('organization_id', organizationUser.organization_id);

      if (donorEmailsForGroup) {
        query = query.in("email", donorEmailsForGroup);
      }

      const { data, error } = await query
        .order('total_donations', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching donors:', error);
        return;
      }

      setDonors(data || []);

      // Get total count with same filter
      let countQuery = supabase
        .from('donor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationUser.organization_id);

      if (donorEmailsForGroup) {
        countQuery = countQuery.in("email", donorEmailsForGroup);
      }

      const { count } = await countQuery;
      setDonorCount(count || 0);
    } catch (error) {
      console.error('Error fetching donors:', error);
    }
  };

  // Fetch donors when component mounts or dependencies change
  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchDonors(activeGroup?.id);
    }
  }, [organizationUser?.organization_id, activeGroup?.id]);

  // Calculate stats from campaigns data
  const activeCampaignsCount = campaigns.length;
  const totalAmountRaised = campaigns.reduce((sum, campaign) => sum + (campaign.amount_raised || 0), 0);
  const totalGoalAmount = campaigns.reduce((sum, campaign) => sum + (campaign.goal_amount || 0), 0);
  const leftToRaise = totalGoalAmount - totalAmountRaised;

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return '-';
    if (!startDate) return endDate ? format(new Date(endDate), 'MMM d, yyyy') : '-';
    if (!endDate) return format(new Date(startDate), 'MMM d, yyyy');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Same year and month
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')}-${format(end, 'd, yyyy')}`;
    }
    
    // Same year, different months
    if (start.getFullYear() === end.getFullYear()) {
      return `${format(start, 'MMM d')}-${format(end, 'MMM d, yyyy')}`;
    }
    
    // Different years
    return `${format(start, 'MMM d, yyyy')}-${format(end, 'MMM d, yyyy')}`;
  };

  // Helper function to get donor display name
  const getDonorName = (donor: any) => {
    if (donor.first_name || donor.last_name) {
      return `${donor.first_name || ''} ${donor.last_name || ''}`.trim();
    }
    return donor.email.split('@')[0];
  };

  // Helper function to get donor initials
  const getDonorInitials = (donor: any) => {
    if (donor.first_name && donor.last_name) {
      return `${donor.first_name[0]}${donor.last_name[0]}`.toUpperCase();
    }
    if (donor.first_name) return donor.first_name[0].toUpperCase();
    if (donor.last_name) return donor.last_name[0].toUpperCase();
    return donor.email[0].toUpperCase();
  };
  // Check if user is a participant/supporter to show player dashboard
  const permissionLevel = organizationUser?.user_type?.permission_level || 
    getPermissionLevel(organizationUser?.user_type?.name || '');
  const isPlayer = permissionLevel === 'participant' || permissionLevel === 'supporter';
  const canManageUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

  // Fetch pending membership requests count for admins/managers
  const fetchPendingRequestsCount = async () => {
    if (!organizationUser?.organization_id || !canManageUsers) return;
    
    const { count } = await supabase
      .from('membership_requests')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationUser.organization_id)
      .eq('status', 'pending');
    
    setPendingRequestsCount(count || 0);
  };

  useEffect(() => {
    if (organizationUser?.organization_id && canManageUsers) {
      fetchPendingRequestsCount();
    }
  }, [organizationUser?.organization_id, canManageUsers]);

  // Real-time subscription for pending requests
  useEffect(() => {
    if (!organizationUser?.organization_id || !canManageUsers) return;

    const channel = supabase
      .channel('dashboard-membership-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_requests',
          filter: `organization_id=eq.${organizationUser.organization_id}`,
        },
        () => {
          fetchPendingRequestsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationUser?.organization_id, canManageUsers]);

  return (
    <DashboardPageLayout
      showBreadcrumbs={false}
    >
      <div className="space-y-4 md:space-y-6">
        {isPlayer ? (
          <PlayerDashboard />
        ) : (
          <>
          {/* Pending Membership Requests Alert */}
          {canManageUsers && pendingRequestsCount > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                    <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Pending Membership Requests</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {pendingRequestsCount} {pendingRequestsCount === 1 ? 'person wants' : 'people want'} to join your organization
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/dashboard/users?tab=pending')} size="sm">
                  Review Requests
                </Button>
              </CardHeader>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-lg md:text-2xl font-bold">{activeCampaignsCount}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Active Campaigns</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-lg md:text-2xl font-bold">${totalAmountRaised.toLocaleString()}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Amount Raised</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-lg md:text-2xl font-bold">{donorCount.toLocaleString()}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Donors</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-lg md:text-2xl font-bold">${Math.max(0, leftToRaise).toLocaleString()}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Left to Raise</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Campaigns</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/campaigns')}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Manage All Campaigns
                </Button>
                <Button onClick={() => setShowAddCampaignForm(true)} size="sm" className="w-full sm:w-auto">Add Campaign</Button>
              </div>
            </CardHeader>
            <CardContent>
              {totalCampaigns === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg font-medium mb-2">Let's get started - Create a Campaign Now</div>
                  <div className="text-muted-foreground mb-4">Start fundraising by creating your first campaign</div>
                  <Button onClick={() => setShowAddCampaignForm(true)}>
                    Create Campaign
                  </Button>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg font-medium mb-2">You currently have no active campaigns</div>
                  <div className="text-muted-foreground">All your campaigns are inactive or ended</div>
                </div>
              ) : isMobile ? (
                // Mobile Card View for Campaigns
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{campaign.name}</h4>
                            <p className="text-xs text-muted-foreground">{campaign.groups?.group_name}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/campaigns/${campaign.id}/edit`)}
                          >
                            Manage
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Raised</span>
                            <span className="font-semibold">
                              ${campaign.amount_raised?.toLocaleString() || 0} / ${campaign.goal_amount?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {campaign.start_date && campaign.end_date 
                              ? `${format(new Date(campaign.start_date), 'MMM d')}-${format(new Date(campaign.end_date), 'MMM d, yyyy')}`
                              : campaign.start_date 
                                ? format(new Date(campaign.start_date), 'MMM d, yyyy')
                                : campaign.end_date
                                  ? format(new Date(campaign.end_date), 'MMM d, yyyy')
                                  : "—"
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Campaign</TableHead>
                        <TableHead className="min-w-[100px]">Group</TableHead>
                        <TableHead className="min-w-[120px]">Amount Raised</TableHead>
                        <TableHead className="min-w-[120px]">Dates</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign, index) => <TableRow key={index}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">{campaign.groups?.group_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            ${campaign.amount_raised?.toLocaleString() || 0}/${campaign.goal_amount?.toLocaleString() || 0}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateRange(campaign.start_date, campaign.end_date)}</TableCell>
                         <TableCell>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => navigate(`/dashboard/campaigns/${campaign.id}/edit`)}
                           >
                             Manage
                           </Button>
                         </TableCell>
                      </TableRow>)}
                  </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Donors Table */}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Donors</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{donorCount} results</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/donors')}>View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {donors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg font-medium mb-2">No donors yet</div>
                  <div className="text-muted-foreground mb-4">Donors will appear here once they contribute to your campaigns</div>
                  <Button variant="outline" onClick={() => navigate('/dashboard/donors')}>
                    View Donor Management
                  </Button>
                </div>
              ) : isMobile ? (
                // Mobile Card View for Donors
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {donors.map((donor) => (
                    <Card key={donor.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/dashboard/donors/${donor.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{getDonorName(donor)}</h4>
                            <p className="text-xs text-muted-foreground truncate">{donor.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ${(donor.total_donations || 0).toLocaleString()} donated
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {donor.rfm_segment || 'New'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Total Donated</TableHead>
                        <TableHead className="min-w-[100px]">Segment</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donors.map((donor) => (
                        <TableRow key={donor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/donors/${donor.id}`)}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getDonorInitials(donor)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{getDonorName(donor)}</span>
                          </TableCell>
                          <TableCell>{donor.email}</TableCell>
                          <TableCell>${(donor.total_donations || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{donor.rfm_segment || 'New'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
        )}

        {/* Organization Setup Modal */}
        {user && (
          <OrganizationSetupModal 
            open={showSetupModal}
            onComplete={handleSetupComplete}
            userId={user.id}
          />
        )}

        {/* Add Campaign Form */}
        <AddCampaignForm 
          open={showAddCampaignForm}
          onOpenChange={setShowAddCampaignForm}
          onCampaignAdded={() => {
            fetchCampaigns();
          }}
        />
      </div>
      </DashboardPageLayout>
    );
  };

export default Dashboard;