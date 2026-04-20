import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Medal, Share2, Target, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchRosterLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";
import DashboardPageLayout from "@/components/DashboardPageLayout";

interface CampaignRecord {
  id: string;
  name: string;
  slug: string;
  goal_amount: number | null;
  amount_raised: number | null;
  end_date: string | null;
  enable_roster_attribution: boolean | null;
  group_id: string | null;
}

const daysLeft = (endDate: string | null) => {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>;
};

export default function CampaignLeaderboard() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const { data: campaignRow, error: cErr } = await supabase
          .from("campaigns")
          .select("id, name, slug, goal_amount, amount_raised, end_date, enable_roster_attribution, group_id")
          .eq("slug", slug)
          .maybeSingle();

        if (cErr) throw cErr;
        if (!campaignRow) {
          if (!cancelled) setNotFound(true);
          return;
        }

        // Find rosters tied to this campaign's group
        const { data: rosters, error: rErr } = await supabase
          .from("rosters")
          .select("id")
          .eq("group_id", campaignRow.group_id);
        if (rErr) throw rErr;

        const rosterIds = (rosters || []).map((r) => r.id as number);
        const lb = rosterIds.length
          ? await fetchRosterLeaderboard(rosterIds, user?.id)
          : [];

        if (!cancelled) {
          setCampaign(campaignRow as CampaignRecord);
          setEntries(lb);
        }
      } catch (e) {
        console.error("Error loading campaign leaderboard", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, user?.id]);

  const allZero = useMemo(
    () => entries.length > 0 && !entries.some((e) => e.totalRaised > 0),
    [entries]
  );

  const handleShare = async () => {
    const url = `${window.location.origin}/c/${slug}`;
    const title = campaign ? `Support ${campaign.name}` : "Support our fundraiser";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Campaign link copied to clipboard." });
  };

  if (loading) {
    return (
      <DashboardPageLayout loading>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardPageLayout>
    );
  }

  if (notFound || !campaign) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "My Fundraising", path: "/dashboard/my-fundraising" },
          { label: "Leaderboard" },
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold">Campaign not found</h1>
          <p className="text-sm text-muted-foreground">The campaign you're looking for doesn't exist.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard/my-fundraising">Back to My Fundraising</Link>
          </Button>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  const dl = daysLeft(campaign.end_date);
  const goal = campaign.goal_amount || 0;
  const raised = campaign.amount_raised || 0;
  const progressPct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <DashboardPageLayout
      segments={[
        { label: "My Fundraising", path: "/dashboard/my-fundraising" },
        { label: campaign.name, path: "/dashboard/my-fundraising" },
        { label: "Leaderboard" },
      ]}
    >
      <Helmet>
        <title>{campaign.name} — Team Leaderboard</title>
        <meta
          name="description"
          content={`See the full team leaderboard for ${campaign.name}.`}
        />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/dashboard/my-fundraising"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Fundraising
        </Link>

        {/* Header card */}
        <Card className="border border-border rounded-lg overflow-hidden shadow-sm border-t-4 border-t-primary p-0 gap-0">
          <div className="bg-muted/30 border-b px-6 py-5">
            <div className="grid lg:grid-cols-2 gap-4 items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {campaign.enable_roster_attribution && (
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                      <Target className="h-3 w-3 mr-1" /> Roster Challenge
                    </Badge>
                  )}
                  {dl !== null && (
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      <Clock className="h-3 w-3 mr-1" /> {dl} Days Left
                    </Badge>
                  )}
                  {campaign.end_date && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Ends {new Date(campaign.end_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight leading-tight">{campaign.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">Team Leaderboard</p>
              </div>

              {goal > 0 && (
                <div className="lg:text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Team Raised
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    ${raised.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    <span className="text-base font-medium text-muted-foreground">
                      {" "}
                      / ${goal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </p>
                  <Progress
                    value={progressPct}
                    className="h-2 mt-2 bg-primary/10 [&>div]:bg-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Full leaderboard */}
          <CardContent className="p-0">
            <div className="bg-primary/[0.03] p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-primary" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Full Team Leaderboard
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {entries.length} {entries.length === 1 ? "member" : "members"} on the roster
                </span>
              </div>

              {allZero && (
                <p className="text-xs text-muted-foreground mb-3 italic">
                  No donations yet — share your link to take the lead.
                </p>
              )}

              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active roster members found for this campaign.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {entries.map((entry, i) => {
                    const isZero = entry.totalRaised <= 0;
                    return (
                      <div
                        key={entry.rosterMemberId}
                        className={`flex items-center justify-between px-3 py-2 rounded-md ${
                          entry.isCurrentUser
                            ? "bg-primary/5 border border-primary/20"
                            : "bg-background border border-border/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 text-center">{getRankIcon(i + 1)}</span>
                          <span
                            className={`text-sm truncate ${
                              entry.isCurrentUser ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {entry.firstName} {entry.lastName}
                          </span>
                          {entry.isCurrentUser && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                              YOU
                            </Badge>
                          )}
                        </div>
                        <span
                          className={`text-sm tabular-nums ${
                            isZero ? "text-muted-foreground" : "font-semibold"
                          }`}
                        >
                          ${entry.totalRaised.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="border border-border bg-muted/20">
          <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Want to climb the board?</p>
              <p className="text-xs text-muted-foreground">Share the campaign link to bring in support.</p>
            </div>
            <Button onClick={handleShare} className="shrink-0">
              <Share2 className="h-4 w-4 mr-2" /> Share campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
