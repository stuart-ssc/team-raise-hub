import { useEffect } from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";

/**
 * Sponsorship Fundraisers — rebuilt 2026 to match approved mockup.
 * Scoped under .sp-sponsorships so the rest of the design system is untouched.
 * Mirrors typography + tokens from CampaignsOverview / DonationCampaigns.
 */

const SCOPED_CSS = `
.sp-sponsorships {
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
.sp-sponsorships .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-sponsorships .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(255,107,53,0.10); color: var(--sp-accent); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-sponsorships .sp-eyebrow-blue { background: rgba(31,95,224,0.08); color: var(--sp-blue); }
.sp-sponsorships .sp-eyebrow-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-sponsorships .sp-eyebrow-light { background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.86); }
.sp-sponsorships .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-sponsorships .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-sponsorships .sp-btn:hover { transform: translateY(-1px); }
.sp-sponsorships .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-sponsorships .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-sponsorships .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-sponsorships .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-sponsorships .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-sponsorships .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-sponsorships .sp-btn-white:hover { background: rgba(255,255,255,0.92); }

/* Sections */
.sp-sponsorships .sp-section { padding: 96px 0; }
.sp-sponsorships .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-sponsorships .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-sponsorships .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-sponsorships .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-sponsorships .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 560px; }
.sp-sponsorships .sp-center { text-align: center; }
.sp-sponsorships .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-sponsorships .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-sponsorships .sp-hero { position: relative; padding: 80px 0 72px; overflow: hidden; background:
  radial-gradient(900px 480px at 90% -10%, rgba(31,95,224,0.10), transparent 60%),
  radial-gradient(700px 360px at -5% 0%, rgba(255,107,53,0.10), transparent 60%),
  var(--sp-paper); }
.sp-sponsorships .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-sponsorships .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(46px, 5.8vw, 76px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-sponsorships .sp-hero h1 .accent { color: var(--sp-blue); font-style: italic; display: block; }
.sp-sponsorships .sp-hero p.sub { font-size: 16.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-sponsorships .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; }
.sp-sponsorships .sp-hero-checks { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-sponsorships .sp-hero-checks .it { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sp-ink-2); font-weight: 500; }
.sp-sponsorships .sp-hero-checks .it .ck { width: 18px; height: 18px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); display: grid; place-items: center; }

/* Sponsor picker mock */
.sp-sponsorships .sp-picker { position: relative; background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); }
.sp-sponsorships .sp-picker .crumb { font-size: 11px; color: var(--sp-muted); margin-bottom: 8px; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
.sp-sponsorships .sp-picker h4 { font-family: var(--sp-display); font-size: 24px; line-height: 1.15; color: var(--sp-ink); }
.sp-sponsorships .sp-picker .sub { font-size: 12px; color: var(--sp-muted); margin-top: 4px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-picker .tier { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-picker .tier:last-of-type { border-bottom: 0; }
.sp-sponsorships .sp-picker .tier .ico { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: white; flex: 0 0 32px; font-weight: 700; font-size: 13px; }
.sp-sponsorships .sp-picker .tier .ico.bronze { background: #B5651D; }
.sp-sponsorships .sp-picker .tier .ico.silver { background: #9AA3B5; }
.sp-sponsorships .sp-picker .tier .ico.gold { background: var(--sp-amber); }
.sp-sponsorships .sp-picker .tier .ico.plat { background: var(--sp-violet); }
.sp-sponsorships .sp-picker .tier .body { flex: 1; min-width: 0; }
.sp-sponsorships .sp-picker .tier .nm { font-size: 14px; color: var(--sp-ink); font-weight: 600; }
.sp-sponsorships .sp-picker .tier .desc { font-size: 11.5px; color: var(--sp-muted); margin-top: 2px; }
.sp-sponsorships .sp-picker .tier .right { text-align: right; }
.sp-sponsorships .sp-picker .tier .pr { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }
.sp-sponsorships .sp-picker .tier .left { font-size: 10px; letter-spacing: 0.10em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; margin-top: 2px; }
.sp-sponsorships .sp-picker .tier .left.warn { color: var(--sp-accent); }
.sp-sponsorships .sp-picker .tier.on { background: rgba(224,162,31,0.07); border-radius: 10px; padding-left: 10px; padding-right: 10px; margin-left: -10px; margin-right: -10px; border-bottom: 1px solid transparent; }
.sp-sponsorships .sp-picker .cta { display: block; margin-top: 14px; background: var(--sp-blue); color: white; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 14px; }
.sp-sponsorships .sp-picker .badge-new { position: absolute; top: -10px; right: 16px; background: white; border: 1px solid var(--sp-line); border-radius: 999px; padding: 6px 10px 6px 8px; box-shadow: 0 12px 28px -16px rgba(10,15,30,0.30); display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.sp-sponsorships .sp-picker .badge-new .dot { width: 16px; height: 16px; border-radius: 999px; background: rgba(14,159,110,0.16); color: var(--sp-green); display: grid; place-items: center; }
.sp-sponsorships .sp-picker .badge-new .ttl { font-weight: 700; color: var(--sp-ink); letter-spacing: 0.06em; text-transform: uppercase; font-size: 9.5px; }
.sp-sponsorships .sp-picker .badge-new .nm { font-weight: 600; color: var(--sp-ink); font-size: 11px; }
.sp-sponsorships .sp-picker .badge-new .meta { color: var(--sp-muted); font-size: 10px; }
.sp-sponsorships .sp-picker .toast { position: absolute; left: -14px; bottom: 70px; background: white; border: 1px solid var(--sp-line); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 16px 30px -18px rgba(10,15,30,0.30); }
.sp-sponsorships .sp-picker .toast .ico { width: 24px; height: 24px; border-radius: 999px; background: rgba(255,107,53,0.14); color: var(--sp-accent); display: grid; place-items: center; }
.sp-sponsorships .sp-picker .toast .l { font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-sponsorships .sp-picker .toast .nm { font-size: 12px; font-weight: 600; color: var(--sp-ink); }
.sp-sponsorships .sp-picker .toast .meta { font-size: 10.5px; color: var(--sp-muted); }

/* Two-column with bullets */
.sp-sponsorships .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-sponsorships .sp-bullets { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-direction: column; gap: 14px; }
.sp-sponsorships .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-bullets li:last-child { border-bottom: 0; }
.sp-sponsorships .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 2px; }
.sp-sponsorships .sp-bullets li b { font-weight: 600; color: var(--sp-ink); }
.sp-sponsorships .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Placement grid */
.sp-sponsorships .sp-placements { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sp-sponsorships .sp-place { background: var(--sp-paper-2); border: 1px solid var(--sp-line); border-radius: 14px; padding: 18px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; }
.sp-sponsorships .sp-place:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -22px rgba(10,15,30,0.18); background: white; }
.sp-sponsorships .sp-place .ico { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; margin-bottom: 12px; }
.sp-sponsorships .sp-place h4 { font-family: var(--sp-display); font-size: 18px; line-height: 1.15; color: var(--sp-ink); }
.sp-sponsorships .sp-place p { font-size: 12.5px; color: var(--sp-muted); margin-top: 4px; }

/* Sponsor profile mock */
.sp-sponsorships .sp-profile { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 0; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.20); overflow: hidden; }
.sp-sponsorships .sp-profile .topline { height: 4px; background: linear-gradient(90deg, var(--sp-amber), var(--sp-green)); }
.sp-sponsorships .sp-profile .body { padding: 22px; }
.sp-sponsorships .sp-profile .head { display: flex; align-items: center; gap: 14px; padding-bottom: 16px; border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-profile .head .av { width: 48px; height: 48px; border-radius: 12px; background: var(--sp-accent); color: white; display: grid; place-items: center; font-family: var(--sp-display); font-size: 26px; }
.sp-sponsorships .sp-profile .head .nm { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); }
.sp-sponsorships .sp-profile .head .meta { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; margin-top: 2px; }
.sp-sponsorships .sp-profile .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px 0; border-bottom: 1px solid var(--sp-line); }
.sp-sponsorships .sp-profile .stats .s { background: var(--sp-paper-2); border-radius: 10px; padding: 12px; text-align: center; }
.sp-sponsorships .sp-profile .stats .s .v { font-family: var(--sp-display); font-size: 22px; line-height: 1; color: var(--sp-ink); }
.sp-sponsorships .sp-profile .stats .s .l { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; margin-top: 6px; }
.sp-sponsorships .sp-profile .assets { padding-top: 14px; }
.sp-sponsorships .sp-profile .assets .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13px; color: var(--sp-ink-2); border-top: 1px solid var(--sp-line); }
.sp-sponsorships .sp-profile .assets .row:first-child { border-top: 0; }
.sp-sponsorships .sp-profile .assets .row .right { display: inline-flex; align-items: center; gap: 6px; color: var(--sp-green); font-weight: 600; font-size: 12px; }
.sp-sponsorships .sp-profile .assets .row .right .ck { width: 16px; height: 16px; border-radius: 999px; background: rgba(14,159,110,0.16); display: grid; place-items: center; }

/* Process band (dark) */
.sp-sponsorships .sp-process { background: radial-gradient(900px 320px at 50% 0%, rgba(31,95,224,0.18), transparent 60%), #0A0F1E; color: white; padding: 96px 0; }
.sp-sponsorships .sp-process .sp-display-h2 { color: white; }
.sp-sponsorships .sp-process .sp-display-h2 .accent-blue { color: #5B8DFF; }
.sp-sponsorships .sp-process .sp-lead { color: rgba(255,255,255,0.78); }
.sp-sponsorships .sp-process .rail { position: relative; margin-top: 56px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.sp-sponsorships .sp-process .rail::before { content: ""; position: absolute; left: 8%; right: 8%; top: 24px; height: 1px; background: rgba(255,255,255,0.18); z-index: 0; }
.sp-sponsorships .sp-process .step { position: relative; z-index: 1; text-align: center; }
.sp-sponsorships .sp-process .step .num { width: 48px; height: 48px; border-radius: 999px; background: #0A0F1E; border: 1px solid rgba(255,255,255,0.30); color: white; display: grid; place-items: center; margin: 0 auto 16px; font-family: var(--sp-display); font-size: 20px; }
.sp-sponsorships .sp-process .step.on .num { background: var(--sp-blue); border-color: var(--sp-blue); box-shadow: 0 8px 22px -8px rgba(31,95,224,0.7); }
.sp-sponsorships .sp-process .step h4 { font-family: var(--sp-display); font-size: 20px; color: white; margin-bottom: 6px; }
.sp-sponsorships .sp-process .step p { font-size: 12.5px; color: rgba(255,255,255,0.70); line-height: 1.55; max-width: 200px; margin: 0 auto; }

/* Final CTA — light */
.sp-sponsorships .sp-cta-light { padding: 100px 0; text-align: center; background:
  radial-gradient(700px 280px at 80% 100%, rgba(31,95,224,0.12), transparent 60%),
  radial-gradient(600px 240px at 20% 0%, rgba(255,107,53,0.10), transparent 60%),
  var(--sp-paper); }
.sp-sponsorships .sp-cta-light h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.01em; margin: 8px 0 18px; color: var(--sp-ink); }
.sp-sponsorships .sp-cta-light h2 .accent { font-style: italic; color: var(--sp-blue); display: block; }
.sp-sponsorships .sp-cta-light p { font-size: 15.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 auto 28px; line-height: 1.55; }
.sp-sponsorships .sp-cta-light .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-sponsorships .sp-section { padding: 64px 0; }
  .sp-sponsorships .sp-hero { padding: 56px 0; }
  .sp-sponsorships .sp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .sp-sponsorships .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-sponsorships .sp-process .rail { grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .sp-sponsorships .sp-process .rail::before { display: none; }
}
@media (max-width: 560px) {
  .sp-sponsorships .sp-wrap { padding: 0 20px; }
  .sp-sponsorships .sp-placements { grid-template-columns: 1fr; }
  .sp-sponsorships .sp-process .rail { grid-template-columns: 1fr; }
}
`;

