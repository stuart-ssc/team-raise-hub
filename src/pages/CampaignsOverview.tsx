import { useEffect } from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";

/**
 * Sponsorly Fundraisers — rebuilt to match the approved 2026 mockup.
 * Fully scoped under .sp-fundraisers so the rest of the app's design
 * system is untouched. Mirrors typography + tokens from
 * src/pages/Features.tsx, src/pages/Pricing.tsx, and src/pages/Schools.tsx.
 */

const SCOPED_CSS = `
.sp-fundraisers {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-accent: #FF6B35;
  --sp-violet: #7B5BE0;
  --sp-amber: #E0A21F;
  --sp-pink: #E04F8B;
  --sp-ink: #0A0F1E;
  --sp-ink-2: #2B3345;
  --sp-muted: #6B7489;
  --sp-line: #E6E9F0;
  --sp-paper: #FAFAF7;
  --sp-paper-2: #F2F3EE;
  --sp-display: "Instrument Serif", "Cormorant Garamond", Georgia, serif;
  --sp-ui: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  background: var(--sp-paper);
  color: var(--sp-ink);
  font-family: var(--sp-ui);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
  overflow-x: hidden;
  max-width: 100vw;
}
.sp-fundraisers .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-fundraisers .sp-italic { font-style: italic; }
.sp-fundraisers .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(31,95,224,0.08); color: var(--sp-blue); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-fundraisers .sp-eyebrow-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-fundraisers .sp-eyebrow-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-fundraisers .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-fundraisers .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-fundraisers .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-fundraisers .sp-btn:hover { transform: translateY(-1px); }
.sp-fundraisers .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-fundraisers .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-fundraisers .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-fundraisers .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-fundraisers .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-fundraisers .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-fundraisers .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-fundraisers .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-fundraisers .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* Section primitives */
.sp-fundraisers .sp-section { padding: 96px 0; }
.sp-fundraisers .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-fundraisers .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-fundraisers .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-fundraisers .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-fundraisers .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-fundraisers .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-fundraisers .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 600px; }
.sp-fundraisers .sp-center { text-align: center; }
.sp-fundraisers .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-fundraisers .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-fundraisers .sp-hero { position: relative; padding: 88px 0 80px; overflow: hidden; background:
  radial-gradient(900px 480px at 80% -10%, rgba(31,95,224,0.10), transparent 60%),
  radial-gradient(700px 360px at 5% 0%, rgba(255,107,53,0.08), transparent 60%),
  var(--sp-paper); }
.sp-fundraisers .sp-hero-inner { text-align: center; max-width: 880px; margin: 0 auto; }
.sp-fundraisers .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(48px, 6.4vw, 88px); line-height: 1.02; letter-spacing: -0.02em; margin: 22px 0 22px; color: var(--sp-ink); }
.sp-fundraisers .sp-hero h1 .accent { color: var(--sp-blue); font-style: italic; }
.sp-fundraisers .sp-hero p.sub { font-size: 17px; color: var(--sp-ink-2); max-width: 560px; margin: 0 auto 32px; line-height: 1.55; }
.sp-fundraisers .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Type cards */
.sp-fundraisers .sp-types { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 40px; }
.sp-fundraisers .sp-type { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 26px; transition: transform .15s ease, box-shadow .2s ease; display: flex; flex-direction: column; gap: 14px; min-height: 230px; }
.sp-fundraisers .sp-type:hover { transform: translateY(-2px); box-shadow: 0 22px 44px -24px rgba(10,15,30,0.20); }
.sp-fundraisers .sp-type .top { display: flex; justify-content: space-between; align-items: flex-start; }
.sp-fundraisers .sp-type .ico { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; }
.sp-fundraisers .sp-type .meta { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 600; }
.sp-fundraisers .sp-type h3 { font-family: var(--sp-display); font-weight: 400; font-size: 28px; line-height: 1.1; color: var(--sp-ink); }
.sp-fundraisers .sp-type p { font-size: 14px; color: var(--sp-ink-2); line-height: 1.55; }
.sp-fundraisers .sp-type .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
.sp-fundraisers .sp-type .chip { font-size: 11.5px; padding: 5px 10px; background: var(--sp-paper-2); color: var(--sp-ink-2); border-radius: 999px; font-weight: 500; }
.sp-fundraisers .sp-type .explore { color: var(--sp-blue); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; }
.sp-fundraisers .sp-type .explore:hover { color: var(--sp-blue-deep); }

/* Donation tier mock */
.sp-fundraisers .sp-tiers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 8px; background: var(--sp-paper-2); border-radius: 12px; }
.sp-fundraisers .sp-tiers .t { font-size: 13px; padding: 10px 0; text-align: center; border-radius: 8px; color: var(--sp-ink-2); font-weight: 600; }
.sp-fundraisers .sp-tiers .t.on { background: var(--sp-blue); color: white; box-shadow: 0 6px 14px -6px rgba(31,95,224,0.5); }

/* Dark stats band */
.sp-fundraisers .sp-stats { background: #0A0F1E; color: white; padding: 40px 0; }
.sp-fundraisers .sp-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: end; }
.sp-fundraisers .sp-stats-row .col { text-align: center; }
.sp-fundraisers .sp-stats-row .v { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 56px); line-height: 1; letter-spacing: -0.02em; color: white; }
.sp-fundraisers .sp-stats-row .v.green { color: var(--sp-green); font-style: italic; }
.sp-fundraisers .sp-stats-row .l { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.65; margin-top: 8px; font-weight: 600; }

/* Two-column feature blocks */
.sp-fundraisers .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-fundraisers .sp-bullets { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-direction: column; gap: 14px; }
.sp-fundraisers .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-fundraisers .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 2px; }
.sp-fundraisers .sp-bullets li b { font-weight: 600; color: var(--sp-ink); margin-right: 6px; }
.sp-fundraisers .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Mock landing card (block 1) */
.sp-fundraisers .sp-mock-landing { border-radius: 18px; overflow: hidden; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); border: 1px solid var(--sp-line); }
.sp-fundraisers .sp-mock-landing .hero { background: linear-gradient(135deg, #1F5FE0 0%, #7B5BE0 100%); color: white; padding: 28px 24px 36px; position: relative; }
.sp-fundraisers .sp-mock-landing .hero .pill { display: inline-block; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; background: rgba(255,255,255,0.16); padding: 4px 10px; border-radius: 999px; font-weight: 600; }
.sp-fundraisers .sp-mock-landing .hero h4 { font-family: var(--sp-display); font-size: 28px; margin-top: 14px; line-height: 1.1; }
.sp-fundraisers .sp-mock-landing .body { background: white; padding: 18px 20px 22px; }
.sp-fundraisers .sp-mock-landing .progress { height: 8px; background: var(--sp-paper-2); border-radius: 999px; overflow: hidden; margin: 4px 0 8px; }
.sp-fundraisers .sp-mock-landing .progress > i { display: block; height: 100%; width: 67%; background: linear-gradient(90deg, var(--sp-green), #1ABF82); }
.sp-fundraisers .sp-mock-landing .pmeta { display: flex; justify-content: space-between; font-size: 12px; color: var(--sp-muted); }
.sp-fundraisers .sp-mock-landing .pmeta b { color: var(--sp-ink); font-family: var(--sp-display); font-size: 16px; font-weight: 400; }
.sp-fundraisers .sp-mock-landing .cta { margin-top: 14px; background: var(--sp-accent); color: white; text-align: center; padding: 12px; border-radius: 12px; font-weight: 600; font-size: 14px; }

/* Mock checkout card (block 2) */
.sp-fundraisers .sp-mock-checkout { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 18px 18px 20px; box-shadow: 0 30px 60px -32px rgba(10,15,30,0.22); }
.sp-fundraisers .sp-mock-checkout .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--sp-line); font-size: 12px; color: var(--sp-muted); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.sp-fundraisers .sp-mock-checkout .item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--sp-line); }
.sp-fundraisers .sp-mock-checkout .item .nm { font-size: 14px; color: var(--sp-ink); font-weight: 500; }
.sp-fundraisers .sp-mock-checkout .item .sub { font-size: 12px; color: var(--sp-muted); }
.sp-fundraisers .sp-mock-checkout .item .pr { font-family: var(--sp-display); font-size: 18px; }
.sp-fundraisers .sp-mock-checkout .item .badge { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); font-weight: 700; letter-spacing: 0.05em; }
.sp-fundraisers .sp-mock-checkout .pays { display: flex; gap: 6px; padding: 14px 0 6px; flex-wrap: wrap; }
.sp-fundraisers .sp-mock-checkout .pays .p { font-size: 11px; padding: 6px 10px; background: var(--sp-paper-2); border-radius: 8px; color: var(--sp-ink-2); font-weight: 600; }
.sp-fundraisers .sp-mock-checkout .pays .p.dark { background: var(--sp-ink); color: white; }
.sp-fundraisers .sp-mock-checkout .pays .p.blue { background: #5468FF; color: white; }
.sp-fundraisers .sp-mock-checkout .total { background: var(--sp-blue); color: white; text-align: center; padding: 14px; border-radius: 12px; margin-top: 10px; font-weight: 600; font-size: 14px; }

/* Mock donor card (block 3) */
.sp-fundraisers .sp-mock-donor { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -32px rgba(10,15,30,0.22); }
.sp-fundraisers .sp-mock-donor .who { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-fundraisers .sp-mock-donor .who .av { width: 38px; height: 38px; border-radius: 999px; background: var(--sp-blue); color: white; display: grid; place-items: center; font-weight: 700; font-size: 14px; }
.sp-fundraisers .sp-mock-donor .who .nm { font-size: 15px; font-weight: 600; color: var(--sp-ink); }
.sp-fundraisers .sp-mock-donor .who .sub { font-size: 11px; color: var(--sp-muted); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }
.sp-fundraisers .sp-mock-donor .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 0; border-bottom: 1px solid var(--sp-line); }
.sp-fundraisers .sp-mock-donor .grid .cell .l { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 600; }
.sp-fundraisers .sp-mock-donor .grid .cell .v { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); }
.sp-fundraisers .sp-mock-donor .hist .ttl { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 600; padding: 12px 0 6px; }
.sp-fundraisers .sp-mock-donor .hist .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: var(--sp-ink-2); border-top: 1px solid var(--sp-line); }
.sp-fundraisers .sp-mock-donor .hist .row b { font-weight: 500; color: var(--sp-ink); }

/* Comparison table */
.sp-fundraisers .sp-table { background: white; border: 1px solid var(--sp-line); border-radius: 18px; overflow: hidden; margin-top: 32px; box-shadow: 0 24px 48px -28px rgba(10,15,30,0.16); }
.sp-fundraisers .sp-table table { width: 100%; border-collapse: collapse; }
.sp-fundraisers .sp-table thead th { background: var(--sp-paper-2); font-size: 12px; letter-spacing: 0.10em; text-transform: uppercase; font-weight: 700; color: var(--sp-ink); padding: 16px 18px; text-align: left; border-bottom: 1px solid var(--sp-line); }
.sp-fundraisers .sp-table tbody td { font-size: 14px; color: var(--sp-ink-2); padding: 16px 18px; border-bottom: 1px solid var(--sp-line); text-align: center; }
.sp-fundraisers .sp-table tbody td:first-child { text-align: left; color: var(--sp-ink); font-weight: 500; }
.sp-fundraisers .sp-table tbody tr:last-child td { border-bottom: 0; }
.sp-fundraisers .sp-table .check { display: inline-flex; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); align-items: center; justify-content: center; }
.sp-fundraisers .sp-table .dash { color: var(--sp-line); }

/* CTA blue band */
.sp-fundraisers .sp-cta { background: linear-gradient(135deg, var(--sp-blue) 0%, var(--sp-blue-deep) 100%); color: white; padding: 96px 0; text-align: center; position: relative; overflow: hidden; }
.sp-fundraisers .sp-cta::before { content: ""; position: absolute; inset: 0; background: radial-gradient(700px 240px at 50% -10%, rgba(255,255,255,0.18), transparent 60%); pointer-events: none; }
.sp-fundraisers .sp-cta .inner { position: relative; max-width: 720px; margin: 0 auto; padding: 0 32px; }
.sp-fundraisers .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 60px); line-height: 1.05; letter-spacing: -0.01em; margin: 18px 0 16px; }
.sp-fundraisers .sp-cta h2 .accent { font-style: italic; }
.sp-fundraisers .sp-cta p { font-size: 15.5px; opacity: 0.85; max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-fundraisers .sp-cta .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-fundraisers .sp-section { padding: 64px 0; }
  .sp-fundraisers .sp-types { grid-template-columns: 1fr; }
  .sp-fundraisers .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-fundraisers .sp-stats-row { grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .sp-fundraisers .sp-table { overflow-x: auto; }
}
@media (max-width: 560px) {
  .sp-fundraisers .sp-wrap { padding: 0 20px; }
  .sp-fundraisers .sp-stats-row { grid-template-columns: 1fr; }
}
`;

