import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ExternalLink, Share2, ArrowRight, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeoHead } from "@/components/seo/SeoHead";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import ShareHubDialog from "@/components/public-hub/ShareHubDialog";

interface OrgRow {
  id: string;
  name: string;
  organization_type: "school" | "nonprofit";
  city: string | null;
  state: string | null;
  logo_url: string | null;
  primary_color: string | null;
  public_slug: string | null;
  public_page_enabled: boolean;
  tagline: string | null;
  cover_image_url: string | null;
  public_contact_email: string | null;
  website_url: string | null;
}

interface GroupRow {
  id: string;
  group_name: string;
  organization_id: string;
  public_slug: string | null;
  public_page_enabled: boolean;
  tagline: string | null;
  cover_image_url: string | null;
  public_contact_email: string | null;
  logo_url: string | null;
  website_url: string | null;
}

interface CampaignRow {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  end_date: string | null;
  publication_status: string | null;
  status: boolean | null;
  group_id: string | null;
  campaign_type: { name: string } | null;
}

const formatCurrency = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n || 0));

const daysLeft = (end?: string | null) => {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

interface PublicHubProps {
  scope: "group" | "org";
}

const PublicHub = ({ scope }: PublicHubProps) => {
  const params = useParams();
  const orgSlug = params.orgSlug as string | undefined;
  const groupSlug = params.groupSlug as string | undefined;

  const [organization, setOrganization] = useState<OrgRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!orgSlug) {
          setError("Page not found");
          return;
        }

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select(
            "id,name,organization_type,city,state,logo_url,primary_color,public_slug,public_page_enabled,tagline,cover_image_url,public_contact_email,website_url"
          )
          .eq("public_slug", orgSlug)
          .eq("public_page_enabled", true)
          .maybeSingle();

        if (orgError) throw orgError;
        if (!orgData) {
          setError("This page is not available");
          return;
        }
        if (cancelled) return;
        setOrganization(orgData as OrgRow);

        let groupRow: GroupRow | null = null;
        if (scope === "group" && groupSlug) {
          const { data: groupData, error: groupErr } = await supabase
            .from("groups")
            .select(
              "id,group_name,organization_id,public_slug,public_page_enabled,tagline,cover_image_url,public_contact_email,logo_url,website_url"
            )
            .eq("organization_id", orgData.id)
            .eq("public_slug", groupSlug)
            .eq("public_page_enabled", true)
            .maybeSingle();
          if (groupErr) throw groupErr;
          if (!groupData) {
            setError("This page is not available");
            return;
          }
          groupRow = groupData as GroupRow;
          if (!cancelled) setGroup(groupRow);
        } else {
          // Org-level: fetch all visible groups for sub-navigation
          const { data: groupsData } = await supabase
            .from("groups")
            .select(
              "id,group_name,organization_id,public_slug,public_page_enabled,tagline,cover_image_url,public_contact_email,logo_url,website_url"
            )
            .eq("organization_id", orgData.id)
            .eq("public_page_enabled", true)
            .eq("status", true);
          if (!cancelled) setGroups((groupsData || []) as GroupRow[]);
        }

        // Fetch campaigns
        let campaignQuery = supabase
          .from("campaigns")
          .select(
            "id,name,slug,description,image_url,goal_amount,amount_raised,end_date,publication_status,status,group_id,campaign_type:campaign_type_id(name)"
          )
          .eq("status", true)
          .eq("publication_status", "published");

        if (groupRow) {
          campaignQuery = campaignQuery.eq("group_id", groupRow.id);
        } else {
          // Org-wide: fetch by all org group ids
          const { data: orgGroups } = await supabase
            .from("groups")
            .select("id")
            .eq("organization_id", orgData.id);
          const ids = (orgGroups || []).map((g) => g.id);
          if (ids.length === 0) {
            if (!cancelled) setCampaigns([]);
            return;
          }
          campaignQuery = campaignQuery.in("group_id", ids);
        }

        const { data: campaignsData, error: campErr } = await campaignQuery;
        if (campErr) throw campErr;
        if (!cancelled) setCampaigns((campaignsData || []) as unknown as CampaignRow[]);
      } catch (e: any) {
        console.error("PublicHub load error", e);
        if (!cancelled) setError("Unable to load this page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, orgSlug, groupSlug]);

  const { active, past } = useMemo(() => {
    const today = new Date();
    const a: CampaignRow[] = [];
    const p: CampaignRow[] = [];
    for (const c of campaigns) {
      const ended = c.end_date ? new Date(c.end_date) < today : false;
      if (ended) p.push(c);
      else a.push(c);
    }
    return { active: a, past: p };
  }, [campaigns]);

  const totalRaised = useMemo(
    () => campaigns.reduce((sum, c) => sum + Number(c.amount_raised || 0), 0),
    [campaigns]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">{error || "Page not found"}</h1>
        <Link to="/" className="text-primary underline">Back to Sponsorly</Link>
      </div>
    );
  }

  const displayName = group
    ? `${organization.name} — ${group.group_name}`
    : organization.name;
  const displayLogo = group?.logo_url || organization.logo_url;
  const displayCover = group?.cover_image_url || organization.cover_image_url;
  const displayTagline = group?.tagline || organization.tagline;
  const displayContact = group?.public_contact_email || organization.public_contact_email;
  const displayWebsite = group?.website_url || organization.website_url;
  const location = [organization.city, organization.state].filter(Boolean).join(", ");

  const seoTitle = `${displayName} | Support our fundraisers`;
  const seoDescription =
    displayTagline ||
    `Discover all current fundraising opportunities from ${displayName} and support them today on Sponsorly.`;
  const seoPath = group
    ? `/g/${organization.public_slug}/${group.public_slug}`
    : `/o/${organization.public_slug}`;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title={seoTitle.slice(0, 60)} description={seoDescription.slice(0, 160)} path={seoPath} />
      <Helmet>
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <SponsorlyLogo variant="full" theme="light" className="h-8 w-auto" />
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        {displayCover ? (
          <div
            className="h-48 sm:h-64 w-full bg-center bg-cover relative"
            style={{ backgroundImage: `url(${displayCover})` }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ) : null}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={`${displayName} logo`}
                className="h-20 w-20 rounded-md object-contain bg-white border border-border p-2"
              />
            ) : null}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{displayName}</h1>
              {displayTagline ? (
                <p className="mt-2 text-muted-foreground text-base sm:text-lg">{displayTagline}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {location}
                  </span>
                ) : null}
                {displayWebsite ? (
                  <a
                    href={displayWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> Website
                  </a>
                ) : null}
                {displayContact ? (
                  <a
                    href={`mailto:${displayContact}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" /> Contact
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active fundraisers */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">Active Fundraisers</h2>
          <span className="text-sm text-muted-foreground">{active.length} open</span>
        </div>

        {active.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                There are no active fundraisers right now. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((c) => (
              <FundraiserCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>

      {/* Past fundraisers */}
      {past.length > 0 ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="text-xl font-semibold mb-1">Past Fundraisers</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Total raised across all fundraisers: <strong>{formatCurrency(totalRaised)}</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((c) => (
              <FundraiserCard key={c.id} campaign={c} muted />
            ))}
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Powered by{" "}
            <Link to="/" className="text-foreground font-medium hover:underline">
              Sponsorly
            </Link>
          </span>
          <Link to="/signup" className="hover:underline">
            Start your own fundraiser
          </Link>
        </div>
      </footer>

      <ShareHubDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={typeof window !== "undefined" ? `${window.location.origin}${seoPath}` : seoPath}
        title={displayName}
      />
    </div>
  );
};

const FundraiserCard = ({ campaign, muted = false }: { campaign: CampaignRow; muted?: boolean }) => {
  const raised = Number(campaign.amount_raised || 0);
  const goal = Number(campaign.goal_amount || 0);
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const dl = daysLeft(campaign.end_date);
  const href = campaign.slug ? `/c/${campaign.slug}` : "#";

  return (
    <Link to={href} className={`block ${muted ? "opacity-80" : ""}`}>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        {campaign.image_url ? (
          <div
            className="h-40 w-full bg-center bg-cover bg-muted"
            style={{ backgroundImage: `url(${campaign.image_url})` }}
            aria-hidden="true"
          />
        ) : (
          <div className="h-40 w-full bg-muted" aria-hidden="true" />
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            {campaign.campaign_type?.name ? (
              <Badge variant="secondary" className="text-xs">{campaign.campaign_type.name}</Badge>
            ) : <span />}
            {dl !== null && !muted ? (
              <span className="text-xs text-muted-foreground">
                {dl === 0 ? "Ends today" : `${dl} day${dl === 1 ? "" : "s"} left`}
              </span>
            ) : null}
          </div>
          <h3 className="font-semibold text-base leading-snug line-clamp-2">{campaign.name}</h3>
          {campaign.description ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
          ) : null}

          {goal > 0 ? (
            <div className="mt-3">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(raised)}</strong> raised
                </span>
                <span>{pct}% of {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goal)}</span>
              </div>
            </div>
          ) : raised > 0 ? (
            <p className="mt-3 text-sm">
              <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(raised)}</strong>{" "}
              <span className="text-muted-foreground">raised</span>
            </p>
          ) : null}

          {!muted ? (
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Support this fundraiser <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
};

export default PublicHub;