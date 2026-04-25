import { useEffect } from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";

/**
 * Merchandise Fundraisers — rebuilt 2026 to match approved mockup.
 * Scoped under .sp-merch. Mirrors typography + tokens from
 * DonationCampaigns / SponsorshipCampaigns / EventCampaigns.
 */

const SCOPED_CSS = `
.sp-merch {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-green-deep: #0B7C56;
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
.sp-merch .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-merch .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(14,159,110,0.10); color: var(--sp-green); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-merch .sp-eyebrow-blue { background: rgba(31,95,224,0.08); color: var(--sp-blue); }
.sp-merch .sp-eyebrow-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-merch .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-merch .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-merch .sp-btn:hover { transform: translateY(-1px); }
.sp-merch .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-merch .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-merch .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-merch .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-merch .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }

/* Sections */
.sp-merch .sp-section { padding: 96px 0; }
.sp-merch .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-merch .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-merch .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-merch .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-merch .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 600px; }
.sp-merch .sp-center { text-align: center; }
.sp-merch .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-merch .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-merch .sp-hero { position: relative; padding: 80px 0 72px; overflow: hidden; background:
  radial-gradient(900px 480px at 90% -10%, rgba(14,159,110,0.10), transparent 60%),
  radial-gradient(700px 360px at -5% 0%, rgba(31,95,224,0.07), transparent 60%),
  var(--sp-paper); }
.sp-merch .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-merch .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.6vw, 72px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-merch .sp-hero h1 .accent { color: var(--sp-green); font-style: italic; }
.sp-merch .sp-hero p.sub { font-size: 16.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-merch .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; }
.sp-merch .sp-hero-checks { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-merch .sp-hero-checks .it { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sp-ink-2); font-weight: 500; }
.sp-merch .sp-hero-checks .it .ck { width: 18px; height: 18px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); display: grid; place-items: center; }

/* Storefront card */
.sp-merch .sp-store { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 18px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); position: relative; }
.sp-merch .sp-store .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-store .top .meta { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-merch .sp-store .top h4 { font-family: var(--sp-display); font-size: 20px; line-height: 1.15; margin-top: 4px; color: var(--sp-ink); }
.sp-merch .sp-store .top .det { font-size: 11.5px; color: var(--sp-muted); margin-top: 2px; }
.sp-merch .sp-store .top .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 5px 9px; background: rgba(14,159,110,0.10); color: var(--sp-green); border-radius: 999px; white-space: nowrap; }
.sp-merch .sp-store .top .pill .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-green); }
.sp-merch .sp-store .top .pill .s { display: block; font-size: 10px; opacity: 0.75; font-weight: 500; }
.sp-merch .sp-store .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 0; }
.sp-merch .sp-store .prod { border-radius: 12px; overflow: hidden; background: var(--sp-paper-2); position: relative; }
.sp-merch .sp-store .prod .img { aspect-ratio: 4/3; display: grid; place-items: center; color: rgba(255,255,255,0.85); }
.sp-merch .sp-store .prod .img.b { background: var(--sp-blue); }
.sp-merch .sp-store .prod .img.o { background: var(--sp-accent); }
.sp-merch .sp-store .prod .img.k { background: var(--sp-ink); }
.sp-merch .sp-store .prod .img.g { background: var(--sp-green); }
.sp-merch .sp-store .prod .meta { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; }
.sp-merch .sp-store .prod .meta .nm { font-size: 12.5px; font-weight: 600; color: var(--sp-ink); }
.sp-merch .sp-store .prod .meta .nm .v { display: block; font-size: 10.5px; color: var(--sp-muted); font-weight: 500; margin-top: 2px; }
.sp-merch .sp-store .prod .meta .pr { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }
.sp-merch .sp-store .sub { display: flex; justify-content: space-between; align-items: center; padding: 10px 4px 12px; border-top: 1px solid var(--sp-line); }
.sp-merch .sp-store .sub .l { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-merch .sp-store .sub .v { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); }
.sp-merch .sp-store .cta { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--sp-green); color: white; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 24px -10px rgba(14,159,110,0.55); }

/* Two-column with bullets */
.sp-merch .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-merch .sp-bullets { list-style: none; padding: 0; margin: 24px 0 28px; display: flex; flex-direction: column; gap: 14px; }
.sp-merch .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-merch .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 2px; }
.sp-merch .sp-bullets li b { font-weight: 600; color: var(--sp-ink); margin-right: 6px; }
.sp-merch .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Order management mock */
.sp-merch .sp-orders { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.20); }
.sp-merch .sp-orders .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-orders .head .ttl { font-family: var(--sp-display); font-size: 20px; color: var(--sp-ink); }
.sp-merch .sp-orders .head .lk { font-size: 11.5px; color: var(--sp-blue); font-weight: 600; }
.sp-merch .sp-orders .row { display: grid; grid-template-columns: 64px 1fr auto auto; align-items: center; gap: 14px; padding: 14px 4px; border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-orders .row:last-of-type { border-bottom: 0; }
.sp-merch .sp-orders .row .id { font-size: 10.5px; letter-spacing: 0.12em; color: var(--sp-muted); font-weight: 700; }
.sp-merch .sp-orders .row .who { font-size: 13px; color: var(--sp-ink); font-weight: 600; }
.sp-merch .sp-orders .row .who .it { display: block; font-size: 11px; color: var(--sp-muted); font-weight: 500; margin-top: 2px; }
.sp-merch .sp-orders .row .am { font-family: var(--sp-display); font-size: 16px; color: var(--sp-ink); min-width: 50px; text-align: right; }
.sp-merch .sp-orders .row .st { font-size: 10.5px; padding: 4px 10px; border-radius: 999px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.sp-merch .sp-orders .row .st.ok { background: rgba(14,159,110,0.12); color: var(--sp-green); }
.sp-merch .sp-orders .row .st.pr { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-merch .sp-orders .row .st.tg { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-merch .sp-orders .totals { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; margin-top: 6px; border-top: 1px solid var(--sp-line); }
.sp-merch .sp-orders .totals .b .l { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-merch .sp-orders .totals .b .v { font-family: var(--sp-display); font-size: 26px; color: var(--sp-ink); margin-top: 4px; }
.sp-merch .sp-orders .totals .b .v small { font-family: var(--sp-ui); font-size: 11px; color: var(--sp-green); font-weight: 700; margin-left: 4px; vertical-align: middle; }

/* Product types grid */
.sp-merch .sp-types { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; }
.sp-merch .sp-type { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 20px; transition: transform .15s ease, box-shadow .2s ease; display: flex; flex-direction: column; gap: 10px; }
.sp-merch .sp-type:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -20px rgba(10,15,30,0.18); }
.sp-merch .sp-type .ico { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 4px; }
.sp-merch .sp-type h3 { font-family: var(--sp-display); font-weight: 400; font-size: 20px; line-height: 1.15; color: var(--sp-ink); }
.sp-merch .sp-type p { font-size: 12.5px; color: var(--sp-ink-2); line-height: 1.5; }
.sp-merch .sp-type .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.sp-merch .sp-type .chips .c { font-size: 10.5px; padding: 4px 8px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-ink-2); font-weight: 600; }

/* Sales by member mock */
.sp-merch .sp-sellers { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.18); }
.sp-merch .sp-sellers .head { padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-sellers .head .ttl { font-family: var(--sp-display); font-size: 20px; color: var(--sp-ink); }
.sp-merch .sp-sellers .head .sub { font-size: 11.5px; color: var(--sp-muted); margin-top: 2px; }
.sp-merch .sp-sellers .row { display: grid; grid-template-columns: 30px 1fr auto; gap: 12px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--sp-line); }
.sp-merch .sp-sellers .row:last-of-type { border-bottom: 0; }
.sp-merch .sp-sellers .row .av { width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center; color: white; font-size: 11px; font-weight: 700; }
.sp-merch .sp-sellers .row .av.a { background: var(--sp-amber); }
.sp-merch .sp-sellers .row .av.b { background: var(--sp-green); }
.sp-merch .sp-sellers .row .av.c { background: var(--sp-accent); }
.sp-merch .sp-sellers .row .av.d { background: var(--sp-blue); }
.sp-merch .sp-sellers .row .body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.sp-merch .sp-sellers .row .body .nm { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--sp-ink); font-weight: 600; }
.sp-merch .sp-sellers .row .body .nm .it { font-size: 11px; color: var(--sp-muted); font-weight: 500; }
.sp-merch .sp-sellers .row .bar { height: 6px; background: var(--sp-paper-2); border-radius: 999px; overflow: hidden; }
.sp-merch .sp-sellers .row .bar > i { display: block; height: 100%; border-radius: 999px; background: var(--sp-green); }
.sp-merch .sp-sellers .row .am { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }

/* Numbers dark band */
.sp-merch .sp-numbers { background: #0A0F1E; color: white; padding: 96px 0; text-align: center; }
.sp-merch .sp-numbers .sp-eyebrow { background: rgba(14,159,110,0.18); color: #4ADE80; }
.sp-merch .sp-numbers h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: white; margin: 14px 0 16px; }
.sp-merch .sp-numbers h2 .accent { color: #4ADE80; font-style: italic; }
.sp-merch .sp-numbers p.sub { font-size: 15.5px; opacity: 0.78; max-width: 540px; margin: 0 auto 48px; line-height: 1.55; }
.sp-merch .sp-numbers .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 960px; margin: 0 auto; }
.sp-merch .sp-numbers .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 36px 24px; }
.sp-merch .sp-numbers .stat .v { font-family: var(--sp-display); font-size: 60px; line-height: 1; }
.sp-merch .sp-numbers .stat .v.blue { color: #6FA0FF; }
.sp-merch .sp-numbers .stat .v.green { color: #4ADE80; }
.sp-merch .sp-numbers .stat .v.orange { color: var(--sp-accent); }
.sp-merch .sp-numbers .stat .l { font-family: var(--sp-display); font-style: italic; font-size: 18px; margin-top: 10px; opacity: 0.95; }
.sp-merch .sp-numbers .stat .s { font-size: 12px; opacity: 0.6; margin-top: 6px; }

/* Final CTA */
.sp-merch .sp-cta { background:
  radial-gradient(900px 320px at 50% 0%, rgba(14,159,110,0.12), transparent 60%),
  radial-gradient(700px 240px at 100% 100%, rgba(31,95,224,0.10), transparent 60%),
  var(--sp-paper);
  padding: 100px 0; text-align: center; }
.sp-merch .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.01em; margin: 0 0 16px; color: var(--sp-ink); }
.sp-merch .sp-cta h2 .accent { font-style: italic; color: var(--sp-green); }
.sp-merch .sp-cta p { font-size: 15.5px; color: var(--sp-ink-2); max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-merch .sp-cta .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-merch .sp-section { padding: 64px 0; }
  .sp-merch .sp-hero { padding: 56px 0; }
  .sp-merch .sp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .sp-merch .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-merch .sp-types { grid-template-columns: 1fr 1fr; }
  .sp-merch .sp-numbers .stats { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .sp-merch .sp-wrap { padding: 0 20px; }
  .sp-merch .sp-types { grid-template-columns: 1fr; }
  .sp-merch .sp-store .grid { grid-template-columns: 1fr; }
}
`;