/* Inline icons */
const IHeart = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IStar = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const ICalendar = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IBag = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const IFlag = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/></svg>);
const IGavel = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-7.5 7.5"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>);
const ICheck = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);

const types = [
  {
    Icon: IHeart, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)", meta: "01 / Donations",
    title: "Donation fundraisers",
    copy: "One-time or recurring donations with automatic tax receipts. Ideal for annual giving, emergencies, memorial funds, and monthly supporter programs.",
    chips: ["One-time", "Built-in recurring", "Auto receipts", "5,000+ donors"],
    href: "/fundraisers/donations",
    extra: (
      <div className="sp-tiers" aria-hidden="true">
        <div className="t">$25</div><div className="t on">$100</div><div className="t">$250</div><div className="t">$500</div>
      </div>
    ),
  },
  {
    Icon: IStar, color: "#0E9F6E", bg: "rgba(14,159,110,0.10)", meta: "02 / Sponsorships",
    title: "Sponsorship fundraisers",
    copy: "Local businesses sponsor your team or event in exchange for branded visibility. The fastest way to turn community relationships into recurring revenue.",
    chips: ["Tiered sponsors", "Logo placement", "Renewal reminders", "Business CRM"],
    href: "/fundraisers/sponsorships",
  },
  {
    Icon: ICalendar, color: "#FF6B35", bg: "rgba(255,107,53,0.10)", meta: "03 / Events",
    title: "Event fundraisers",
    copy: "Tickets, tables, and auctions in a single checkout. Galas, golf, tournaments, and 5Ks with built-in seat assignments and check-in.",
    chips: ["Tickets", "Table sponsors", "Check-in QR", "Silent auctions"],
    href: "/fundraisers/events",
  },
  {
    Icon: IFlag, color: "#7B5BE0", bg: "rgba(123,91,224,0.10)", meta: "04 / Pledges",
    title: "Pledge fundraisers",
    copy: "Per-mile, per-lap, or per-rep — supporters pledge a rate and you bill at the finish. Perfect for jogathons, readathons, and seasonal challenges.",
    chips: ["Per-unit pledges", "Auto invoicing", "Roster goals", "Parent reminders"],
    href: "/campaigns/roster",
  },
  {
    Icon: IBag, color: "#E0A21F", bg: "rgba(224,162,31,0.12)", meta: "05 / Merchandise",
    title: "Merchandise sales",
    copy: "Spirit gear, snack stand, or branded apparel — collect orders, take payment, and track fulfillment without spreadsheets or order forms.",
    chips: ["Inventory tracking", "Variants & sizes", "Pickup or ship", "Order CSV"],
    href: "/fundraisers/merchandise",
  },
  {
    Icon: IGavel, color: "#E04F8B", bg: "rgba(224,79,139,0.10)", meta: "06 / Roster",
    title: "Roster-enabled campaigns",
    copy: "Every player, member, or participant gets a personal page and shareable link — with leaderboards, attribution, and team-wide goals.",
    chips: ["P2P pages", "Leaderboards", "Auto attribution", "Goal pacing"],
    href: "/campaigns/roster",
  },
];

