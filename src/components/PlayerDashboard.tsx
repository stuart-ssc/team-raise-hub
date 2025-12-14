import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Copy, Share2, DollarSign, Target, Calendar, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentCampaigns, setCurrentCampaigns] = useState<Campaign[]>([]);
  const [pastCampaigns, setPastCampaigns] = useState<Campaign[]>([]);
  const [attributedCampaigns, setAttributedCampaigns] = useState<AttributedCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlayerData();
    }
  }, [user]);

  const fetchPlayerData = async () => {
    try {
      // Step 1: Get user's roster memberships with roster IDs
      const { data: rosterMemberships, error: rosterError } = await supabase
        .from('organization_user')
        .select('id, roster_id')
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

      const groupIds = rosters?.map(r => r.group_id).filter(Boolean) || [];

      if (groupIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch ALL campaigns for these groups (not just roster-enabled ones)
      const { data: allCampaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, slug, goal_amount, amount_raised, start_date, end_date, status, enable_roster_attribution, group_id')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      if (!allCampaigns || allCampaigns.length === 0) {
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Categorize campaigns
      const current: Campaign[] = [];
      const past: Campaign[] = [];

      allCampaigns.forEach(campaign => {
        const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
        const isActive = campaign.status === true;
        const isPast = endDate && endDate < today;

        if (isActive && !isPast) {
          current.push(campaign);
        } else {
          past.push(campaign);
        }
      });

      setCurrentCampaigns(current);
      setPastCampaigns(past);

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

            return {
              ...campaign,
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
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string, isPersonal: boolean = false) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: isPersonal 
        ? "Your personal fundraising link has been copied" 
        : "Campaign link has been copied",
    });
  };

  const shareLink = async (url: string, campaignName: string, isPersonal: boolean = false) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isPersonal ? `Support me in ${campaignName}` : `Support ${campaignName}`,
          text: isPersonal 
            ? `Help me reach my fundraising goal for ${campaignName}!`
            : `Support our ${campaignName} fundraiser!`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink(url, isPersonal);
    }
  };

  const getCampaignUrl = (campaign: Campaign) => {
    return `${window.location.origin}/c/${campaign.slug}`;
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

  const hasNoCampaigns = currentCampaigns.length === 0 && pastCampaigns.length === 0;

  if (hasNoCampaigns) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Campaigns Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Your team doesn't have any active or past campaigns.
            Contact your coach or team manager to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats - Only show if user has attributed campaigns */}
      {attributedCampaigns.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRaisedAll / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {attributedCampaigns.length} attributed campaign{attributedCampaigns.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Supporters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSupportersAll}</div>
              <p className="text-xs text-muted-foreground">Unique donors via my links</p>
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

      {/* My Fundraising - Attributed Campaigns */}
      {attributedCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>My Fundraising</CardTitle>
                <CardDescription>Campaigns with your personal fundraising link</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {attributedCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Rank #{campaign.rank} of {campaign.totalParticipants}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {campaign.donationCount} donation{campaign.donationCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">My Progress</span>
                      <span className="font-medium">
                        ${(campaign.totalRaised / 100).toFixed(2)} / ${(campaign.personalGoal / 100).toFixed(2)}
                      </span>
                    </div>
                    <Progress value={campaign.percentToGoal} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyLink(campaign.personalUrl, true)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy My Link
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => shareLink(campaign.personalUrl, campaign.name, true)}
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
      )}

      {/* Current Campaigns - All active campaigns for user's groups */}
      {currentCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Current Campaigns</CardTitle>
                <CardDescription>Active campaigns for your team - share to help raise funds</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCampaigns.map((campaign) => {
              // Check if this campaign is also in attributed
              const isAttributed = attributedCampaigns.some(a => a.id === campaign.id);
              if (isAttributed) return null; // Don't show duplicates

              const goalAmount = campaign.goal_amount || 0;
              const amountRaised = campaign.amount_raised || 0;
              const progress = goalAmount > 0 ? (amountRaised / goalAmount) * 100 : 0;
              const campaignUrl = getCampaignUrl(campaign);

              return (
                <Card key={campaign.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        {campaign.end_date && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Ends {new Date(campaign.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>

                    {goalAmount > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team Progress</span>
                          <span className="font-medium">
                            ${(amountRaised / 100).toFixed(2)} / ${(goalAmount / 100).toFixed(2)}
                          </span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyLink(campaignUrl, false)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => shareLink(campaignUrl, campaign.name, false)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Past Campaigns */}
      {pastCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Past Campaigns</CardTitle>
                <CardDescription>Completed campaigns from your team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastCampaigns.slice(0, 5).map((campaign) => {
                const goalAmount = campaign.goal_amount || 0;
                const amountRaised = campaign.amount_raised || 0;

                return (
                  <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <h4 className="font-medium">{campaign.name}</h4>
                      {campaign.end_date && (
                        <p className="text-sm text-muted-foreground">
                          Ended {new Date(campaign.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${(amountRaised / 100).toFixed(2)}</div>
                      {goalAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          of ${(goalAmount / 100).toFixed(2)} goal
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {pastCampaigns.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {pastCampaigns.length - 5} more past campaigns
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
