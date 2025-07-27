import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { SchoolUserSetupModal } from "@/components/SchoolUserSetupModal";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
const Dashboard = () => {
  const { user } = useAuth();
  const { schoolUser, loading } = useSchoolUser();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{id: string, group_name: string}>>([]);

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
      let query = supabase
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
        query = query.eq("group_id", selectedGroup);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching campaigns:", error);
        return;
      }

      setCampaigns(data || []);
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
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader onGroupClick={handleGroupClick} activeGroup={activeGroup} />

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">14</div>
                <div className="text-muted-foreground">Active Campaigns</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">$25K</div>
                <div className="text-muted-foreground">Amount Raised</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">1,250</div>
                <div className="text-muted-foreground">2025 Donors</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">$15K</div>
                <div className="text-muted-foreground">Left to Raise</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campaigns</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Sort</Button>
                <Button variant="outline" size="sm">Filter</Button>
                <Button size="sm">New</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>School Group</TableHead>
                    <TableHead>Amount Raised</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign, index) => <TableRow key={index}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{schoolUser?.schools?.school_name}</div>
                        <div className="text-xs text-muted-foreground">{campaign.groups?.group_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ${campaign.amount_raised?.toLocaleString() || 0}/${campaign.goal_amount?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      <TableCell>{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status ? "default" : "secondary"}>
                          {campaign.status ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">⋮</Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Donors Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Donors</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">6 results</span>
                <Button variant="outline" size="sm">Sort</Button>
                <Button variant="outline" size="sm">Filter</Button>
                <Button size="sm">New</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead></TableHead>
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
    </div>;
};
export default Dashboard;