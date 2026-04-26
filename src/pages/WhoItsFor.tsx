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

const SVG = {
  player: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  shield: "M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z",
  music: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z",
  parents: "M16 4a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  heart: "M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.1A5.1 5.1 0 017.1 3c1.7 0 3.4.8 4.4 2 1-1.2 2.7-2 4.4-2A5.1 5.1 0 0121 8.1c0 3.8-3.4 6.9-8.5 11.5L12 21z",
  bars: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
};

const audiences = [
  {
    to: "/schools/sports-teams",
    title: "Sports Teams",
    body: "Roster fundraisers, jersey sponsors, team stores, and pledge-per-event campaigns built for school and club athletics.",
    photo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80",
    iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.player,
    wide: true,
  },
  {
    to: "/schools/booster-clubs",
    title: "Booster Clubs",
    body: "Multi-team rosters, restricted-fund tracking, and sponsor renewals for the volunteers running the whole athletic program.",
    photo: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=900&q=80",
    iconBg: "rgba(14,159,110,0.14)", iconColor: "#0E9F6E", icon: SVG.shield,
  },
  {
    to: "/schools/marching-bands",
    title: "Marching Bands",
    body: "Per-student trip accounts, instrument sponsorships, and uniform drives for music programs of every size.",
    photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
    iconBg: "rgba(255,107,53,0.14)", iconColor: "#FF6B35", icon: SVG.music,
  },
  {
    to: "/schools/pto-pta",
    title: "PTOs & PTAs",
    body: "Annual giving drives, carnival ticketing, teacher grants, and spirit-wear stores in one volunteer-friendly platform.",
    photo: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80",
    iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.parents,
  },
  {
    to: "/nonprofits",
    title: "Nonprofits",
    body: "Donor CRM, recurring giving, peer-to-peer campaigns, and IRS-ready receipts purpose-built for 501(c)(3)s.",
    photo: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=900&q=80",
    iconBg: "rgba(124,58,237,0.14)", iconColor: "#7C3AED", icon: SVG.heart,
  },
  {
    to: "/for-businesses",
    title: "Local Businesses",
    body: "Sponsor every team, school, and nonprofit in your community from one dashboard — with reporting your accountant will love.",
    photo: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80",
    iconBg: "rgba(31,95,224,0.12)", iconColor: "#1F5FE0", icon: SVG.bars,
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
          One platform.<br />
          <em>Every kind of fundraiser.</em>
        </h1>
        <p>
          From varsity football to the spring book fair to a community foundation's year-end appeal — Sponsorly is built for the way each of these groups actually raises. Pick yours below.
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