/* Inline icons */
const ICheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IPlay = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const ICart = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const IShirt = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>);
const IJersey = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.5 7 3l3 3h4l3-3 4 3.5L18 11v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-9z"/></svg>);
const IBag = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const IPin = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IPalette = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125 0-.946.756-1.688 1.688-1.688h1.996c3.094 0 5.543-2.518 5.543-5.612C22 6.985 17.52 2 12 2z"/></svg>);
const IGift = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const ICal = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IShirtSm = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>);

const productTypes = [
  { Icon: IShirtSm, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)",
    title: "Team apparel", copy: "Jerseys, hoodies, T-shirts, and warm-up gear.",
    chips: ["Hoodies", "Jerseys", "Tees"] },
  { Icon: IGift, color: "#FF6B35", bg: "rgba(255,107,53,0.10)",
    title: "Fundraising products", copy: "Cookie dough, candles, candy, and other classics.",
    chips: ["Cookie dough", "Candles", "Popcorn"] },
  { Icon: IPalette, color: "#7B5BE0", bg: "rgba(123,91,224,0.10)",
    title: "Custom merchandise", copy: "Personalized items with names, numbers, or year-of-team.",
    chips: ["Hats", "Mugs", "Decals"] },
  { Icon: ICal, color: "#E0A21F", bg: "rgba(224,162,31,0.12)",
    title: "Seasonal items", copy: "Holiday drops, special editions, and yearbook-style ornaments.",
    chips: ["Holiday", "Yearbook", "Ornaments"] },
];

