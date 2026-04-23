import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  Plus,
  Search,
  ExternalLink,
  Globe,
  Eye,
  AlertCircle,
  Sparkles,
  PenLine,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  Copy,
  QrCode,
  Share2,
  Link2,
  Clock,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShareMenu } from "@/components/ShareMenu";
import { QRDialog, pickBrandLogo } from "@/components/player/QRDialog";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("active");
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [qrDialogCampaign, setQrDialogCampaign] = useState<Campaign | null>(null);
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { activeGroup, groups } = useActiveGroup();
  const { toast } = useToast();

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

      // Filter by deleted_at based on current view
      if (filterBy === "deleted") {
        query = query.not("deleted_at", "is", null);
      } else {
        query = query.is("deleted_at", null);
      }

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

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", campaignToDelete.id);

      if (error) throw error;

      toast({
        title: "Campaign deleted",
        description: "You can restore it from the Deleted filter.",
      });
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleRestoreCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ deleted_at: null })
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Campaign restored",
        description: "The campaign is back in your drafts.",
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Error restoring campaign:", error);
      toast({
        title: "Error",
        description: "Failed to restore campaign",
        variant: "destructive",
      });
    }
  };

  const isDeletable = (c: Campaign) =>
    c.publication_status === "draft" || c.publication_status === "pending_verification";

  const isExpired = (c: Campaign) => {
    if (c.publication_status !== 'published') return false;
    if (!c.end_date) return false;
    return new Date(c.end_date) < new Date(new Date().toDateString());
  };

  const isInDateRange = (c: Campaign) => {
    const now = new Date();
    const today = new Date(now.toDateString());
    if (c.start_date && new Date(c.start_date) > now) return false;
    if (c.end_date && new Date(c.end_date) < today) return false;
    return true;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.campaign_type_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const isPublished = campaign.publication_status === 'published';

    const matchesFilter =
      filterBy === "all" ||
      filterBy === "deleted" ||
      (filterBy === "active" && isPublished && isInDateRange(campaign)) ||
      (filterBy === "published" && isPublished) ||
      (filterBy === "expired" && isExpired(campaign)) ||
      (filterBy === "draft" && campaign.publication_status === 'draft') ||
      (filterBy === "pending_verification" && campaign.publication_status === 'pending_verification');

    return matchesSearch && matchesFilter;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    // Default sort: alphabetical by name (stable, matches manager expectations)
    return (a.name || "").localeCompare(b.name || "");
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
  }, [activeGroup?.id, filterBy]);

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout 
        segments={[{ label: "Fundraisers" }]}
        loading={true}
      >
        <div>Loading...</div>
      </DashboardPageLayout>
    );
  }

  if (!canSeeUsers) {
    return (
      <DashboardPageLayout 
        segments={[{ label: "Fundraisers" }]}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to view fundraisers.</p>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout 
      segments={[{ label: "Fundraisers" }]}
    >
      <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fundraisers</h1>
              <p className="text-muted-foreground">
                Manage fundraisers for your groups.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search fundraisers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="published">Published (all)</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add Fundraiser
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard/fundraisers/new")}>
                    <PenLine className="h-4 w-4 mr-2" />
                    Create manually
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/fundraisers/ai-builder")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create with AI
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isMobile && (
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof Campaign)}>
                  <SelectTrigger className="flex-1">
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  {sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {isMobile ? (
              // Mobile Card View
              <div className="grid grid-cols-1 gap-4">
                {sortedCampaigns.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">No fundraisers found.</p>
                      <Button 
                        onClick={() => navigate("/dashboard/fundraisers/new")}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Let's Create a Fundraiser
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  sortedCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                              {campaign.slug && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/c/${campaign.slug}`, '_blank');
                                  }}
                                  title="Preview landing page"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{campaign.group_name || "—"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/fundraisers/${campaign.id}/edit`)}
                            >
                              Manage
                            </Button>
                            {filterBy === "deleted" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreCampaign(campaign.id)}
                                title="Restore campaign"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            ) : isDeletable(campaign) ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setCampaignToDelete(campaign)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{campaign.campaign_type_name || "—"}</Badge>
                          <Badge 
                            variant={isExpired(campaign) ? 'secondary' : campaign.publication_status === 'published' ? 'default' : 'outline'}
                            className="gap-1"
                          >
                            {isExpired(campaign) ? (
                              <><AlertCircle className="h-3 w-3" /> Expired</>
                            ) : campaign.publication_status === 'published' ? (
                              <><Globe className="h-3 w-3" /> Published</>
                            ) : campaign.publication_status === 'pending_verification' ? (
                              <><AlertCircle className="h-3 w-3" /> Pending</>
                            ) : (
                              <><Eye className="h-3 w-3" /> Draft</>
                            )}
                          </Badge>
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
                          Fundraiser Name
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
                          <p className="text-muted-foreground">No fundraisers found.</p>
                          <Button 
                            onClick={() => navigate("/dashboard/fundraisers/new")}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Let's Create a Fundraiser
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {campaign.name}
                            {campaign.slug && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/c/${campaign.slug}`, '_blank');
                                }}
                                title="Preview landing page"
                              >
                                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                            )}
                          </div>
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
                          <Badge 
                            variant={isExpired(campaign) ? 'secondary' : campaign.publication_status === 'published' ? 'default' : 'outline'}
                            className="gap-1"
                          >
                            {isExpired(campaign) ? (
                              <><AlertCircle className="h-3 w-3" /> Expired</>
                            ) : campaign.publication_status === 'published' ? (
                              <><Globe className="h-3 w-3" /> Published</>
                            ) : campaign.publication_status === 'pending_verification' ? (
                              <><AlertCircle className="h-3 w-3" /> Pending</>
                            ) : (
                              <><Eye className="h-3 w-3" /> Draft</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/fundraisers/${campaign.id}/edit`)}
                            >
                              Manage
                            </Button>
                            {filterBy === "deleted" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreCampaign(campaign.id)}
                                title="Restore campaign"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            ) : isDeletable(campaign) ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setCampaignToDelete(campaign)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              </div>
            )}
        </div>

        <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
              <AlertDialogDescription>
                "{campaignToDelete?.name}" will be moved to the Deleted filter. You can restore it later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCampaign}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </DashboardPageLayout>
  );
}