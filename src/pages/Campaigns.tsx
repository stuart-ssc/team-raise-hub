import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddCampaignForm } from "@/components/AddCampaignForm";
import { ChevronDown, ChevronUp, Plus, Search } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  start_date: string | null;
  end_date: string | null;
  status: boolean;
  group_name: string | null;
  campaign_type_name: string | null;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof Campaign>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const { schoolUser, loading: schoolUserLoading } = useSchoolUser();
  const { toast } = useToast();

  const authorizedRoles = ['Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader'];
  const canSeeUsers = schoolUser?.user_type.name && authorizedRoles.includes(schoolUser.user_type.name);

  const fetchCampaigns = async () => {
    if (!schoolUser) {
      console.log("No school user found");
      setLoading(false);
      return;
    }

    console.log("Fetching campaigns for school user:", schoolUser);

    try {
      let query = supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(
            id,
            group_name,
            school_id
          ),
          campaign_type(
            id,
            name
          )
        `);

      // Apply role-based filtering
      if (schoolUser.user_type.name === 'Principal') {
        // Principal can see all campaigns for their school
        query = query.eq('groups.school_id', schoolUser.school_id);
      } else if (schoolUser.user_type.name === 'Athletic Director') {
        // Athletic Director can see campaigns for sports teams only
        query = query
          .eq('groups.school_id', schoolUser.school_id)
          .in('groups.group_type_id', [/* Add sports group type IDs here */]);
      } else {
        // Coach, Club Sponsor, Booster Leader can see campaigns for their groups only
        if (schoolUser.group_id) {
          query = query.eq('group_id', schoolUser.group_id);
        } else {
          // If no group assigned, show no campaigns
          setCampaigns([]);
          setLoading(false);
          return;
        }
      }

      if (selectedGroup) {
        query = query.eq('group_id', selectedGroup);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching campaigns:", error);
        return;
      }

      console.log("Raw campaigns data:", data);

      const formattedCampaigns: Campaign[] = (data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        goal_amount: campaign.goal_amount,
        amount_raised: campaign.amount_raised,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status,
        group_name: campaign.groups?.group_name || null,
        campaign_type_name: campaign.campaign_type?.name || null,
      }));

      console.log("Formatted campaigns:", formattedCampaigns);
      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampaignStatus = async (campaignId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);

      if (error) {
        console.error("Error updating campaign status:", error);
        toast({
          title: "Error",
          description: "Failed to update campaign status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Campaign ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });

      // Refresh campaigns
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: keyof Campaign) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.campaign_type_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "active" && campaign.status) ||
                         (filterBy === "inactive" && !campaign.status);
    
    return matchesSearch && matchesFilter;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  useEffect(() => {
    if (!schoolUserLoading) {
      fetchCampaigns();
    }
  }, [schoolUser, schoolUserLoading, selectedGroup]);

  if (schoolUserLoading || loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-8">
            <div>Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!canSeeUsers) {
    return (
      <div className="min-h-screen flex bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p>You don't have permission to view campaigns.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground">
                Manage fundraising campaigns for your groups.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof Campaign)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="group_name">Group</SelectItem>
                    <SelectItem value="goal_amount">Goal Amount</SelectItem>
                    <SelectItem value="amount_raised">Amount Raised</SelectItem>
                    <SelectItem value="start_date">Start Date</SelectItem>
                    <SelectItem value="end_date">End Date</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => setShowAddCampaign(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Campaign
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Campaign Name
                        {sortBy === "name" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("group_name")}
                    >
                      <div className="flex items-center gap-2">
                        Group
                        {sortBy === "group_name" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("campaign_type_name")}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        {sortBy === "campaign_type_name" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("amount_raised")}
                    >
                      <div className="flex items-center gap-2">
                        Amount Raised
                        {sortBy === "amount_raised" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("start_date")}
                    >
                      <div className="flex items-center gap-2">
                        Dates
                        {sortBy === "start_date" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <p className="text-muted-foreground">No campaigns found.</p>
                          <Button 
                            onClick={() => setShowAddCampaign(true)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Let's Create a Campaign
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>{campaign.group_name || "—"}</TableCell>
                        <TableCell>{campaign.campaign_type_name || "—"}</TableCell>
                        <TableCell>
                          {`$${(campaign.amount_raised || 0).toLocaleString()}/${campaign.goal_amount ? campaign.goal_amount.toLocaleString() : '0'}`}
                        </TableCell>
                        <TableCell>
                          {campaign.start_date && campaign.end_date 
                            ? `${new Date(campaign.start_date).toLocaleDateString()}-${new Date(campaign.end_date).toLocaleDateString()}`
                            : campaign.start_date 
                              ? new Date(campaign.start_date).toLocaleDateString()
                              : campaign.end_date
                                ? new Date(campaign.end_date).toLocaleDateString()
                                : "—"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.status ? "default" : "secondary"}>
                            {campaign.status ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedCampaign(campaign)}
                              >
                                {campaign.status ? "Deactivate" : "Activate"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {campaign.status ? "Deactivate" : "Activate"} Campaign
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {campaign.status ? "deactivate" : "activate"} the campaign "{campaign.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    if (selectedCampaign) {
                                      handleUpdateCampaignStatus(selectedCampaign.id, !selectedCampaign.status);
                                    }
                                  }}
                                >
                                  {campaign.status ? "Deactivate" : "Activate"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>

      <AddCampaignForm 
        open={showAddCampaign} 
        onOpenChange={setShowAddCampaign}
        onCampaignAdded={fetchCampaigns}
      />
    </div>
  );
}