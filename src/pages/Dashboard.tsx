import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Package } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { SchoolUserSetupModal } from "@/components/SchoolUserSetupModal";
import { AddCampaignForm } from "@/components/AddCampaignForm";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
const Dashboard = () => {
  const { user } = useAuth();
  const { schoolUser, loading } = useSchoolUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{id: string, group_name: string}>>([]);
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [manageCampaignId, setManageCampaignId] = useState<string | null>(null);

  // Check if user needs to complete school/group setup
  useEffect(() => {
    console.log("Dashboard useEffect - user:", !!user, "loading:", loading, "schoolUser:", !!schoolUser);
    if (user && !loading && !schoolUser) {
      console.log("Showing setup modal because no schoolUser found");
      setShowSetupModal(true);
    } else {
      console.log("Not showing setup modal");
      setShowSetupModal(false);
    }
  }, [user, loading, schoolUser]);

  const handleSetupComplete = (schoolUserData: any) => {
    setShowSetupModal(false);
    // This will trigger a refresh in the SchoolUserProvider
  };

  const fetchCampaigns = async () => {
    if (!schoolUser?.school_id) return;

    try {
      // First, get total campaigns (all campaigns) for this school/group to check if any exist
      let totalQuery = supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(id, group_name, school_id)
        `)
        .eq("groups.school_id", schoolUser.school_id);

      // Filter by selected group if one is selected
      if (selectedGroup && selectedGroup !== "All") {
        totalQuery = totalQuery.eq("group_id", selectedGroup);
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
          groups!inner(id, group_name, school_id),
          campaign_type(id, name)
        `)
        .eq("groups.school_id", schoolUser.school_id)
        .eq("status", true) // Only active campaigns
        .order("end_date", { ascending: true }); // Sort by end date, soonest first

      // Filter by selected group if one is selected
      if (selectedGroup && selectedGroup !== "All") {
        activeQuery = activeQuery.eq("group_id", selectedGroup);
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

  const fetchGroups = async () => {
    if (!schoolUser) return;

    const userRole = schoolUser.user_type.name;
    
    if (userRole === "Principal") {
      // Principal sees all groups for their school
      const { data } = await supabase
        .from("groups")
        .select("id, group_name")
        .eq("school_id", schoolUser.school_id);
      
      setGroups(data || []);
    } else if (userRole === "Athletic Director") {
      // Athletic Director sees all sports teams
      const { data } = await supabase
        .from("groups")
        .select("id, group_name, group_type!inner(name)")
        .eq("school_id", schoolUser.school_id)
        .eq("group_type.name", "Sports Team");
      
      setGroups(data || []);
    } else if (["Coach", "Club Sponsor", "Booster Leader", "Team Player", "Club Participant", "Family Member"].includes(userRole)) {
      // These roles only see groups they're connected to
      if (schoolUser.groups) {
        setGroups([schoolUser.groups]);
      }
    }
  };

  const handleGroupClick = (groupId: string | null) => {
    setSelectedGroup(groupId);
  };

  // Fetch groups and campaigns when component mounts or dependencies change
  useEffect(() => {
    if (schoolUser?.school_id) {
      fetchGroups();
      fetchCampaigns();
    }
  }, [schoolUser?.school_id]);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedGroup]);

  const activeGroup = selectedGroup ? groups.find(g => g.id === selectedGroup) : null;

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
  return <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <div className={`flex-1 flex flex-col ${isMobile ? 'pl-16' : ''}`}>
        <DashboardHeader onGroupClick={handleGroupClick} activeGroup={activeGroup} />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
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
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/campaigns')}
                  size="sm"
                  className="w-full md:w-auto"
                >
                  Manage All Campaigns
                </Button>
                <Button onClick={() => setShowAddCampaignForm(true)} size="sm" className="w-full md:w-auto">Add Campaign</Button>
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
              ) : (
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
            </CardContent>
          </Card>
        </main>
      </div>

      {/* School User Setup Modal */}
      {user && (
        <SchoolUserSetupModal 
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
    </div>;
};
export default Dashboard;