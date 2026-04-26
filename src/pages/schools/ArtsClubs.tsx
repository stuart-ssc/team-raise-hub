import AudiencePage from "@/components/audience/AudiencePage";

const SVG = {
  ticket: "M22 10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 010 4v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 010-4zm-9 7.5h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 18H6V4h7v5h5v11z",
  cash: "M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1zm-9 8a3 3 0 110-6 3 3 0 010 6z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  music: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z",
  cap: "M12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
  brush: "M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 000-1.41z",
};

const ArtsClubs = () => (
  <AudiencePage
    theme="pink"
    seo={{
      title: "Sponsorly for Arts Clubs — Fund the show, from flats to footlights",
      description: "Theater, choir, dance, film, and visual arts programs raise more on Sponsorly. Built-in ticketing, patron CRM, program-book ad sales, and royalty-friendly receipts.",
      path: "/schools/arts-clubs",
    }}
    chipLabel="Built for Arts Clubs"
    heroHeadlinePre="Fund the show."
    heroHeadlineEm="From flats to footlights."
    heroSub="Theater, choir, dance, film, visual arts, literary mag. Every arts program runs on ticket sales, patron gifts, and a budget tied together with hot glue. Sponsorly fixes the budget part."
    primaryCta="Start an arts fundraiser — free"
    secondaryCta="See a sample show"
    microPoints={["Ticketing & seating", "Patron & donor CRM", "Royalty-friendly receipts"]}
    heroImage="https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80"
    heroBadgeAmount="$28,140"
    heroBadgeLabel="Raised this season"
    heroOrgName="Lincoln HS Theater — Spring Musical"
    heroOrgMeta1="340 patrons · 4 sponsor circles"
    heroOrgMeta2="Goal $32,000"
    heroBarPct={89}
    pillarsEyebrow="Why arts programs choose Sponsorly"
    pillarsEyebrowColor="pink"
    pillarsHeadline="The platform for programs that"
    pillarsHeadlineEm="sell tickets and tell stories."
    pillarsSub="Box-office, patrons, royalty receipts, program-book ads, costume budgets — finally in one place, not by the people already running the show."
    pillars={[
      { iconBg: "rgba(214,51,108,0.14)", iconColor: "#D6336C", icon: SVG.ticket, title: "Ticketing & reserved seating, built-in.", body: "Sell GA and reserved-seating tickets in minutes online. Patrons pick their seats, get a printable ticket, and you keep the door staff sane.", bullets: ["Reserved-seat seating maps", "Concession & merch add-ons", "Comp-tickets & cast-list management"] },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.star, title: "Patron circle & named-gift recognition.", body: "Star Producer, Director, Patron, Friend tiers — with program-book recognition, lobby plaques, and opening-night thank-you notes. All automatic.", bullets: ["Tiered recognition packages", "Auto-generated program-book listings", "Lobby donor wall — auto-updated"] },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.doc, title: "Show-budget bookkeeping.", body: "Royalties, sets, lights, costumes, scripts, costume rentals — track every line item against income from box-office, sponsors, and patrons.", bullets: ["Per-show restricted budgets", "Royalty & rights expense tracking", "Closing-night season report — PDF"] },
    ]}
    fundEyebrow="Campaigns built for every art form"
    fundEyebrowColor="pink"
    fundHeadline="The fundraisers a season runs on."
    fundSub="Fall play, winter showcase, spring musical, year-end gallery night. The campaigns that actually move the audience-to-donor needle."
    fundCards={[
      { iconBg: "rgba(214,51,108,0.14)", iconColor: "#D6336C", icon: SVG.ticket, tag: "Per show", title: "Show ticket sales", body: "Reserved seating, opening-night galas, student matinees, dinner-theater bundles. Run all four off one show page.", stat1Value: "$6,400", stat1Label: "Avg per show", stat2Value: "4 nights", stat2Label: "Typical run" },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.bars, tag: "Per show", title: "Program-book ad sales", body: "Local businesses buy quarter-, half-, and full-page program-book ads. Auto-collect logos and proof artwork.", stat1Value: "$3,200", stat1Label: "Avg per show", stat2Value: "8 sponsors", stat2Label: "Avg per book" },
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.star, tag: "Annual", title: "Patron drive", body: "Star Producer, Director, Patron, Friend tiers — patron circle drive funds the whole season, not just one show.", stat1Value: "$8,400", stat1Label: "Avg raised", stat2Value: "6 weeks", stat2Label: "Typical run" },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.brush, tag: "Spring", title: "Gallery night & auction", body: "Visual-arts shows sell student work and silent-auction donated pieces. Cashless checkout, instant receipts.", stat1Value: "$5,400", stat1Label: "Avg raised", stat2Value: "1 night", stat2Label: "Cash in hand" },
    ]}
    crmEyebrow="Patron & box-office CRM"
    crmEyebrowColor="pink"
    crmHeadline="Every patron, every ticket,"
    crmHeadlineEm="every standing ovation."
    crmSub="Arts programs survive on a small, fiercely loyal patron base. Sponsorly remembers their giving history and the year their kid graduated — so you can keep them showing up for years."
    crmChecks={[
      { title: "Patron giving history", rest: "— see lifetime, last donation, and current tier at a glance" },
      { title: "Ticket-buyer history", rest: "— see who's bought every show season after the season ends" },
      { title: "Program-book listings", rest: "— pull patron names + dedications straight into the playbill" },
      { title: "Director & tech reminders", rest: "— all royalty-due dates, stage-manager item comps, tech crew snacks tracking" },
    ]}
    crmMockTitle="Patrons & ticket-holders · Lincoln HS Theater — spring musical"
    crmMockFilter="⌕  type to search 312 patrons"
    crmCols={["Patron", "Tier", "Lifetime", "Status"]}
    crmRows={[
      { initials: "EA", avBg: "#D6336C", name: "Eleanor & Mark Abramson", role: "Star Producer · 6 yrs", pillLabel: "Producer", pillVariant: "violet", amount: "$9,400", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
      { initials: "BS", avBg: "#7C3AED", name: "Dr. & Susana Mehta", role: "Director · 4 yrs", pillLabel: "Director", pillVariant: "violet", amount: "$5,200", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
      { initials: "AL", avBg: "#1F5FE0", name: "Aaron Levine", role: "Patron · alumni '12", pillLabel: "Patron", pillVariant: "blue", amount: "$1,800", trailing: "", trailingPill: { label: "Outreach sent", variant: "orange" } },
      { initials: "JR", avBg: "#0E9F6E", name: "James Ruiz", role: "Patron · cast parent", pillLabel: "Patron", pillVariant: "green", amount: "$1,200", trailing: "", trailingPill: { label: "Renewing", variant: "green" } },
      { initials: "FH", avBg: "#FF6B35", name: "Father Hayes Bookstore", role: "Program-book ad · 3 yrs", pillLabel: "Sponsor", pillVariant: "orange", amount: "$900", trailing: "", trailingPill: { label: "Paid", variant: "green" } },
    ]}
    campEyebrow="Real campaigns, real arts programs"
    campEyebrowColor="accent"
    campHeadline="What arts programs are running on Sponsorly."
    campRows={[
      { title: "Spring musical box-office", body: "Sold 4 nights of reserved seating, opening-night gala packages, and student matinee bundles for Beauty and the Beast.", amount: "$28,400" },
      { title: "Patron circle annual drive", body: "Re-engaged returning patrons and recruited new Producer-tier supporters with one campaign — funded the whole season.", amount: "$21,600" },
      { title: "Black-box music-fest playlist", body: "The choir program sold tickets and dedications for an alumni-directed song-cycle showcase.", amount: "$9,500" },
      { title: "Visual arts gallery night", body: "Student artwork sale and silent auction. Donors bid live, paid via Sponsorly checkout, and walked out with the piece.", amount: "$7,400" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80"
    campQuote="We used to settle the box-office in a shoebox. Sponsorly closes the show with one click. No after-party math required."
    campQuoteAuthor="Mx. Riley Sutton"
    campQuoteOrg="Theater Director, Lincoln HS Performing Arts"
    statsBg="linear-gradient(135deg, #D6336C 0%, #9D1F4E 100%)"
    statsHeadline="Arts programs sell more — and stress less."
    statsSub="Theater, dance, choir, film, and visual-arts programs use Sponsorly because the platform was built for the way a season actually runs — show by show, patron by patron."
    stats={[
      { value: "480+", label: "Arts programs on Sponsorly" },
      { value: "$12M+", label: "Raised for theater & studios" },
      { value: "2.8x", label: "Patron renewal vs. industry average" },
    ]}
    sisterHeadline="Built for every program — not just the stage."
    sisterSub="Same platform, same zero fees — every group on campus has a home on Sponsorly."
    sisterLinks={[
      { to: "/schools/sports-teams", label: "Sports Teams", iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.player },
      { to: "/schools/booster-clubs", label: "Booster Clubs", iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.shield },
      { to: "/schools/marching-bands", label: "Marching Bands", iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.music },
      { to: "/schools/academic-clubs", label: "Academic Clubs", iconBg: "rgba(14,138,138,0.14)", iconColor: "#0E8A8A", icon: SVG.cap },
    ]}
    ctaHeadlinePre="Curtain up."
    ctaHeadlineEm="Fund every show, every season."
    ctaSub="Join 480+ arts programs running ticketing, patrons, programs and royalties in one app — for less."
    ctaPrimary="Start an arts fundraiser — free"
    ctaSecondary="Talk to our team"
  />
);

export default ArtsClubs;