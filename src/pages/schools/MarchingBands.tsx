import AudiencePage from "@/components/audience/AudiencePage";

const SVG = {
  music: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z",
  bus: "M4 16c0 .9.4 1.7 1 2.2V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.8c.6-.5 1-1.3 1-2.2V6c0-3.5-3.6-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18 11H6V6h12v5z",
  shirt: "M16 6V4l-2-2H10L8 4v2H2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6h-6zm-6-2h4v2h-4V4z",
  cal: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  cash: "M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1zm-9 8a3 3 0 110-6 3 3 0 010 6z",
};

const MarchingBands = () => (
  <AudiencePage
    theme="accent"
    seo={{
      title: "Sponsorly for Marching Bands — Fund every trip, every uniform, every season",
      description: "Built for marching bands and music programs: uniform fundraisers, competition-trip funding, instrument sponsorships, and parent-booster CRM. Zero platform fees.",
      path: "/schools/marching-bands",
    }}
    chipLabel="Built for Marching Bands"
    heroHeadlinePre="Fund the trip, the uniforms,"
    heroHeadlineEm="and the moments that matter."
    heroSub="Marching bands raise differently — bigger trips, bigger uniforms, bigger instrument lists. Sponsorly is built for the way music programs actually fundraise."
    primaryCta="Start a band fundraiser — free"
    secondaryCta="See how it works"
    microPoints={["Zero platform fees", "Per-student tracking", "Trip-fund automation"]}
    heroImage="https://images.unsplash.com/photo-1574391891836-43b5b7c0a3a4?w=1200&q=80"
    heroBadgeAmount="$92,400"
    heroBadgeLabel="Raised for Indianapolis trip"
    heroOrgName="Lakeside HS Marching Lions"
    heroOrgMeta1="124 students · 38 sponsors"
    heroOrgMeta2="Goal $115,000"
    heroBarPct={80}
    pillarsEyebrow="Why bands choose Sponsorly"
    pillarsEyebrowColor="accent"
    pillarsHeadline="Built for the way bands"
    pillarsHeadlineEm="actually fundraise."
    pillarsSub="Per-student trip accounts, instrument sponsorships, and uniform drives — all on the same platform, all fee-free."
    pillars={[
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.bus, title: "Per-student trip accounts.", body: "Each student has a personal trip-fund balance. Family contributes, grandparents contribute, sponsors contribute — it all credits to that student's trip cost.", bullets: ["Individual student ledgers", "Family donor portal", "Auto-credit at checkout"] },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.music, title: "Instrument & uniform sponsorships.", body: "Local businesses sponsor a tuba, a section, or the new drum-major uniform. Plaques, recognition, and tax letters all handled automatically.", bullets: ["Sponsor-a-uniform packages", "Sponsor-an-instrument tiers", "Auto-renewal each year"] },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.cal, title: "Built for the long season.", body: "From summer band camp through state finals — track every fundraiser, every donor, every trip in one rolling dashboard.", bullets: ["Multi-season comparison", "Performance event tickets", "Recital & competition donations"] },
    ]}
    fundEyebrow="The fundraisers that work for bands"
    fundEyebrowColor="accent"
    fundHeadline="Every season, every section."
    fundSub="Mix and match the campaigns that fit your program — competitive marching, concert band, jazz, color guard, percussion."
    fundCards={[
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.bus, tag: "Pre-season", title: "Trip fundraiser", body: "Each student raises toward their personal trip cost. Funds credit straight to their student account.", stat1Value: "$680", stat1Label: "Avg per student", stat2Value: "60 days", stat2Label: "Typical run" },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.music, tag: "Year-round", title: "Sponsor-an-instrument", body: "Local businesses sponsor an instrument or section with a plaque, tax letter, and program-book recognition.", stat1Value: "$14,200", stat1Label: "Avg raised", stat2Value: "12 mo", stat2Label: "Always-on" },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.shirt, tag: "Annual", title: "Uniform fund", body: "Run a one-time push to replace the uniform set. Donors and sponsors both contribute toward the goal.", stat1Value: "$32,000", stat1Label: "Avg drive", stat2Value: "1 season", stat2Label: "To goal" },
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.cal, tag: "Performance", title: "Concert ticket sales", body: "Sell tickets to recitals, fall preview, and winter concert. Add a donation upsell on every checkout.", stat1Value: "$4,800", stat1Label: "Avg event", stat2Value: "1 night", stat2Label: "Cash in hand" },
    ]}
    crmEyebrow="Donor & family CRM"
    crmEyebrowColor="accent"
    crmHeadline="Every family, every sponsor —"
    crmHeadlineEm="organized for next season."
    crmSub="Marching band families give for years. Sponsorly remembers — so when the senior trip comes around, you know exactly who to ask and what they've given."
    crmChecks={[
      { title: "Tag by section, grad year, or sponsor type", rest: "— filter your list any way you need" },
      { title: "Per-student giving history", rest: "— see exactly who has given for each band kid" },
      { title: "Auto-generated 501(c)(3) receipts", rest: "— families and sponsors get tax letters in seconds" },
      { title: "Year-over-year sponsor renewal", rest: "— last year's instrument sponsors get a one-click ask" },
    ]}
    crmMockTitle="Donors · Lakeside HS Marching Lions"
    crmMockFilter="⌕  type to search 412 donors"
    crmCols={["Donor", "Tag", "Lifetime", "Last gift"]}
    crmRows={[
      { initials: "JM", avBg: "#FF6B35", name: "Jessica Morales", role: "Parent · Drumline · Class '26", pillLabel: "Family", pillVariant: "orange", amount: "$2,400", trailing: "Sep 14" },
      { initials: "MS", avBg: "#1F5FE0", name: "Main Street Music", role: "Instrument sponsor · 5 yrs", pillLabel: "Sponsor", pillVariant: "blue", amount: "$8,400", trailing: "Aug 30" },
      { initials: "RG", avBg: "#0E9F6E", name: "Robert Greene", role: "Grandparent · Color Guard", pillLabel: "Family", pillVariant: "green", amount: "$1,200", trailing: "Aug 12" },
      { initials: "DA", avBg: "#7C3AED", name: "Davenport Auto", role: "Uniform sponsor · 3 yrs", pillLabel: "Local biz", pillVariant: "violet", amount: "$3,600", trailing: "Aug 4" },
      { initials: "AL", avBg: "#EC4899", name: "Alumni · Class of '04", role: "Brass section · recurring", pillLabel: "Alumni", pillVariant: "blue", amount: "$960", trailing: "Jul 28" },
    ]}
    campEyebrow="Real campaigns, real bands"
    campEyebrowColor="green"
    campHeadline="What marching bands run on Sponsorly."
    campRows={[
      { title: "Indianapolis trip drive", body: "Each of 124 students raised toward their personal trip cost. Funds auto-credited to individual ledgers.", amount: "$84,300" },
      { title: "New uniform set fundraiser", body: "Combination donor drive + uniform sponsorships replaced a 12-year-old uniform set in one season.", amount: "$48,000" },
      { title: "Sponsor-an-instrument relaunch", body: "32 local businesses sponsored a tuba, sax, or color-guard flag set with full plaque & program recognition.", amount: "$22,800" },
      { title: "Winter concert tickets + donations", body: "Sold concert tickets with a donation upsell at checkout. Every family gave a little more on the way in.", amount: "$6,400" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80"
    campQuote="We finally retired the 2003 uniforms in one fundraising season. The parents stopped chasing checks and started actually enjoying competition weekends."
    campQuoteAuthor="Director Kelvin Aoki"
    campQuoteOrg="Lakeside HS Marching Lions"
    statsBg="linear-gradient(135deg, #FF6B35 0%, #E0531B 100%)"
    statsHeadline="The platform music programs trust."
    statsSub="From 30-piece middle-school bands to 300-piece state-finalist programs — Sponsorly scales with your music."
    stats={[
      { value: "1,200+", label: "Music programs on Sponsorly" },
      { value: "$9M+", label: "Raised for bands" },
      { value: "92%", label: "Renew season-over-season" },
    ]}
    sisterHeadline="Not a marching band? We're built for these groups too."
    sisterSub="Same platform, same zero fees — tailored for every program on campus and beyond."
    sisterCards={[
      { to: "/schools/sports-teams", title: "Sports Teams", body: "Roster fundraisers, sponsor packages, pledge-per-event campaigns.", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/booster-clubs", title: "Booster Clubs", body: "Tiered sponsor packages, capital campaigns, gala & auction nights.", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80", arrowColor: "#0E9F6E" },
      { to: "/schools/pto-pta", title: "PTOs & PTAs", body: "Direct-give campaigns, jog-a-thons, spring auctions, classroom grants.", image: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/academic-clubs", title: "Academic Clubs", body: "Robotics, debate, Model UN, FBLA — fund the regional-to-nationals climb.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80", arrowColor: "#0E8A8A" },
      { to: "/schools/arts-clubs", title: "Arts Clubs", body: "Theater, choir, orchestra, dance — production budgets and patron giving.", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=80", arrowColor: "#D6336C" },
      { to: "/nonprofits", title: "Nonprofits", body: "Annual appeals, peer-to-peer events, recurring giving, major-gift CRM.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&q=80", arrowColor: "#7C3AED" },
    ]}
    ctaHeadlinePre="Ready to fund"
    ctaHeadlineEm="your next performance?"
    ctaSub="Join 1,200+ music programs raising smarter on Sponsorly. Most bands are live in under 10 minutes."
    ctaPrimary="Start a band fundraiser — free"
    ctaSecondary="Talk to our team"
  />
);

export default MarchingBands;