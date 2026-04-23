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

            {sortedCampaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No fundraisers found.</p>
                  <Button
                    onClick={() => navigate("/dashboard/fundraisers/new")}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Let's Create a Fundraiser
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedCampaigns.map((campaign) => (
                  <CampaignManagerCard
                    key={campaign.id}
                    campaign={campaign}
                    isExpired={isExpired(campaign)}
                    isDeletable={isDeletable(campaign)}
                    filterBy={filterBy}
                    onManage={() => navigate(`/dashboard/fundraisers/${campaign.id}/edit`)}
                    onShowQR={() => setQrDialogCampaign(campaign)}
                    onDelete={() => setCampaignToDelete(campaign)}
                    onRestore={() => handleRestoreCampaign(campaign.id)}
                  />
                ))}
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

        {qrDialogCampaign && qrDialogCampaign.slug && (
          <QRDialog
            open={!!qrDialogCampaign}
            onOpenChange={(open) => !open && setQrDialogCampaign(null)}
            url={`${window.location.origin}/c/${qrDialogCampaign.slug}`}
            campaignName={qrDialogCampaign.name}
            logoUrl={pickBrandLogo({ groupLogo: null, schoolLogo: null, orgLogo: null })}
            schoolOrOrgName={null}
            groupName={qrDialogCampaign.group_name}
            campaignDescription={qrDialogCampaign.description}
          />
        )}
    </DashboardPageLayout>
  );
}

/* ============================ Card subcomponents ============================ */

function fmtMoney(n: number) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtShortDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysLeft(endIso: string | null): number | null {
  if (!endIso) return null;
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}

function DaysLeftChip({ endDate }: { endDate: string | null }) {
  const d = daysLeft(endDate);
  if (d === null || d < 0) return null;
  let cls = "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (d <= 7) cls = "bg-red-50 text-red-700 border-red-100";
  else if (d <= 14) cls = "bg-amber-50 text-amber-700 border-amber-100";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        cls
      )}
    >
      <Clock className="h-3 w-3" />
      {d} day{d === 1 ? "" : "s"} left
    </div>
  );
}

const IconBtn = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    label: string;
    onClick?: () => void;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, label, onClick, className, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    {...rest}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
      className
    )}
  >
    {children}
  </button>
));
IconBtn.displayName = "IconBtn";

function StatColumn({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-serif text-lg font-semibold text-foreground">{value}</p>
      {caption && <p className="text-xs text-muted-foreground truncate">{caption}</p>}
    </div>
  );
}

function CampaignManagerCard({
  campaign,
  isExpired,
  isDeletable,
  filterBy,
  onManage,
  onShowQR,
  onDelete,
  onRestore,
}: {
  campaign: Campaign;
  isExpired: boolean;
  isDeletable: boolean;
  filterBy: string;
  onManage: () => void;
  onShowQR: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const { toast } = useToast();
  const isRoster = !!campaign.enable_roster_attribution;
  const stripeColor = isRoster ? "bg-emerald-500" : "bg-sky-500";
  const progressColor = isRoster ? "bg-emerald-500" : "bg-sky-500";
  const typePill = isRoster
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-sky-200 bg-sky-50 text-sky-700";

  const hasSlug = !!campaign.slug;
  const shareUrl = hasSlug ? `${window.location.origin}/c/${campaign.slug}` : "";
  const displayUrl = shareUrl.replace(/^https?:\/\//, "");

  const goal = campaign.goal_amount || 0;
  const raised = campaign.amount_raised || 0;
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;

  const startStr = fmtShortDate(campaign.start_date);
  const endStr = fmtShortDate(campaign.end_date);
  const dateRange =
    startStr && endStr
      ? `${startStr} – ${endStr}`
      : startStr
        ? `Starts ${startStr}`
        : endStr
          ? `Ends ${endStr}`
          : "—";

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Share it anywhere." });
  };

  const statusBadge = isExpired ? (
    <Badge variant="secondary" className="gap-1">
      <AlertCircle className="h-3 w-3" /> Expired
    </Badge>
  ) : campaign.publication_status === "published" ? (
    <Badge variant="default" className="gap-1">
      <Globe className="h-3 w-3" /> Published
    </Badge>
  ) : campaign.publication_status === "pending_verification" ? (
    <Badge variant="outline" className="gap-1">
      <AlertCircle className="h-3 w-3" /> Pending
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1">
      <Eye className="h-3 w-3" /> Draft
    </Badge>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className={cn("w-1.5 shrink-0", stripeColor)} aria-hidden />
        <div className="flex-1 p-5 md:p-6">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-2xl font-semibold leading-tight text-foreground">
                  {campaign.name}
                </h3>
                {hasSlug && (
                  <button
                    type="button"
                    onClick={() => window.open(`/c/${campaign.slug}`, "_blank")}
                    title="Preview landing page"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
                <Badge variant="outline" className={cn("text-xs", typePill)}>
                  {isRoster ? "Roster" : "Team"}
                </Badge>
                {statusBadge}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {campaign.group_name && <span>{campaign.group_name}</span>}
                {campaign.campaign_type_name && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{campaign.campaign_type_name}</span>
                  </>
                )}
              </div>
            </div>
            <DaysLeftChip endDate={campaign.end_date} />
          </div>

          {/* Stat strip */}
          <div className="mt-5 grid gap-5 md:grid-cols-4 md:gap-6">
            <div className="md:col-span-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                GOAL
              </p>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="font-serif text-lg font-semibold text-foreground">
                  {fmtMoney(raised)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {fmtMoney(goal)}
                  </span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(pct)}%
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <StatColumn label="DATES" value={dateRange} />
            <StatColumn label="TYPE" value={campaign.campaign_type_name || "—"} />
            <StatColumn label="GROUP" value={campaign.group_name || "—"} />
          </div>

          {/* Link bar + Manage */}
          <div className="mt-5 flex flex-col gap-2 rounded-lg border bg-muted/40 px-3 py-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              {hasSlug ? (
                <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate font-mono">{displayUrl}</span>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background/80 px-3 py-2 text-sm text-muted-foreground italic">
                  <Link2 className="h-4 w-4 shrink-0" />
                  <span>No public link yet — publish to generate one</span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1">
              {hasSlug && (
                <>
                  <IconBtn label="Copy link" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Show QR code" onClick={onShowQR}>
                    <QrCode className="h-4 w-4" />
                  </IconBtn>
                  <ShareMenu
                    url={shareUrl}
                    title={`Support ${campaign.name}`}
                    text={`Help ${campaign.group_name || "us"} reach the goal for ${campaign.name}!`}
                  >
                    <IconBtn label="Share">
                      <Share2 className="h-4 w-4" />
                    </IconBtn>
                  </ShareMenu>
                  <IconBtn
                    label="Open"
                    onClick={() => window.open(shareUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </IconBtn>
                </>
              )}
              <Button size="sm" onClick={onManage} className="ml-1">
                Manage
              </Button>
              {filterBy === "deleted" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRestore}
                  title="Restore campaign"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : isDeletable ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}