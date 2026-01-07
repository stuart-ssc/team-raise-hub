import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Copy, Share2, ExternalLink, MessageSquare, Edit, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PitchEditor } from "@/components/PitchEditor";
import QRCode from "react-qr-code";
import { Separator } from "@/components/ui/separator";
import ManageGuardiansCard from "@/components/ManageGuardiansCard";
interface CampaignStat {
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  groupDirections: string | null;
  personalUrl: string;
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
}

interface RosterMembership {
  id: string;
  roster_id: number | null;
  organization_id: string;
  group_id: string | null;
  rosters: { group_id: string } | null;
}

export default function MyFundraising() {
  const { user } = useAuth();
  const { activeGroup } = useActiveGroup();
  const { toast } = useToast();
  const [stats, setStats] = useState<CampaignStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [rosterMembership, setRosterMembership] = useState<RosterMembership | null>(null);

  useEffect(() => {
    if (user) {
      fetchFundraisingStats();
    }
  }, [user, activeGroup?.id]);

  const fetchFundraisingStats = async () => {
    try {
      // Get user's roster memberships
      const { data: rosterMemberships, error: rosterError } = await supabase
        .from('organization_user')
        .select(`
          id,
          roster_id,
          organization_id,
          group_id,
          rosters(group_id)
        `)
        .eq('user_id', user?.id)
        .eq('active_user', true);

      if (rosterError) throw rosterError;

      if (!rosterMemberships || rosterMemberships.length === 0) {
        setStats([]);
        setRosterMembership(null);
        setLoading(false);
        return;
      }

      // Store the first roster membership for the guardian card
      setRosterMembership(rosterMemberships[0] as RosterMembership);

      // Get campaigns with roster attribution enabled for these groups
      let groupIds = rosterMemberships
        .map(m => (m as any).rosters?.group_id)
        .filter(Boolean);

      // Filter by active group if one is selected
      if (activeGroup) {
        groupIds = groupIds.filter((id: string) => id === activeGroup.id);
      }

      if (groupIds.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, slug, group_directions')
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
        const rosterMembership = rosterMemberships[0]; // Use first membership for now
        
        const { data: linkData } = await supabase
          .from('roster_member_campaign_links')
          .select('slug, pitch_message, pitch_image_url, pitch_video_url, pitch_recorded_video_url')
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
          groupDirections: campaign.group_directions,
          personalUrl: `${window.location.origin}/c/${campaign.slug}/${linkData.slug}`,
          pitchMessage: linkData.pitch_message,
          pitchImageUrl: linkData.pitch_image_url,
          pitchVideoUrl: linkData.pitch_video_url,
          pitchRecordedVideoUrl: linkData.pitch_recorded_video_url,
          ...statsData,
        };
      });

      const resolvedStats = (await Promise.all(statsPromises)).filter(Boolean) as CampaignStat[];
      setStats(resolvedStats);
    } catch (error) {
      console.error('Error fetching fundraising stats:', error);
      toast({
        title: "Error",
        description: "Failed to load fundraising statistics",
        variant: "destructive",
      });
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

  return (
    <DashboardPageLayout
      segments={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'My Fundraising' },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Fundraising</h1>
          <p className="text-muted-foreground mt-2">
            Track your personal fundraising progress and share your links
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : stats.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You're not currently enrolled in any fundraising campaigns with roster attribution enabled.
                Contact your campaign manager to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalRaisedAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique donors
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
                    #{Math.min(...stats.map(s => s.rank || 999))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Highest ranking
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Cards */}
            <div className="space-y-4">
              {stats.map((stat) => (
                <Card key={stat.campaignId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{stat.campaignName}</CardTitle>
                        <CardDescription className="mt-1">
                          Rank #{stat.rank} of {stat.totalParticipants} participants
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {stat.donationCount} donation{stat.donationCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Group Directions */}
                    {stat.groupDirections && (
                      <Alert className="bg-muted/50 border-primary/20">
                        <MessageSquare className="h-4 w-4" />
                        <AlertTitle className="text-sm font-medium">Instructions from your coach</AlertTitle>
                        <AlertDescription className="text-sm whitespace-pre-wrap">
                          {stat.groupDirections}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Personal Goal Progress</span>
                        <span className="text-sm text-muted-foreground">
                          ${stat.totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${stat.personalGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Progress value={stat.percentToGoal} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.percentToGoal.toFixed(1)}% of goal reached
                      </p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 py-3 border-y">
                      <div>
                        <p className="text-sm text-muted-foreground">Raised</p>
                        <p className="text-lg font-semibold">${stat.totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Supporters</p>
                        <p className="text-lg font-semibold">{stat.uniqueSupporters}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Gift</p>
                        <p className="text-lg font-semibold">
                          ${stat.donationCount > 0 ? (stat.totalRaised / stat.donationCount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Personal Link</label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 bg-muted rounded-md text-sm font-mono truncate">
                          {stat.personalUrl}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(stat.personalUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareLink(stat.personalUrl, stat.campaignName)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(stat.personalUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQRCode(showQRCode === stat.personalUrl ? null : stat.personalUrl)}
                          className="flex-1"
                        >
                          {showQRCode === stat.personalUrl ? 'Hide' : 'Show'} QR Code
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingPitchId(editingPitchId === stat.campaignId ? null : stat.campaignId)}
                          className="flex-1"
                        >
                          {editingPitchId === stat.campaignId ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Close Pitch Editor
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              {stat.pitchMessage ? 'Edit' : 'Add'} Personal Pitch
                            </>
                          )}
                        </Button>
                      </div>
                      {showQRCode === stat.personalUrl && (
                        <div className="flex justify-center p-4 bg-white rounded-md">
                          <QRCode value={stat.personalUrl} size={200} />
                        </div>
                      )}
                    </div>

                    {/* Inline Pitch Editor */}
                    {editingPitchId === stat.campaignId && (
                      <>
                        <Separator className="my-4" />
                        <PitchEditor
                          campaignId={stat.campaignId}
                          campaignName={stat.campaignName}
                          initialPitch={{
                            message: stat.pitchMessage,
                            imageUrl: stat.pitchImageUrl,
                            videoUrl: stat.pitchVideoUrl,
                            recordedVideoUrl: stat.pitchRecordedVideoUrl,
                          }}
                          onSave={() => {
                            setEditingPitchId(null);
                            fetchFundraisingStats();
                          }}
                          onClose={() => setEditingPitchId(null)}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Family Members Section */}
        {rosterMembership && (
          <ManageGuardiansCard
            organizationUserId={rosterMembership.id}
            organizationId={rosterMembership.organization_id}
            groupId={rosterMembership.group_id || rosterMembership.rosters?.group_id || null}
            rosterId={rosterMembership.roster_id}
          />
        )}
      </div>
    </DashboardPageLayout>
  );
}
