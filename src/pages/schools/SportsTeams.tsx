import AudiencePage from "@/components/audience/AudiencePage";

const SVG = {
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  shirt: "M16 6V4l-2-2H10L8 4v2H2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6h-6zm-6-2h4v2h-4V4z",
  ball: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  music: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z",
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  list: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
};

const SportsTeams = () => (
  <AudiencePage
    theme="blue"
    seo={{
      title: "Sponsorly for Sports Teams — Fund the season your team deserves",
      description: "Roster fundraisers, sponsor packages, team stores, and pledge-per-event campaigns built for school and club sports. Zero platform fees.",
      path: "/schools/sports-teams",
    }}
    chipLabel="Built for Sports Teams"
    heroHeadlinePre="Fund the season your team"
    heroHeadlineEm="actually deserves."
    heroSub="From uniforms and tournament travel to new equipment and coaching stipends — sports teams raise more on Sponsorly because every dollar stays with the players."
    primaryCta="Start a team fundraiser — free"
    secondaryCta="See how it works"
    microPoints={["Zero platform fees", "Same-day payouts", "IRS-compliant receipts"]}
    heroImage="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80"
    heroBadgeAmount="$48,200"
    heroBadgeLabel="Raised this season"
    heroOrgName="Lakeside Lions Varsity Girls' Soccer"
    heroOrgMeta1="52 players · 18 sponsors"
    heroOrgMeta2="Goal $60,000"
    heroBarPct={80}
    pillarsEyebrow="Why teams choose Sponsorly"
    pillarsEyebrowColor="blue"
    pillarsHeadline="Built for the way teams actually fundraise."
    pillarsSub="Roster-based fundraising, business sponsorships, and team-store merch — all on the same platform, all fee-free."
    pillars={[
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.player, title: "Every player's network — together.", body: "Each athlete gets their own fundraising page with a personal goal. Friends, grandparents, and neighbors give directly to that player — but the team raises as one.", bullets: ["Personal player pages with photo & jersey #", "Live team leaderboard", "Auto-attribution of every donation"] },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.bars, title: "Local business sponsorships, finally easy.", body: "Sell jersey patches, banner spots, scoreboard ads, and game-day shoutouts. Sponsorly handles the inventory, contracts, and digital ad-files for sponsors.", bullets: ["Tiered sponsor packages", "Logo & artwork collection", "Auto-renewal next season"] },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.shirt, title: "Team-branded merchandise on demand.", body: "Open a team store in 15 minutes. Hoodies, tees, hats, water bottles — printed on demand, no inventory, profit goes straight to the program.", bullets: ["40+ apparel templates", "Print-on-demand fulfillment", "No setup or minimums"] },
    ]}
    fundEyebrow="The fundraisers that work for teams"
    fundEyebrowColor="green"
    fundHeadline="Every season, a different play."
    fundSub="Mix and match the campaigns that fit your sport, your roster, and your time of year."
    fundCards={[
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.player, tag: "Pre-season", title: "Roster fundraiser", body: "Each player invites their network. Personal goals roll up to a team total with a live leaderboard.", stat1Value: "$8,400", stat1Label: "Avg raised", stat2Value: "14 days", stat2Label: "Typical run" },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.bars, tag: "All season", title: "Sponsorship packages", body: "Local businesses sponsor banners, jerseys, and game-day shoutouts. Tiered packages auto-renew yearly.", stat1Value: "$12,800", stat1Label: "Avg raised", stat2Value: "8 sponsors", stat2Label: "Avg per team" },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.shield, tag: "In-game", title: "Pledge-per-event", body: "Pledge per goal, per touchdown, per ace, per 3-pointer. Donors confirm after the game — no chasing checks.", stat1Value: "$5,200", stat1Label: "Avg raised", stat2Value: "1 game", stat2Label: "Typical run" },
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.shirt, tag: "Year-round", title: "Team store", body: "Hoodies, tees, hats — printed on demand. Open it once, profit comes in for the whole season.", stat1Value: "$3,600", stat1Label: "Avg margin", stat2Value: "12 months", stat2Label: "Always-on" },
    ]}
    crmEyebrow="Donor management, simplified"
    crmEyebrowColor="blue"
    crmHeadline="Every donor, every season —"
    crmHeadlineEm="in one place."
    crmSub={`No more spreadsheet of "uncle Mike's email" passed coach to coach. Every donor, sponsor, and local business is tagged, searchable, and ready for next season's outreach.`}
    crmChecks={[
      { title: "Tag by player, sponsor type, or season", rest: "— slice your donor list any way you need" },
      { title: "One-click renewal outreach", rest: "— message every sponsor from last year with one email" },
      { title: "Lifetime giving history", rest: "— see who's given $5 once vs. who's given $500 every year" },
      { title: "Hand off without losing data", rest: "— when the head coach changes, the donor list stays" },
    ]}
    crmMockTitle="Donors · Lakeside Lions Football"
    crmMockFilter="⌕  type to search 348 donors"
    crmCols={["Donor", "Tag", "Lifetime", "Last gift"]}
    crmRows={[
      { initials: "RP", avBg: "#1F5FE0", name: "Riverside Plumbing", role: "Banner sponsor · 4 yrs", pillLabel: "Sponsor", pillVariant: "blue", amount: "$4,800", trailing: "Sep 14" },
      { initials: "MM", avBg: "#0E9F6E", name: "Mary Martinez", role: "Player parent · #22", pillLabel: "Family", pillVariant: "green", amount: "$1,250", trailing: "Aug 30" },
      { initials: "JA", avBg: "#FF6B35", name: "Jefferson Auto Body", role: "Jersey sponsor · 2 yrs", pillLabel: "Local biz", pillVariant: "orange", amount: "$2,400", trailing: "Aug 12" },
      { initials: "DK", avBg: "#7C3AED", name: "Daniel Kim", role: "Alumni · class of '08", pillLabel: "Alumni", pillVariant: "blue", amount: "$960", trailing: "Aug 4" },
      { initials: "SH", avBg: "#EC4899", name: "Sara Hayward", role: "Grandparent · #14", pillLabel: "Family", pillVariant: "green", amount: "$420", trailing: "Jul 28" },
    ]}
    campEyebrow="Real campaigns, real teams"
    campEyebrowColor="accent"
    campHeadline="Plays that run on Sponsorly."
    campRows={[
      { title: "Pre-season roster drive", body: "Each player on the soccer team raises $300 from their network in a 14-day window before fall practice begins.", amount: "$11,400" },
      { title: "Tournament travel sponsorships", body: "Hockey team sells $500 banner spots and $250 game-day shoutouts to fund a regional tournament trip.", amount: "$8,750" },
      { title: "Senior-night equipment fund", body: "Volleyball team sells branded warm-up jackets and ran a senior-night merch pop-up — all profit went to new nets and balls.", amount: "$3,200" },
      { title: "Pledge-per-3-pointer", body: "Basketball team's home opener: donors pledged a few dollars per made 3-pointer. The team hit 14 — and beat their goal.", amount: "$2,940" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80"
    campQuote="We replaced our entire 2003-era helmet stock in one fundraiser. The boosters spent zero hours chasing checks."
    campQuoteAuthor="Coach Marcus Reyes"
    campQuoteOrg="Lakeside Lions Varsity Football"
    statsBg="linear-gradient(135deg, #1F5FE0 0%, #0B3FB0 100%)"
    statsHeadline="The platform teams keep coming back to."
    statsSub="Sports programs across the country trust Sponsorly because every dollar — every season — stays with the team."
    stats={[
      { value: "2,400+", label: "Sports teams on Sponsorly" },
      { value: "$14M+", label: "Raised for athletes" },
      { value: "87%", label: "Renew season-over-season" },
    ]}
    sisterHeadline="Not a sports team? We're built for these groups too."
    sisterSub="Same platform, same zero fees — tailored for every program on campus and beyond."
    sisterLinks={[
      { to: "/schools/booster-clubs", label: "Booster Clubs", iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.shield },
      { to: "/schools/pto-pta", label: "PTOs & PTAs", iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.parents },
      { to: "/schools/marching-bands", label: "Marching Bands", iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.star },
      { to: "/nonprofits", label: "Nonprofits", iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.heart },
    ]}
    ctaHeadlinePre="Ready to fund"
    ctaHeadlineEm="your next season?"
    ctaSub="Join 2,400+ teams raising smarter with Sponsorly. Most teams are live in under 8 minutes."
    ctaPrimary="Start a team fundraiser — free"
    ctaSecondary="Talk to our team"
  />
);

export default SportsTeams;
