import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";
import { SeoHead } from "@/components/seo/SeoHead";

/**
 * Pledge Fundraisers — built 2026 to match approved mockup.
 * Scoped under .sp-pledge. Mirrors typography + tokens from
 * the other redesigned fundraiser pages (Events, Donations, etc.)
 * with a teal-primary palette to fit the activity-based theme.
 */

const SCOPED_CSS = `
.sp-pledge {
  --sp-blue: #1F5FE0;
  --sp-teal: #0E8B86;
  --sp-teal-deep: #0A6F6B;
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
  --sp-paper: #FAF7F2;
  --sp-paper-2: #F2EEE6;
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
.sp-pledge .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-pledge .sp-italic { font-style: italic; }
.sp-pledge .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(14,139,134,0.12); color: var(--sp-teal); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-pledge .sp-eyebrow-orange { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-pledge .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-pledge .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-pledge .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-pledge .sp-btn:hover { transform: translateY(-1px); }
.sp-pledge .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-pledge .sp-btn-primary { background: var(--sp-teal); color: white; box-shadow: 0 6px 18px -6px rgba(14,139,134,0.55); }
.sp-pledge .sp-btn-primary:hover { background: var(--sp-teal-deep); }
.sp-pledge .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-pledge .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-pledge .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-pledge .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-pledge .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-pledge .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* Sections */
.sp-pledge .sp-section { padding: 96px 0; }
.sp-pledge .sp-section.alt { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-pledge .sp-section.cream { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-pledge .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-pledge .sp-display-h2 .accent-teal { color: var(--sp-teal); font-style: italic; }
.sp-pledge .sp-display-h2 .accent-orange { color: var(--sp-accent); font-style: italic; }
.sp-pledge .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 600px; }
.sp-pledge .sp-center { text-align: center; }
.sp-pledge .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-pledge .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-pledge .sp-hero { position: relative; padding: 80px 0 72px; overflow: hidden; background:
  radial-gradient(900px 480px at 90% -10%, rgba(255,107,53,0.10), transparent 60%),
  radial-gradient(700px 360px at -5% 0%, rgba(14,139,134,0.10), transparent 60%),
  var(--sp-paper); }
.sp-pledge .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-pledge .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.6vw, 72px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-pledge .sp-hero h1 .accent { color: var(--sp-teal); font-style: italic; }
.sp-pledge .sp-hero p.sub { font-size: 16.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-pledge .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; }
.sp-pledge .sp-hero-checks { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-pledge .sp-hero-checks .it { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sp-ink-2); font-weight: 500; }
.sp-pledge .sp-hero-checks .it .ck { width: 18px; height: 18px; border-radius: 999px; background: rgba(14,139,134,0.14); color: var(--sp-teal); display: grid; place-items: center; }

/* Hero pledge form mock */
.sp-pledge .sp-form { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); position: relative; }
.sp-pledge .sp-form .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-pledge .sp-form .top .meta { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-pledge .sp-form .top h4 { font-family: var(--sp-display); font-size: 22px; line-height: 1.15; margin-top: 6px; color: var(--sp-ink); }
.sp-pledge .sp-form .top .det { font-size: 12px; color: var(--sp-muted); margin-top: 4px; display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sp-pledge .sp-form .top .det .dot { width: 3px; height: 3px; border-radius: 999px; background: currentColor; opacity: 0.5; }
.sp-pledge .sp-form .top .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 5px 9px; background: rgba(14,139,134,0.10); color: var(--sp-teal); border-radius: 999px; white-space: nowrap; }
.sp-pledge .sp-form .top .pill .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-teal); }

.sp-pledge .sp-form .athlete { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--sp-line); border-radius: 12px; margin-top: 12px; background: var(--sp-paper); }
.sp-pledge .sp-form .athlete .av { width: 36px; height: 36px; border-radius: 999px; background: var(--sp-teal); color: white; display: grid; place-items: center; font-weight: 700; font-size: 13px; }
.sp-pledge .sp-form .athlete .nm { font-size: 13.5px; font-weight: 600; color: var(--sp-ink); }
.sp-pledge .sp-form .athlete .nm .s { display: block; font-size: 11.5px; color: var(--sp-muted); font-weight: 500; margin-top: 1px; }
.sp-pledge .sp-form .athlete .ck { margin-left: auto; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,139,134,0.14); color: var(--sp-teal); display: grid; place-items: center; }

.sp-pledge .sp-form .lab { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; margin: 18px 0 8px; }
.sp-pledge .sp-form .seg { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--sp-line); border-radius: 12px; padding: 4px; gap: 4px; }
.sp-pledge .sp-form .seg .o { padding: 10px 12px; border-radius: 9px; font-size: 13px; font-weight: 600; color: var(--sp-ink-2); text-align: center; cursor: pointer; }
.sp-pledge .sp-form .seg .o.on { background: var(--sp-paper-2); color: var(--sp-ink); }
.sp-pledge .sp-form .seg .o .s { display: block; font-size: 10.5px; color: var(--sp-muted); font-weight: 500; margin-top: 2px; }

.sp-pledge .sp-form .amount { margin-top: 14px; padding: 14px 16px; border: 1px solid var(--sp-line); border-radius: 12px; display: flex; align-items: baseline; gap: 8px; background: var(--sp-paper); }
.sp-pledge .sp-form .amount .cur { font-family: var(--sp-display); font-size: 24px; color: var(--sp-muted); }
.sp-pledge .sp-form .amount .v { font-family: var(--sp-display); font-size: 36px; color: var(--sp-ink); line-height: 1; }
.sp-pledge .sp-form .chips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; }
.sp-pledge .sp-form .chips .c { padding: 8px 10px; border: 1px solid var(--sp-line); border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--sp-ink-2); text-align: center; }
.sp-pledge .sp-form .chips .c.on { background: var(--sp-teal); color: white; border-color: var(--sp-teal); }

.sp-pledge .sp-form .est { margin-top: 14px; display: flex; justify-content: space-between; align-items: center; padding: 12px 4px; border-top: 1px dashed var(--sp-line); }
.sp-pledge .sp-form .est .l { font-size: 12px; color: var(--sp-ink-2); }
.sp-pledge .sp-form .est .v { font-family: var(--sp-display); font-size: 22px; color: var(--sp-accent); }
.sp-pledge .sp-form .est.cap { padding-top: 8px; border-top: none; }
.sp-pledge .sp-form .est.cap .v { color: var(--sp-ink); }

.sp-pledge .sp-form .cta { margin-top: 12px; display: block; background: var(--sp-teal); color: white; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 24px -10px rgba(14,139,134,0.55); }
.sp-pledge .sp-form .footer { display: flex; justify-content: center; gap: 12px; margin-top: 12px; font-size: 10.5px; color: var(--sp-muted); }
.sp-pledge .sp-form .footer .d { opacity: 0.5; }

.sp-pledge .sp-toast { position: absolute; right: -16px; top: 18px; background: white; border: 1px solid var(--sp-line); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 18px 36px -20px rgba(10,15,30,0.30); }
.sp-pledge .sp-toast .dot { width: 8px; height: 8px; border-radius: 999px; background: var(--sp-teal); }
.sp-pledge .sp-toast .t { font-size: 12px; color: var(--sp-ink); font-weight: 600; }
.sp-pledge .sp-toast .s { font-size: 11px; color: var(--sp-muted); }

.sp-pledge .sp-orange-toast { position: absolute; left: -16px; bottom: -14px; background: var(--sp-accent); color: white; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 18px 36px -20px rgba(255,107,53,0.45); font-size: 12px; font-weight: 600; }
.sp-pledge .sp-orange-toast .s { font-size: 11px; opacity: 0.85; font-weight: 500; }

/* Event types grid (3x2) */
.sp-pledge .sp-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 48px; }
.sp-pledge .sp-type { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; transition: transform .15s ease, box-shadow .2s ease; display: flex; flex-direction: column; gap: 10px; }
.sp-pledge .sp-type:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -20px rgba(10,15,30,0.18); }
.sp-pledge .sp-type .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 4px; }
.sp-pledge .sp-type h3 { font-family: var(--sp-display); font-weight: 400; font-size: 22px; line-height: 1.15; color: var(--sp-ink); }
.sp-pledge .sp-type p { font-size: 13px; color: var(--sp-ink-2); line-height: 1.5; }
.sp-pledge .sp-type .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.sp-pledge .sp-type .chips .c { font-size: 11px; padding: 4px 9px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-ink-2); font-weight: 600; }

/* Two-column "Pledges that just work" */
.sp-pledge .sp-two { display: grid; grid-template-columns: 1fr 1.1fr; gap: 64px; align-items: center; }
.sp-pledge .sp-steps { display: flex; flex-direction: column; gap: 12px; }
.sp-pledge .sp-step { display: flex; gap: 14px; align-items: flex-start; padding: 18px; background: white; border: 1px solid var(--sp-line); border-radius: 14px; }
.sp-pledge .sp-step .num { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 999px; background: var(--sp-teal); color: white; display: grid; place-items: center; font-size: 12px; font-weight: 700; margin-top: 1px; }
.sp-pledge .sp-step h4 { font-size: 14px; font-weight: 600; color: var(--sp-ink); margin-bottom: 4px; }
.sp-pledge .sp-step p { font-size: 13px; color: var(--sp-ink-2); line-height: 1.5; }

/* Leaderboard mock */
.sp-pledge .sp-board { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.20); }
.sp-pledge .sp-board .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-pledge .sp-board .head .ttl { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }
.sp-pledge .sp-board .head .pill { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: rgba(255,107,53,0.14); color: var(--sp-accent); font-weight: 700; display: inline-flex; align-items: center; gap: 6px; }
.sp-pledge .sp-board .head .pill .d { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-accent); animation: sp-pulse 1.6s ease-in-out infinite; }
.sp-pledge .sp-board .cols { display: flex; justify-content: space-between; padding: 12px 8px; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-pledge .sp-board .row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 12px 8px; border-top: 1px solid var(--sp-line); }
.sp-pledge .sp-board .row .who { display: flex; align-items: center; gap: 12px; }
.sp-pledge .sp-board .row .av { width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center; color: white; font-weight: 700; font-size: 11px; }
.sp-pledge .sp-board .row .nm { font-size: 13.5px; font-weight: 600; color: var(--sp-ink); }
.sp-pledge .sp-board .row .nm .s { display: block; font-size: 11.5px; color: var(--sp-muted); font-weight: 500; margin-top: 1px; }
.sp-pledge .sp-board .row .laps { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); min-width: 32px; text-align: right; }
.sp-pledge .sp-board .row .raised { font-family: var(--sp-display); font-size: 18px; color: var(--sp-teal); min-width: 56px; text-align: right; }
.sp-pledge .sp-board .totals { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--sp-line); }
.sp-pledge .sp-board .totals .k .l { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-pledge .sp-board .totals .k .v { font-family: var(--sp-display); font-size: 28px; line-height: 1; margin-top: 6px; color: var(--sp-teal); }
.sp-pledge .sp-board .totals .k .v.dim { color: var(--sp-ink); }
.sp-pledge .sp-board .totals .k .v .pace { font-size: 12px; color: var(--sp-accent); font-family: var(--sp-ui); margin-left: 6px; font-weight: 600; }

@keyframes sp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

/* Bullets */
.sp-pledge .sp-bullets { list-style: none; padding: 0; margin: 24px 0 28px; display: flex; flex-direction: column; gap: 14px; }
.sp-pledge .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-pledge .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,139,134,0.14); color: var(--sp-teal); display: grid; place-items: center; margin-top: 2px; }
.sp-pledge .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Why grid (4 tiles) */
.sp-pledge .sp-why { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 48px; }
.sp-pledge .sp-why .tile { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 22px; text-align: center; }
.sp-pledge .sp-why .tile .ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; margin: 0 auto 12px; }
.sp-pledge .sp-why .tile h3 { font-family: var(--sp-display); font-size: 20px; color: var(--sp-ink); margin-bottom: 6px; }
.sp-pledge .sp-why .tile p { font-size: 12.5px; color: var(--sp-ink-2); line-height: 1.5; }

/* Results dark band */
.sp-pledge .sp-results { background: #0A0F1E; color: white; padding: 96px 0; text-align: center; }
.sp-pledge .sp-results .sp-eyebrow { background: rgba(14,139,134,0.22); color: #6FE3DD; }
.sp-pledge .sp-results h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: white; margin: 14px 0 16px; }
.sp-pledge .sp-results h2 .accent { color: var(--sp-teal); font-style: italic; }
.sp-pledge .sp-results p.sub { font-size: 15.5px; opacity: 0.78; max-width: 540px; margin: 0 auto 48px; line-height: 1.55; }
.sp-pledge .sp-results .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 960px; margin: 0 auto; }
.sp-pledge .sp-results .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 36px 24px; }
.sp-pledge .sp-results .stat .v { font-family: var(--sp-display); font-size: 60px; line-height: 1; }
.sp-pledge .sp-results .stat .v.teal { color: #6FE3DD; }
.sp-pledge .sp-results .stat .v.orange { color: var(--sp-accent); }
.sp-pledge .sp-results .stat .v.green { color: #4ADE80; }
.sp-pledge .sp-results .stat .l { font-family: var(--sp-display); font-style: italic; font-size: 18px; margin-top: 10px; opacity: 0.95; }
.sp-pledge .sp-results .stat .s { font-size: 12px; opacity: 0.6; margin-top: 6px; }

/* Final CTA */
.sp-pledge .sp-cta { background:
  radial-gradient(900px 320px at 50% 0%, rgba(14,139,134,0.14), transparent 60%),
  radial-gradient(700px 240px at 100% 100%, rgba(255,107,53,0.10), transparent 60%),
  var(--sp-paper);
  padding: 100px 0; text-align: center; }
.sp-pledge .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.01em; margin: 0 0 16px; color: var(--sp-ink); }
.sp-pledge .sp-cta h2 .accent { font-style: italic; color: var(--sp-teal); }
.sp-pledge .sp-cta p { font-size: 15.5px; color: var(--sp-ink-2); max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-pledge .sp-cta .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-pledge .sp-section { padding: 64px 0; }
  .sp-pledge .sp-hero { padding: 56px 0; }
  .sp-pledge .sp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .sp-pledge .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-pledge .sp-types { grid-template-columns: 1fr 1fr; }
  .sp-pledge .sp-why { grid-template-columns: 1fr 1fr; }
  .sp-pledge .sp-results .stats { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .sp-pledge .sp-wrap { padding: 0 20px; }
  .sp-pledge .sp-types { grid-template-columns: 1fr; }
  .sp-pledge .sp-why { grid-template-columns: 1fr; }
  .sp-pledge .sp-board .totals { grid-template-columns: 1fr; }
}
`;

