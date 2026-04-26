import AudiencePage from "@/components/audience/AudiencePage";
import ptoPtaPlayground from "@/assets/pto-pta-playground.jpg";

const SVG = {
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  receipt: "M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8l-6-6zm2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  cal: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z",
  cash: "M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1zm-9 8a3 3 0 110-6 3 3 0 010 6z",
  mail: "M22 6c0-1.1-.9-2-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z",
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
};

const Nonprofits = () => (
  <AudiencePage
    theme="violet"
    seo={{
      title: "Sponsorly for Nonprofits — Donor management and fundraising on one platform",
      description: "Built for 501(c)(3) nonprofits: donor CRM, recurring giving, sponsor packages, IRS-ready receipts, peer-to-peer campaigns, and event ticketing. Zero platform fees.",
      path: "/nonprofits",
    }}
    chipLabel="Built for Nonprofits"
    heroHeadlinePre="Mission-driven fundraising,"
    heroHeadlineEm="finally fee-free."
    heroSub="Donor CRM, recurring giving, peer-to-peer campaigns, sponsor packages, and 501(c)(3) receipts — purpose-built for the nonprofits doing the work, not the platforms taking a cut."
    primaryCta="Start your nonprofit — free"
    secondaryCta="See how it works"
    microPoints={["Zero platform fees", "501(c)(3) receipt automation", "Recurring giving built-in"]}
    heroImage="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80"
    heroBadgeAmount="$284,000"
    heroBadgeLabel="Raised this year"
    heroOrgName="Riverside Community Foundation"
    heroOrgMeta1="1,240 donors · 38 sponsors"
    heroOrgMeta2="Goal $400,000"
    heroBarPct={71}
    pillarsEyebrow="Why nonprofits choose Sponsorly"
    pillarsEyebrowColor="violet"
    pillarsHeadline="Built for the nonprofits"
    pillarsHeadlineEm="actually doing the work."
    pillarsSub="Donor management, recurring giving, sponsor pipelines, and IRS-compliant receipting — all on one platform with no fees taking from your mission."
    pillars={[
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.heart, title: "Donor CRM that actually works.", body: "Every donor, every gift, every interaction in one searchable timeline. Tag by program, lifetime value, or recurring status — and message the right group instantly.", bullets: ["Lifetime donor profiles", "Segmented outreach", "Smart-list automation"] },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.cash, title: "Recurring giving, on autopilot.", body: "Monthly donors are the backbone of nonprofit fundraising. Set them up once, and Sponsorly handles cards updates, retries, and renewal reminders.", bullets: ["Monthly & annual recurring", "Card-update automation", "Donor self-service portal"] },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.receipt, title: "IRS-ready receipts in seconds.", body: "Every donation generates an automatic 501(c)(3) tax letter. Annual giving statements go out in January — no spreadsheet, no manual mail-merge.", bullets: ["Per-gift tax receipts", "Annual giving statements", "Compliant with IRS Pub. 1771"] },
    ]}
    fundEyebrow="Every campaign type your nonprofit needs"
    fundEyebrowColor="violet"
    fundHeadline="One platform, every fundraiser."
    fundSub="Annual appeals, gala events, peer-to-peer drives, corporate sponsorships, and recurring giving — all on the same platform with the same donor record."
    fundCards={[
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.heart, tag: "Annual", title: "Year-end appeal", body: "Run a December giving push with personalized email outreach to last year's donors. Auto-receipts go out the same day.", stat1Value: "$84,000", stat1Label: "Avg appeal", stat2Value: "30 days", stat2Label: "Typical run" },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.cash, tag: "Always-on", title: "Monthly giving program", body: "Convert one-time donors into recurring supporters. Monthly giving compounds — small gifts become major.", stat1Value: "$3,200", stat1Label: "Avg monthly", stat2Value: "12 mo", stat2Label: "Renewal rate 89%" },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.cal, tag: "Annual", title: "Gala & event ticketing", body: "Sell event tickets, sponsor tables, and silent-auction packages — all with the donor record attached.", stat1Value: "$48,000", stat1Label: "Avg gala", stat2Value: "1 night", stat2Label: "Cash in hand" },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.parents, tag: "Anytime", title: "Peer-to-peer campaigns", body: "Volunteers, board members, and ambassadors raise from their personal networks with their own pages.", stat1Value: "$22,400", stat1Label: "Avg campaign", stat2Value: "21 days", stat2Label: "Typical run" },
    ]}
    crmEyebrow="Donor management, simplified"
    crmEyebrowColor="violet"
    crmHeadline="Every donor, every program —"
    crmHeadlineEm="in one place."
    crmSub="Stop paying for a separate CRM, a separate giving page, and a separate email tool. Sponsorly is all three — built for the way nonprofits actually work."
    crmChecks={[
      { title: "Tag by program, fund, or donor type", rest: "— restricted gifts stay restricted, always" },
      { title: "Built-in segmented email outreach", rest: "— message lapsed donors, top givers, or board only" },
      { title: "Recurring-giving health dashboard", rest: "— see at-risk monthly donors before they churn" },
      { title: "Annual giving statements automated", rest: "— January 31st, every donor gets their tax letter" },
    ]}
    crmMockTitle="Donors · Riverside Community Foundation"
    crmMockFilter="⌕  type to search 1,240 donors"
    crmCols={["Donor", "Type", "Lifetime", "Last gift"]}
    crmRows={[
      { initials: "JM", avBg: "#7C3AED", name: "Jessica Morales", role: "Monthly donor · 4 yrs", pillLabel: "Recurring", pillVariant: "violet", amount: "$2,880", trailing: "Sep 14" },
      { initials: "MS", avBg: "#1F5FE0", name: "Main Street Foundation", role: "Grant funder · 3 yrs", pillLabel: "Foundation", pillVariant: "blue", amount: "$45,000", trailing: "Aug 30" },
      { initials: "RG", avBg: "#0E9F6E", name: "Robert Greene Estate", role: "Major gift · planned", pillLabel: "Major", pillVariant: "green", amount: "$120,000", trailing: "Aug 12" },
      { initials: "DA", avBg: "#FF6B35", name: "Davenport Holdings", role: "Corporate sponsor · gala", pillLabel: "Corporate", pillVariant: "orange", amount: "$18,000", trailing: "Aug 4" },
      { initials: "AL", avBg: "#EC4899", name: "Anita Liang", role: "Board member · annual", pillLabel: "Board", pillVariant: "violet", amount: "$5,400", trailing: "Jul 28" },
    ]}
    campEyebrow="Real campaigns, real nonprofits"
    campEyebrowColor="green"
    campHeadline="What nonprofits run on Sponsorly."
    campRows={[
      { title: "December year-end appeal", body: "Personalized email outreach to last year's donors with one-click recurring upgrade prompts at checkout.", amount: "$98,400" },
      { title: "Monthly giving relaunch", body: "Converted 142 one-time donors into monthly recurring supporters with a focused 30-day campaign.", amount: "$4,200/mo" },
      { title: "Annual gala", body: "Sold tickets, table sponsorships, and silent-auction packages in one campaign with full donor records attached.", amount: "$76,000" },
      { title: "Board peer-to-peer drive", body: "Each board member's personal page raised from their network. Funds rolled up to the general operating budget.", amount: "$32,800" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80"
    campQuote="We replaced four different platforms — DonorPerfect, Classy, Mailchimp, and a separate ticketing app — with Sponsorly. Same donor, same record, every channel."
    campQuoteAuthor="Marcus Greene"
    campQuoteOrg="Executive Director, Riverside Community Foundation"
    statsBg="linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)"
    statsHeadline="The platform nonprofits trust."
    statsSub="From all-volunteer animal rescues to multi-million-dollar community foundations — Sponsorly scales with your mission."
    stats={[
      { value: "1,400+", label: "Nonprofits on Sponsorly" },
      { value: "$38M+", label: "Raised for missions" },
      { value: "89%", label: "Recurring donor retention" },
    ]}
    sisterHeadline="Not a nonprofit? We're built for these groups too."
    sisterSub="Same platform, same zero fees — tailored for every organization that fundraises."
    sisterCards={[
      { to: "/schools/sports-teams", title: "Sports Teams", body: "Roster fundraisers, sponsor packages, pledge-per-event campaigns.", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/booster-clubs", title: "Booster Clubs", body: "Tiered sponsor packages, capital campaigns, gala & auction nights.", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80", arrowColor: "#0E9F6E" },
      { to: "/schools/pto-pta", title: "PTOs & PTAs", body: "Direct-give campaigns, jog-a-thons, spring auctions, classroom grants.", image: ptoPtaPlayground, arrowColor: "#1F5FE0" },
      { to: "/schools/marching-bands", title: "Marching Bands", body: "Trip funds, uniform drives, sponsor-an-instrument, concert ticketing.", image: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=900&q=80", arrowColor: "#FF6B35" },
      { to: "/schools/academic-clubs", title: "Academic Clubs", body: "Robotics, debate, Model UN, FBLA — fund the regional-to-nationals climb.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80", arrowColor: "#0E8A8A" },
      { to: "/schools/arts-clubs", title: "Arts Clubs", body: "Theater, choir, orchestra, dance — production budgets and patron giving.", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=80", arrowColor: "#D6336C" },
    ]}
    ctaHeadlinePre="Ready to grow your mission"
    ctaHeadlineEm="without losing to fees?"
    ctaSub="Join 1,400+ nonprofits raising smarter on Sponsorly. Most teams migrate from legacy platforms in under 30 days."
    ctaPrimary="Start your nonprofit — free"
    ctaSecondary="Talk to our team"
  />
);

export default Nonprofits;