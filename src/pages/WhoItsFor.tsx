import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { SeoHead } from "@/components/seo/SeoHead";
import { AUDIENCE_SCOPED_CSS } from "@/components/audience/audienceStyles";

const Icon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);

const SVG: Record<string, string> = {
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  music: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  cap: "M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z",
  mask: "M12 2C7 2 3 6 3 11v3a4 4 0 004 4h1a3 3 0 003-3v-1H8.5a.5.5 0 010-1H10v-2H8.5a.5.5 0 010-1H10c0-2.5 1.5-4 2-4s2 1.5 2 4h1.5a.5.5 0 010 1H14v2h1.5a.5.5 0 010 1H14v1a3 3 0 003 3h1a4 4 0 004-4v-3c0-5-4-9-9-9z",
};

const audiences = [
  {
    to: "/schools/sports-teams",
    title: "Sports Teams",
    body: "Roster fundraisers, sponsor packages, team stores, pledge-per-event fundraisers. Fund the season your team deserves.",
    photo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80",
    iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.player,
  },
  {
    to: "/schools/booster-clubs",
    title: "Booster Clubs",
    body: "Tiered sponsor packages, capital fundraisers, gala & auction nights. Run the program without the binder.",
    photo: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=900&q=80",
    iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.shield,
  },
  {
    to: "/schools/pto-pta",
    title: "PTOs & PTAs",
    body: "Direct-give fundraisers, jog-a-thons, spring auctions, classroom grants. Volunteer-friendly, board-ready.",
    photo: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80",
    iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.parents,
  },
  {
    to: "/schools/marching-bands",
    title: "Marching Bands",
    body: "Per-student fair-share, BOA travel funding, program-book ads, alumni drives. Built for a marching budget.",
    photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
    iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.music,
  },
  {
    to: "/schools/academic-clubs",
    title: "Academic Clubs",
    body: "Robotics, debate, Science Olympiad, Model UN, FBLA, esports. Travel funds, registration fees, equipment grants — built for the regional-to-nationals climb.",
    photo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80",
    iconBg: "rgba(14,138,138,0.14)", iconColor: "#0E8A8A", icon: SVG.cap,
  },
  {
    to: "/schools/arts-clubs",
    title: "Arts Clubs",
    body: "Theater, choir, orchestra, dance, film, visual arts. Production budgets, season subscriptions, donor lounges, program-book ads — patron culture without the binder.",
    photo: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=80",
    iconBg: "rgba(214,51,108,0.14)", iconColor: "#D6336C", icon: SVG.mask,
  },
  {
    to: "/nonprofits",
    title: "Nonprofits",
    body: "Annual appeals, peer-to-peer events, capital fundraisers, recurring giving, major-gift CRM. Big-shop tools, small-shop fees.",
    photo: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=900&q=80",
    iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.heart,
    wide: true,
  },
];

const WhoItsFor = () => (
  <div className="sp-aud theme-blue">
    <SeoHead
      title="Who's Sponsorly for? — Built for teams, schools, nonprofits & businesses"
      description="Sponsorly powers fundraising for sports teams, booster clubs, marching bands, PTOs/PTAs, nonprofits, and the local businesses that sponsor them. One platform, zero fees."
      path="/who-its-for"
    />
    <style dangerouslySetInnerHTML={{ __html: AUDIENCE_SCOPED_CSS }} />
    <MarketingHeader />

    <section className="sp-hub-hero">
      <div className="sp-wrap">
        <span className="sp-chip">
          <span className="sp-chip-dot" /> Who's it for?
        </span>
        <h1>
          Built for the people who<br />
          <em>actually do the asking.</em>
        </h1>
        <p>
          Coaches, parent volunteers, band directors, robotics mentors, theater parents, executive directors, treasurers, presidents. Sponsorly is the same zero-fee platform tailored for every kind of group that raises.
        </p>
      </div>
    </section>

    <section style={{ padding: 0 }}>
      <div className="sp-wrap-wide">
        <div className="sp-hub-grid">
          {audiences.map((a) => (
            <Link key={a.to} to={a.to} className={`sp-hub-card${a.wide ? " wide" : ""}`}>
              <div className="sp-photo" style={{ backgroundImage: `url('${a.photo}')` }} />
              <div className="sp-body">
                <div>
                  <div className="sp-ico" style={{ background: a.iconBg, color: a.iconColor }}>
                    <Icon d={a.icon} />
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </div>
                <div className="sp-arr">Explore {a.title.toLowerCase()} →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="sp-final-cta">
      <div className="sp-wrap">
        <span className="sp-chip green">
          <span className="sp-chip-dot" /> Free forever. No card required.
        </span>
        <h2>
          Whatever you're raising for,<br />
          <em>we built it for you.</em>
        </h2>
        <p className="sp-sub">Most organizations are live in under 10 minutes. No credit card. No platform fees ever.</p>
        <div className="sp-ctas">
          <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">Start free</Link>
          <Link to="/contact" className="sp-btn sp-btn-on-dark sp-btn-lg">Talk to our team →</Link>
        </div>
      </div>
    </section>

    <MarketingFooter />
  </div>
);

export default WhoItsFor;