import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Copy, Share2, DollarSign, Calendar, Clock, Medal, MessageSquare, Mail, Facebook, Twitter, MessageCircle, Link2, Target, TrendingUp, ArrowRight, Mic, QrCode, Sparkles, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import ManageGuardiansCard from "./ManageGuardiansCard";
import { RecordPitchDialog } from "@/components/player/RecordPitchDialog";
import { ShareMenu } from "@/components/ShareMenu";
import { QRDialog, pickBrandLogo } from "@/components/player/QRDialog";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  goal_amount: number | null;
  amount_raised: number | null;
  start_date: string | null;
  end_date: string | null;
  status: boolean;
  enable_roster_attribution: boolean;
  group_id: string;
  groupLogo?: string | null;
  schoolLogo?: string | null;
  orgLogo?: string | null;
  groupName?: string | null;
  schoolOrOrgName?: string | null;
  campaignDescription?: string | null;
}

interface AttributedCampaign extends Campaign {
  personalSlug: string;
  personalUrl: string;
  totalRaised: number;
  donationCount: number;
  uniqueSupporters: number;
  rank: number;
  totalParticipants: number;
  personalGoal: number;
  percentToGoal: number;
  childName?: string; // For parent view
  childOrganizationUserId?: string; // For parent view
}

interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  totalRaised: number;
  donationCount: number;
  isCurrentUser: boolean;
}

