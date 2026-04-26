import AudiencePage from "@/components/audience/AudiencePage";
import ptoPtaPlayground from "@/assets/pto-pta-playground.jpg";

const SVG = {
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  cash: "M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1zm-9 8a3 3 0 110-6 3 3 0 010 6z",
  cal: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z",
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 18H6V4h7v5h5v11z",
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  shirt: "M16 6V4l-2-2H10L8 4v2H2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6h-6zm-6-2h4v2h-4V4z",
};

const BoosterClubs = () => (
  <AudiencePage
    theme="green"
    seo={{
      title: "Sponsorly for Booster Clubs — One platform for every program you support",
      description: "Run sponsorships, donations, merch, and events for every team and group your booster club funds. Built-in CRM, IRS-ready receipts, zero platform fees.",
      path: "/schools/booster-clubs",
    }}
    chipLabel="Built for Booster Clubs"
    heroHeadlinePre="One platform for every program"
    heroHeadlineEm="your booster club supports."
    heroSub="Multi-team rosters, sponsor renewals, restricted-fund tracking, and 501(c)(3) receipts — purpose-built for the volunteers who keep school athletics and activities funded."
    primaryCta="Start your booster club — free"
    secondaryCta="See how it works"
    microPoints={["Zero platform fees", "Multi-team & multi-fund", "501(c)(3) receipt automation"]}
    heroImage="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80"
    heroBadgeAmount="$184,500"
    heroBadgeLabel="Raised this year"
    heroOrgName="Lakeside HS Athletic Boosters"
    heroOrgMeta1="14 teams · 62 sponsors"
    heroOrgMeta2="Goal $250,000"
    heroBarPct={74}
    pillarsEyebrow="Why boosters choose Sponsorly"
    pillarsEyebrowColor="green"
    pillarsHeadline="Built for the messy reality of"
    pillarsHeadlineEm="multi-program fundraising."
    pillarsSub="One booster club, fifteen teams, three checking accounts, and a sponsor list trapped in someone's Gmail. Sponsorly fixes that."
    pillars={[
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.cash, title: "Restricted funds, finally trackable.", body: "Money raised for football stays with football. Wrestling sees what wrestling raised. Every dollar is tagged to its program automatically.", bullets: ["Per-team sub-accounts", "Restricted-fund reporting", "Designated giving on every donation"] },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.bars, title: "Sponsor renewal that runs itself.", body: "Banner sponsors, jersey sponsors, scoreboard ads — all auto-renewed each season with one-click outreach to last year's supporters.", bullets: ["Lifetime sponsor history", "One-click renewal emails", "Auto-generated sponsor invoices"] },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.shield, title: "Made for volunteer hand-offs.", body: "When the treasurer changes and the new president takes over, the donor list, sponsor contracts, and fund balances are all still there.", bullets: ["Role-based admin access", "Full audit trail", "Year-over-year reporting"] },
    ]}
    fundEyebrow="Every fundraiser, every program"
    fundEyebrowColor="green"
    fundHeadline="The toolkit your booster club needs."
    fundSub="Stop juggling Square, Venmo, GoFundMe, and a paper sign-up sheet. One platform, every program, every fundraiser type."
    fundCards={[
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.bars, tag: "Year-round", title: "Sponsorship packages", body: "Tiered banner, jersey, and scoreboard sponsorships sold once and renewed every season automatically.", stat1Value: "$28,400", stat1Label: "Avg per club", stat2Value: "12 mo", stat2Label: "Always-on" },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.player, tag: "Pre-season", title: "Roster fundraisers", body: "Each team's athletes raise from their personal network. Funds stay with that team's restricted account.", stat1Value: "$8,200", stat1Label: "Avg per team", stat2Value: "14 days", stat2Label: "Typical run" },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.shirt, tag: "Year-round", title: "Spirit-wear store", body: "School-branded apparel printed on demand. Open it once, profit comes in every game-day weekend.", stat1Value: "$12,600", stat1Label: "Avg margin", stat2Value: "0", stat2Label: "Inventory needed" },
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.cal, tag: "Annual", title: "Banquet & event tickets", body: "Sell awards-banquet tickets, golf-outing entries, and silent-auction packages — all in one place.", stat1Value: "$18,000", stat1Label: "Avg event", stat2Value: "1 night", stat2Label: "Cash in hand" },
    ]}
    crmEyebrow="Sponsor & donor CRM"
    crmEyebrowColor="green"
    crmHeadline="Every sponsor, every season —"
    crmHeadlineEm="one source of truth."
    crmSub="No more passing a spreadsheet from outgoing treasurer to incoming treasurer. Your sponsor list, donor history, and renewal pipeline live in one place forever."
    crmChecks={[
      { title: "Tag by team, sport, or sponsor tier", rest: "— filter and message the right group instantly" },
      { title: "Renewal reminders 60 days out", rest: "— never lose a returning sponsor again" },
      { title: "Auto-generated 501(c)(3) receipts", rest: "— donors get tax letters in seconds, not weeks" },
      { title: "Lifetime giving & sponsor history", rest: "— see your top 10 supporters across every season" },
    ]}
    crmMockTitle="Sponsors · Lakeside HS Athletic Boosters"
    crmMockFilter="⌕  type to search 187 sponsors"
    crmCols={["Sponsor", "Team", "Lifetime", "Renewal"]}
    crmRows={[
      { initials: "RP", avBg: "#0E9F6E", name: "Riverside Plumbing", role: "Banner · Football", pillLabel: "Tier 1", pillVariant: "green", amount: "$14,200", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
      { initials: "JA", avBg: "#1F5FE0", name: "Jefferson Auto Body", role: "Jersey · Soccer", pillLabel: "Tier 2", pillVariant: "blue", amount: "$8,400", trailing: "", trailingPill: { label: "Sent 9/12", variant: "orange" } },
      { initials: "MM", avBg: "#FF6B35", name: "Main Street Diner", role: "Scoreboard · All", pillLabel: "Tier 1", pillVariant: "green", amount: "$11,200", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
      { initials: "DK", avBg: "#7C3AED", name: "Daniel Kim Realty", role: "Banner · Basketball", pillLabel: "Tier 3", pillVariant: "violet", amount: "$3,600", trailing: "", trailingPill: { label: "Pending", variant: "orange" } },
      { initials: "SH", avBg: "#EC4899", name: "Sara Hayward, DDS", role: "Jersey · Volleyball", pillLabel: "Tier 2", pillVariant: "blue", amount: "$5,400", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
    ]}
    campEyebrow="Real campaigns, real boosters"
    campEyebrowColor="accent"
    campHeadline="What boosters are running on Sponsorly."
    campRows={[
      { title: "Annual sponsor renewal drive", body: "Athletic boosters re-engaged 47 returning sponsors with one outreach email — 89% renewed within 14 days.", amount: "$62,400" },
      { title: "Multi-team roster fundraiser", body: "All 14 fall sports teams ran rosters simultaneously. Funds auto-allocated to each team's restricted account.", amount: "$48,800" },
      { title: "Spring spirit-wear store", body: "Branded hoodies, hats, and yard signs printed on demand for the playoff push — zero inventory risk.", amount: "$11,300" },
      { title: "Annual booster banquet", body: "Sold tickets, sponsorships, and silent-auction packages in one campaign. All revenue tagged to the general fund.", amount: "$24,000" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80"
    campQuote="We were managing 14 teams in 7 different bank accounts and 3 spreadsheets. Sponsorly turned it into one dashboard. Best switch we ever made."
    campQuoteAuthor="Renee Saunders"
    campQuoteOrg="President, Lakeside HS Athletic Boosters"
    statsBg="linear-gradient(135deg, #0E9F6E 0%, #0A7A55 100%)"
    statsHeadline="Boosters keep coming back."
    statsSub="The platform built for the volunteers who keep school programs funded."
    stats={[
      { value: "1,800+", label: "Booster clubs on Sponsorly" },
      { value: "$22M+", label: "Raised across programs" },
      { value: "91%", label: "Renew year-over-year" },
    ]}
    sisterHeadline="Not running a booster club? We're built for these groups too."
    sisterSub="Same platform, same zero fees — tailored for every program on campus and beyond."
    sisterCards={[
      { to: "/schools/sports-teams", title: "Sports Teams", body: "Roster fundraisers, sponsor packages, pledge-per-event campaigns.", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/pto-pta", title: "PTOs & PTAs", body: "Direct-give campaigns, jog-a-thons, spring auctions, classroom grants.", image: ptoPtaPlayground, arrowColor: "#1F5FE0" },
      { to: "/schools/marching-bands", title: "Marching Bands", body: "Trip funds, uniform drives, sponsor-an-instrument, concert ticketing.", image: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=900&q=80", arrowColor: "#FF6B35" },
      { to: "/schools/academic-clubs", title: "Academic Clubs", body: "Robotics, debate, Model UN, FBLA — fund the regional-to-nationals climb.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80", arrowColor: "#0E8A8A" },
      { to: "/schools/arts-clubs", title: "Arts Clubs", body: "Theater, choir, orchestra, dance — production budgets and patron giving.", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=80", arrowColor: "#D6336C" },
      { to: "/nonprofits", title: "Nonprofits", body: "Annual appeals, peer-to-peer events, recurring giving, major-gift CRM.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&q=80", arrowColor: "#7C3AED" },
    ]}
    ctaHeadlinePre="Ready to fund every team"
    ctaHeadlineEm="under one roof?"
    ctaSub="Join 1,800+ booster clubs raising smarter on Sponsorly. Most clubs are live in under 10 minutes."
    ctaPrimary="Start your booster club — free"
    ctaSecondary="Talk to our team"
  />
);

export default BoosterClubs;