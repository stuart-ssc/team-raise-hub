import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  Copy,
  Share2,
  ExternalLink,
  MessageSquare,
  Edit,
  ChevronUp,
  QrCode,
  Mic,
  Link2,
  Clock,
  Upload,
  Sparkles,
  Zap,
  TrendingUp,
  LayoutList,
  Rows3,
  UserPlus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PitchEditor } from "@/components/PitchEditor";
import { QRDialog, pickBrandLogo } from "@/components/player/QRDialog";
import { Separator } from "@/components/ui/separator";
import ManageGuardiansCard from "@/components/ManageGuardiansCard";
import MyConnectedStudentsCard from "@/components/MyConnectedStudentsCard";
import InviteParentDialog from "@/components/InviteParentDialog";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/* ----------------------------- Types ----------------------------- */

interface CampaignStat {
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  groupDirections: string | null;
  enableRosterAttribution: boolean;
  hasPersonalLink: boolean;
  personalUrl: string | null;
  totalRaised: number;
  donationCount: number;
  uniqueSupporters: number;
  rank: number;
  totalParticipants: number;
  personalGoal: number;
  percentToGoal: number;
  pitchMessage: string | null;
  pitchImageUrl: string | null;
  pitchVideoUrl: string | null;
  pitchRecordedVideoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  topGiftAmount: number | null;
  topGiftDonorName: string | null;
  // Parent view additions
  childName?: string;
  childOrganizationUserId?: string;
  // Branding for QR poster
  groupLogo?: string | null;
  schoolLogo?: string | null;
  orgLogo?: string | null;
}

interface RosterMembership {
  id: string;
  roster_id: number | null;
  organization_id: string;
  group_id: string | null;
  rosters: { group_id: string } | null;
}

interface LinkedChild {
  organizationUserId: string;
  firstName: string;
  lastName: string;
  rosterId: number | null;
  groupId: string | null;
  organizationId: string;
}

type StatusFilter = "active" | "past" | "all";
type SortMode = "recent" | "raised" | "progress" | "ending";
type ViewMode = "list" | "compact";

/* ----------------------------- Helpers ----------------------------- */

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

const fmtShortDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const daysLeft = (endIso: string | null): number | null => {
  if (!endIso) return null;
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return null;
  const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
};

const isActive = (endIso: string | null) => {
  const d = daysLeft(endIso);
  return d === null || d >= 0;
};

/* ============================ Component ============================ */

