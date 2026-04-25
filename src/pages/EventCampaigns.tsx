import { useEffect } from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";

/**
 * Event Fundraisers — rebuilt 2026 to match approved mockup.
 * Scoped under .sp-events. Mirrors typography + tokens from
 * DonationCampaigns / SponsorshipCampaigns / Pricing / Schools.
 */

const SCOPED_CSS = `
.sp-events {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-accent: #FF6B35;
  --sp-accent-deep: #E0531B;
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
.sp-events .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-events .sp-italic { font-style: italic; }
.sp-events .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(255,107,53,0.10); color: var(--sp-accent); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-events .sp-eyebrow-blue { background: rgba(31,95,224,0.08); color: var(--sp-blue); }
.sp-events .sp-eyebrow-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-events .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-events .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-events .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-events .sp-btn:hover { transform: translateY(-1px); }
.sp-events .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-events .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-events .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-events .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-events .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-events .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-events .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-events .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-events .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* Sections */
.sp-events .sp-section { padding: 96px 0; }
.sp-events .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-events .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-events .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-events .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-events .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-events .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-events .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 600px; }
.sp-events .sp-center { text-align: center; }
.sp-events .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-events .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-events .sp-hero { position: relative; padding: 80px 0 72px; overflow: hidden; background:
  radial-gradient(900px 480px at 90% -10%, rgba(255,107,53,0.10), transparent 60%),
  radial-gradient(700px 360px at -5% 0%, rgba(31,95,224,0.07), transparent 60%),
  var(--sp-paper); }
.sp-events .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-events .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.6vw, 72px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-events .sp-hero h1 .accent { color: var(--sp-accent); font-style: italic; }
.sp-events .sp-hero p.sub { font-size: 16.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-events .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; }
.sp-events .sp-hero-checks { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-events .sp-hero-checks .it { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sp-ink-2); font-weight: 500; }
.sp-events .sp-hero-checks .it .ck { width: 18px; height: 18px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); display: grid; place-items: center; }

/* Hero ticket card */
.sp-events .sp-tix { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); position: relative; }
.sp-events .sp-tix .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-events .sp-tix .top .meta { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-events .sp-tix .top h4 { font-family: var(--sp-display); font-size: 22px; line-height: 1.15; margin-top: 6px; color: var(--sp-ink); }
.sp-events .sp-tix .top .det { font-size: 12px; color: var(--sp-muted); margin-top: 4px; display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sp-events .sp-tix .top .det .dot { width: 3px; height: 3px; border-radius: 999px; background: currentColor; opacity: 0.5; }
.sp-events .sp-tix .top .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 5px 9px; background: rgba(14,159,110,0.10); color: var(--sp-green); border-radius: 999px; white-space: nowrap; }
.sp-events .sp-tix .top .pill .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-green); }
.sp-events .sp-tix .row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 14px 12px; border: 1px solid var(--sp-line); border-radius: 12px; margin-top: 10px; }
.sp-events .sp-tix .row.high { background: rgba(255,107,53,0.05); border-color: rgba(255,107,53,0.35); }
.sp-events .sp-tix .row .nm { font-size: 13.5px; font-weight: 600; color: var(--sp-ink); }
.sp-events .sp-tix .row .nm .desc { display: block; font-size: 11.5px; color: var(--sp-muted); font-weight: 500; margin-top: 2px; }
.sp-events .sp-tix .row .qty { display: inline-flex; align-items: center; gap: 8px; }
.sp-events .sp-tix .row .qty .b { width: 22px; height: 22px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-ink-2); display: grid; place-items: center; font-size: 14px; font-weight: 700; }
.sp-events .sp-tix .row .qty .v { font-size: 13px; font-weight: 700; min-width: 14px; text-align: center; }
.sp-events .sp-tix .row .pr { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); min-width: 56px; text-align: right; }
.sp-events .sp-tix .row.high .pr { color: var(--sp-accent); }
.sp-events .sp-tix .sub { display: flex; justify-content: space-between; align-items: center; padding: 16px 4px 6px; }
.sp-events .sp-tix .sub .l { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-events .sp-tix .sub .v { font-family: var(--sp-display); font-size: 24px; color: var(--sp-ink); }
.sp-events .sp-tix .cta { margin-top: 8px; display: block; background: var(--sp-accent); color: white; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 24px -10px rgba(255,107,53,0.55); }
.sp-events .sp-tix-toast { position: absolute; left: -16px; bottom: -14px; background: white; border: 1px solid var(--sp-line); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 18px 36px -20px rgba(10,15,30,0.30); }
.sp-events .sp-tix-toast .dot { width: 8px; height: 8px; border-radius: 999px; background: var(--sp-green); }
.sp-events .sp-tix-toast .t { font-size: 12px; color: var(--sp-ink); font-weight: 600; }
.sp-events .sp-tix-toast .s { font-size: 11px; color: var(--sp-muted); }

/* Two-column with bullets */
.sp-events .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-events .sp-two.flip { direction: rtl; }
.sp-events .sp-two.flip > * { direction: ltr; }
.sp-events .sp-bullets { list-style: none; padding: 0; margin: 24px 0 28px; display: flex; flex-direction: column; gap: 14px; }
.sp-events .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-events .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 2px; }
.sp-events .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Ticket dashboard mock */
.sp-events .sp-dash { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.20); }
.sp-events .sp-dash .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-events .sp-dash .head .ttl { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }
.sp-events .sp-dash .head .pill { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); font-weight: 700; display: inline-flex; align-items: center; gap: 6px; }
.sp-events .sp-dash .head .pill .d { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-green); }
.sp-events .sp-dash .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--sp-line); }
.sp-events .sp-dash .kpis .k .l { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-events .sp-dash .kpis .k .v { font-family: var(--sp-display); font-size: 28px; line-height: 1; margin-top: 6px; color: var(--sp-ink); }
.sp-events .sp-dash .bars { padding-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.sp-events .sp-dash .bars .b .top { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
.sp-events .sp-dash .bars .b .top .nm { font-weight: 600; color: var(--sp-ink); }
.sp-events .sp-dash .bars .b .top .ct { color: var(--sp-muted); font-weight: 600; }
.sp-events .sp-dash .bars .b .bar { height: 8px; background: var(--sp-paper-2); border-radius: 999px; overflow: hidden; }
.sp-events .sp-dash .bars .b .bar > i { display: block; height: 100%; border-radius: 999px; }
.sp-events .sp-dash .bars .b.b1 .bar > i { width: 100%; background: var(--sp-accent); }
.sp-events .sp-dash .bars .b.b2 .bar > i { width: 51%; background: var(--sp-blue); }
.sp-events .sp-dash .bars .b.b3 .bar > i { width: 72%; background: var(--sp-green); }

/* Event types grid */
.sp-events .sp-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 48px; }
.sp-events .sp-type { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; transition: transform .15s ease, box-shadow .2s ease; display: flex; flex-direction: column; gap: 10px; }
.sp-events .sp-type:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -20px rgba(10,15,30,0.18); }
.sp-events .sp-type .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 4px; }
.sp-events .sp-type h3 { font-family: var(--sp-display); font-weight: 400; font-size: 22px; line-height: 1.15; color: var(--sp-ink); }
.sp-events .sp-type p { font-size: 13px; color: var(--sp-ink-2); line-height: 1.5; }
.sp-events .sp-type .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.sp-events .sp-type .chips .c { font-size: 11px; padding: 4px 9px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-ink-2); font-weight: 600; }

/* Sponsor packages 2x2 grid */
.sp-events .sp-pkgs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sp-events .sp-pkg { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 18px; transition: transform .15s ease, box-shadow .2s ease; }
.sp-events .sp-pkg:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -18px rgba(10,15,30,0.18); }
.sp-events .sp-pkg .meta { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; margin-bottom: 6px; }
.sp-events .sp-pkg .nm { font-size: 14px; font-weight: 600; color: var(--sp-ink); margin-bottom: 8px; }
.sp-events .sp-pkg .pr { font-family: var(--sp-display); font-size: 22px; color: var(--sp-accent); }
.sp-events .sp-pkg .sub { font-size: 11px; color: var(--sp-muted); margin-top: 4px; }

/* Results dark band */
.sp-events .sp-results { background: #0A0F1E; color: white; padding: 96px 0; text-align: center; }
.sp-events .sp-results .sp-eyebrow { background: rgba(255,107,53,0.18); color: #FFB892; }
.sp-events .sp-results h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: white; margin: 14px 0 16px; }
.sp-events .sp-results h2 .accent { color: var(--sp-accent); font-style: italic; }
.sp-events .sp-results p.sub { font-size: 15.5px; opacity: 0.78; max-width: 540px; margin: 0 auto 48px; line-height: 1.55; }
.sp-events .sp-results .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 960px; margin: 0 auto; }
.sp-events .sp-results .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 36px 24px; }
.sp-events .sp-results .stat .v { font-family: var(--sp-display); font-size: 60px; line-height: 1; }
.sp-events .sp-results .stat .v.orange { color: var(--sp-accent); }
.sp-events .sp-results .stat .v.blue { color: #6FA0FF; }
.sp-events .sp-results .stat .v.green { color: #4ADE80; }
.sp-events .sp-results .stat .l { font-family: var(--sp-display); font-style: italic; font-size: 18px; margin-top: 10px; opacity: 0.95; }
.sp-events .sp-results .stat .s { font-size: 12px; opacity: 0.6; margin-top: 6px; }

/* Final CTA */
.sp-events .sp-cta { background:
  radial-gradient(900px 320px at 50% 0%, rgba(255,107,53,0.14), transparent 60%),
  radial-gradient(700px 240px at 100% 100%, rgba(31,95,224,0.10), transparent 60%),
  var(--sp-paper);
  padding: 100px 0; text-align: center; }
.sp-events .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.01em; margin: 0 0 16px; color: var(--sp-ink); }
.sp-events .sp-cta h2 .accent { font-style: italic; color: var(--sp-accent); }
.sp-events .sp-cta p { font-size: 15.5px; color: var(--sp-ink-2); max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-events .sp-cta .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-events .sp-section { padding: 64px 0; }
  .sp-events .sp-hero { padding: 56px 0; }
  .sp-events .sp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .sp-events .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-events .sp-two.flip { direction: ltr; }
  .sp-events .sp-types { grid-template-columns: 1fr 1fr; }
  .sp-events .sp-results .stats { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .sp-events .sp-wrap { padding: 0 20px; }
  .sp-events .sp-types { grid-template-columns: 1fr; }
  .sp-events .sp-pkgs { grid-template-columns: 1fr; }
  .sp-events .sp-dash .kpis { grid-template-columns: 1fr; }
}
`;

