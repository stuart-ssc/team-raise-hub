import AudiencePage from "@/components/audience/AudiencePage";

const SVG = {
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 18H6V4h7v5h5v11z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  cash: "M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1zm-9 8a3 3 0 110-6 3 3 0 010 6z",
  cap: "M12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
  trophy: "M19 3h-2V2H7v1H5a2 2 0 00-2 2v3a3 3 0 003 3h.5a6.5 6.5 0 005 5.4V19H9v2h6v-2h-2.5v-2.6a6.5 6.5 0 005-5.4H18a3 3 0 003-3V5a2 2 0 00-2-2zM5 9V5h2v4a1 1 0 01-1-1zm14-1a1 1 0 01-1 1V5h2v3z",
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
  music: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z",
  theater: "M12 2a10 10 0 100 20 10 10 0 000-20zm-3 8a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2zm-6.5 4h7c0 2-1.6 3.5-3.5 3.5S8.5 16 8.5 14z",
};

const AcademicClubs = () => (
  <AudiencePage
    theme="teal"
    seo={{
      title: "Sponsorly for Academic Clubs — Fund the trip, the team, the trophy",
      description: "Robotics, Math Team, Science Olympiad, DECA, Mock Trial — Sponsorly funds the travel, parts budgets, and entry fees every academic club season runs on.",
      path: "/schools/academic-clubs",
    }}
    chipLabel="Built for Academic Clubs"
    heroHeadlinePre="Fund the trip,"
    heroHeadlineEm="the team, the trophy."
    heroSub="Robotics, Math Team, Science Olympiad, Quiz Bowl, Model UN, DECA. The travel is real, the entry fees are real, the parts budgets are real — and Sponsorly is built for every one of them."
    primaryCta="Start a club fundraiser — free"
    secondaryCta="Book a 15-minute walkthrough"
    microPoints={["Per-student trip ledgers", "Sponsor & grant tracking", "Coach + parent access"]}
    heroImage="https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&q=80"
    heroBadgeAmount="$12,540"
    heroBadgeLabel="Raised this season"
    heroOrgName="Westview HS Robotics — Team #4126"
    heroOrgMeta1="32 members · Worlds bound"
    heroOrgMeta2="Goal $15,000"
    heroBarPct={84}
    pillarsEyebrow="Why academic clubs choose Sponsorly"
    pillarsEyebrowColor="teal"
    pillarsHeadline="Built for clubs that compete,"
    pillarsHeadlineEm="travel, and build."
    pillarsSub="Every academic team has the same three problems: trip costs, parts budgets, and one teacher-coach trying to track it all. Sponsorly is the operating system for the whole season."
    pillars={[
      { iconBg: "rgba(14,138,138,0.14)", iconColor: "#0E8A8A", icon: SVG.doc, title: "Per-student travel ledgers.", body: "Worlds in Houston. Nationals in DC. Conference in Chicago. Track every student's trip cost, what they've raised, and what they still owe — in one ledger.", bullets: ["Per-student trip balances", "Family-facing fundraising pages", "Auto-receipts for every donation"] },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.parents, title: "Corporate sponsors that actually renew.", body: "Robotics teams have local-business sponsors. Math Team has alumni donors. DECA has industry partners. Sponsorly tracks every relationship so you can renew them.", bullets: ["Tiered sponsor packages", "Renewal reminders 60 days out", "Logo & artwork collection"] },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.cash, title: "Grants & STEM funding, organized.", body: "NASA, Lockheed, local foundations — grants are a lifeline, but reporting back is a nightmare. Sponsorly tracks restricted funds and shows what was spent where.", bullets: ["Grants vs. donations reporting", "Restricted-fund tagging", "Year-end donor summaries"] },
    ]}
    fundEyebrow="Campaigns built for academic clubs"
    fundEyebrowColor="teal"
    fundHeadline="Every fundraiser the competition season runs on."
    fundSub="Off-season camps, build-season parts, travel funds, and tournament entries — the four campaign types that fund a full academic-club year."
    fundCards={[
      { iconBg: "rgba(14,138,138,0.14)", iconColor: "#0E8A8A", icon: SVG.cap, tag: "Pre-season", title: "Scholarship & dues funding", body: "Cover club dues, registration, and team fees so no student is priced out of joining the program.", stat1Value: "$6,200", stat1Label: "Avg raised", stat2Value: "4 weeks", stat2Label: "Typical run" },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.player, tag: "Mid-season", title: "Tournament travel", body: "Worlds, Nationals, Regionals — fund flights, hotels, and meals for the whole roster in one campaign.", stat1Value: "$18,400", stat1Label: "Avg raised", stat2Value: "6 weeks", stat2Label: "Typical run" },
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.bars, tag: "Year-round", title: "Corporate sponsorships", body: "Local engineering firms, law offices, and labs sponsor your team for branded gear and recognition.", stat1Value: "$22,800", stat1Label: "Avg raised", stat2Value: "12 sponsors", stat2Label: "Avg per club" },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.star, tag: "Summer", title: "Camp & clinic scholarships", body: "Send students to summer training, debate camps, and STEM intensives. Donors fund individual scholarships.", stat1Value: "$7,400", stat1Label: "Avg raised", stat2Value: "5 weeks", stat2Label: "Typical run" },
    ]}
    crmEyebrow="Sponsor & family management"
    crmEyebrowColor="teal"
    crmHeadline="The whole roster. The whole rolodex."
    crmHeadlineEm="One screen."
    crmSub="Coaches change, captains graduate, sponsors get acquired. Sponsorly keeps the institutional memory — every student, every donor, every corporate partner — so your team doesn't restart from scratch every year."
    crmChecks={[
      { title: "Per-student trip ledgers", rest: "— see who's raised what and who's still behind" },
      { title: "Sponsor renewal pipeline", rest: "— auto-flag renewals 60 days before the next season" },
      { title: "Grant calendar", rest: "— track NASA, Lockheed, FIRST, and local Rotary deadlines" },
      { title: "Coach & parent permissions", rest: "— coach sees students, treasurer sees funds, admins see everything" },
    ]}
    crmMockTitle="Team & sponsors · Westview Robotics #4126"
    crmMockFilter="⌕  type to search 64 contacts"
    crmCols={["Member / sponsor", "Role", "Trip / lifetime", "Status"]}
    crmRows={[
      { initials: "PI", avBg: "#0E8A8A", name: "Priya Iyer", role: "Senior · Captain", pillLabel: "Captain", pillVariant: "green", amount: "$1,400", trailing: "", trailingPill: { label: "Worlds paid", variant: "green" } },
      { initials: "RL", avBg: "#1F5FE0", name: "Randall Lee", role: "Junior · Build lead", pillLabel: "Member", pillVariant: "blue", amount: "$940", trailing: "", trailingPill: { label: "$260 short", variant: "orange" } },
      { initials: "MR", avBg: "#0E9F6E", name: "Maya Rodriguez", role: "Sophomore · Programmer", pillLabel: "Member", pillVariant: "green", amount: "$520", trailing: "", trailingPill: { label: "$680 short", variant: "orange" } },
      { initials: "LM", avBg: "#7C3AED", name: "Lockheed Martin", role: "Industry sponsor · 3 yrs", pillLabel: "Platinum", pillVariant: "violet", amount: "$15,000", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
      { initials: "BL", avBg: "#FF6B35", name: "Brookline Engineering", role: "Local sponsor · 2 yrs", pillLabel: "Gold", pillVariant: "orange", amount: "$3,200", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
    ]}
    campEyebrow="Real campaigns, real clubs"
    campEyebrowColor="accent"
    campHeadline="What academic clubs are running on Sponsorly."
    campRows={[
      { title: "FIRST Worlds travel", body: "Robotics team fully funded its trip to Worlds in Houston — 32 students, 6 chaperones, 4 nights of hotels.", amount: "$48,200" },
      { title: "Build-season parts & kits", body: "Pre-season campaign covered the full FRC kit-of-parts, custom CNC stock, and 3D-printer filament for the whole season.", amount: "$18,600" },
      { title: "Mock Trial nationals trip", body: "After winning state, the Mock Trial team raised flights and hotels for nationals in 11 days — every donor got a tax letter.", amount: "$22,500" },
      { title: "Science Olympiad event kit", body: "Funded test materials, lab supplies, and event-day breakfast for the regional Science Olympiad invitational the team hosts.", amount: "$7,100" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&q=80"
    campQuote="We were running on a Google Sheet and a stack of Venmo screenshots. Sponsorly is an actual program — our season's coach in one app."
    campQuoteAuthor="Dr. Andrea Reyes"
    campQuoteOrg="Robotics advisor, Westview HS"
    statsBg="linear-gradient(135deg, #0E8A8A 0%, #0A6F6F 100%)"
    statsHeadline="Clubs travel further — and build smarter."
    statsSub="Academic teams across the country use Sponsorly because the platform was built for the year of academic-club support — for students, for sponsors, and for the trophy."
    stats={[
      { value: "540+", label: "Academic clubs on Sponsorly" },
      { value: "$14M+", label: "Raised for travel & equipment" },
      { value: "91%", label: "Of trips fully funded on time" },
    ]}
    sisterHeadline="Built for every program — not just the lab."
    sisterSub="Same platform, same zero fees — every group on campus has a home on Sponsorly."
    sisterCards={[
      { to: "/schools/sports-teams", title: "Sports Teams", body: "Roster fundraisers, sponsor packages, pledge-per-event campaigns.", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/booster-clubs", title: "Booster Clubs", body: "Tiered sponsor packages, capital campaigns, gala & auction nights.", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80", arrowColor: "#0E9F6E" },
      { to: "/schools/pto-pta", title: "PTOs & PTAs", body: "Direct-give campaigns, jog-a-thons, spring auctions, classroom grants.", image: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/marching-bands", title: "Marching Bands", body: "Trip funds, uniform drives, sponsor-an-instrument, concert ticketing.", image: "https://images.unsplash.com/photo-1574391891836-43b5b7c0a3a4?w=900&q=80", arrowColor: "#FF6B35" },
      { to: "/schools/arts-clubs", title: "Arts Clubs", body: "Theater, choir, orchestra, dance — production budgets and patron giving.", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=80", arrowColor: "#D6336C" },
      { to: "/nonprofits", title: "Nonprofits", body: "Annual appeals, peer-to-peer events, recurring giving, major-gift CRM.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&q=80", arrowColor: "#7C3AED" },
    ]}
    ctaHeadlinePre="Fund the season."
    ctaHeadlineEm="Fund every kid on the team."
    ctaSub="Join 540+ academic clubs raising more for travel, parts, and every student's seat at the tournament."
    ctaPrimary="Start a club fundraiser — free"
    ctaSecondary="Talk to our team"
  />
);

export default AcademicClubs;