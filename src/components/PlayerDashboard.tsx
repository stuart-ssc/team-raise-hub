import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Copy, Share2, ExternalLink, DollarSign, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CampaignStat {
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  personalUrl: string;
  totalRaised: number;
  donationCount: number;
  uniqueSupporters: number;
  rank: number;
  totalParticipants: number;
  personalGoal: number;
  percentToGoal: number;
}

interface RecentDonation {
  id: string;
  donor_name: string;
  amount: number;
  created_at: string;
  campaign_name: string;
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<CampaignStat[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlayerData();
    }
  }, [user]);

  const fetchPlayerData = async () => {
    try {
      // Get user's roster memberships
      const { data: rosterMemberships, error: rosterError } = await supabase
        .from('organization_user')
        .select(`
          id,
          roster_id,
          rosters(group_id)
        `)
        .eq('user_id', user?.id)
        .eq('active_user', true);

      if (rosterError) throw rosterError;

      if (!rosterMemberships || rosterMemberships.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      // Get campaigns with roster attribution enabled for these groups
      const groupIds = rosterMemberships
        .map(m => (m as any).rosters?.group_id)
        .filter(Boolean);

      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, slug, goal_amount')
        .in('group_id', groupIds)
        .eq('enable_roster_attribution', true)
        .eq('status', true);

      if (campaignError) throw campaignError;

      if (!campaigns || campaigns.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      // Fetch stats for each campaign
      const statsPromises = campaigns.map(async (campaign) => {
        const rosterMembership = rosterMemberships[0];
        
        const { data: linkData } = await supabase
          .from('roster_member_campaign_links')
          .select('slug')
          .eq('campaign_id', campaign.id)
          .eq('roster_member_id', rosterMembership.id)
          .single();

        if (!linkData) return null;

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

        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignSlug: campaign.slug,
          personalUrl: `${window.location.origin}/c/${campaign.slug}/${linkData.slug}`,
          ...statsData,
        };
      });

      const resolvedStats = (await Promise.all(statsPromises)).filter(Boolean) as CampaignStat[];
      setStats(resolvedStats);

      // Note: Recent donations display removed temporarily - requires proper orders table structure
      setRecentDonations([]);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Your personal fundraising link has been copied to clipboard",
    });
  };

  const shareLink = async (url: string, campaignName: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Support me in ${campaignName}`,
          text: `Help me reach my fundraising goal for ${campaignName}!`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink(url);
    }
  };

  const totalRaisedAll = stats.reduce((sum, s) => sum + s.totalRaised, 0);
  const totalSupportersAll = stats.reduce((sum, s) => sum + s.uniqueSupporters, 0);
  const bestRank = stats.length > 0 ? Math.min(...stats.map(s => s.rank || 999)) : 0;

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

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start Your Fundraising Journey!</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            You're not currently enrolled in any active fundraising campaigns.
            Contact your coach or team manager to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRaisedAll / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.length} campaign{stats.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supporters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupportersAll}</div>
            <p className="text-xs text-muted-foreground">Unique donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bestRank > 0 ? `#${bestRank}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Highest ranking</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Share your links to get donations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/my-fundraising'}>
              View All Stats
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.slice(0, 2).map((stat) => (
            <Card key={stat.campaignId} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{stat.campaignName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Rank #{stat.rank} of {stat.totalParticipants}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {stat.donationCount} donation{stat.donationCount !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      ${(stat.totalRaised / 100).toFixed(2)} / ${(stat.personalGoal / 100).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={stat.percentToGoal} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyLink(stat.personalUrl)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => shareLink(stat.personalUrl, stat.campaignName)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>Your latest supporters</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDonations.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No donations yet. Share your link to get your first supporter!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {donation.donor_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{donation.donor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {donation.campaign_name} • {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="font-semibold text-primary">
                    ${(donation.amount / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