interface LinkedChild {
  organizationUserId: string;
  firstName: string;
  lastName: string;
  rosterId: number | null;
  groupId: string | null;
  organizationId: string;
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const { activeGroup } = useActiveGroup();
  const { toast } = useToast();
  const [currentCampaigns, setCurrentCampaigns] = useState<Campaign[]>([]);
  const [attributedCampaigns, setAttributedCampaigns] = useState<AttributedCampaign[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParentView, setIsParentView] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [rosterMembership, setRosterMembership] = useState<{
    id: string;
    organization_id: string;
    group_id: string | null;
    roster_id: number | null;
  } | null>(null);
  const [pitchDialogOpen, setPitchDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPlayerData();
    }
  }, [user, activeGroup?.id]);

  const fetchPlayerData = async () => {
    try {
      // First, check if user is a parent/guardian (has linked_organization_user_id)
      const { data: parentLinks, error: parentError } = await supabase
        .from('organization_user')
        .select('id, linked_organization_user_id, organization_id, group_id')
        .eq('user_id', user?.id)
        .eq('active_user', true)
        .not('linked_organization_user_id', 'is', null);

      if (parentError) throw parentError;

      // If user is a parent, fetch their children's data
      if (parentLinks && parentLinks.length > 0) {
        setIsParentView(true);
        await fetchParentData(parentLinks);
        return;
      }

      // Otherwise, proceed with regular player logic
      setIsParentView(false);
      
      // Step 1: Get user's roster memberships with roster IDs
      const { data: rosterMemberships, error: rosterError } = await supabase
        .from('organization_user')
        .select('id, roster_id, organization_id')
        .eq('user_id', user?.id)
        .eq('active_user', true)
        .not('roster_id', 'is', null);

      if (rosterError) throw rosterError;

      if (!rosterMemberships || rosterMemberships.length === 0) {
        setLoading(false);
        return;
      }

      // Step 2: Get group IDs from rosters table
      const rosterIds = rosterMemberships.map(m => m.roster_id).filter(Boolean);
      const { data: rosters, error: rostersError } = await supabase
        .from('rosters')
        .select('id, group_id')
        .in('id', rosterIds);

      if (rostersError) throw rostersError;

      // Filter by active group if one is selected
      let filteredRosters = rosters || [];
      if (activeGroup) {
        filteredRosters = filteredRosters.filter(r => r.group_id === activeGroup.id);
      }

      const groupIds = filteredRosters.map(r => r.group_id).filter(Boolean);

      if (groupIds.length === 0) {
        setCurrentCampaigns([]);
        setAttributedCampaigns([]);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch ALL campaigns for these groups (not just roster-enabled ones)
      const { data: allCampaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, slug, goal_amount, amount_raised, start_date, end_date, status, enable_roster_attribution, group_id, groups:groups(logo_url, schools(logo_file), organizations(logo_url))')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      if (!allCampaigns || allCampaigns.length === 0) {
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Categorize campaigns - only active ones
      const current: Campaign[] = [];

      allCampaigns.forEach(campaign => {
        const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
        const isActive = campaign.status === true;
        const isPast = endDate && endDate < today;

        if (isActive && !isPast) {
          const grp: any = (campaign as any).groups;
          current.push({
            ...campaign,
            groupLogo: grp?.logo_url ?? null,
            schoolLogo: grp?.schools?.logo_file ?? null,
            orgLogo: grp?.organizations?.logo_url ?? null,
            groupName: grp?.group_name ?? null,
            schoolOrOrgName: grp?.schools?.school_name ?? grp?.organizations?.name ?? null,
            campaignDescription: (campaign as any).description ?? null,
          } as Campaign);
        }
      });

      setCurrentCampaigns(current);

      // Store roster membership for ManageGuardiansCard
      if (rosterMemberships.length > 0) {
        const membership = rosterMemberships[0];
        const roster = filteredRosters.find(r => r.id === membership.roster_id);
        setRosterMembership({
          id: membership.id,
          organization_id: membership.organization_id,
          group_id: roster?.group_id || null,
          roster_id: membership.roster_id,
        });
      }

      // Fetch attributed campaign stats (campaigns where user has roster_member_campaign_links)
      const rosterMembership = rosterMemberships[0];
      const { data: myLinks, error: linksError } = await supabase
        .from('roster_member_campaign_links')
        .select('campaign_id, slug')
        .eq('roster_member_id', rosterMembership.id);

      if (linksError) {
        console.error('Error fetching links:', linksError);
      }

      if (myLinks && myLinks.length > 0) {
        const attributedPromises = myLinks.map(async (link) => {
          const campaign = allCampaigns.find(c => c.id === link.campaign_id);
          if (!campaign) return null;

          try {
            const { data: statsData, error: statsError } = await supabase.functions.invoke(
              'get-roster-member-stats',
              {
                body: {
                  campaignId: campaign.id,
                  rosterMemberId: rosterMembership.id,
                },
              }
            );

            if (statsError) {
              console.error('Error fetching stats:', statsError);
              return null;
            }

            const grp: any = (campaign as any).groups;
            return {
              ...campaign,
              groupLogo: grp?.logo_url ?? null,
              schoolLogo: grp?.schools?.logo_file ?? null,
              orgLogo: grp?.organizations?.logo_url ?? null,
              personalSlug: link.slug,
              personalUrl: `${window.location.origin}/c/${campaign.slug}/${link.slug}`,
              ...statsData,
            } as AttributedCampaign;
          } catch (err) {
            console.error('Error fetching stats:', err);
            return null;
          }
        });

        const resolvedAttributed = (await Promise.all(attributedPromises)).filter(Boolean) as AttributedCampaign[];
        setAttributedCampaigns(resolvedAttributed);
      }

      // Fetch leaderboard data - top 10 fundraisers on the same roster(s)
      await fetchLeaderboard(rosterIds, rosterMemberships[0].organization_id);

    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentData = async (parentLinks: { id: string; linked_organization_user_id: string | null; organization_id: string; group_id: string | null }[]) => {
    try {
      const linkedIds = parentLinks.map(p => p.linked_organization_user_id).filter(Boolean) as string[];

      if (linkedIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get children's organization_user records (which have roster_id)
      const { data: childrenRecords, error: childrenError } = await supabase
        .from('organization_user')
        .select('id, roster_id, organization_id, user_id')
        .in('id', linkedIds)
        .eq('active_user', true);

      if (childrenError) throw childrenError;

      if (!childrenRecords || childrenRecords.length === 0) {
        setLoading(false);
        return;
      }

      // Get children's profiles
      const childUserIds = childrenRecords.map(c => c.user_id).filter(Boolean);
      const { data: childProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', childUserIds);

      if (profilesError) throw profilesError;

      const profilesMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      childProfiles?.forEach(p => {
        profilesMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
      });

      // Get roster info for each child
      const rosterIds = childrenRecords.map(c => c.roster_id).filter(Boolean) as number[];
      const { data: rosters, error: rostersError } = await supabase
        .from('rosters')
        .select('id, group_id')
        .in('id', rosterIds);

      if (rostersError) throw rostersError;

      const rosterGroupMap: Record<number, string | null> = {};
      rosters?.forEach(r => {
        rosterGroupMap[r.id] = r.group_id;
      });

      // Build linked children array
      const children: LinkedChild[] = childrenRecords.map(child => {
        const profile = child.user_id ? profilesMap[child.user_id] : null;
        return {
          organizationUserId: child.id,
          firstName: profile?.first_name || 'Child',
          lastName: profile?.last_name || '',
          rosterId: child.roster_id,
          groupId: child.roster_id ? rosterGroupMap[child.roster_id] || null : null,
          organizationId: child.organization_id,
        };
      });

      setLinkedChildren(children);

      // Filter by active group if one is selected
      let filteredChildren = children;
      if (activeGroup) {
        filteredChildren = children.filter(c => c.groupId === activeGroup.id);
      }

      const groupIds = filteredChildren.map(c => c.groupId).filter(Boolean) as string[];

      if (groupIds.length === 0) {
        setCurrentCampaigns([]);
        setAttributedCampaigns([]);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch campaigns for children's groups
      const { data: allCampaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, slug, goal_amount, amount_raised, start_date, end_date, status, enable_roster_attribution, group_id, description, groups:groups(logo_url, group_name, schools(school_name, logo_file), organizations(name, logo_url))')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      if (!allCampaigns || allCampaigns.length === 0) {
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Categorize campaigns - only active ones
      const current: Campaign[] = [];

      allCampaigns.forEach(campaign => {
        const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
        const isActive = campaign.status === true;
        const isPast = endDate && endDate < today;

        if (isActive && !isPast) {
          const grp: any = (campaign as any).groups;
          current.push({
            ...campaign,
            groupLogo: grp?.logo_url ?? null,
            schoolLogo: grp?.schools?.logo_file ?? null,
            orgLogo: grp?.organizations?.logo_url ?? null,
            groupName: grp?.group_name ?? null,
            schoolOrOrgName: grp?.schools?.school_name ?? grp?.organizations?.name ?? null,
            campaignDescription: (campaign as any).description ?? null,
          } as Campaign);
        }
      });

      setCurrentCampaigns(current);

      // For each child, fetch their attributed campaign stats
      const allAttributedCampaigns: AttributedCampaign[] = [];

      for (const child of filteredChildren) {
        if (!child.rosterId) continue;

        const { data: childLinks, error: linksError } = await supabase
          .from('roster_member_campaign_links')
          .select('campaign_id, slug')
          .eq('roster_member_id', child.organizationUserId);

        if (linksError) {
          console.error('Error fetching links for child:', linksError);
          continue;
        }

        if (childLinks && childLinks.length > 0) {
          const attributedPromises = childLinks.map(async (link) => {
            const campaign = allCampaigns.find(c => c.id === link.campaign_id);
            if (!campaign) return null;

            try {
              const { data: statsData, error: statsError } = await supabase.functions.invoke(
                'get-roster-member-stats',
                {
                  body: {
                    campaignId: campaign.id,
                    rosterMemberId: child.organizationUserId,
                  },
                }
              );

              if (statsError) {
                console.error('Error fetching stats:', statsError);
                return null;
              }

              const grp: any = (campaign as any).groups;
              return {
                ...campaign,
                groupLogo: grp?.logo_url ?? null,
                schoolLogo: grp?.schools?.logo_file ?? null,
                orgLogo: grp?.organizations?.logo_url ?? null,
                personalSlug: link.slug,
                personalUrl: `${window.location.origin}/c/${campaign.slug}/${link.slug}`,
                childName: `${child.firstName} ${child.lastName}`.trim(),
                childOrganizationUserId: child.organizationUserId,
                ...statsData,
              } as AttributedCampaign;
            } catch (err) {
              console.error('Error fetching stats:', err);
              return null;
            }
          });

          const resolvedAttributed = (await Promise.all(attributedPromises)).filter(Boolean) as AttributedCampaign[];
          allAttributedCampaigns.push(...resolvedAttributed);
        }
      }

      setAttributedCampaigns(allAttributedCampaigns);

      // Fetch leaderboard for first child's roster
      if (rosterIds.length > 0 && children[0]) {
        await fetchLeaderboard(rosterIds, children[0].organizationId);
      }

    } catch (error) {
      console.error('Error fetching parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (rosterIds: number[], organizationId: string) => {
    try {
      // Get all teammates on the same rosters
      const { data: teammates, error: teammatesError } = await supabase
        .from('organization_user')
        .select('id, user_id')
        .in('roster_id', rosterIds)
        .eq('active_user', true);

      if (teammatesError) throw teammatesError;

      if (!teammates || teammates.length === 0) return;

      // Get all roster member IDs and user IDs
      const rosterMemberIds = teammates.map(t => t.id);
      const userIds = teammates.map(t => t.user_id).filter(Boolean);

      // Fetch profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      profiles?.forEach(p => {
        profilesMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
      });

      // Get donation totals for each roster member from orders
      const { data: donationData, error: donationError } = await supabase
        .from('orders')
        .select('attributed_roster_member_id, items')
        .in('attributed_roster_member_id', rosterMemberIds)
        .in('status', ['succeeded', 'completed']);

      if (donationError) throw donationError;

      // Aggregate donations by roster member
      const donationsByMember: Record<string, { total: number; count: number }> = {};
      donationData?.forEach(order => {
        const memberId = order.attributed_roster_member_id;
        if (memberId) {
          if (!donationsByMember[memberId]) {
            donationsByMember[memberId] = { total: 0, count: 0 };
          }
          // Calculate total from items (price_at_purchase * quantity for each item)
          const itemsTotal = (order.items as any[])?.reduce((sum, item) => 
            sum + (item.price_at_purchase || 0) * (item.quantity || 1), 0) || 0;
          donationsByMember[memberId].total += itemsTotal;
          donationsByMember[memberId].count += 1;
        }
      });

      // Build leaderboard entries
      const allEntries: LeaderboardEntry[] = teammates
        .map(teammate => {
          const profile = profilesMap[teammate.user_id] || null;
          const donations = donationsByMember[teammate.id] || { total: 0, count: 0 };
          
          return {
            userId: teammate.user_id,
            firstName: profile?.first_name || 'Unknown',
            lastName: profile?.last_name || '',
            totalRaised: donations.total,
            donationCount: donations.count,
            isCurrentUser: teammate.user_id === user?.id,
          };
        });

      const hasAnyDonations = allEntries.some(e => e.totalRaised > 0);
      const leaderboardEntries: LeaderboardEntry[] = (
        hasAnyDonations
          ? [...allEntries].sort((a, b) => b.totalRaised - a.totalRaised)
          : [...allEntries].sort((a, b) =>
              (a.firstName || '').localeCompare(b.firstName || '') ||
              (a.lastName || '').localeCompare(b.lastName || '')
            )
      ).slice(0, 10);

      setLeaderboard(leaderboardEntries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const copyLink = (url: string, isPersonal: boolean = false, childName?: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: isPersonal 
        ? (childName ? `${childName}'s fundraising link has been copied` : "Your personal fundraising link has been copied")
        : "Campaign link has been copied",
    });
  };

  const shareLink = async (url: string, campaignName: string, isPersonal: boolean = false, childName?: string) => {
    const shareTitle = isPersonal 
      ? (childName ? `Support ${childName} in ${campaignName}` : `Support me in ${campaignName}`)
      : `Support ${campaignName}`;
    const shareText = isPersonal 
      ? (childName ? `Help ${childName} reach their fundraising goal for ${campaignName}!` : `Help me reach my fundraising goal for ${campaignName}!`)
      : `Support our ${campaignName} fundraiser!`;
      
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink(url, isPersonal, childName);
    }
  };

  const getCampaignUrl = (campaign: Campaign) => {
    return `${window.location.origin}/c/${campaign.slug}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="w-6 text-center text-muted-foreground">{rank}</span>;
  };

  // Stats for attributed campaigns only
  const totalRaisedAll = attributedCampaigns.reduce((sum, s) => sum + (s.totalRaised || 0), 0);
  const totalSupportersAll = attributedCampaigns.reduce((sum, s) => sum + (s.uniqueSupporters || 0), 0);
  const bestRank = attributedCampaigns.length > 0 
    ? Math.min(...attributedCampaigns.map(s => s.rank || 999)) 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const hasNoCampaigns = currentCampaigns.length === 0 && attributedCampaigns.length === 0;

  if (hasNoCampaigns) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Campaigns</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {isParentView 
              ? "Your child's team doesn't have any active campaigns right now. Contact their coach or team manager when fundraising begins!"
              : "Your team doesn't have any active campaigns right now. Contact your coach or team manager when fundraising begins!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get first child name for single-child parent view
  const singleChildName = linkedChildren.length === 1 ? `${linkedChildren[0].firstName} ${linkedChildren[0].lastName}`.trim() : null;

  // ============================================================
  // PARENT VIEW — keep existing layout (out of scope for redesign)
  // ============================================================
  if (isParentView) {
    return (
      <div className="space-y-6">
        {/* Quick Stats - Only show if there are attributed campaigns */}
        {attributedCampaigns.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {singleChildName ? `${singleChildName}'s Total Raised` : "Total Raised"}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRaisedAll.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From {attributedCampaigns.length} attributed campaign{attributedCampaigns.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {singleChildName ? `${singleChildName}'s Supporters` : "Supporters"}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSupportersAll}</div>
                <p className="text-xs text-muted-foreground">
                  {singleChildName ? `Unique donors via ${singleChildName}'s links` : "Unique donors"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Rank</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bestRank > 0 && bestRank < 999 ? `#${bestRank}` : '-'}
                </div>
                <p className="text-xs text-muted-foreground">Highest ranking</p>
              </CardContent>
            </Card>
          </div>
        )}

        {attributedCampaigns.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>
                    {singleChildName ? `${singleChildName}'s Fundraising` : (linkedChildren.length > 1 ? "Your Children's Fundraising" : "Fundraising")}
                  </CardTitle>
                  <CardDescription>Campaigns with personal fundraising links - share to help raise funds!</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {attributedCampaigns.map((campaign) => (
                <Card key={`${campaign.id}-${campaign.childOrganizationUserId || 'self'}`} className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        {linkedChildren.length > 1 && campaign.childName && (
                          <Badge variant="outline" className="mt-1 mb-1">{campaign.childName}</Badge>
                        )}
                        <p className="text-sm text-muted-foreground">Rank #{campaign.rank} of {campaign.totalParticipants}</p>
                      </div>
                      <Badge variant="secondary">{campaign.donationCount} donation{campaign.donationCount !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{campaign.childName ? `${campaign.childName}'s Progress` : "Progress"}</span>
                        <span className="font-medium">${campaign.totalRaised.toFixed(2)} / ${campaign.personalGoal.toFixed(2)}</span>
                      </div>
                      <Progress value={campaign.percentToGoal} className="h-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(campaign.personalUrl, true, campaign.childName)}>
                        <Copy className="h-4 w-4 mr-2" />
                        {linkedChildren.length > 1 ? `Copy ${campaign.childName?.split(' ')[0]}'s Link` : "Copy Link"}
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" onClick={() => shareLink(campaign.personalUrl, campaign.name, true, campaign.childName)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ============================================================
  // PLAYER VIEW — REDESIGNED
  // ============================================================
  const firstName =
    (user?.user_metadata as any)?.first_name ||
    leaderboard.find(e => e.isCurrentUser)?.firstName ||
    "there";
  const lastName =
    (user?.user_metadata as any)?.last_name ||
    leaderboard.find(e => e.isCurrentUser)?.lastName ||
    "";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // Headline campaign: prefer roster-attribution; fall back to first attributed
  const headline =
    attributedCampaigns.find(c => c.enable_roster_attribution) ||
    attributedCampaigns[0] ||
    null;

  // Other campaigns: attributed (excluding headline) then team-only (excluding any duplicates)
  const otherAttributed = attributedCampaigns.filter(c => c.id !== headline?.id);
  const teamOnly = currentCampaigns.filter(
    c => !attributedCampaigns.some(a => a.id === c.id)
  );

  // Gap-to-next computation from leaderboard
  const currentEntryIdx = leaderboard.findIndex(e => e.isCurrentUser);
  const aheadEntry = currentEntryIdx > 0 ? leaderboard[currentEntryIdx - 1] : null;
  const gapToNext = aheadEntry
    ? Math.max(0, aheadEntry.totalRaised - leaderboard[currentEntryIdx].totalRaised)
    : 0;

  // Intelligent, campaign-aware headline message
  const headlineMessage: { lead: string; highlight: string } = (() => {
    if (!headline) {
      return { lead: "No active campaigns yet —", highlight: "check back soon." };
    }
    if (headline.enable_roster_attribution) {
      if (aheadEntry && gapToNext > 0) {
        return {
          lead: "You're",
          highlight: `$${gapToNext.toFixed(0)} away from passing ${aheadEntry.firstName}.`,
        };
      }
      if (currentEntryIdx === 0 && leaderboard.length > 1) {
        return { lead: "You're", highlight: "#1 on the team — keep widening the lead." };
      }
      if ((headline.totalRaised || 0) === 0) {
        return { lead: "Share your link to", highlight: "land your first donation." };
      }
      if (!headline.personalGoal || headline.personalGoal <= 0) {
        return { lead: "Set a personal goal and", highlight: `start raising for ${headline.name}.` };
      }
      return { lead: "Keep going —", highlight: `every share gets you closer to your goal.` };
    }
    // Team-only campaign
    const teamRemaining = Math.max(0, (headline.goal_amount || 0) - (headline.amount_raised || 0));
    if (teamRemaining > 0) {
      return {
        lead: "Your team is",
        highlight: `$${teamRemaining.toLocaleString()} from the ${headline.name} goal — every share helps.`,
      };
    }
    return { lead: "Your team", highlight: `crushed the ${headline.name} goal — keep the momentum.` };
  })();

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";

  // Days remaining helper
  const daysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Pre-filled share message helpers
  const buildShareMessage = (campaignName: string, url: string) =>
    `Help me reach my goal for ${campaignName} — every donation counts! ${url}`;

  const openShare = (kind: 'sms' | 'email' | 'facebook' | 'twitter' | 'whatsapp', campaignName: string, url: string) => {
    const msg = buildShareMessage(campaignName, url);
    const enc = encodeURIComponent(msg);
    const encUrl = encodeURIComponent(url);
    const subject = encodeURIComponent(`Support me in ${campaignName}`);
    let target = '';
    switch (kind) {
      case 'sms':      target = `sms:?&body=${enc}`; break;
      case 'email':    target = `mailto:?subject=${subject}&body=${enc}`; break;
      case 'facebook': target = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`; break;
      case 'twitter':  target = `https://twitter.com/intent/tweet?text=${enc}`; break;
      case 'whatsapp': target = `https://wa.me/?text=${enc}`; break;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-gradient-to-br from-sidebar via-sidebar to-primary/40 text-sidebar-foreground shadow-lg">
        {/* Decorative radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, hsl(var(--primary) / 0.35), transparent 55%), radial-gradient(circle at 10% 90%, hsl(var(--primary) / 0.20), transparent 50%)",
          }}
        />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* LEFT: greeting + pills + headline + stats */}
            <div className="flex-1 min-w-0">
              {/* Pills row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {headline?.enable_roster_attribution && (
                  <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary border-0">
                    <Target className="h-3 w-3 mr-1" /> Roster Challenge
                  </Badge>
                )}
                {headline?.end_date && daysLeft(headline.end_date) !== null && (
                  <Badge
                    variant="outline"
                    className={
                      (daysLeft(headline.end_date) ?? 99) <= 7
                        ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
                        : "border-white/20 bg-white/10 text-sidebar-foreground/90"
                    }
                  >
                    <Clock className="h-3 w-3 mr-1" /> {daysLeft(headline.end_date)} Days Left
                  </Badge>
                )}
                {headline && (
                  <Badge variant="outline" className="border-white/20 bg-white/10 text-sidebar-foreground/90">
                    <Users className="h-3 w-3 mr-1" /> {headline.uniqueSupporters} Supporters
                  </Badge>
                )}
              </div>

              <p className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/60 font-semibold">
                {greeting}, {firstName}
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-2 leading-tight">
                <span className="text-sidebar-foreground/95">{headlineMessage.lead}</span>{" "}
                <span className="italic bg-gradient-to-r from-primary-foreground to-primary-foreground/70 bg-clip-text text-transparent">
                  {headlineMessage.highlight}
                </span>
              </h1>

              {/* Stat trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">My Raised</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">${totalRaisedAll.toFixed(0)}</p>
                  <p className="text-xs text-sidebar-foreground/60 mt-1">
                    Across {attributedCampaigns.length} campaign{attributedCampaigns.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">Team Rank</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">
                    {bestRank > 0 && bestRank < 999 ? `#${bestRank}` : '—'}
                    {leaderboard.length > 0 && (
                      <span className="text-base font-normal text-sidebar-foreground/60"> / {leaderboard.length}</span>
                    )}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 mt-1">On your team</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">Supporters</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{totalSupportersAll}</p>
                  <p className="text-xs text-sidebar-foreground/60 mt-1">Unique donors</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Player Card */}
            <div className="lg:w-72 shrink-0">
              <div className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                {/* Watermark initials */}
                <div
                  aria-hidden
                  className="absolute -right-4 -bottom-6 text-[7rem] font-black leading-none text-white/5 select-none pointer-events-none"
                >
                  {initials}
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60 font-semibold">Player Card</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold ring-2 ring-white/20">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{firstName} {lastName}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 mt-1 truncate">
                      Player{activeGroup?.group_name ? ` · ${activeGroup.group_name}` : ''}
                    </p>
                  </div>
                </div>
                {headline && (
                  <Button
                    size="sm"
                    className="relative mt-4 w-full bg-white text-sidebar hover:bg-white/90 font-semibold"
                    onClick={() => shareLink(headline.personalUrl, headline.name, true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share My Link
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          {headline && (
            <>
              <div className="my-6 h-px bg-white/10" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-sm text-sidebar-foreground/80 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-foreground/80" />
                  {headline.enable_roster_attribution
                    ? "Tip: players who share 3+ times raise 3× more."
                    : "Share the team page to help reach the goal."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {headline.enable_roster_attribution && rosterMembership && (
                    <Button
                      size="sm"
                      className="bg-white text-sidebar hover:bg-white/90 font-semibold"
                      onClick={() => setPitchDialogOpen(true)}
                    >
                      <Mic className="h-4 w-4 mr-2" /> Record My Pitch
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setQrDialogOpen(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" /> Show My QR
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => shareLink(headline.personalUrl, headline.name, true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" /> Share Link
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pitch + QR dialogs */}
      {headline && (
        <>
          <RecordPitchDialog
            open={pitchDialogOpen}
            onOpenChange={setPitchDialogOpen}
            campaignId={headline.id}
            campaignName={headline.name}
            onSaved={() => fetchPlayerData()}
          />
          <QRDialog
            open={qrDialogOpen}
            onOpenChange={setQrDialogOpen}
            url={headline.personalUrl}
            campaignName={headline.name}
            participantName={firstName}
            logoUrl={pickBrandLogo({
              groupLogo: headline.groupLogo,
              schoolLogo: headline.schoolLogo,
              orgLogo: headline.orgLogo,
            })}
            schoolOrOrgName={headline.schoolOrOrgName}
            groupName={headline.groupName}
            campaignDescription={headline.campaignDescription}
          />
        </>
      )}

      {/* ====================== HEADLINE CHALLENGE ======================= */}
      {headline && (
        <Card className="border border-border rounded-lg overflow-hidden shadow-sm border-t-4 border-t-primary p-0 gap-0">
          {/* Header zone */}
          <div className="bg-muted/30 border-b px-6 py-5">
            <div className="grid lg:grid-cols-2 gap-4 items-start">
              {/* Left: pills + title */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    <Target className="h-3 w-3 mr-1" /> Roster Challenge
                  </Badge>
                  {headline.end_date && daysLeft(headline.end_date) !== null && (
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      <Clock className="h-3 w-3 mr-1" /> {daysLeft(headline.end_date)} Days Left
                    </Badge>
                  )}
                  {headline.end_date && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Ends {new Date(headline.end_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight leading-tight">{headline.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">Your Headline Challenge</p>
              </div>

              {/* Right: Team Raised */}
              {(headline.goal_amount || 0) > 0 && (
                <div className="lg:text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Team Raised</p>
                  <p className="text-2xl font-bold tabular-nums">
                    ${(headline.amount_raised || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="text-base font-medium text-muted-foreground">
                      {' '}/ ${(headline.goal_amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </p>
                  <Progress
                    value={Math.min(((headline.amount_raised || 0) / (headline.goal_amount || 1)) * 100, 100)}
                    className="h-2 mt-2 bg-primary/10 [&>div]:bg-primary"
                  />
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2">
              {/* Left content zone — Personal goal + share toolkit */}
              <div className="bg-background p-6 space-y-5 lg:border-r border-t lg:border-t-0">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">My Personal Goal</p>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-bold text-primary">
                      ${headline.totalRaised.toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of ${headline.personalGoal.toFixed(0)} ({Math.round(headline.percentToGoal)}%)
                    </span>
                  </div>
                  <Progress value={headline.percentToGoal} className="h-3" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Your Personal Link</p>
                  <div className="flex items-center gap-2 bg-muted/40 rounded-md px-3 py-2 border">
                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{headline.personalUrl.replace(/^https?:\/\//, '')}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => copyLink(headline.personalUrl, true)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1" onClick={() => openShare('sms', headline.name, headline.personalUrl)}>
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-[10px]">Text</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1" onClick={() => openShare('email', headline.name, headline.personalUrl)}>
                      <Mail className="h-4 w-4" />
                      <span className="text-[10px]">Email</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1" onClick={() => openShare('facebook', headline.name, headline.personalUrl)}>
                      <Facebook className="h-4 w-4" />
                      <span className="text-[10px]">Facebook</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1" onClick={() => openShare('twitter', headline.name, headline.personalUrl)}>
                      <Twitter className="h-4 w-4" />
                      <span className="text-[10px]">X</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1" onClick={() => openShare('whatsapp', headline.name, headline.personalUrl)}>
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-[10px]">WhatsApp</span>
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Tip: Players who share 5+ times raise 3× more on average.
                  </p>
                </div>
              </div>

              {/* Right content zone — Team Leaderboard */}
              <div className="bg-primary/[0.03] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Team Leaderboard</p>
                  </div>
                  {leaderboard.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {leaderboard.length > 5 ? `Top 5 of ${leaderboard.length}+` : `${leaderboard.length} members`}
                    </span>
                  )}
                </div>
                {leaderboard.length > 0 && !leaderboard.some(e => e.totalRaised > 0) && (
                  <p className="text-xs text-muted-foreground mb-3 italic">
                    No donations yet — share your link to take the lead.
                  </p>
                )}
                <div className="space-y-1.5">
                  {leaderboard.slice(0, 5).map((entry, i) => {
                    const isZero = entry.totalRaised <= 0;
                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between px-3 py-2 rounded-md ${
                          entry.isCurrentUser
                            ? 'bg-primary/5 border border-primary/20'
                            : 'bg-background border border-border/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 text-center">{getRankIcon(i + 1)}</span>
                          <span className={`text-sm truncate ${entry.isCurrentUser ? 'font-semibold' : 'font-medium'}`}>
                            {entry.firstName} {entry.lastName}
                          </span>
                          {entry.isCurrentUser && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">YOU</Badge>
                          )}
                        </div>
                        <span className={`text-sm tabular-nums ${isZero ? 'text-muted-foreground' : 'font-semibold'}`}>
                          ${entry.totalRaised.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {headline?.slug && leaderboard.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                      <Link to={`/dashboard/my-fundraising/leaderboard/${headline.slug}`}>
                        View full leaderboard
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                )}
                {gapToNext > 0 && aheadEntry && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    <span className="font-semibold text-primary">${gapToNext.toFixed(0)}</span> separates you from #{currentEntryIdx}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================= OTHER CAMPAIGNS ======================== */}
      {(otherAttributed.length > 0 || teamOnly.length > 0) && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Other Campaigns
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {otherAttributed.map(campaign => {
              const dl = daysLeft(campaign.end_date);
              return (
                <Card key={campaign.id} className="border-l-4 border-l-primary/60">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold leading-tight">{campaign.name}</h4>
                      {dl !== null && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Clock className="h-3 w-3 mr-1" /> {dl}d Left
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] mb-3">
                      Roster Challenge
                    </Badge>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">My Progress</span>
                        <span className="font-medium">${campaign.totalRaised.toFixed(0)} / ${campaign.personalGoal.toFixed(0)}</span>
                      </div>
                      <Progress value={campaign.percentToGoal} className="h-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(campaign.personalUrl, true)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" onClick={() => shareLink(campaign.personalUrl, campaign.name, true)}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {teamOnly.map(campaign => {
              const dl = daysLeft(campaign.end_date);
              const goalAmount = campaign.goal_amount || 0;
              const amountRaised = campaign.amount_raised || 0;
              const progress = goalAmount > 0 ? (amountRaised / goalAmount) * 100 : 0;
              const campaignUrl = getCampaignUrl(campaign);
              return (
                <Card key={campaign.id} className="border-l-4 border-l-muted-foreground/30">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold leading-tight">{campaign.name}</h4>
                      {dl !== null && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Clock className="h-3 w-3 mr-1" /> {dl}d Left
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] mb-3">Team Campaign</Badge>
                    {goalAmount > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team Progress</span>
                          <span className="font-medium">${amountRaised.toFixed(0)} / ${goalAmount.toFixed(0)}</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(campaignUrl, false)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" onClick={() => shareLink(campaignUrl, campaign.name, false)}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================ FAMILY ============================== */}
      {rosterMembership && (
        <ManageGuardiansCard
          organizationUserId={rosterMembership.id}
          organizationId={rosterMembership.organization_id}
          groupId={rosterMembership.group_id}
          rosterId={rosterMembership.roster_id}
        />
      )}
    </div>
  );
}
