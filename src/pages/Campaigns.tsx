import { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddCampaignForm } from "@/components/AddCampaignForm";
import { CampaignPublicationControl } from "@/components/CampaignPublicationControl";
import { ChevronDown, ChevronUp, Plus, Search, MoreHorizontal, Edit, Package, X, ExternalLink, Link as LinkIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  start_date: string | null;
  end_date: string | null;
  status: boolean;
  publication_status: string;
  group_name: string | null;
  campaign_type_name: string | null;
  group_id?: string;
  campaign_type_id?: string;
  slug?: string;
  image_url?: string | null;
  enable_roster_attribution?: boolean;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof Campaign>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterBy, setFilterBy] = useState("active");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [managingCampaignId, setManagingCampaignId] = useState<string | null>(null);
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { activeGroup, groups } = useActiveGroup();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const permissionLevel = organizationUser?.user_type.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

  const fetchCampaigns = async () => {
    if (!organizationUser) {
      console.log("No organization user found");
      setLoading(false);
      return;
    }

    console.log("Fetching campaigns for organization user:", organizationUser);

    try {
      let query = supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(
            id,
            group_name,
            organization_id
          ),
          campaign_type(
            id,
            name
          )
        `);

      // Apply role-based filtering
      const permissionLevel = organizationUser.user_type.permission_level;
      
      if (permissionLevel === 'organization_admin') {
        // Organization admins can see all campaigns for their organization
        query = query.eq('groups.organization_id', organizationUser.organization_id);
      } else if (permissionLevel === 'program_manager') {
        // Program managers can see campaigns for their groups only
        if (organizationUser.group_id) {
          query = query.eq('group_id', organizationUser.group_id);
        } else {
          // If no group assigned, show no campaigns
          setCampaigns([]);
          setLoading(false);
          return;
        }
      } else {
        // Other roles don't manage campaigns
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Apply selected group filter if set
      if (activeGroup) {
        query = query.eq('group_id', activeGroup.id);
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
        publication_status: campaign.publication_status || 'draft',
        group_name: campaign.groups?.group_name || null,
        campaign_type_name: campaign.campaign_type?.name || null,
        group_id: campaign.group_id,
        campaign_type_id: campaign.campaign_type_id,
        slug: campaign.slug,
        image_url: campaign.image_url,
        enable_roster_attribution: campaign.enable_roster_attribution,
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

  const handleGenerateRosterLinks = async (campaignId: string, campaignName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-roster-member-links', {
        body: { campaignId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${data.count} shareable links for ${campaignName}`,
      });
    } catch (error) {
      console.error('Error generating roster links:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate roster links",
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
    if (!organizationUserLoading && organizationUser) {
      fetchCampaigns();
    }
  }, [organizationUser, organizationUserLoading]);

  useEffect(() => {
    if (organizationUser) {
      fetchCampaigns();
    }
  }, [activeGroup?.id]);

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout 
        segments={[{ label: "Campaigns" }]}
        loading={true}
      >
        <div>Loading...</div>
      </DashboardPageLayout>
    );
  }

  if (!canSeeUsers) {
    return (
      <DashboardPageLayout 
        segments={[{ label: "Campaigns" }]}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to view campaigns.</p>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout 
      segments={[{ label: "Campaigns" }]}
    >
      <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground">
                Manage fundraising campaigns for your groups.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof Campaign)}>
                  <SelectTrigger className="w-full">
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => setShowAddCampaign(true)} className="flex items-center gap-2 col-span-2 sm:col-span-1 w-full">
                  <Plus className="h-4 w-4" />
                  Add Campaign
                </Button>
              </div>
            </div>

            {isMobile ? (
              // Mobile Card View
              <div className="grid grid-cols-1 gap-4">
                {sortedCampaigns.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">No campaigns found.</p>
                      <Button 
                        onClick={() => setShowAddCampaign(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Let's Create a Campaign
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  sortedCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{campaign.group_name || "—"}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border">
                              <DropdownMenuItem onClick={() => {
                                setEditingCampaign(campaign);
                                setManagingCampaignId(null);
                                setShowAddCampaign(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingCampaign(null);
                                setManagingCampaignId(campaign.id);
                                setShowAddCampaign(true);
                              }}>
                                <Package className="mr-2 h-4 w-4" />
                                Manage Items
                              </DropdownMenuItem>
                              {campaign.enable_roster_attribution && campaign.publication_status === 'published' && (
                                <DropdownMenuItem onClick={() => handleGenerateRosterLinks(campaign.id, campaign.name)}>
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  Generate Roster Links
                                </DropdownMenuItem>
                              )}
                              {campaign.slug && (
                                <DropdownMenuItem onClick={() => window.open(`/campaign/${campaign.slug}`, '_blank')}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Landing Page
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{campaign.campaign_type_name || "—"}</Badge>
                          <CampaignPublicationControl
                            campaignId={campaign.id}
                            campaignName={campaign.name}
                            groupId={campaign.group_id || ""}
                            currentStatus={campaign.publication_status}
                            enableRosterAttribution={campaign.enable_roster_attribution}
                            onStatusChange={fetchCampaigns}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">
                              ${(campaign.amount_raised || 0).toLocaleString()} / ${campaign.goal_amount ? campaign.goal_amount.toLocaleString() : '0'}
                            </span>
                          </div>
                          <Progress 
                            value={campaign.goal_amount ? Math.min((campaign.amount_raised || 0) / campaign.goal_amount * 100, 100) : 0} 
                          />
                          <div className="text-sm text-muted-foreground">
                            {campaign.start_date && campaign.end_date 
                              ? `${new Date(campaign.start_date).toLocaleDateString()}-${new Date(campaign.end_date).toLocaleDateString()}`
                              : campaign.start_date 
                                ? new Date(campaign.start_date).toLocaleDateString()
                                : campaign.end_date
                                  ? new Date(campaign.end_date).toLocaleDateString()
                                  : "—"
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              // Desktop Table View
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
                    <TableHead>Publication Status</TableHead>
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
                          <CampaignPublicationControl
                            campaignId={campaign.id}
                            campaignName={campaign.name}
                            groupId={campaign.group_id || ""}
                            currentStatus={campaign.publication_status}
                            enableRosterAttribution={campaign.enable_roster_attribution}
                            onStatusChange={fetchCampaigns}
                          />
                        </TableCell>
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
                                  setEditingCampaign(campaign);
                                  setShowAddCampaign(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => {
                                  setManagingCampaignId(campaign.id);
                                  setShowAddCampaign(true);
                                }}
                              >
                                <Package className="mr-2 h-4 w-4" />
                                Manage Campaign Items
                              </DropdownMenuItem>
                              {campaign.enable_roster_attribution && campaign.publication_status === 'published' && (
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => handleGenerateRosterLinks(campaign.id, campaign.name)}
                                >
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  Generate Roster Links
                                </DropdownMenuItem>
                              )}
                              {campaign.slug && (
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => {
                                    window.open(`/c/${campaign.slug}`, '_blank');
                                  }}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Preview Campaign Page
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setSelectedCampaign(campaign);
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    {campaign.status ? "Deactivate" : "Activate"} Campaign
                                  </DropdownMenuItem>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              </div>
            )}

            {showAddCampaign && (
            <AddCampaignForm
              open={showAddCampaign}
              onOpenChange={(open) => {
                setShowAddCampaign(open);
                if (!open) {
                  setEditingCampaign(null);
                  setManagingCampaignId(null);
                }
              }}
              onCampaignAdded={fetchCampaigns}
              editCampaign={editingCampaign ? {
                id: editingCampaign.id,
                name: editingCampaign.name,
                description: editingCampaign.description,
                thank_you_message: (editingCampaign as any).thank_you_message || null,
                goal_amount: editingCampaign.goal_amount,
                start_date: editingCampaign.start_date,
                end_date: editingCampaign.end_date,
                group_id: editingCampaign.group_id || '',
                campaign_type_id: editingCampaign.campaign_type_id || '',
                slug: editingCampaign.slug || '',
                image_url: editingCampaign.image_url || null,
                publication_status: editingCampaign.publication_status || 'draft',
              } : null}
              manageCampaignId={managingCampaignId}
            />
          )}
        </div>
    </DashboardPageLayout>
  );
}