/* Inline icons */
const ICheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IPlay = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const ITrophy = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>);
const IStar = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IUtensils = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>);
const IGavel = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>);
const IMap = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>);
const IMusic = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>);
const ICal = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IPin = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);

const eventTypes = [
  { Icon: ITrophy, color: "#0E9F6E", bg: "rgba(14,159,110,0.10)",
    title: "Golf tournaments",
    copy: "Scrambles, best-ball, and charity rounds with built-in foursome registration and hole packages.",
    chips: ["Foursomes", "Hole sponsors", "Pin contest"] },
  { Icon: IStar, color: "#FF6B35", bg: "rgba(255,107,53,0.10)",
    title: "Skills camps",
    copy: "Sports clinics and training sessions with weekly registration, waivers, and parent reminders.",
    chips: ["Sessions", "Age groups", "Waivers"] },
  { Icon: IUtensils, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)",
    title: "Galas & dinners",
    copy: "Formal fundraising events with table sponsors, seat assignments, and meal preferences.",
    chips: ["Tables", "Meal options", "Seating"] },
  { Icon: IGavel, color: "#7B5BE0", bg: "rgba(123,91,224,0.10)",
    title: "Auctions",
    copy: "Silent and live auction events with bidding history and built-in payment processing.",
    chips: ["Silent", "Live", "Mobile bidding"] },
  { Icon: IMap, color: "#E0A21F", bg: "rgba(224,162,31,0.12)",
    title: "Field trips",
    copy: "Educational and recreational experiences with permission slips and chaperone tracking.",
    chips: ["Permission", "Chaperones", "Per-student"] },
  { Icon: IMusic, color: "#E04F8B", bg: "rgba(224,79,139,0.10)",
    title: "Performances",
    copy: "Concerts, plays, and recitals with reserved or general admission and program ads.",
    chips: ["GA", "Reserved", "Program ads"] },
];