export default function MyFundraising() {
  const { user } = useAuth();
  const { activeGroup } = useActiveGroup();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CampaignStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDialogStat, setQrDialogStat] = useState<CampaignStat | null>(null);
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [rosterMembership, setRosterMembership] = useState<RosterMembership | null>(null);
  const [isParentView, setIsParentView] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (user) fetchFundraisingStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeGroup?.id]);

  /* --------------------------- Data fetching --------------------------- */

  const fetchFundraisingStats = async () => {
    try {
      const { data: parentLinks, error: parentError } = await supabase
        .from("organization_user")
        .select("id, linked_organization_user_id, organization_id, group_id")
        .eq("user_id", user?.id)
        .eq("active_user", true)
        .not("linked_organization_user_id", "is", null);

      if (parentError) throw parentError;

      if (parentLinks && parentLinks.length > 0) {
        await fetchParentViewStats(parentLinks);
        return;
      }

      setIsParentView(false);
      setLinkedChildren([]);
      await fetchPlayerViewStats();
    } catch (error) {
      console.error("Error fetching fundraising stats:", error);
      toast({
        title: "Error",
        description: "Failed to load fundraising statistics",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchParentViewStats = async (parentLinks: any[]) => {
    try {
      setIsParentView(true);

      const childOrgUserIds = parentLinks
        .map((p) => p.linked_organization_user_id)
        .filter(Boolean) as string[];

      const { data: childOrgUsers, error: childError } = await supabase
        .from("organization_user")
        .select(`
          id,
          user_id,
          roster_id,
          group_id,
          organization_id,
          rosters(id, group_id)
        `)
        .in("id", childOrgUserIds)
        .eq("active_user", true);

      if (childError) throw childError;

      if (!childOrgUsers || childOrgUsers.length === 0) {
        setStats([]);
        setLinkedChildren([]);
        setLoading(false);
        return;
      }

      const childUserIds = childOrgUsers.map((c) => c.user_id).filter(Boolean) as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", childUserIds);

      const children: LinkedChild[] = childOrgUsers.map((child) => {
        const profile = profiles?.find((p) => p.id === child.user_id);
        return {
          organizationUserId: child.id,
          firstName: profile?.first_name || "Unknown",
          lastName: profile?.last_name || "",
          rosterId: child.roster_id,
          groupId: child.group_id || (child.rosters as any)?.group_id || null,
          organizationId: child.organization_id,
        };
      });
      setLinkedChildren(children);

      let groupIds = childOrgUsers
        .map((m) => (m.rosters as any)?.group_id)
        .filter(Boolean);

      if (activeGroup) groupIds = groupIds.filter((id: string) => id === activeGroup.id);

      if (groupIds.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .select(
          "id, name, slug, group_directions, enable_roster_attribution, goal_amount, start_date, end_date, groups:groups(logo_url, schools(logo_file), organizations(logo_url))"
        )
        .in("group_id", groupIds)
        .eq("status", true);

      if (campaignError) throw campaignError;

      if (!campaigns || campaigns.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      const allStats: CampaignStat[] = [];

      for (const child of children) {
        const childOrgUser = childOrgUsers.find((c) => c.id === child.organizationUserId);
        if (!childOrgUser) continue;

        const childGroupId = child.groupId || (childOrgUser.rosters as any)?.group_id;
        const childCampaigns = campaigns.filter(() => groupIds.includes(childGroupId));

        const { data: rosterLinks } = await supabase
          .from("roster_member_campaign_links")
          .select(
            "campaign_id, slug, pitch_message, pitch_image_url, pitch_video_url, pitch_recorded_video_url"
          )
          .eq("roster_member_id", child.organizationUserId);

        const linkMap = new Map(rosterLinks?.map((l) => [l.campaign_id, l]) || []);

        for (const campaign of childCampaigns) {
          const linkData = linkMap.get(campaign.id);
          const hasPersonalLink = !!linkData;
          const personalUrl = hasPersonalLink
            ? `${window.location.origin}/c/${campaign.slug}/${linkData.slug}`
            : null;

          let statsData: any = null;
          if (hasPersonalLink) {
            const { data, error: statsError } = await supabase.functions.invoke(
              "get-roster-member-stats",
              {
                body: { campaignId: campaign.id, rosterMemberId: child.organizationUserId },
              }
            );
            if (!statsError) statsData = data;
          }

          const personalGoal =
            statsData?.personalGoal || ((campaign as any).goal_amount || 0) / 10;

          const grp: any = (campaign as any).groups;
          allStats.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            campaignSlug: campaign.slug,
            groupDirections: campaign.group_directions,
            enableRosterAttribution: (campaign as any).enable_roster_attribution || false,
            hasPersonalLink,
            personalUrl,
            pitchMessage: linkData?.pitch_message || null,
            pitchImageUrl: linkData?.pitch_image_url || null,
            pitchVideoUrl: linkData?.pitch_video_url || null,
            pitchRecordedVideoUrl: linkData?.pitch_recorded_video_url || null,
            childName: `${child.firstName} ${child.lastName}`.trim(),
            childOrganizationUserId: child.organizationUserId,
            totalRaised: statsData?.totalRaised || 0,
            donationCount: statsData?.donationCount || 0,
            uniqueSupporters: statsData?.uniqueSupporters || 0,
            rank: statsData?.rank || 0,
            totalParticipants: statsData?.totalParticipants || 0,
            personalGoal,
            percentToGoal:
              personalGoal > 0
                ? Math.min(100, ((statsData?.totalRaised || 0) / personalGoal) * 100)
                : 0,
            startDate: (campaign as any).start_date ?? null,
            endDate: (campaign as any).end_date ?? null,
            topGiftAmount: statsData?.topGiftAmount ?? null,
            topGiftDonorName: statsData?.topGiftDonorName ?? null,
            groupLogo: grp?.logo_url ?? null,
            schoolLogo: grp?.schools?.logo_file ?? null,
            orgLogo: grp?.organizations?.logo_url ?? null,
          });
        }
      }

      setStats(allStats);
    } catch (error) {
      console.error("Error fetching parent view stats:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerViewStats = async () => {
    try {
      const { data: rosterMemberships, error: rosterError } = await supabase
        .from("organization_user")
        .select(`
          id,
          roster_id,
          organization_id,
          group_id,
          rosters(group_id)
        `)
        .eq("user_id", user?.id)
        .eq("active_user", true);

      if (rosterError) throw rosterError;

      if (!rosterMemberships || rosterMemberships.length === 0) {
        setStats([]);
        setRosterMembership(null);
        setLoading(false);
        return;
      }

      setRosterMembership(rosterMemberships[0] as RosterMembership);

      let groupIds = rosterMemberships
        .map((m) => (m as any).rosters?.group_id)
        .filter(Boolean);

      if (activeGroup) groupIds = groupIds.filter((id: string) => id === activeGroup.id);

      if (groupIds.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .select(
          "id, name, slug, group_directions, enable_roster_attribution, goal_amount, start_date, end_date, groups:groups(logo_url, schools(logo_file), organizations(logo_url))"
        )
        .in("group_id", groupIds)
        .eq("status", true);

      if (campaignError) throw campaignError;

      if (!campaigns || campaigns.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      const rosterMembershipData = rosterMemberships[0];

      const { data: rosterLinks } = await supabase
        .from("roster_member_campaign_links")
        .select(
          "campaign_id, slug, pitch_message, pitch_image_url, pitch_video_url, pitch_recorded_video_url"
        )
        .eq("roster_member_id", rosterMembershipData.id);

      const linkMap = new Map(rosterLinks?.map((l) => [l.campaign_id, l]) || []);

      const statsPromises = campaigns.map(async (campaign) => {
        const linkData = linkMap.get(campaign.id);
        const hasPersonalLink = !!linkData;
        const personalUrl = hasPersonalLink
          ? `${window.location.origin}/c/${campaign.slug}/${linkData.slug}`
          : null;

        let statsData: any = null;
        if (hasPersonalLink) {
          const { data, error: statsError } = await supabase.functions.invoke(
            "get-roster-member-stats",
            { body: { campaignId: campaign.id, rosterMemberId: rosterMembershipData.id } }
          );
          if (!statsError) statsData = data;
        }

        const personalGoal =
          statsData?.personalGoal || (campaign.goal_amount || 0) / 10;

        const grp: any = (campaign as any).groups;
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignSlug: campaign.slug,
          groupDirections: campaign.group_directions,
          enableRosterAttribution: campaign.enable_roster_attribution || false,
          hasPersonalLink,
          personalUrl,
          pitchMessage: linkData?.pitch_message || null,
          pitchImageUrl: linkData?.pitch_image_url || null,
          pitchVideoUrl: linkData?.pitch_video_url || null,
          pitchRecordedVideoUrl: linkData?.pitch_recorded_video_url || null,
          totalRaised: statsData?.totalRaised || 0,
          donationCount: statsData?.donationCount || 0,
          uniqueSupporters: statsData?.uniqueSupporters || 0,
          rank: statsData?.rank || 0,
          totalParticipants: statsData?.totalParticipants || 0,
          personalGoal,
          percentToGoal:
            personalGoal > 0
              ? Math.min(100, ((statsData?.totalRaised || 0) / personalGoal) * 100)
              : 0,
          startDate: (campaign as any).start_date ?? null,
          endDate: (campaign as any).end_date ?? null,
          topGiftAmount: statsData?.topGiftAmount ?? null,
          topGiftDonorName: statsData?.topGiftDonorName ?? null,
          groupLogo: grp?.logo_url ?? null,
          schoolLogo: grp?.schools?.logo_file ?? null,
          orgLogo: grp?.organizations?.logo_url ?? null,
        } as CampaignStat;
      });

      const resolvedStats = await Promise.all(statsPromises);
      setStats(resolvedStats);
    } catch (error) {
      console.error("Error fetching player view stats:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------- Actions --------------------------- */

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: isParentView
        ? "Your child's fundraising link has been copied to clipboard"
        : "Your personal fundraising link has been copied to clipboard",
    });
  };

  const shareLink = async (url: string, campaignName: string, childName?: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: childName
            ? `Support ${childName} in ${campaignName}`
            : `Support me in ${campaignName}`,
          text: childName
            ? `Help ${childName} reach their fundraising goal for ${campaignName}!`
            : `Help me reach my fundraising goal for ${campaignName}!`,
          url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyLink(url);
    }
  };

  /* --------------------------- Derived data --------------------------- */

  const totalRaisedAll = stats.reduce((sum, s) => sum + s.totalRaised, 0);
  const totalSupportersAll = stats.reduce((sum, s) => sum + s.uniqueSupporters, 0);
  const bestRank = stats.length
    ? Math.min(...stats.map((s) => s.rank || Infinity))
    : null;
  const bestRankCampaign = stats.find((s) => s.rank === bestRank)?.campaignName ?? null;

  // Compute team total (sum of campaign goals as a stand-in when team raised total isn't available)
  const teamPotShare = useMemo(() => {
    const teamTotal = stats.reduce((sum, s) => {
      // approximate: avg per participant × participants
      if (!s.totalParticipants || !s.donationCount) return sum + s.totalRaised;
      return sum + (s.totalRaised / Math.max(1, s.donationCount)) * s.donationCount;
    }, 0);
    if (!teamTotal) return 0;
    return Math.round((totalRaisedAll / teamTotal) * 100);
  }, [stats, totalRaisedAll]);

  // Sparkline placeholder data — shape only
  const sparkline = useMemo(() => {
    const base = totalRaisedAll || 0;
    if (base === 0) {
      return Array.from({ length: 6 }, (_, i) => ({ i, v: 0 }));
    }
    return [0.15, 0.25, 0.35, 0.55, 0.75, 1].map((p, i) => ({ i, v: base * p }));
  }, [totalRaisedAll]);

  const counts = useMemo(() => {
    const a = stats.filter((s) => isActive(s.endDate)).length;
    const p = stats.length - a;
    return { active: a, past: p, all: stats.length };
  }, [stats]);

  const visibleStats = useMemo(() => {
    let arr = stats.slice();
    if (statusFilter === "active") arr = arr.filter((s) => isActive(s.endDate));
    else if (statusFilter === "past") arr = arr.filter((s) => !isActive(s.endDate));

    arr.sort((a, b) => {
      switch (sortMode) {
        case "raised":
          return b.totalRaised - a.totalRaised;
        case "progress":
          return b.percentToGoal - a.percentToGoal;
        case "ending": {
          const ad = daysLeft(a.endDate) ?? Infinity;
          const bd = daysLeft(b.endDate) ?? Infinity;
          return ad - bd;
        }
        case "recent":
        default: {
          const ad = a.endDate ? new Date(a.endDate).getTime() : 0;
          const bd = b.endDate ? new Date(b.endDate).getTime() : 0;
          return bd - ad;
        }
      }
    });
    return arr;
  }, [stats, statusFilter, sortMode]);

  const uniqueChildNames = [
    ...new Set(linkedChildren.map((c) => `${c.firstName} ${c.lastName}`.trim())),
  ];
  const pageTitle = isParentView
    ? uniqueChildNames.length === 1
      ? `${uniqueChildNames[0]}'s Fundraising`
      : "Your Children's Fundraising"
    : "My Fundraising";

  const subheading = isParentView
    ? "Track your student's fundraising and share their links."
    : "Manage every fundraiser you've ever been part of. Grab your links, check the stats, and celebrate the wins.";

  const hasRosterCampaign = stats.some((s) => s.enableRosterAttribution);

  /* --------------------------- Render --------------------------- */

  return (
    <DashboardPageLayout
      segments={[
        { label: "Dashboard", path: "/dashboard" },
        { label: isParentView ? "Student Fundraising" : "My Fundraising" },
      ]}
    >
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              {pageTitle}
            </h1>
            <p className="text-muted-foreground mt-1">{subheading}</p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/donors?upload=1")}
            className="bg-foreground text-background hover:bg-foreground/90 self-start md:self-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload donors
          </Button>
        </header>

        {loading ? (
          <LoadingSkeleton />
        ) : stats.length === 0 ? (
          <EmptyState isParentView={isParentView} />
        ) : (
          <>
            {/* Hero stats */}
            <section className="flex w-full flex-col gap-4 md:flex-row md:items-stretch">
              <div className="min-w-0 md:flex-[4_1_0%] [&>*]:h-full">
                <LifetimeRaisedCard
                  amount={totalRaisedAll}
                  campaignCount={stats.length}
                  potShare={teamPotShare}
                  sparkline={sparkline}
                />
              </div>
              <div className="min-w-0 md:flex-[3_1_0%] [&>*]:h-full">
                <SupportersCard count={totalSupportersAll} />
              </div>
              <div className="min-w-0 md:flex-[3_1_0%] [&>*]:h-full">
                <BestRankCard rank={bestRank} campaignName={bestRankCampaign} />
              </div>
            </section>

            {/* Filter row */}
            <FilterToolbar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              counts={counts}
              sortMode={sortMode}
              setSortMode={setSortMode}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {/* Campaign list */}
            <section className="space-y-4">
              {visibleStats.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No campaigns match this filter.
                  </CardContent>
                </Card>
              ) : (
                visibleStats.map((stat) =>
                  viewMode === "compact" ? (
                    <CompactCampaignRow
                      key={`${stat.campaignId}-${stat.childOrganizationUserId || "self"}`}
                      stat={stat}
                      onCopy={copyLink}
                    />
                  ) : (
                    <CampaignCard
                      key={`${stat.campaignId}-${stat.childOrganizationUserId || "self"}`}
                      stat={stat}
                      isParentView={isParentView}
                      onCopy={copyLink}
                      onShare={shareLink}
                      onTogglePitch={(id) =>
                        setEditingPitchId(editingPitchId === id ? null : id)
                      }
                      isPitchOpen={editingPitchId === stat.campaignId}
                      onOpenQR={() => setQrDialogStat(stat)}
                      onPitchSaved={() => {
                        setEditingPitchId(null);
                        fetchFundraisingStats();
                      }}
                      onPitchClose={() => setEditingPitchId(null)}
                    />
                  )
                )
              )}
            </section>

            {/* Pro tip removed */}
          </>
        )}

        {/* Connected students / guardians management cards */}
        {isParentView && user?.id && <MyConnectedStudentsCard userId={user.id} />}
        {!isParentView && rosterMembership && (
          <ManageGuardiansCard
            organizationUserId={rosterMembership.id}
            organizationId={rosterMembership.organization_id}
            groupId={
              rosterMembership.group_id || rosterMembership.rosters?.group_id || null
            }
            rosterId={rosterMembership.roster_id}
          />
        )}

        {/* Invite dialog wired to the banner CTA */}
        {!isParentView && rosterMembership && (
          <InviteParentDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            organizationUserId={rosterMembership.id}
            organizationId={rosterMembership.organization_id}
            groupId={
              rosterMembership.group_id || rosterMembership.rosters?.group_id || null
            }
            rosterId={rosterMembership.roster_id}
            onInviteSent={() => setInviteOpen(false)}
          />
        )}
      </div>

      {qrDialogStat && (
        <QRDialog
          open={!!qrDialogStat}
          onOpenChange={(o) => !o && setQrDialogStat(null)}
          url={
            qrDialogStat.hasPersonalLink && qrDialogStat.personalUrl
              ? qrDialogStat.personalUrl
              : `${window.location.origin}/c/${qrDialogStat.campaignSlug}`
          }
          campaignName={qrDialogStat.campaignName}
          participantName={isParentView ? qrDialogStat.childName : undefined}
          logoUrl={pickBrandLogo({
            groupLogo: qrDialogStat.groupLogo,
            schoolLogo: qrDialogStat.schoolLogo,
            orgLogo: qrDialogStat.orgLogo,
          })}
        />
      )}
    </DashboardPageLayout>
  );
}

/* ============================ Subcomponents ============================ */

function ConnectedFamilyBanner({
  guardians,
  onInviteClick,
}: {
  guardians: { firstName: string | null; lastName: string | null }[];
  onInviteClick: () => void;
}) {
  const names = guardians
    .map((g) => `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim())
    .filter(Boolean);
  const visible = names.slice(0, 2);
  const extra = names.length - visible.length;
  const label =
    visible.length === 1
      ? `${visible[0]} is connected as your family member.`
      : visible.length === 2
      ? `${visible[0]} and ${visible[1]} are connected as your family members${
          extra > 0 ? ` and ${extra} other${extra > 1 ? "s" : ""}` : ""
        }.`
      : "Your family members are connected.";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Users className="h-4 w-4" />
        </div>
        <p className="text-sm text-emerald-900">
          <span className="font-medium">{label}</span>{" "}
          <span className="text-emerald-800/80">
            They can see your progress and help share your links.
          </span>
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onInviteClick}
        className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
      >
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        Invite another
      </Button>
    </div>
  );
}

function LifetimeRaisedCard({
  amount,
  campaignCount,
  potShare,
  sparkline,
}: {
  amount: number;
  campaignCount: number;
  potShare: number;
  sparkline: { i: number; v: number }[];
}) {
  return (
    <Card className="bg-foreground text-background border-foreground/10 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs uppercase tracking-wider text-background/60">
                Lifetime raised
              </span>
            </div>
            <div className="font-serif text-4xl font-semibold leading-none">
              {fmtMoney(amount)}
            </div>
            <p className="text-xs text-background/60 leading-snug">
              Across {campaignCount} campaign{campaignCount !== 1 ? "s" : ""}
              {potShare > 0 && <> · you've personally driven {potShare}% of team pot</>}
            </p>
          </div>
          <div className="h-16 w-24 shrink-0 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="hsl(142 76% 56%)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SupportersCard({ count }: { count: number }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Users className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Unique supporters
          </span>
        </div>
        <div className="font-serif text-4xl font-semibold leading-none text-foreground">
          {count}
        </div>
        <p className="text-xs text-muted-foreground">Family, friends &amp; fans</p>
      </CardContent>
    </Card>
  );
}

function BestRankCard({
  rank,
  campaignName,
}: {
  rank: number | null;
  campaignName: string | null;
}) {
  const display = rank && rank !== Infinity ? `#${rank}` : "—";
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Best rank
          </span>
        </div>
        <div className="font-serif text-4xl font-semibold leading-none text-foreground">
          {display}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {campaignName ?? "No ranked campaigns yet"}
        </p>
      </CardContent>
    </Card>
  );
}

function FilterToolbar({
  statusFilter,
  setStatusFilter,
  counts,
  sortMode,
  setSortMode,
  viewMode,
  setViewMode,
}: {
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  counts: { active: number; past: number; all: number };
  sortMode: SortMode;
  setSortMode: (s: SortMode) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}) {
  const tab = (key: StatusFilter, label: string, count: number) => (
    <button
      key={key}
      onClick={() => setStatusFilter(key)}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        statusFilter === key
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5",
          statusFilter === key ? "text-background/70" : "text-muted-foreground/70"
        )}
      >
        ({count})
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-auto items-center gap-1 self-start rounded-full border bg-card p-1">
        {tab("active", "Active", counts.active)}
        {tab("past", "Past", counts.past)}
        {tab("all", "All", counts.all)}
      </div>
      <div className="flex items-center gap-2">
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent activity</SelectItem>
            <SelectItem value="raised">Most raised</SelectItem>
            <SelectItem value="progress">Goal progress</SelectItem>
            <SelectItem value="ending">Ending soonest</SelectItem>
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-md border bg-card">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-l-md",
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="List view"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={cn(
              "p-2 rounded-r-md border-l",
              viewMode === "compact"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Compact view"
          >
            <Rows3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
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

function CampaignCard({
  stat,
  isParentView,
  onCopy,
  onShare,
  onTogglePitch,
  isPitchOpen,
  onOpenQR,
  onPitchSaved,
  onPitchClose,
}: {
  stat: CampaignStat;
  isParentView: boolean;
  onCopy: (url: string) => void;
  onShare: (url: string, name: string, child?: string) => void;
  onTogglePitch: (id: string) => void;
  isPitchOpen: boolean;
  onOpenQR: () => void;
  onPitchSaved: () => void;
  onPitchClose: () => void;
}) {
  const isRoster = stat.enableRosterAttribution;
  const stripeColor = isRoster ? "bg-emerald-500" : "bg-sky-500";
  const progressColor = isRoster ? "bg-emerald-500" : "bg-sky-500";
  const typePill = isRoster
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-sky-200 bg-sky-50 text-sky-700";

  const shareUrl =
    stat.hasPersonalLink && stat.personalUrl
      ? stat.personalUrl
      : `${window.location.origin}/c/${stat.campaignSlug}`;
  const displayUrl = shareUrl.replace(/^https?:\/\//, "");
  const goalLabel = isRoster
    ? isParentView
      ? "GOAL"
      : "MY PERSONAL GOAL"
    : "TEAM GOAL";
  const hasPitch = !!(
    stat.pitchMessage ||
    stat.pitchImageUrl ||
    stat.pitchVideoUrl ||
    stat.pitchRecordedVideoUrl
  );
  const avgGift =
    stat.donationCount > 0 ? stat.totalRaised / stat.donationCount : 0;

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
                  {stat.campaignName}
                </h3>
                <Badge variant="outline" className={cn("text-xs", typePill)}>
                  {isRoster ? "Roster" : "Team"}
                </Badge>
                {hasPitch && (
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-50 text-purple-700 text-xs"
                  >
                    <Mic className="mr-1 h-3 w-3" />
                    Pitch
                  </Badge>
                )}
                {isParentView && stat.childName && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.childName}
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {stat.startDate && fmtShortDate(stat.startDate) && (
                  <span>Started {fmtShortDate(stat.startDate)}</span>
                )}
                {stat.endDate && fmtShortDate(stat.endDate) && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Ends {fmtShortDate(stat.endDate)}</span>
                  </>
                )}
                {isRoster && stat.hasPersonalLink && stat.totalParticipants > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      Rank #{stat.rank} of {stat.totalParticipants}
                    </span>
                  </>
                )}
              </div>
            </div>
            <DaysLeftChip endDate={stat.endDate} />
          </div>

          {/* Coach instructions */}
          {stat.groupDirections && (
            <Alert className="mt-4 bg-muted/50 border-primary/20">
              <MessageSquare className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">
                Instructions from your coach
              </AlertTitle>
              <AlertDescription className="whitespace-pre-wrap text-sm">
                {stat.groupDirections}
              </AlertDescription>
            </Alert>
          )}

          {/* Stat strip */}
          <div className="mt-5 grid gap-5 md:grid-cols-4 md:gap-6">
            {/* Goal column */}
            <div className="md:col-span-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {goalLabel}
              </p>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="font-serif text-lg font-semibold text-foreground">
                  {fmtMoney(stat.totalRaised)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {fmtMoney(stat.personalGoal)}
                  </span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(stat.percentToGoal)}%
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${Math.min(100, stat.percentToGoal)}%` }}
                />
              </div>
            </div>
            <StatColumn label="SUPPORTERS" value={String(stat.uniqueSupporters || 0)} />
            <StatColumn
              label="AVG GIFT"
              value={avgGift > 0 ? fmtMoney(avgGift) : "—"}
            />
            <StatColumn
              label="TOP GIFT"
              value={stat.topGiftAmount ? fmtMoney(stat.topGiftAmount) : "—"}
              caption={stat.topGiftDonorName || undefined}
            />
          </div>

          {/* Notice strip when roster but no personal link */}
          {isRoster && !stat.hasPersonalLink && (
            <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Personal fundraising link not set up yet. Contact your campaign manager to
              get started.
            </div>
          )}

          {/* Link bar */}
          <div className="mt-5 flex flex-col gap-2 rounded-lg border bg-muted/40 px-3 py-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate font-mono">{displayUrl}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1">
              <IconBtn label="Copy link" onClick={() => onCopy(shareUrl)}>
                <Copy className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Show QR code" onClick={onOpenQR}>
                <QrCode className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label="Share"
                onClick={() => onShare(shareUrl, stat.campaignName, stat.childName)}
              >
                <Share2 className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label="Open"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </IconBtn>
              {!isParentView && isRoster && stat.hasPersonalLink && (
                <Button
                  size="sm"
                  onClick={() => onTogglePitch(stat.campaignId)}
                  className="ml-1 whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isPitchOpen ? (
                    <>
                      <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                      Close
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1.5 h-3.5 w-3.5" />
                      {hasPitch ? "Re-record" : "Record pitch"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Inline pitch editor */}
          {!isParentView && isPitchOpen && (
            <>
              <Separator className="my-5" />
              <PitchEditor
                campaignId={stat.campaignId}
                campaignName={stat.campaignName}
                initialPitch={{
                  message: stat.pitchMessage,
                  imageUrl: stat.pitchImageUrl,
                  videoUrl: stat.pitchVideoUrl,
                  recordedVideoUrl: stat.pitchRecordedVideoUrl,
                }}
                onSave={onPitchSaved}
                onClose={onPitchClose}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatColumn({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-serif text-lg font-semibold text-foreground">{value}</p>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
        active && "bg-background text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function CompactCampaignRow({
  stat,
  onCopy,
}: {
  stat: CampaignStat;
  onCopy: (url: string) => void;
}) {
  const isRoster = stat.enableRosterAttribution;
  const stripeColor = isRoster ? "bg-emerald-500" : "bg-sky-500";
  const shareUrl =
    stat.hasPersonalLink && stat.personalUrl
      ? stat.personalUrl
      : `${window.location.origin}/c/${stat.campaignSlug}`;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center">
        <div className={cn("h-12 w-1.5 shrink-0", stripeColor)} aria-hidden />
        <div className="flex flex-1 items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-semibold text-foreground">
              {stat.campaignName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {fmtMoney(stat.totalRaised)} raised · {stat.uniqueSupporters} supporters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DaysLeftChip endDate={stat.endDate} />
            <Button variant="outline" size="sm" onClick={() => onCopy(shareUrl)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy link
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProTipCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700">
        <Zap className="h-4 w-4" />
      </div>
      <p className="text-sm text-sky-900">
        <span className="font-semibold">Pitch videos raise 3.2× more.</span>{" "}
        <span className="text-sky-800/80">Record once, share everywhere.</span>
      </p>
    </div>
  );
}

function EmptyState({ isParentView }: { isParentView: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-14">
        <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="font-serif text-2xl font-semibold mb-2">No active campaigns</h3>
        <p className="max-w-md text-center text-muted-foreground">
          {isParentView
            ? "Your connected students aren't currently enrolled in any fundraising campaigns."
            : "You're not currently part of any fundraising campaigns. Contact your campaign manager to get started!"}
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}