const sellers = [
  { initials: "JM", cls: "a", name: "Jase M.", items: "12 orders · 14 items", amount: "$674", pct: 100 },
  { initials: "ES", cls: "b", name: "Emma S.", items: "9 orders · 11 items", amount: "$478", pct: 71 },
  { initials: "TK", cls: "c", name: "Tyler K.", items: "7 orders · 9 items", amount: "$375", pct: 56 },
  { initials: "RK", cls: "d", name: "Riley K.", items: "5 orders · 7 items", amount: "$284", pct: 42 },
];

const MerchandiseCampaigns = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers/merchandise" });

  useEffect(() => {
    document.title = "Merchandise Fundraisers — Team Stores & Spirit Wear | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Spin up a beautiful storefront for spirit wear, fundraising products, and custom merchandise. Manage variants, track inventory, and attribute sales to team members."
      );
    }
  }, []);

  return (
    <div className="sp-merch">
      <style>{SCOPED_CSS}</style>
      <MarketingHeader />

      {/* HERO */}
      <section className="sp-hero">
        <div className="sp-wrap sp-hero-grid">
          <div>
            <span className="sp-eyebrow">Merchandise Fundraisers</span>
            <h1>Sell team gear with <span className="accent">zero hassle.</span></h1>
            <p className="sub">
              Spin up a beautiful storefront for spirit wear, fundraising products, and custom merchandise.
              Manage sizes, colors, inventory — and track which team members sold what.
            </p>
            <div className="sp-hero-ctas">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                Start selling <IArrow />
              </Link>
              <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                <IPlay /> See a demo
              </Link>
            </div>
            <div className="sp-hero-checks">
              <span className="it"><span className="ck"><ICheck /></span> Variant sizes</span>
              <span className="it"><span className="ck"><ICheck /></span> Inventory tracking</span>
              <span className="it"><span className="ck"><ICheck /></span> Seller attribution</span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="sp-store">
              <div className="top">
                <div>
                  <div className="meta">Sponsorly · Checkout/Store</div>
                  <h4>Spirit Wear Store</h4>
                  <div className="det">Fall 2026 Collection · 24 items</div>
                </div>
                <span className="pill">
                  <span className="dot"></span>
                  <span>
                    New order
                    <span className="s">Hoodie · M · $45</span>
                  </span>
                </span>
              </div>
              <div className="grid">
                <div className="prod">
                  <div className="img b"><IShirt /></div>
                  <div className="meta">
                    <div className="nm">Team Hoodie<span className="v">Sizes XS–XXL</span></div>
                    <div className="pr">$45</div>
                  </div>
                </div>
                <div className="prod">
                  <div className="img o"><IJersey /></div>
                  <div className="meta">
                    <div className="nm">Practice Jersey<span className="v">Colors</span></div>
                    <div className="pr">$35</div>
                  </div>
                </div>
                <div className="prod">
                  <div className="img k"><IBag /></div>
                  <div className="meta">
                    <div className="nm">Duffle Bag<span className="v">One size</span></div>
                    <div className="pr">$22</div>
                  </div>
                </div>
                <div className="prod">
                  <div className="img g"><IPin /></div>
                  <div className="meta">
                    <div className="nm">Spirit Stick<span className="v">Custom</span></div>
                    <div className="pr">$15</div>
                  </div>
                </div>
              </div>
              <div className="sub">
                <span className="l">2 hoodies left in M</span>
                <span className="v">$102</span>
              </div>
              <div className="cta"><ICart /> View Cart (3)</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES + ORDER MGMT */}
      <section className="sp-section alt">
        <div className="sp-wrap sp-two">
          <div>
            <span className="sp-eyebrow sp-eyebrow-blue">Core Features</span>
            <h2 className="sp-display-h2">
              Everything you need to <span className="accent-blue">sell online.</span>
            </h2>
            <p className="sp-lead">
              A complete e-commerce experience designed specifically for school and nonprofit fundraising —
              no Shopify subscription, no plugins, no headaches.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span><b>Product variants</b>for sizes, colors, and styles</span></li>
              <li><span className="dot"><ICheck /></span><span><b>Inventory tracking</b>and low-stock alerts</span></li>
              <li><span className="dot"><ICheck /></span><span><b>Order management</b>and status tracking</span></li>
              <li><span className="dot"><ICheck /></span><span><b>Fulfillment coordination</b>and shipping</span></li>
              <li><span className="dot"><ICheck /></span><span><b>Pre-order capabilities</b>for bulk orders</span></li>
            </ul>
          </div>

          <div className="sp-orders">
            <div className="head">
              <div className="ttl">Order management</div>
              <div className="lk">View all →</div>
            </div>
            <div className="row">
              <div className="id">#1024</div>
              <div className="who">Sarah M. Karnal<span className="it">Hoodie · L</span></div>
              <div className="am">$67</div>
              <div className="st ok">Fulfilled</div>
            </div>
            <div className="row">
              <div className="id">#1023</div>
              <div className="who">Marcus Chen<span className="it">Practice Jersey · M</span></div>
              <div className="am">$35</div>
              <div className="st pr">In progress</div>
            </div>
            <div className="row">
              <div className="id">#1022</div>
              <div className="who">James Park<span className="it">Backpack + decals</span></div>
              <div className="am">$45</div>
              <div className="st tg">To ship</div>
            </div>
            <div className="totals">
              <div className="b">
                <div className="l">Total Sales</div>
                <div className="v">$4,250 <small>+12%</small></div>
              </div>
              <div className="b" style={{ textAlign: "right" }}>
                <div className="l">Items</div>
                <div className="v">127</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT TYPES */}
      <section className="sp-section">
        <div className="sp-wrap sp-center">
          <span className="sp-eyebrow sp-eyebrow-blue">Sell Anything</span>
          <h2 className="sp-display-h2">
            Perfect for every <span className="accent-green">product type.</span>
          </h2>
          <p className="sp-lead">
            Whether you're selling spirit wear or fundraising products, we've got you covered.
          </p>
        </div>
        <div className="sp-wrap">
          <div className="sp-types">
            {productTypes.map((t, i) => (
              <div key={i} className="sp-type">
                <div className="ico" style={{ background: t.bg, color: t.color }}>
                  <t.Icon />
                </div>
                <h3>{t.title}</h3>
                <p>{t.copy}</p>
                <div className="chips">
                  {t.chips.map((c, j) => <span key={j} className="c">{c}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBER TRACKING */}
      <section className="sp-section white">
        <div className="sp-wrap sp-two">
          <div className="sp-sellers">
            <div className="head">
              <div className="ttl">Sales by team member</div>
              <div className="sub">Spring 2026 · Live leaderboard</div>
            </div>
            {sellers.map((s, i) => (
              <div key={i} className="row">
                <div className={`av ${s.cls}`}>{s.initials}</div>
                <div className="body">
                  <div className="nm"><span>{s.name}</span><span className="it">{s.items}</span></div>
                  <div className="bar"><i style={{ width: `${s.pct}%` }} /></div>
                </div>
                <div className="am">{s.amount}</div>
              </div>
            ))}
          </div>

          <div>
            <span className="sp-eyebrow sp-eyebrow-accent">Member Tracking</span>
            <h2 className="sp-display-h2">
              Track <span className="accent-accent">who sells</span> what.
            </h2>
            <p className="sp-lead">
              With code-enabled merchandise fundraisers, you can see exactly which team members are driving
              sales — perfect for competitions and incentive programs.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span>Individual sales attribution by team member</span></li>
              <li><span className="dot"><ICheck /></span><span>Leaderboards encourage friendly competition</span></li>
              <li><span className="dot"><ICheck /></span><span>Incentive tracking for top sellers</span></li>
              <li><span className="dot"><ICheck /></span><span>Personalized links for each player</span></li>
            </ul>
            <Link to="/fundraisers" className="sp-btn sp-btn-ghost">
              Learn about member fundraisers <IArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="sp-numbers">
        <div className="sp-wrap">
          <span className="sp-eyebrow">The Numbers</span>
          <h2>Merchandise fundraisers that <span className="accent">perform.</span></h2>
          <p className="sub">Schools and teams running merch on Sponsorly see meaningful gains.</p>
          <div className="stats">
            <div className="stat">
              <div className="v blue">35%</div>
              <div className="l">Higher average order value</div>
              <div className="s">with cross-sell prompts</div>
            </div>
            <div className="stat">
              <div className="v green">60%</div>
              <div className="l">Reduction in manual work</div>
              <div className="s">with automated orders</div>
            </div>
            <div className="stat">
              <div className="v orange">2×</div>
              <div className="l">Sales with seller tracking</div>
              <div className="s">vs. anonymous storefronts</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sp-cta">
        <div className="sp-wrap sp-center">
          <h2>Open your <span className="accent">team store.</span></h2>
          <p>Launch your merchandise store in minutes. No technical skills required.</p>
          <div className="ctas">
            <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
              Get started free <IArrow />
            </Link>
            <Link to="/fundraisers" className="sp-btn sp-btn-ghost sp-btn-lg">
              Explore all fundraiser types
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default MerchandiseCampaigns;
