import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Package } from "lucide-react";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { OrganizationSetupModal } from "@/components/OrganizationSetupModal";
import { AddCampaignForm } from "@/components/AddCampaignForm";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
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
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [manageCampaignId, setManageCampaignId] = useState<string | null>(null);

  // Check if user needs to complete organization setup
  useEffect(() => {
    console.log("Dashboard useEffect - user:", !!user, "loading:", loading, "organizationUser:", !!organizationUser);
    if (user && !loading && !organizationUser) {
      console.log("Showing setup modal because no organizationUser found");
      setShowSetupModal(true);
    } else {
      console.log("Not showing setup modal");
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

      // Then get active campaigns only
      let activeQuery = supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(id, group_name, organization_id),
          campaign_type(id, name)
        `)
        .eq("groups.organization_id", organizationUser.organization_id)
        .eq("status", true) // Only active campaigns
        .order("end_date", { ascending: true }); // Sort by end date, soonest first

      // Filter by selected group if one is selected
      if (activeGroup) {
        activeQuery = activeQuery.eq("group_id", activeGroup.id);
      }

      const { data: activeData, error: activeError } = await activeQuery;

      if (activeError) {
        console.error("Error fetching active campaigns:", activeError);
        return;
      }

      setCampaigns(activeData || []);
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

  // Mock data for donors
  const donors = [{
    name: "Jeff Conner",
    email: "jconner@testemail.com",
    title: "jconner@testemail.com",
    role: "Standard"
  }, {
    name: "Emma Perez",
    email: "eperez@testemail.com",
    title: "eperez@testemail.com",
    role: "Standard"
  }, {
    name: "Raj Mishra",
    email: "rmishra@testemail.com",
    title: "rmishra@testemail.com",
    role: "Standard"
  }];
  return (
    <DashboardPageLayout
      showBreadcrumbs={false}
      showRosters={true}
    >
      <div className="space-y-4 md:space-y-6">
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
                <div className="text-lg md:text-2xl font-bold">1,250</div>
                <div className="text-xs md:text-sm text-muted-foreground">2025 Donors</div>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border">
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditCampaign(campaign);
                                  setManageCampaignId(null);
                                  setShowAddCampaignForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Update Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditCampaign(null);
                                  setManageCampaignId(campaign.id);
                                  setShowAddCampaignForm(true);
                                }}
                              >
                                <Package className="mr-2 h-4 w-4" />
                                Manage Items
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="outline" size="sm">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="bg-background border">
                               <DropdownMenuItem 
                                 className="cursor-pointer"
                                 onClick={() => {
                                   setEditCampaign(campaign);
                                   setManageCampaignId(null);
                                   setShowAddCampaignForm(true);
                                 }}
                               >
                                 <Edit className="mr-2 h-4 w-4" />
                                 Update Campaign
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                 className="cursor-pointer"
                                 onClick={() => {
                                   setEditCampaign(null);
                                   setManageCampaignId(campaign.id);
                                   setShowAddCampaignForm(true);
                                 }}
                               >
                                 <Package className="mr-2 h-4 w-4" />
                                 Manage Items
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
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
                <span className="text-sm text-muted-foreground">6 results</span>
                <Button variant="outline" size="sm">Sort</Button>
                <Button variant="outline" size="sm">Filter</Button>
                <Button size="sm">New</Button>
              </div>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                // Mobile Card View for Donors
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {donors.map((donor, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{donor.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{donor.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">{donor.role}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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
                      <TableHead className="min-w-[150px]">Title</TableHead>
                      <TableHead className="min-w-[100px]">Role</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {donors.map((donor, index) => <TableRow key={index}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>{donor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{donor.name}</span>
                      </TableCell>
                      <TableCell>{donor.email}</TableCell>
                      <TableCell>{donor.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{donor.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">⋮</Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

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
          onOpenChange={(open) => {
            setShowAddCampaignForm(open);
            if (!open) {
              setEditCampaign(null);
              setManageCampaignId(null);
            }
          }}
          onCampaignAdded={() => {
            fetchCampaigns();
          }}
          editCampaign={editCampaign}
          manageCampaignId={manageCampaignId}
        />
      </DashboardPageLayout>
    );
  };

export default Dashboard;