/* Inline icons */
const ICheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IPlay = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const IHandshake = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-2 2-2-2 2-2 2 2z"/><path d="M14 14l-3 3-2-2 4-4 8 8-3 3-4-4"/><path d="m21 3-9 9-2-2 4-4-2-2-2 2-2-2 4-4Z"/></svg>);
const ITrophy = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M6 5h12v6a6 6 0 0 1-12 0z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg>);
const IShirt = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>);
const IStar = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IFile = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>);
const IMonitor = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>);
const IMega = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>);
const IRefresh = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>);

const placements = [
  { Icon: IMonitor, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)", title: "Stadium signage", copy: "Banners and field signs." },
  { Icon: IShirt, color: "#FF6B35", bg: "rgba(255,107,53,0.10)", title: "Jersey sponsors", copy: "Logos on team uniforms." },
  { Icon: IStar, color: "#E0A21F", bg: "rgba(224,162,31,0.14)", title: "Naming rights", copy: '"This field sponsored by…"' },
  { Icon: IFile, color: "#0E9F6E", bg: "rgba(14,159,110,0.10)", title: "Program book ads", copy: "Full or half-page placements." },
  { Icon: IMonitor, color: "#7B5BE0", bg: "rgba(123,91,224,0.10)", title: "Digital displays", copy: "Scoreboard and lobby screens." },
  { Icon: IMega, color: "#E04F8B", bg: "rgba(224,79,139,0.10)", title: "PA announcements", copy: "Read at every game." },
];