const compareRows: Array<{ label: string; cells: Array<boolean | "soft"> }> = [
  { label: "Annual giving",            cells: [true,  false, false, false, false] },
  { label: "Recurring requests",       cells: [true,  true,  false, false, false] },
  { label: "Local business partners",  cells: [false, true,  true,  false, false] },
  { label: "Ticketed event or auction",cells: [false, false, true,  false, true ] },
  { label: "Per-unit/per-lap goals",   cells: [false, false, false, true,  false] },
  { label: "Sell items or bundles",    cells: [true,  true,  true,  true,  true ] },
];
const compareCols = ["Donation", "Sponsorship", "Event", "Pledge", "Auction"];

const Fundraisers = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers" });

  useEffect(() => {
    document.title = "Fundraisers — Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Donations, sponsorships, events, pledges, and merch — all on the same zero-fee fundraising platform. Mix them, match them, run whichever works for your team."
      );
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="sp-fundraisers min-h-screen">
        <MarketingHeader />

        {/* HERO */}
        <section className="sp-hero">
          <div className="sp-wrap">
            <div className="sp-hero-inner">
              <span className="sp-eyebrow">Fundraisers · Done right</span>
              <h1 className="sp-display">
                Every kind of <span className="accent">fundraiser,</span> done right.
              </h1>
              <p className="sub">
                Donations, sponsorships, events, pledges, ticket sales, and merch — all on the same zero-fee platform. Mix them, match them, run whichever works for your team.
              </p>
              <div className="sp-hero-ctas">
                <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                  Get started free <IArrow />
                </Link>
                <a href="#types" className="sp-btn sp-btn-ghost sp-btn-lg">
                  Explore fundraiser types
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TYPE CARDS */}
        <section id="types" className="sp-section white">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow">Fundraiser Types</span>
            <h2 className="sp-display-h2">
              Pick the right tool. Or run <span className="accent-blue">several at once.</span>
            </h2>
            <p className="sp-lead">
              Every Sponsorly fundraiser uses the same zero-fee checkout and donor CRM. Click any card to explore that type in depth.
            </p>
          </div>
          <div className="sp-wrap">
            <div className="sp-types">
              {types.map((t, i) => (
                <Link to={t.href} key={i} className="sp-type">
                  <div className="top">
                    <div className="ico" style={{ background: t.bg, color: t.color }}>
                      <t.Icon />
                    </div>
                    <div className="meta">{t.meta}</div>
                  </div>
                  <h3>{t.title}</h3>
                  <p>{t.copy}</p>
                  {t.extra}
                  <div className="chips">
                    {t.chips.map((c) => (
                      <span className="chip" key={c}>{c}</span>
                    ))}
                  </div>
                  <span className="explore">Explore {t.title.split(" ")[0].toLowerCase()} <IArrow /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* DARK STATS */}
        <section className="sp-stats">
          <div className="sp-wrap">
            <div className="sp-stats-row">
              <div className="col"><div className="v green">$23M+</div><div className="l">Raised across all platform</div></div>
              <div className="col"><div className="v">0%</div><div className="l">Platform fees, ever</div></div>
              <div className="col"><div className="v">8 min</div><div className="l">Avg setup time</div></div>
              <div className="col"><div className="v">94%</div><div className="l">Campaigns reach goal</div></div>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="sp-section alt">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow">Same Engine. Every Type.</span>
            <h2 className="sp-display-h2">
              Whatever you run, the <span className="accent-blue">fundamentals just work.</span>
            </h2>
            <p className="sp-lead">
              Every fundraiser type inherits the same beautiful landing pages, trusted checkout, and donor CRM — so supporters never see something experimental no matter how you run it.
            </p>
          </div>
        </section>

        {/* BLOCK 1: Landing pages */}
        <section className="sp-section white">
          <div className="sp-wrap">
            <div className="sp-two">
              <div>
                <span className="sp-eyebrow">Conversion-Tuned Pages</span>
                <h2 className="sp-display-h2">
                  Beautiful landing pages your supporters <span className="accent-blue">actually finish.</span>
                </h2>
                <p className="sp-lead">
                  Every fundraiser gets a conversion-optimized page built from the same template system — mobile-first, brand-able, and tuned for trust.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span><b>Out-of-the-box themes —</b> light or dark, the full progress bar above the fold.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Mobile optimized —</b> 80% of donations come in by phone; every page is built for that.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Built-in social proof —</b> live donor wall and recently-raised banner.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Custom-domain ready —</b> bring your own URL or use a Sponsorly working link.</span></li>
                </ul>
              </div>
              <div className="sp-mock-landing">
                <div className="hero">
                  <span className="pill">Live Campaign</span>
                  <h4>Send the Wildcats to State</h4>
                </div>
                <div className="body">
                  <div className="progress"><i /></div>
                  <div className="pmeta">
                    <span><b>$23K</b> raised</span>
                    <span>of $35K goal</span>
                  </div>
                  <div className="cta">Donate now</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 2: Checkout */}
        <section className="sp-section alt">
          <div className="sp-wrap">
            <div className="sp-two">
              <div className="sp-mock-checkout">
                <div className="head">
                  <span>Secure checkout</span>
                  <span style={{ color: "var(--sp-green)" }}>● Active</span>
                </div>
                <div className="item">
                  <div>
                    <div className="nm">Drive the Wildcats</div>
                    <div className="sub">Monthly recurring</div>
                  </div>
                  <div className="pr">$100.00</div>
                </div>
                <div className="item">
                  <div>
                    <div className="nm">Booster T-shirt — L</div>
                    <div className="sub">Pickup at school</div>
                  </div>
                  <div className="pr">$25.00</div>
                </div>
                <div className="pays">
                  <span className="p">Visa</span>
                  <span className="p">Amex</span>
                  <span className="p">ACH</span>
                  <span className="p blue">PayPal</span>
                  <span className="p dark"> Pay</span>
                  <span className="p dark">G Pay</span>
                </div>
                <div className="total">Donate $125</div>
              </div>
              <div>
                <span className="sp-eyebrow sp-eyebrow-accent">Trusted Checkout</span>
                <h2 className="sp-display-h2">
                  Familiar e-commerce checkout. <span className="accent-accent">Zero hesitation.</span>
                </h2>
                <p className="sp-lead">
                  Supporters see the same checkout they trust at Amazon, Shopify, and Apple Pay. No login, no confusion — just a simple path to support your cause.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span><b>All major card brands —</b> plus Apple Pay, Google Pay, Venmo, ACH, and more.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Intuitive add-ons —</b> sell tickets, merch, sponsorships, and donations in one cart.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Instant confirmation —</b> branded, IRS-ready receipts with QR-trackable order links.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>PCI compliant —</b> Stripe-powered infrastructure trusted by tens of thousands of brands.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 3: Donor CRM */}
        <section className="sp-section white">
          <div className="sp-wrap">
            <div className="sp-two">
              <div>
                <span className="sp-eyebrow sp-eyebrow-green">Donor CRM</span>
                <h2 className="sp-display-h2">
                  Supporters return <span className="accent-green">year after year.</span>
                </h2>
                <p className="sp-lead">
                  Every donor, sponsor, and parent is auto-linked to one donor record — with saved payment methods, receipts, and a complete giving history.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span><b>Persistent records —</b> one donor, every gift, every campaign — across the years.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Saved payment methods —</b> one-tap renewals from email reminders or annual appeals.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Complete giving history —</b> every receipt and tax document at the donor's fingertips.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Direct communications —</b> email or SMS your major donors right from the donor card.</span></li>
                </ul>
              </div>
              <div className="sp-mock-donor">
                <div className="who">
                  <div className="av">SJ</div>
                  <div>
                    <div className="nm">Sarah Johnson</div>
                    <div className="sub">Supporter since 2021 • 14 gifts</div>
                  </div>
                </div>
                <div className="grid">
                  <div className="cell"><div className="l">Lifetime giving</div><div className="v">$1,240</div></div>
                  <div className="cell"><div className="l">Campaigns</div><div className="v">7</div></div>
                </div>
                <div className="hist">
                  <div className="ttl">Recent activity</div>
                  <div className="row"><b>Spring Musical Sponsorship</b><span>$250</span></div>
                  <div className="row"><b>Spring Run for Funds</b><span>$100</span></div>
                  <div className="row"><b>Annual Giving</b><span>$250</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="sp-section alt">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow">Choose Your Fundraiser</span>
            <h2 className="sp-display-h2">
              Which type is <span className="accent-blue">right for you?</span>
            </h2>
            <p className="sp-lead">
              Most teams run 2 – 3 types at once. Here's the quick decision framework.
            </p>
          </div>
          <div className="sp-wrap">
            <div className="sp-table">
              <table>
                <thead>
                  <tr>
                    <th>Best for</th>
                    {compareCols.map((c) => (<th key={c} style={{ textAlign: "center" }}>{c}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      {r.cells.map((on, i) => (
                        <td key={i}>
                          {on ? <span className="check"><ICheck /></span> : <span className="dash">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="sp-cta">
          <div className="inner">
            <span className="sp-eyebrow sp-eyebrow-light">The Easiest Way to Get Started</span>
            <h2>
              Ready to start your <br /><span className="accent">first fundraiser?</span>
            </h2>
            <p>
              Pick any of the five types — or run several at once. Same platform, same donor CRM, zero fees.
            </p>
            <div className="ctas">
              <Link to="/signup" className="sp-btn sp-btn-white sp-btn-lg">Get started free</Link>
              <Link to="/contact" className="sp-btn sp-btn-outline-white sp-btn-lg">Schedule a demo</Link>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
};

export default Fundraisers;
