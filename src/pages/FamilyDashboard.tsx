import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast as shadToast } from "@/hooks/use-toast";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, DollarSign, Trophy, Target, Copy, Share2, QrCode, Medal, Heart, Loader2, Zap, MessageCircle, ArrowDown, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { QRDialog, pickBrandLogo } from "@/components/player/QRDialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ShareMenu } from "@/components/ShareMenu";

interface GroupLeader {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  groupName: string;
  userType: string;
}

interface LinkedChild {
  id: string;
  organizationUserId: string;
  firstName: string;
  lastName: string;
  groupName: string | null;
  organizationName: string;
}

interface ChildCampaignStats {
  childId: string;
  childName: string;
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  enableRosterAttribution: boolean;
  hasPersonalLink: boolean;
  personalUrl: string | null;
  totalRaised: number;
  personalGoal: number;
  percentToGoal: number;
  donationCount: number;
  uniqueSupporters: number;
  rank: number;
  totalParticipants: number;
  groupLogo?: string | null;
  schoolLogo?: string | null;
  orgLogo?: string | null;
  groupName?: string | null;
  schoolOrOrgName?: string | null;
  campaignDescription?: string | null;
}

interface RecentDonation {
  id: string;
  amount: number;
  donorName: string;
  childName: string;
  campaignName: string;
  timestamp: string;
}

const FamilyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [campaignStats, setCampaignStats] = useState<ChildCampaignStats[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [qrTarget, setQrTarget] = useState<{
    shareUrl: string;
    childName: string;
    campaignName: string;
    logoUrl?: string;
    schoolOrOrgName?: string | null;
    groupName?: string | null;
    campaignDescription?: string | null;
  } | null>(null);
  
  // Quick Actions state
  const [messageCoachOpen, setMessageCoachOpen] = useState(false);
  const [groupLeaders, setGroupLeaders] = useState<GroupLeader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const recentDonationsRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (user?.id) {
      fetchFamilyData();
    }
  }, [user?.id]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);

      // First, get the parent's organization_user records that have linked children
      const { data: parentOrgUsers, error: parentError } = await supabase
        .from('organization_user')
        .select(`
          id,
          linked_organization_user_id,
          organization_id
        `)
        .eq('user_id', user!.id)
        .eq('active_user', true)
        .not('linked_organization_user_id', 'is', null);

      if (parentError) throw parentError;
      if (!parentOrgUsers || parentOrgUsers.length === 0) {
        setLoading(false);
        return;
      }

      // Get the linked children's organization_user records
      const childOrgUserIds = parentOrgUsers.map(p => p.linked_organization_user_id).filter(Boolean) as string[];
      
      const { data: childOrgUsers, error: childError } = await supabase
        .from('organization_user')
        .select(`
          id,
          user_id,
          group_id,
          organization_id,
          roster_id,
          rosters(id, group_id),
          groups:groups(group_name),
          organization:organizations(name)
        `)
        .in('id', childOrgUserIds)
        .eq('active_user', true);

      if (childError) throw childError;

      // Get profiles for the children
      const childUserIds = (childOrgUsers || []).map(c => c.user_id).filter(Boolean) as string[];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', childUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build linked children array
      const children: LinkedChild[] = (childOrgUsers || []).map(child => {
        const profile = profileMap.get(child.user_id);
        return {
          id: child.user_id,
          organizationUserId: child.id,
          firstName: profile?.first_name || 'Unknown',
          lastName: profile?.last_name || '',
          groupName: (child.groups as any)?.group_name || null,
          organizationName: (child.organization as any)?.name || '',
        };
      });

      setLinkedChildren(children);

      // Fetch campaign stats for each child
      const allStats: ChildCampaignStats[] = [];
      const allDonations: RecentDonation[] = [];

      for (const child of childOrgUsers || []) {
        const profile = profileMap.get(child.user_id);
        const childName = `${profile?.first_name || 'Unknown'} ${profile?.last_name || ''}`.trim();
        
        // Get the group ID for this child
        const childGroupId = child.group_id || (child.rosters as any)?.group_id;
        
        if (!childGroupId) continue;

        // Get ALL active campaigns for this child's group
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, name, slug, enable_roster_attribution, goal_amount, description, groups:groups(logo_url, group_name, schools(school_name, logo_file), organizations(name, logo_url))')
          .eq('group_id', childGroupId)
          .eq('status', true);

        if (!campaigns || campaigns.length === 0) continue;

        // Get all roster links for this child
        const { data: rosterLinks } = await supabase
          .from('roster_member_campaign_links')
          .select('campaign_id, slug')
          .eq('roster_member_id', child.id);

        const linkMap = new Map(rosterLinks?.map(l => [l.campaign_id, l.slug]) || []);

        for (const campaign of campaigns) {
          const personalSlug = linkMap.get(campaign.id);
          const hasPersonalLink = !!personalSlug;
          const personalUrl = hasPersonalLink 
            ? `${window.location.origin}/c/${campaign.slug}/${personalSlug}` 
            : null;

          // Get stats if there's a personal link
          let statsData: any = null;
          if (hasPersonalLink) {
            try {
              const { data } = await supabase.functions.invoke('get-roster-member-stats', {
                body: { campaignId: campaign.id, rosterMemberId: child.id }
              });
              statsData = data;

              // Collect recent donations
              if (statsData?.supporters) {
                for (const supporter of statsData.supporters.slice(0, 3)) {
                  allDonations.push({
                    id: `${campaign.id}-${supporter.email}-${supporter.date}`,
                    amount: supporter.amount,
                    donorName: supporter.name || 'Anonymous',
                    childName,
                    campaignName: campaign.name,
                    timestamp: supporter.date,
                  });
                }
              }
            } catch (err) {
              console.error('Error fetching stats:', err);
            }
          }

          const personalGoal = statsData?.personalGoal || (campaign.goal_amount || 0) / 10;

          const grp: any = (campaign as any).groups;
          allStats.push({
            childId: child.user_id,
            childName,
            campaignId: campaign.id,
            campaignName: campaign.name,
            campaignSlug: campaign.slug || '',
            enableRosterAttribution: campaign.enable_roster_attribution || false,
            hasPersonalLink,
            personalUrl,
            totalRaised: statsData?.totalRaised || 0,
            personalGoal,
            percentToGoal: personalGoal > 0 ? Math.min(100, ((statsData?.totalRaised || 0) / personalGoal) * 100) : 0,
            donationCount: statsData?.donationCount || 0,
            uniqueSupporters: statsData?.uniqueSupporters || 0,
            rank: statsData?.rank || 0,
            totalParticipants: statsData?.totalParticipants || 0,
            groupLogo: grp?.logo_url ?? null,
            schoolLogo: grp?.schools?.logo_file ?? null,
            orgLogo: grp?.organizations?.logo_url ?? null,
            groupName: grp?.group_name ?? null,
            schoolOrOrgName: grp?.schools?.school_name ?? grp?.organizations?.name ?? null,
            campaignDescription: (campaign as any).description ?? null,
          });
        }
      }

      setCampaignStats(allStats);
      setRecentDonations(allDonations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10));

    } catch (error) {
      console.error('Error fetching family data:', error);
      toast.error('Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const shareLink = async (url: string, childName: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Support ${childName}'s Fundraiser`,
          url,
        });
      } catch (err) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white"><Medal className="h-3 w-3 mr-1" />1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white"><Medal className="h-3 w-3 mr-1" />2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white"><Medal className="h-3 w-3 mr-1" />3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  // Quick Actions: Share All Links
  const shareableLinks = campaignStats.filter(s => s.hasPersonalLink && s.personalUrl);
  
  const handleShareAllLinks = async () => {
    if (shareableLinks.length === 0) return;
    
    const linksText = shareableLinks
      .map(l => `${l.childName} - ${l.campaignName}:\n${l.personalUrl}`)
      .join('\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Family Fundraising Links',
          text: linksText,
        });
      } catch (err) {
        navigator.clipboard.writeText(linksText);
        toast.success('All links copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(linksText);
      toast.success('All links copied to clipboard!');
    }
  };

  // Quick Actions: Scroll to Recent Donations
  const scrollToRecentDonations = () => {
    recentDonationsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quick Actions: Message Coach
  const fetchGroupLeaders = async () => {
    setLoadingLeaders(true);
    try {
      // Get unique group IDs from linked children
      const groupIds = [...new Set(linkedChildren.map(c => c.groupName).filter(Boolean))];
      
      // Get organization IDs
      const orgIds = [...new Set(linkedChildren.map(c => c.organizationName))];
      
      // Fetch the parent's linked org user IDs to get the actual group_ids
      const { data: parentOrgUsers } = await supabase
        .from('organization_user')
        .select('linked_organization_user_id')
        .eq('user_id', user!.id)
        .eq('active_user', true)
        .not('linked_organization_user_id', 'is', null);
      
      const childOrgUserIds = parentOrgUsers?.map(p => p.linked_organization_user_id).filter(Boolean) as string[] || [];
      
      // Get the actual group IDs from children's org users
      const { data: childOrgUsers } = await supabase
        .from('organization_user')
        .select('group_id, organization_id')
        .in('id', childOrgUserIds);
      
      const actualGroupIds = [...new Set(childOrgUsers?.map(c => c.group_id).filter(Boolean) as string[])];
      const actualOrgIds = [...new Set(childOrgUsers?.map(c => c.organization_id).filter(Boolean) as string[])];
      
      if (actualGroupIds.length === 0) {
        setGroupLeaders([]);
        return;
      }
      
      // Get leader user types
      const { data: leaderTypes } = await supabase
        .from('user_type')
        .select('id, name')
        .in('name', ['Coach', 'Club Sponsor', 'Program Director', 'Booster Leader', 'Manager', 'Administrator']);
      
      const leaderTypeIds = leaderTypes?.map(t => t.id) || [];
      
      // Get leaders in these groups
      const { data: leaders } = await supabase
        .from('organization_user')
        .select(`
          id,
          user_id,
          group_id,
          user_type_id,
          groups:groups(group_name),
          user_type:user_type(name),
          profiles:profiles(first_name, last_name)
        `)
        .in('group_id', actualGroupIds)
        .in('organization_id', actualOrgIds)
        .in('user_type_id', leaderTypeIds)
        .eq('active_user', true);
      
      const leadersList: GroupLeader[] = (leaders || []).map(l => ({
        id: l.id,
        userId: l.user_id,
        firstName: (l.profiles as any)?.first_name || 'Unknown',
        lastName: (l.profiles as any)?.last_name || '',
        groupName: (l.groups as any)?.group_name || 'Unknown Group',
        userType: (l.user_type as any)?.name || 'Leader',
      }));
      
      setGroupLeaders(leadersList);
    } catch (error) {
      console.error('Error fetching group leaders:', error);
      toast.error('Failed to load coaches');
    } finally {
      setLoadingLeaders(false);
    }
  };

  const handleMessageCoach = async (leader: GroupLeader) => {
    try {
      // Check if there's an existing conversation with this leader
      const { data: existingConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', leader.userId);
      
      if (existingConversations && existingConversations.length > 0) {
        // Check if user is also in any of these conversations
        const { data: userParticipation } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user!.id)
          .in('conversation_id', existingConversations.map(c => c.conversation_id));
        
        if (userParticipation && userParticipation.length > 0) {
          // Navigate to existing conversation
          navigate(`/dashboard/messages/${userParticipation[0].conversation_id}`);
          setMessageCoachOpen(false);
          return;
        }
      }
      
      // Get user's organization ID
      const { data: userOrg } = await supabase
        .from('organization_user')
        .select('organization_id')
        .eq('user_id', user!.id)
        .eq('active_user', true)
        .limit(1)
        .single();
      
      if (!userOrg) {
        toast.error('Could not find your organization');
        return;
      }
      
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: userOrg.organization_id,
          conversation_type: 'direct',
          subject: `Message to ${leader.firstName}`,
          created_by: user!.id,
        })
        .select()
        .single();
      
      if (convError) throw convError;
      
      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConversation.id, user_id: user!.id, participant_type: 'user', role: 'member' },
        { conversation_id: newConversation.id, user_id: leader.userId, participant_type: 'user', role: 'member' },
      ]);
      
      navigate(`/dashboard/messages/${newConversation.id}`);
      setMessageCoachOpen(false);
      toast.success(`Started conversation with ${leader.firstName}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  useEffect(() => {
    if (messageCoachOpen && linkedChildren.length > 0) {
      fetchGroupLeaders();
    }
  }, [messageCoachOpen, linkedChildren]);

  // Aggregate stats
  const totalFamilyRaised = campaignStats.reduce((sum, s) => sum + s.totalRaised, 0);
  const totalSupporters = campaignStats.reduce((sum, s) => sum + s.uniqueSupporters, 0);
  const activeCampaigns = new Set(campaignStats.map(s => s.campaignId)).size;

  // Comparison chart data
  const comparisonData = linkedChildren.map(child => {
    const childStats = campaignStats.filter(s => s.childId === child.id);
    const raised = childStats.reduce((sum, s) => sum + s.totalRaised, 0);
    return {
      name: child.firstName,
      raised,
    };
  });

  const chartColors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  if (loading) {
    return (
      <DashboardPageLayout
        segments={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Family Dashboard' },
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardPageLayout>
    );
  }

  if (linkedChildren.length === 0) {
    return (
      <DashboardPageLayout
        segments={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Family Dashboard' },
        ]}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Connected Students</h3>
            <p className="text-muted-foreground max-w-md">
              You don't have any students connected to your account yet. 
              Accept an invitation from your child's organization to see their fundraising progress here.
            </p>
          </CardContent>
        </Card>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Family Dashboard' },
      ]}
    >
      <div className="space-y-6">
        {/* Hero Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Family Raised</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">${totalFamilyRaised.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/20 to-chart-2/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Supporters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-chart-2" />
                <span className="text-3xl font-bold">{totalSupporters}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/20 to-chart-3/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-chart-3" />
                <span className="text-3xl font-bold">{activeCampaigns}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-4/20 to-chart-4/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-4" />
                <span className="text-3xl font-bold">{linkedChildren.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleShareAllLinks} 
                disabled={shareableLinks.length === 0}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share All Links ({shareableLinks.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={scrollToRecentDonations}
                disabled={recentDonations.length === 0}
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                View Recent Donations
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMessageCoachOpen(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Coach
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Children Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {linkedChildren.map(child => {
            const childStats = campaignStats.filter(s => s.childId === child.id);
            const totalRaised = childStats.reduce((sum, s) => sum + s.totalRaised, 0);
            const totalGoal = childStats.reduce((sum, s) => sum + s.personalGoal, 0);
            const overallProgress = totalGoal > 0 ? Math.min(100, (totalRaised / totalGoal) * 100) : 0;

            return (
              <Card key={child.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                        {getInitials(child.firstName, child.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{child.firstName} {child.lastName}</CardTitle>
                      {child.groupName && (
                        <Badge variant="secondary" className="mt-1">{child.groupName}</Badge>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{child.organizationName}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">${totalRaised.toFixed(2)} / ${totalGoal.toFixed(2)}</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold">{childStats.length}</p>
                      <p className="text-xs text-muted-foreground">Campaigns</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold">{childStats.reduce((sum, s) => sum + s.uniqueSupporters, 0)}</p>
                      <p className="text-xs text-muted-foreground">Supporters</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Campaigns by Child */}
        {linkedChildren.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Campaigns by Child
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={linkedChildren[0]?.id} className="w-full">
                <TabsList className="mb-4">
                  {linkedChildren.map(child => (
                    <TabsTrigger key={child.id} value={child.id}>
                      {child.firstName}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {linkedChildren.map(child => (
                  <TabsContent key={child.id} value={child.id} className="space-y-4">
                    {campaignStats
                      .filter(s => s.childId === child.id)
                      .map(stat => (
                        <Card key={stat.campaignId} className="border">
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{stat.campaignName}</h4>
                                  {stat.hasPersonalLink && stat.rank > 0 && getRankBadge(stat.rank)}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium">
                                      ${stat.totalRaised.toFixed(2)} / ${stat.personalGoal.toFixed(2)}
                                    </span>
                                  </div>
                                  <Progress value={stat.percentToGoal} className="h-2" />
                                </div>

                                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                                  <span>{stat.donationCount} donations</span>
                                  <span>{stat.uniqueSupporters} supporters</span>
                                  {stat.hasPersonalLink && stat.totalParticipants > 0 && (
                                    <span>Rank {stat.rank} of {stat.totalParticipants}</span>
                                  )}
                                </div>

                                {stat.enableRosterAttribution && !stat.hasPersonalLink && (
                                  <div className="bg-muted/50 rounded-lg p-4 mt-2">
                                    <p className="text-sm text-muted-foreground">
                                      Personal fundraising link not set up yet. Contact the campaign manager to get started.
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                {(() => {
                                  const shareUrl = stat.hasPersonalLink && stat.personalUrl
                                    ? stat.personalUrl
                                    : `${window.location.origin}/c/${stat.campaignSlug}`;
                                  const qrKey = stat.hasPersonalLink ? stat.personalUrl : stat.campaignSlug;
                                  return (
                                    <>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => copyToClipboard(shareUrl)}
                                        >
                                          <Copy className="h-4 w-4 mr-1" />
                                          Copy
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => shareLink(shareUrl, stat.childName)}
                                        >
                                          <Share2 className="h-4 w-4 mr-1" />
                                          Share
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setQrTarget({
                                              shareUrl,
                                              childName: stat.childName,
                                              campaignName: stat.campaignName,
                                              logoUrl: pickBrandLogo({
                                                groupLogo: stat.groupLogo,
                                                schoolLogo: stat.schoolLogo,
                                                orgLogo: stat.orgLogo,
                                              }),
                                              schoolOrOrgName: stat.schoolOrOrgName,
                                              groupName: stat.groupName,
                                              campaignDescription: stat.campaignDescription,
                                            })
                                          }
                                        >
                                          <QrCode className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {campaignStats.filter(s => s.childId === child.id).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No active campaigns for {child.firstName}
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Comparison Chart */}
        {linkedChildren.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Fundraising Comparison</CardTitle>
              <CardDescription>Total amount raised by each child</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Raised']}
                  />
                  <Bar dataKey="raised" radius={[4, 4, 0, 0]}>
                    {comparisonData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentDonations.length > 0 && (
          <Card ref={recentDonationsRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Recent Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDonations.map(donation => (
                  <div 
                    key={donation.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{donation.donorName}</p>
                      <p className="text-sm text-muted-foreground">
                        via {donation.childName}'s link • {donation.campaignName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(donation.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">+${donation.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Message Coach Dialog */}
      <Dialog open={messageCoachOpen} onOpenChange={setMessageCoachOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message a Coach</DialogTitle>
            <DialogDescription>
              Select a coach or group leader to start a conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {loadingLeaders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : groupLeaders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No coaches found for your children's groups
              </p>
            ) : (
              groupLeaders.map(leader => (
                <Button
                  key={leader.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleMessageCoach(leader)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>
                      {leader.firstName.charAt(0)}{leader.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{leader.firstName} {leader.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {leader.userType} • {leader.groupName}
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {qrTarget && (
        <QRDialog
          open={!!qrTarget}
          onOpenChange={(o) => !o && setQrTarget(null)}
          url={qrTarget.shareUrl}
          campaignName={qrTarget.campaignName}
          participantName={qrTarget.childName}
          logoUrl={qrTarget.logoUrl}
          schoolOrOrgName={qrTarget.schoolOrOrgName}
          groupName={qrTarget.groupName}
          campaignDescription={qrTarget.campaignDescription}
        />
      )}
    </DashboardPageLayout>
  );
};

export default FamilyDashboard;