const SponsorshipCampaigns = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers/sponsorships" });

  useEffect(() => {
    document.title = "Sponsorship Fundraisers — Turn Local Businesses Into Lasting Partners | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Invite local businesses to sponsor your team or event. Tiered packages, automatic asset collection, sponsor recognition, and renewals — all in one place."
      );
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="sp-sponsorships min-h-screen">
        <MarketingHeader />

        {/* HERO */}
        <section className="sp-hero">
          <div className="sp-wrap">
            <div className="sp-hero-grid">
              <div>
                <span className="sp-eyebrow">
                  <IHandshake /> Sponsorship fundraisers
                </span>
                <h1>
                  Turn local businesses into
                  <span className="accent">lasting partners.</span>
                </h1>
                <p className="sub">
                  Invite businesses to advertise with your group in exchange for supporting your cause. Create tiered packages, collect assets automatically, and build relationships that last.
                </p>
                <div className="sp-hero-ctas">
                  <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                    Start your sponsor program <IArrow />
                  </Link>
                  <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                    <IPlay /> See a demo
                  </Link>
                </div>
                <div className="sp-hero-checks">
                  <span className="it"><span className="ck"><ICheck /></span> Tiered packages</span>
                  <span className="it"><span className="ck"><ICheck /></span> Auto asset collection</span>
                  <span className="it"><span className="ck"><ICheck /></span> Tax-deductible</span>
                </div>
              </div>

              <div className="sp-picker" aria-hidden="true">
                <div className="badge-new">
                  <span className="dot"><ICheck /></span>
                  <span>
                    <span className="ttl" style={{ display: "block" }}>New sponsor</span>
                    <span className="nm">Acme Hardware — Gold tier</span>
                  </span>
                </div>
                <div className="crumb">sponsorly.io/c/wildcats-sponsor</div>
                <h4>Become a Wildcats sponsor</h4>
                <div className="sub">Westlake HS Athletics · Fall 2026 Season</div>

                <div className="tier">
                  <div className="ico bronze">Br</div>
                  <div className="body">
                    <div className="nm">Bronze Sponsor</div>
                    <div className="desc">Logo on website + social mention</div>
                  </div>
                  <div className="right">
                    <div className="pr">$250</div>
                    <div className="left">14 left</div>
                  </div>
                </div>

                <div className="tier">
                  <div className="ico silver">Si</div>
                  <div className="body">
                    <div className="nm">Silver Sponsor</div>
                    <div className="desc">+ Program book ad + signage</div>
                  </div>
                  <div className="right">
                    <div className="pr">$500</div>
                    <div className="left">8 left</div>
                  </div>
                </div>

                <div className="tier on">
                  <div className="ico gold">Au</div>
                  <div className="body">
                    <div className="nm">Gold Sponsor</div>
                    <div className="desc">+ PA announcements + jersey patch</div>
                  </div>
                  <div className="right">
                    <div className="pr">$1,000</div>
                    <div className="left warn">3 left</div>
                  </div>
                </div>

                <div className="tier">
                  <div className="ico plat">Pt</div>
                  <div className="body">
                    <div className="nm">Platinum Sponsor</div>
                    <div className="desc">+ Naming rights + VIP access</div>
                  </div>
                  <div className="right">
                    <div className="pr">$2,500</div>
                    <div className="left warn">1 left</div>
                  </div>
                </div>

                <div className="toast">
                  <span className="ico"><IRefresh /></span>
                  <span>
                    <span className="l" style={{ display: "block" }}>Renewal</span>
                    <span className="nm">Joe's Pizza · 3rd year sponsor</span>
                    <span className="meta" style={{ display: "block" }}>Auto-renewed for 2026</span>
                  </span>
                </div>

                <a href="#" className="cta" onClick={(e) => e.preventDefault()}>
                  Become a sponsor
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FOR ORGANIZATIONS — Build lasting relationships */}
        <section className="sp-section white">
          <div className="sp-wrap">
            <div className="sp-two">
              <div>
                <span className="sp-eyebrow sp-eyebrow-blue">For organizations</span>
                <h2 className="sp-display-h2">
                  Build <span className="accent-accent">lasting</span><br />
                  business relationships.
                </h2>
                <p className="sp-lead">
                  Sponsorly makes it easy to create professional sponsorship programs that attract and retain business partners year after year.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span>Create <b>unlimited tiered packages</b></span></li>
                  <li><span className="dot"><ICheck /></span><span>Offer advertising placements (banners, jerseys, programs, digital)</span></li>
                  <li><span className="dot"><ICheck /></span><span>Build ongoing relationships with local businesses</span></li>
                  <li><span className="dot"><ICheck /></span><span>Professional sponsor recognition displays</span></li>
                  <li><span className="dot"><ICheck /></span><span>Automatic season-over-season renewals</span></li>
                </ul>
              </div>

              <div className="sp-placements">
                {placements.map((p, i) => (
                  <div className="sp-place" key={i}>
                    <div className="ico" style={{ background: p.bg, color: p.color }}><p.Icon /></div>
                    <h4>{p.title}</h4>
                    <p>{p.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOR BUSINESSES — Meaningful community engagement */}
        <section className="sp-section alt">
          <div className="sp-wrap">
            <div className="sp-two">
              <div className="sp-profile" aria-hidden="true">
                <div className="topline" />
                <div className="body">
                  <div className="head">
                    <div className="av">A</div>
                    <div>
                      <div className="nm">Acme Hardware</div>
                      <div className="meta">Proud Gold Sponsor · Central High Football</div>
                    </div>
                  </div>
                  <div className="stats">
                    <div className="s"><div className="v">5K+</div><div className="l">Impressions</div></div>
                    <div className="s"><div className="v">12</div><div className="l">Events</div></div>
                    <div className="s"><div className="v">3</div><div className="l">Years</div></div>
                  </div>
                  <div className="assets">
                    <div className="row">
                      <span>Field signage</span>
                      <span className="right"><span className="ck"><ICheck /></span> Live</span>
                    </div>
                    <div className="row">
                      <span>Jersey patch</span>
                      <span className="right"><span className="ck"><ICheck /></span> Delivered</span>
                    </div>
                    <div className="row">
                      <span>PA announcements</span>
                      <span className="right"><span className="ck"><ICheck /></span> Weekly</span>
                    </div>
                    <div className="row">
                      <span>Program ad</span>
                      <span className="right"><span className="ck"><ICheck /></span> Full page</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="sp-eyebrow sp-eyebrow-green">For businesses</span>
                <h2 className="sp-display-h2">
                  Meaningful <span className="accent-green">community</span><br />
                  engagement.
                </h2>
                <p className="sp-lead">
                  Businesses get authentic local visibility while supporting causes their customers care about — far more memorable than another billboard.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span>Get local brand exposure at community events</span></li>
                  <li><span className="dot"><ICheck /></span><span>Support community causes with credibility</span></li>
                  <li><span className="dot"><ICheck /></span><span>Tax-deductible contributions</span></li>
                  <li><span className="dot"><ICheck /></span><span>Year-round visibility opportunities</span></li>
                  <li><span className="dot"><ICheck /></span><span>Auto-collected asset files for usage</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS — dark band */}
        <section className="sp-process">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow sp-eyebrow-light">The process</span>
            <h2 className="sp-display-h2">
              How sponsorship<br />
              <span className="accent-blue">fundraisers</span> work.
            </h2>
            <p className="sp-lead">
              From setup to asset collection, we've streamlined the entire sponsorship process.
            </p>
            <div className="rail">
              <div className="step on">
                <div className="num">1</div>
                <h4>Create packages</h4>
                <p>Define sponsorship tiers with benefits and pricing in minutes.</p>
              </div>
              <div className="step">
                <div className="num">2</div>
                <h4>Share fundraiser</h4>
                <p>Send your professional fundraiser page to local businesses.</p>
              </div>
              <div className="step">
                <div className="num">3</div>
                <h4>Businesses purchase</h4>
                <p>Sponsors select their tier and pay online — instant confirmation.</p>
              </div>
              <div className="step">
                <div className="num">4</div>
                <h4>Collect assets</h4>
                <p>We automatically request and collect logos and files from each sponsor.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA — light */}
        <section className="sp-cta-light">
          <div className="sp-wrap">
            <h2>
              Ready to build your
              <span className="accent">sponsor program?</span>
            </h2>
            <p>
              Join the schools and nonprofits raising thousands through local business partnerships.
            </p>
            <div className="ctas">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                Get started free <IArrow />
              </Link>
              <Link to="/for-businesses" className="sp-btn sp-btn-ghost sp-btn-lg">
                I'm a business
              </Link>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
};

export default SponsorshipCampaigns;