/* Inline icons */
const ICheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IPlay = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const IRun = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="m5 22 5-9 4 3-2 6"/><path d="m9 13 4-2 5 4-3 4"/><path d="M13 11l3-1 3 5"/></svg>);
const IBook = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
const IBall = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93 19.07 19.07"/><path d="M14.83 14.83 4.93 19.07"/><path d="M19.07 4.93 9.17 14.83"/></svg>);
const IDrop = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>);
const IBike = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M6 15 9 6h6l3 9"/><path d="M9 6h3l3 9"/></svg>);
const ISpark = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 5.6 2.1 2.1"/><path d="m16.3 16.3 2.1 2.1"/><path d="m5.6 18.4 2.1-2.1"/><path d="m16.3 7.7 2.1-2.1"/></svg>);
const IPiggy = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7h.01"/><path d="M19 5a3 3 0 0 1 1.5 5.6"/><path d="M5 11a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4h-1l-2 3-2-3H9a4 4 0 0 1-4-4z"/></svg>);
const IUsers = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const IStar = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const ITarget = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);

const eventTypes = [
  { Icon: IRun, color: "#0E8B86", bg: "rgba(14,139,134,0.10)",
    title: "Jog-a-thons",
    copy: "Per-lap pledges for school-wide laps or virtual run challenges. Built-in lap tracking and class-vs-class leaderboards.",
    chips: ["Per lap", "Per minute", "Per kilometer"] },
  { Icon: IBook, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)",
    title: "Read-a-thons",
    copy: "Per-book or per-minute pledges for elementary and middle school reading challenges. Logged from the classroom or at home.",
    chips: ["Per book", "Per minute", "Per chapter"] },
  { Icon: IBall, color: "#FF6B35", bg: "rgba(255,107,53,0.10)",
    title: "Free-throw-a-thons",
    copy: "Basketball, soccer-shot, or any per-attempt drill. Players collect pledges and try to break personal records on event day.",
    chips: ["Per shot", "Per goal", "Per drill"] },
  { Icon: IDrop, color: "#7B5BE0", bg: "rgba(123,91,224,0.10)",
    title: "Swim-a-thons",
    copy: "Per-lap or per-meter pledges for swim teams and aquatics programs. Coaches mark off laps in the lane card view.",
    chips: ["Per lap", "Per meter", "Per minute"] },
  { Icon: IBike, color: "#E0A21F", bg: "rgba(224,162,31,0.12)",
    title: "Bike-a-thons",
    copy: "Per-mile pledges for cycling teams and outdoor clubs. Routes and stops are tracked from a coach phone or GPS.",
    chips: ["Per mile", "Per stop", "Flat"] },
  { Icon: ISpark, color: "#E04F8B", bg: "rgba(224,79,139,0.10)",
    title: "Raise-a-thons",
    copy: "Generic pledge events for choir-a-thons, math-a-thons, dance-a-thons — anything you want to make a-thon.",
    chips: ["Per item", "Per minute", "Flat"] },
];

