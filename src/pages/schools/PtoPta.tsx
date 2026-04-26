import AudiencePage from "@/components/audience/AudiencePage";

const SVG = {
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  book: "M19 2H8a3 3 0 00-3 3v14a3 3 0 003 3h11V2zM8 4h9v12H8a1 1 0 00-1 1V5a1 1 0 011-1z",
  cal: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z",
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  shirt: "M16 6V4l-2-2H10L8 4v2H2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6h-6zm-6-2h4v2h-4V4z",
  ticket: "M22 10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 012 2 2 2 0 01-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 01-2-2 2 2 0 012-2z",
  star: "M12 3l3 6 6 1-4.5 4.5 1.5 6.5L12 17l-6 4 1.5-6.5L3 10l6-1z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
};

const PtoPta = () => (
  <AudiencePage
    theme="violet"
    seo={{
      title: "Sponsorly for PTOs & PTAs — Fund teachers, classrooms, and the whole school",
      description: "Built for parent-teacher organizations: classroom funding, teacher grants, school events, spirit-wear stores, and parent CRM. Zero platform fees, IRS-ready receipts.",
      path: "/schools/pto-pta",
    }}
    chipLabel="Built for PTOs & PTAs"
    heroHeadlinePre="Fund the teachers, classrooms,"
    heroHeadlineEm="and the whole school."
    heroSub="From the spring carnival to the teacher-grant fund to the field-trip scholarship — one platform for every PTO and PTA fundraiser, with zero platform fees taking from the school."
    primaryCta="Start your PTO/PTA — free"
    secondaryCta="See how it works"
    microPoints={["Zero platform fees", "501(c)(3) receipt automation", "Volunteer-friendly setup"]}
    heroImage="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&q=80"
    heroBadgeAmount="$48,200"
    heroBadgeLabel="Raised this year"
    heroOrgName="Lakeside Elementary PTO"
    heroOrgMeta1="412 families · 28 sponsors"
    heroOrgMeta2="Goal $65,000"
    heroBarPct={74}
    pillarsEyebrow="Why PTOs & PTAs choose Sponsorly"
    pillarsEyebrowColor="violet"
    pillarsHeadline="Built for the volunteers who"
    pillarsHeadlineEm="run the whole school."
    pillarsSub="Annual giving drives, fall festivals, teacher grants, and spirit wear — finally on one platform with no fees eating the proceeds."
    pillars={[
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.parents, title: "Built for the parent volunteer.", body: "Set up an entire fundraiser in 10 minutes — no IT, no design, no contract negotiation. Volunteers can run it from a phone after carpool.", bullets: ["10-minute setup", "Mobile-first admin", "Pre-built PTO templates"] },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.book, title: "Direct teacher & classroom funding.", body: "Designate gifts to a specific teacher's grant or classroom wishlist. Donors see exactly where their money went and so does the teacher.", bullets: ["Teacher wishlist pages", "Designated giving", "Auto thank-yous to donors"] },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.cal, title: "Every PTO event, one platform.", body: "Carnival, book fair, fun run, restaurant night — sell tickets, run sponsor packages, and collect donations all in the same place.", bullets: ["Event tickets & sponsorships", "Spirit-wear store", "Annual giving drives"] },
    ]}
    fundEyebrow="Every fundraiser, every grade level"
    fundEyebrowColor="violet"
    fundHeadline="The PTO toolkit, finally in one place."
    fundSub="Stop juggling Square for the bake sale, Venmo for spirit wear, and a paper sign-up for the carnival. One platform, every fundraiser."
    fundCards={[
      { iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.heart, tag: "Fall", title: "Annual giving drive", body: "One ask, one campaign — every family gives once and the PTO is funded for the year.", stat1Value: "$22,400", stat1Label: "Avg raised", stat2Value: "30 days", stat2Label: "Typical run" },
      { iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.cal, tag: "Spring", title: "Carnival & event tickets", body: "Sell wristbands, ride tickets, and game booths. Collect sponsor packages from local businesses in the same campaign.", stat1Value: "$18,000", stat1Label: "Avg event", stat2Value: "1 day", stat2Label: "On-site" },
      { iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.shirt, tag: "Year-round", title: "Spirit-wear store", body: "School logo hoodies, tees, and yard signs printed on demand. Always-on revenue with zero inventory.", stat1Value: "$6,800", stat1Label: "Avg margin", stat2Value: "12 mo", stat2Label: "Always-on" },
      { iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.book, tag: "Anytime", title: "Teacher grants & wishlists", body: "Donors fund a specific teacher's classroom request — 'a class set of chapter books' or 'new science kits.'", stat1Value: "$320", stat1Label: "Avg grant", stat2Value: "100%", stat2Label: "To classroom" },
    ]}
    crmEyebrow="Family & sponsor CRM"
    crmEyebrowColor="violet"
    crmHeadline="Every family, every business —"
    crmHeadlineEm="ready for next year."
    crmSub="When the new PTO board takes over in May, the donor list, sponsor pipeline, and teacher-grant history all stay. No more starting over every year."
    crmChecks={[
      { title: "Tag by grade, teacher, or sponsor type", rest: "— message the right group instantly" },
      { title: "Automatic 501(c)(3) tax receipts", rest: "— families and sponsors get their letters in seconds" },
      { title: "One-click renewal outreach", rest: "— last year's sponsors get re-engaged with one email" },
      { title: "Year-over-year board hand-off", rest: "— the donor list lives with the PTO, not the outgoing president" },
    ]}
    crmMockTitle="Donors · Lakeside Elementary PTO"
    crmMockFilter="⌕  type to search 482 donors"
    crmCols={["Donor", "Tag", "Lifetime", "Last gift"]}
    crmRows={[
      { initials: "JM", avBg: "#7C3AED", name: "Jessica Morales", role: "Parent · 2nd grade · Mrs. Lee", pillLabel: "Family", pillVariant: "violet", amount: "$420", trailing: "Sep 14" },
      { initials: "MS", avBg: "#1F5FE0", name: "Main Street Pediatrics", role: "Carnival sponsor · 3 yrs", pillLabel: "Sponsor", pillVariant: "blue", amount: "$3,600", trailing: "Aug 30" },
      { initials: "RG", avBg: "#0E9F6E", name: "Robert Greene", role: "Grandparent · 4th grade", pillLabel: "Family", pillVariant: "green", amount: "$280", trailing: "Aug 12" },
      { initials: "DA", avBg: "#FF6B35", name: "Davenport Dental", role: "Spirit-wear sponsor · 2 yrs", pillLabel: "Local biz", pillVariant: "orange", amount: "$1,800", trailing: "Aug 4" },
      { initials: "AL", avBg: "#EC4899", name: "Anita Liang", role: "Teacher · 5th grade", pillLabel: "Staff", pillVariant: "violet", amount: "$120", trailing: "Jul 28" },
    ]}
    campEyebrow="Real campaigns, real PTOs"
    campEyebrowColor="green"
    campHeadline="What PTOs & PTAs run on Sponsorly."
    campRows={[
      { title: "Fall annual giving drive", body: "One ask in October — 'Skip the wrapping paper, give directly.' 68% participation rate from a school of 412 families.", amount: "$26,400" },
      { title: "Spring carnival + sponsor packages", body: "Sold wristbands online, collected booth-sponsor packages from 14 local businesses, and ran a silent auction.", amount: "$22,800" },
      { title: "Teacher grant fund", body: "Each classroom posted a wishlist. Donors funded chapter books, science kits, and flexible-seating chairs.", amount: "$8,400" },
      { title: "Spirit-wear store relaunch", body: "School-logo hoodies and tees printed on demand for back-to-school. Always-on revenue all year.", amount: "$5,200" },
    ]}
    campPhoto="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80"
    campQuote="We replaced the gift-wrap fundraiser, the cookie-dough fundraiser, and the magazine drive with one direct ask. Parents thanked us. Teachers got more."
    campQuoteAuthor="Marisol Park"
    campQuoteOrg="President, Lakeside Elementary PTO"
    statsBg="linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)"
    statsHeadline="The platform PTOs and PTAs trust."
    statsSub="From 80-family rural schools to 1,200-family suburban campuses — Sponsorly scales with your community."
    stats={[
      { value: "2,100+", label: "PTOs & PTAs on Sponsorly" },
      { value: "$11M+", label: "Raised for schools" },
      { value: "94%", label: "Renew year-over-year" },
    ]}
    sisterHeadline="Not a PTO or PTA? We're built for these groups too."
    sisterSub="Same platform, same zero fees — tailored for every program on campus and beyond."
    sisterCards={[
      { to: "/schools/sports-teams", title: "Sports Teams", body: "Roster fundraisers, sponsor packages, pledge-per-event campaigns.", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80", arrowColor: "#1F5FE0" },
      { to: "/schools/booster-clubs", title: "Booster Clubs", body: "Tiered sponsor packages, capital campaigns, gala & auction nights.", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80", arrowColor: "#0E9F6E" },
      { to: "/schools/marching-bands", title: "Marching Bands", body: "Trip funds, uniform drives, sponsor-an-instrument, concert ticketing.", image: "https://images.unsplash.com/photo-1574391891836-43b5b7c0a3a4?w=900&q=80", arrowColor: "#FF6B35" },
      { to: "/schools/academic-clubs", title: "Academic Clubs", body: "Robotics, debate, Model UN, FBLA — fund the regional-to-nationals climb.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80", arrowColor: "#0E8A8A" },
      { to: "/schools/arts-clubs", title: "Arts Clubs", body: "Theater, choir, orchestra, dance — production budgets and patron giving.", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=80", arrowColor: "#D6336C" },
      { to: "/nonprofits", title: "Nonprofits", body: "Annual appeals, peer-to-peer events, recurring giving, major-gift CRM.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&q=80", arrowColor: "#7C3AED" },
    ]}
    ctaHeadlinePre="Ready to fund the whole school"
    ctaHeadlineEm="without the fees?"
    ctaSub="Join 2,100+ PTOs and PTAs raising smarter on Sponsorly. Most boards are live in under 15 minutes."
    ctaPrimary="Start your PTO/PTA — free"
    ctaSecondary="Talk to our team"
  />
);

export default PtoPta;