const sponsorPackages = [
  { meta: "Golf · 18 holes", nm: "Tee box signage + program ad", pr: "$500/hole", sub: "18 available" },
  { meta: "Gala · Beverage cart", nm: "Logo on every cart all night", pr: "$1,500", sub: "1 spot" },
  { meta: "Gala · Awards dinner", nm: "Trophy presentation co-brand", pr: "$750", sub: "4 tables" },
  { meta: "Title · Event naming", nm: "“Presented by” + camp T-shirt", pr: "$5,000", sub: "1 spot" },
];

const EventCampaigns = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers/events" });

  useEffect(() => {
    document.title = "Event Fundraisers — Ticketing & Event Fundraising | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Sell tickets for golf scrambles, galas, auctions, camps, and more. Combine ticketing with sponsorship packages for unforgettable fundraising events."
      );
    }
  }, []);

  return (
    <div className="sp-events">
      <style>{SCOPED_CSS}</style>
      <MarketingHeader />

      {/* HERO */}
      <section className="sp-hero">
        <div className="sp-wrap sp-hero-grid">
          <div>
            <span className="sp-eyebrow">Event Fundraisers</span>
            <h1>
              Host events that <span className="accent">raise serious money.</span>
            </h1>
            <p className="sub">
              Sell tickets, manage registrations, and collect passes for every fundraising event.
              From golf scrambles to galas, Sponsorly handles the ticketing — you focus on the experience.
            </p>
            <div className="sp-hero-ctas">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                Plan your event <IArrow />
              </Link>
              <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                <IPlay /> See a demo
              </Link>
            </div>
            <div className="sp-hero-checks">
              <span className="it"><span className="ck"><ICheck /></span> Mobile check-in</span>
              <span className="it"><span className="ck"><ICheck /></span> Group packages</span>
              <span className="it"><span className="ck"><ICheck /></span> Real-time tracking</span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="sp-tix">
              <div className="top">
                <div>
                  <div className="meta">Sponsorly · Reg/Checkout</div>
                  <h4>Annual Golf Scramble</h4>
                  <div className="det">
                    <ICal /> May 15, 2026
                    <span className="dot"></span>
                    <IPin /> Westshore Country Club
                    <span className="dot"></span>
                    8:00 AM tee-off
                  </div>
                </div>
                <span className="pill"><span className="dot"></span> Just sold · Foursome — Acme Co.</span>
              </div>
              <div className="row">
                <div className="nm">Individual Player<span className="desc">Includes lunch & cart, prizes</span></div>
                <div className="qty"><span className="b">−</span><span className="v">0</span><span className="b">+</span></div>
                <div className="pr">$125</div>
              </div>
              <div className="row high">
                <div className="nm">Foursome Package<span className="desc">Save $100 off team entry</span></div>
                <div className="qty"><span className="b">−</span><span className="v">2</span><span className="b">+</span></div>
                <div className="pr">$900</div>
              </div>
              <div className="row">
                <div className="nm">Dinner Only<span className="desc">Join us for the awards dinner</span></div>
                <div className="qty"><span className="b">−</span><span className="v">1</span><span className="b">+</span></div>
                <div className="pr">$50</div>
              </div>
              <div className="sub">
                <span className="l">Subtotal</span>
                <span className="v">$1,850</span>
              </div>
              <Link to="/signup" className="cta">Get Tickets</Link>
            </div>
            <div className="sp-tix-toast">
              <span className="dot"></span>
              <div>
                <div className="t">57 tickets sold</div>
                <div className="s">in the last 24 hours</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLEXIBLE TICKETING */}
      <section className="sp-section white">
        <div className="sp-wrap sp-two">
          <div>
            <span className="sp-eyebrow">Powerful Ticketing</span>
            <h2 className="sp-display-h2">
              Flexible <span className="accent-accent">ticketing</span> for any event.
            </h2>
            <p className="sp-lead">
              Create multiple ticket types, offer early-bird pricing, and manage attendance from a single dashboard.
              Built for events that don't fit a template.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span><b style={{ color: "var(--sp-ink)" }}>Single tickets or group packages</b></span></li>
              <li><span className="dot"><ICheck /></span><span><b style={{ color: "var(--sp-ink)" }}>Early-bird and limited-time pricing tiers</b></span></li>
              <li><span className="dot"><ICheck /></span><span><b style={{ color: "var(--sp-ink)" }}>VIP packages with exclusive perks</b></span></li>
              <li><span className="dot"><ICheck /></span><span><b style={{ color: "var(--sp-ink)" }}>Mobile check-in & QR-code scanning</b></span></li>
              <li><span className="dot"><ICheck /></span><span><b style={{ color: "var(--sp-ink)" }}>Digital ticket delivery via email or SMS</b></span></li>
            </ul>
          </div>

          <div className="sp-dash">
            <div className="head">
              <div className="ttl">Ticket Dashboard</div>
              <div className="pill"><span className="d"></span> Live</div>
            </div>
            <div className="kpis">
              <div className="k"><div className="l">Sold</div><div className="v">127</div></div>
              <div className="k"><div className="l">Revenue</div><div className="v">$12.7k</div></div>
              <div className="k"><div className="l">Sell-through</div><div className="v">68%</div></div>
            </div>
            <div className="bars">
              <div className="b b1">
                <div className="top"><span className="nm">Early Bird</span><span className="ct">50 / 50 · Sold out</span></div>
                <div className="bar"><i /></div>
              </div>
              <div className="b b2">
                <div className="top"><span className="nm">General Admission</span><span className="ct">77 / 150</span></div>
                <div className="bar"><i /></div>
              </div>
              <div className="b b3">
                <div className="top"><span className="nm">VIP Package</span><span className="ct">14 / 20</span></div>
                <div className="bar"><i /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="sp-section alt">
        <div className="sp-wrap sp-center">
          <span className="sp-eyebrow sp-eyebrow-blue">All Shapes & Sizes</span>
          <h2 className="sp-display-h2">
            Event <span className="accent-blue">types</span> we support.
          </h2>
          <p className="sp-lead">Whatever your event, Sponsorly makes ticketing and registration simple.</p>
        </div>
        <div className="sp-wrap">
          <div className="sp-types">
            {eventTypes.map((t, i) => (
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

      {/* EVENT SPONSORSHIPS */}
      <section className="sp-section">
        <div className="sp-wrap sp-two">
          <div>
            <span className="sp-eyebrow sp-eyebrow-green">Event Sponsorship</span>
            <h2 className="sp-display-h2">
              Maximize revenue with <span className="accent-green">event sponsorships.</span>
            </h2>
            <p className="sp-lead">
              Stack ticketing with sponsorship tiers tied to the event itself. Hole sponsors, table sponsors,
              in-kind donations — all in one place, with their own visibility.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span>Hole sponsors for golf tournaments</span></li>
              <li><span className="dot"><ICheck /></span><span>Table sponsors for galas and dinners</span></li>
              <li><span className="dot"><ICheck /></span><span>Prize sponsors for auctions and raffles</span></li>
              <li><span className="dot"><ICheck /></span><span>Equipment sponsors for camps and clinics</span></li>
            </ul>
            <Link to="/fundraisers/sponsorships" className="sp-btn sp-btn-ghost">
              Learn about sponsorships <IArrow />
            </Link>
          </div>

          <div className="sp-pkgs">
            {sponsorPackages.map((p, i) => (
              <div key={i} className="sp-pkg">
                <div className="meta">{p.meta}</div>
                <div className="nm">{p.nm}</div>
                <div className="pr">{p.pr}</div>
                <div className="sub">{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="sp-results">
        <div className="sp-wrap">
          <span className="sp-eyebrow">The Results</span>
          <h2>Event fundraising that <span className="accent">delivers.</span></h2>
          <p className="sub">Organizations using Sponsorly for events see real results.</p>
          <div className="stats">
            <div className="stat">
              <div className="v orange">2.5×</div>
              <div className="l">Average revenue increase</div>
              <div className="s">vs. manual ticketing</div>
            </div>
            <div className="stat">
              <div className="v blue">40%</div>
              <div className="l">Less admin time</div>
              <div className="s">with automated check-in</div>
            </div>
            <div className="stat">
              <div className="v green">95%</div>
              <div className="l">Attendee satisfaction</div>
              <div className="s">with mobile tickets</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sp-cta">
        <div className="sp-wrap sp-center">
          <h2>Plan your next <span className="accent">fundraising event.</span></h2>
          <p>From small camps to large galas, Sponsorly makes event fundraising simple and successful.</p>
          <div className="ctas">
            <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
              Get started free <IArrow />
            </Link>
            <Link to="/fundraisers" className="sp-btn sp-btn-ghost sp-btn-lg">
              Explore all campaign types
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default EventCampaigns;