const PledgeCampaigns = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers/pledge" });

  return (
    <div className="sp-pledge">
      <SeoHead
        title="Pledge Fundraisers — Jog-a-thons & Per-Unit Pledges | Sponsorly"
        description="Run jog-a-thons, read-a-thons, and per-unit pledge events where supporters commit to an amount per lap, book, or rep — and get charged after, automatically."
        path="/fundraisers/pledge"
      />
      <style>{SCOPED_CSS}</style>
      <MarketingHeader />

      {/* HERO */}
      <section className="sp-hero">
        <div className="sp-wrap sp-hero-grid">
          <div>
            <span className="sp-eyebrow">Pledge Fundraisers</span>
            <h1>
              Pledge a little.<br />Raise <span className="accent">a lot.</span>
            </h1>
            <p className="sub">
              Run jog-a-thons, read-a-thons, and per-unit pledge events where supporters commit to an amount per lap, book, or rep — and get charged after, automatically.
            </p>
            <div className="sp-hero-ctas">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                Start a pledge event <IArrow />
              </Link>
              <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                <IPlay /> See a demo
              </Link>
            </div>
            <div className="sp-hero-checks">
              <div className="it"><span className="ck"><ICheck /></span>Per-unit math</div>
              <div className="it"><span className="ck"><ICheck /></span>Optional cap</div>
              <div className="it"><span className="ck"><ICheck /></span>Auto-billed</div>
            </div>
          </div>

          {/* Hero pledge form mock */}
          <div style={{ position: "relative" }}>
            <div className="sp-form">
              <div className="sp-toast">
                <span className="dot" />
                <div>
                  <div className="t">New pledge · $0.50/lap</div>
                  <div className="s">Aunt Lisa · 18 sec ago</div>
                </div>
              </div>

              <div className="top">
                <div>
                  <div className="meta">Lincoln High Jog-a-thon</div>
                  <h4>Make a pledge</h4>
                  <div className="det">
                    <span>May 4 · Stratton Track</span>
                    <span className="dot" />
                    <span>32 athletes</span>
                  </div>
                </div>
                <span className="pill"><span className="dot" />Live</span>
              </div>

              <div className="athlete">
                <div className="av">SH</div>
                <div className="nm">
                  Sara Hartman
                  <span className="s">Cross country · grade 11</span>
                </div>
                <span className="ck"><ICheck /></span>
              </div>

              <div className="lab">Pledge type</div>
              <div className="seg">
                <div className="o on">Per lap<span className="s">Charged after</span></div>
                <div className="o">Flat amount<span className="s">Charged today</span></div>
              </div>

              <div className="lab">Per-lap amount</div>
              <div className="amount">
                <span className="cur">$</span>
                <span className="v">2.00</span>
              </div>
              <div className="chips">
                <div className="c">$0.50</div>
                <div className="c">$1.00</div>
                <div className="c on">$2.00</div>
                <div className="c">$5.00</div>
              </div>

              <div className="est">
                <span className="l">Current estimate</span>
                <span className="v">$78.00</span>
              </div>
              <div className="est cap">
                <span className="l">Cap (max 40 laps)</span>
                <span className="v">$80.00</span>
              </div>

              <a className="cta" href="#">Submit pledge</a>
              <div className="footer">
                <span>Secure · Stripe</span>
                <span className="d">·</span>
                <span>Receipt by email</span>
              </div>

              <div className="sp-orange-toast">
                <div>
                  <div>32 athletes pledging</div>
                  <div className="s">$8,420 estimated raise</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVERY KIND OF -A-THON */}
      <section className="sp-section alt">
        <div className="sp-wrap sp-center">
          <span className="sp-eyebrow">Every kind of -a-thon</span>
          <h2 className="sp-display-h2">Pledge events <span className="accent-teal">made simple.</span></h2>
          <p className="sp-lead">Whatever your activity, set the unit and Sponsorly does the math.</p>

          <div className="sp-types">
            {eventTypes.map((t) => (
              <div key={t.title} className="sp-type">
                <div className="ico" style={{ background: t.bg, color: t.color }}>
                  <t.Icon />
                </div>
                <h3>{t.title}</h3>
                <p>{t.copy}</p>
                <div className="chips">
                  {t.chips.map((c) => <span key={c} className="c">{c}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLEDGES THAT JUST WORK */}
      <section className="sp-section">
        <div className="sp-wrap sp-two">
          <div>
            <span className="sp-eyebrow">The math</span>
            <h2 className="sp-display-h2">Pledges that <span className="accent-teal">just work.</span></h2>
            <p className="sp-lead">
              Sponsorly handles the math, the caps, and the edge cases. You count laps and watch the totals roll in.
            </p>
            <div style={{ marginTop: 28 }}>
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                See available events <IArrow />
              </Link>
            </div>
          </div>

          <div className="sp-steps">
            <div className="sp-step">
              <div className="num">1</div>
              <div>
                <h4>Supporters pledge</h4>
                <p>Friends and family commit a per-unit amount on each athlete's page — with an optional cap so no one is surprised by the final total.</p>
              </div>
            </div>
            <div className="sp-step">
              <div className="num">2</div>
              <div>
                <h4>Athletes perform</h4>
                <p>Coaches log laps, books, or shots from a phone or tablet — including class-by-class or lane-by-lane card views.</p>
              </div>
            </div>
            <div className="sp-step">
              <div className="num">3</div>
              <div>
                <h4>Sponsorly bills automatically</h4>
                <p>When the event closes, every pledge is calculated, capped, charged, and receipted in a single batch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WATCH TOTALS CLIMB */}
      <section className="sp-section cream">
        <div className="sp-wrap sp-two">
          <div className="sp-board">
            <div className="head">
              <div className="ttl">Lincoln Cross Country · Lap 18</div>
              <span className="pill"><span className="d" />Live</span>
            </div>
            <div className="cols">
              <span>Athlete</span>
              <span style={{ marginLeft: "auto", marginRight: 56 }}>Laps</span>
              <span>Raised</span>
            </div>
            {[
              { av: "JM", color: "#0E8B86", nm: "Jake Martinez", sub: "Sophomore · #14", laps: 22, raised: "$924" },
              { av: "RW", color: "#1F5FE0", nm: "Riley Walters", sub: "Senior · #07", laps: 20, raised: "$816" },
              { av: "MC", color: "#FF6B35", nm: "Mara Chen", sub: "Junior · #21", laps: 19, raised: "$760" },
              { av: "ER", color: "#7B5BE0", nm: "Eden Rao", sub: "Freshman · #03", laps: 17, raised: "$612" },
            ].map((p) => (
              <div key={p.av} className="row">
                <div className="who">
                  <div className="av" style={{ background: p.color }}>{p.av}</div>
                  <div className="nm">{p.nm}<span className="s">{p.sub}</span></div>
                </div>
                <div className="laps">{p.laps}</div>
                <div className="raised">{p.raised}</div>
              </div>
            ))}
            <div className="totals">
              <div className="k">
                <div className="l">Pledged so far</div>
                <div className="v">$8,420 <span className="pace">+$140</span></div>
              </div>
              <div className="k">
                <div className="l">After all caps applied</div>
                <div className="v dim">$7,180</div>
              </div>
            </div>
          </div>

          <div>
            <span className="sp-eyebrow sp-eyebrow-orange">Live tracking</span>
            <h2 className="sp-display-h2">Watch totals climb in <span className="accent-orange">real time.</span></h2>
            <p className="sp-lead">
              Athletes and donors see the numbers move. Every lap, book, or shot updates leaderboards, projected raises, and caps — and updates the running total.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span>Tap-to-count interface for any volunteer</span></li>
              <li><span className="dot"><ICheck /></span><span>Live leaderboards for athletes and parents</span></li>
              <li><span className="dot"><ICheck /></span><span>Caps applied automatically before billing</span></li>
              <li><span className="dot"><ICheck /></span><span>CSV export after the event without a chart</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHY PLEDGES RAISE MORE */}
      <section className="sp-section alt">
        <div className="sp-wrap sp-center">
          <span className="sp-eyebrow">The psychology</span>
          <h2 className="sp-display-h2">Why pledges <span className="accent-orange">raise more.</span></h2>
          <p className="sp-lead">
            Per-unit commitments feel small but compound — and supporters love being part of the activity.
          </p>

          <div className="sp-why">
            <div className="tile">
              <div className="ico" style={{ background: "rgba(14,139,134,0.10)", color: "var(--sp-teal)" }}><IPiggy /></div>
              <h3>Low friction</h3>
              <p>"$1/lap" feels like a small ask, not a heavy donation request.</p>
            </div>
            <div className="tile">
              <div className="ico" style={{ background: "rgba(31,95,224,0.10)", color: "var(--sp-blue)" }}><IUsers /></div>
              <h3>Built-in cheering</h3>
              <p>Pledgers want to see their athlete try harder — they're invested in the outcome.</p>
            </div>
            <div className="tile">
              <div className="ico" style={{ background: "rgba(255,107,53,0.10)", color: "var(--sp-accent)" }}><IStar /></div>
              <h3>Performance-driven</h3>
              <p>Athletes work harder when each lap, book, or rep has a price tag attached.</p>
            </div>
            <div className="tile">
              <div className="ico" style={{ background: "rgba(123,91,224,0.10)", color: "var(--sp-violet)" }}><ITarget /></div>
              <h3>Built-in design</h3>
              <p>Scoring, leaderboards, and the team sharing structure are part of the format.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS DARK BAND */}
      <section className="sp-results">
        <div className="sp-wrap">
          <span className="sp-eyebrow">The numbers</span>
          <h2>Pledge fundraisers that <span className="accent">compound.</span></h2>
          <p className="sub">Activity-based events out-raise flat-donation events almost every spring.</p>
          <div className="stats">
            <div className="stat">
              <div className="v teal">$84</div>
              <div className="l">Average pledge total</div>
              <div className="s">vs $32 for flat donations</div>
            </div>
            <div className="stat">
              <div className="v orange">68%</div>
              <div className="l">Pledge return rate</div>
              <div className="s">year-over-year donors</div>
            </div>
            <div className="stat">
              <div className="v green">99.4%</div>
              <div className="l">Auto-billing success</div>
              <div className="s">no chasing checks</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sp-cta">
        <div className="sp-wrap">
          <h2>Run your next <span className="accent">-a-thon.</span></h2>
          <p>From jog-a-thons to read-a-thons, Sponsorly handles every per-unit pledge with zero math on your end.</p>
          <div className="ctas">
            <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">Get started free <IArrow /></Link>
            <Link to="/fundraisers" className="sp-btn sp-btn-ghost sp-btn-lg">Explore all campaign types</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default PledgeCampaigns;
