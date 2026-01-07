import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Trophy, Target, Copy, Share2, QrCode, Medal, Heart, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  personalUrl: string;
  totalRaised: number;
  personalGoal: number;
  percentToGoal: number;
  donationCount: number;
  uniqueSupporters: number;
  rank: number;
  totalParticipants: number;
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
  const [loading, setLoading] = useState(true);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [campaignStats, setCampaignStats] = useState<ChildCampaignStats[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

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

      // Get group IDs from children's rosters
      const groupIds = (childOrgUsers || [])
        .map(m => (m.rosters as any)?.group_id)
        .filter(Boolean);

      if (groupIds.length === 0) {
        setCampaignStats([]);
        setRecentDonations([]);
        setLoading(false);
        return;
      }

      // Get campaigns for these groups
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, slug')
        .in('group_id', groupIds)
        .eq('enable_roster_attribution', true)
        .eq('status', true);

      // Fetch campaign stats for each child
      const allStats: ChildCampaignStats[] = [];
      const allDonations: RecentDonation[] = [];

      for (const child of childOrgUsers || []) {
        const profile = profileMap.get(child.user_id);
        const childName = `${profile?.first_name || 'Unknown'} ${profile?.last_name || ''}`.trim();

        for (const campaign of campaigns || []) {
          // Get roster link for this child and campaign
          const { data: linkData } = await supabase
            .from('roster_member_campaign_links')
            .select('slug')
            .eq('campaign_id', campaign.id)
            .eq('roster_member_id', child.id)
            .single();

          if (!linkData) continue;

          const personalUrl = `${window.location.origin}/c/${campaign.slug}/${linkData.slug}`;

          // Get stats from the edge function
          try {
            const { data: statsData } = await supabase.functions.invoke('get-roster-member-stats', {
              body: { campaignId: campaign.id, rosterMemberId: child.id }
            });

            const personalGoal = statsData?.personalGoal || 0;

            allStats.push({
              childId: child.user_id,
              childName,
              campaignId: campaign.id,
              campaignName: campaign.name,
              personalUrl,
              totalRaised: statsData?.totalRaised || 0,
              personalGoal,
              percentToGoal: personalGoal > 0 ? Math.min(100, ((statsData?.totalRaised || 0) / personalGoal) * 100) : 0,
              donationCount: statsData?.donationCount || 0,
              uniqueSupporters: statsData?.uniqueSupporters || 0,
              rank: statsData?.rank || 0,
              totalParticipants: statsData?.totalParticipants || 0,
            });

            // Collect recent donations
            if (statsData?.recentSupporters) {
              for (const supporter of statsData.recentSupporters.slice(0, 3)) {
                allDonations.push({
                  id: supporter.orderId,
                  amount: supporter.amount,
                  donorName: supporter.donorName || 'Anonymous',
                  childName,
                  campaignName: campaign.name,
                  timestamp: supporter.purchasedAt,
                });
              }
            }
          } catch (err) {
            console.error('Error fetching stats:', err);
          }
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
                                  {stat.rank > 0 && getRankBadge(stat.rank)}
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
                                  {stat.totalParticipants > 0 && (
                                    <span>Rank {stat.rank} of {stat.totalParticipants}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(stat.personalUrl)}
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => shareLink(stat.personalUrl, stat.childName)}
                                  >
                                    <Share2 className="h-4 w-4 mr-1" />
                                    Share
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowQRCode(showQRCode === stat.personalUrl ? null : stat.personalUrl)}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                </div>

                                {showQRCode === stat.personalUrl && (
                                  <div className="bg-white p-3 rounded-lg">
                                    <QRCode value={stat.personalUrl} size={100} />
                                  </div>
                                )}
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
          <Card>
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
    </DashboardPageLayout>
  );
};

export default FamilyDashboard;
