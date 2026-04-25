import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";
import { SeoHead } from "@/components/seo/SeoHead";

/**
 * Donation Fundraisers — rebuilt 2026 to match approved mockup.
 * Scoped under .sp-donations so the rest of the design system is untouched.
 * Mirrors typography + tokens from CampaignsOverview / Pricing / Schools / Features.
 */

const SCOPED_CSS = `
.sp-donations {
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
.sp-donations .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-donations .sp-italic { font-style: italic; }
.sp-donations .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(14,159,110,0.10); color: var(--sp-green); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-donations .sp-eyebrow-blue { background: rgba(31,95,224,0.08); color: var(--sp-blue); }
.sp-donations .sp-eyebrow-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-donations .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-donations .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-donations .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-donations .sp-btn:hover { transform: translateY(-1px); }
.sp-donations .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-donations .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-donations .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-donations .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-donations .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-donations .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-donations .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-donations .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-donations .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* Sections */
.sp-donations .sp-section { padding: 96px 0; }
.sp-donations .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-donations .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-donations .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-donations .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-donations .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-donations .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-donations .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 600px; }
.sp-donations .sp-center { text-align: center; }
.sp-donations .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-donations .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-donations .sp-hero { position: relative; padding: 80px 0 72px; overflow: hidden; background:
  radial-gradient(900px 480px at 90% -10%, rgba(31,95,224,0.10), transparent 60%),
  radial-gradient(700px 360px at -5% 0%, rgba(14,159,110,0.08), transparent 60%),
  var(--sp-paper); }
.sp-donations .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-donations .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.6vw, 72px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-donations .sp-hero h1 .accent { color: var(--sp-blue); font-style: italic; }
.sp-donations .sp-hero p.sub { font-size: 16.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-donations .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; }
.sp-donations .sp-hero-checks { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-donations .sp-hero-checks .it { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sp-ink-2); font-weight: 500; }
.sp-donations .sp-hero-checks .it .ck { width: 18px; height: 18px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); display: grid; place-items: center; }

/* Hero donate card */
.sp-donations .sp-donate-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); position: relative; }
.sp-donations .sp-donate-card .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-donations .sp-donate-card .top .meta { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-donations .sp-donate-card .top h4 { font-family: var(--sp-display); font-size: 22px; line-height: 1.15; margin-top: 6px; color: var(--sp-ink); }
.sp-donations .sp-donate-card .top .sub { font-size: 12px; color: var(--sp-muted); margin-top: 4px; }
.sp-donations .sp-donate-card .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 5px 9px; background: rgba(14,159,110,0.10); color: var(--sp-green); border-radius: 999px; white-space: nowrap; }
.sp-donations .sp-donate-card .pill .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-green); }
.sp-donations .sp-donate-card .raised { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 0 6px; }
.sp-donations .sp-donate-card .raised .v { font-family: var(--sp-display); font-size: 30px; line-height: 1; color: var(--sp-ink); }
.sp-donations .sp-donate-card .raised .l { font-size: 12px; color: var(--sp-muted); }
.sp-donations .sp-donate-card .pct { font-size: 12px; color: var(--sp-green); font-weight: 700; }
.sp-donations .sp-donate-card .progress { height: 8px; background: var(--sp-paper-2); border-radius: 999px; overflow: hidden; margin: 4px 0 6px; }
.sp-donations .sp-donate-card .progress > i { display: block; height: 100%; width: 65%; background: linear-gradient(90deg, var(--sp-green), #1ABF82); }
.sp-donations .sp-donate-card .pmeta { display: flex; justify-content: space-between; font-size: 11px; color: var(--sp-muted); padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-donations .sp-donate-card .label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: var(--sp-muted); margin: 16px 0 8px; }
.sp-donations .sp-donate-card .amts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.sp-donations .sp-donate-card .amts .a { padding: 10px 0; text-align: center; border-radius: 10px; background: var(--sp-paper-2); font-weight: 600; font-size: 13px; color: var(--sp-ink); }
.sp-donations .sp-donate-card .amts .a.on { background: var(--sp-blue); color: white; box-shadow: 0 6px 14px -6px rgba(31,95,224,0.55); }
.sp-donations .sp-donate-card .donor { display: flex; align-items: center; gap: 10px; padding: 14px 0 4px; }
.sp-donations .sp-donate-card .donor .av { width: 28px; height: 28px; border-radius: 999px; background: var(--sp-pink); color: white; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.sp-donations .sp-donate-card .donor .nm { font-size: 12.5px; color: var(--sp-ink); font-weight: 600; }
.sp-donations .sp-donate-card .donor .ti { font-size: 11px; color: var(--sp-muted); }
.sp-donations .sp-donate-card .anon { font-size: 12px; color: var(--sp-muted); margin-left: auto; font-style: italic; }
.sp-donations .sp-donate-card .cta { margin-top: 14px; display: block; background: var(--sp-accent); color: white; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 14px; }

/* Features grid */
.sp-donations .sp-feat-grid { display: grid; grid-template-columns: 1.1fr 2fr; gap: 18px; margin-top: 48px; }
.sp-donations .sp-feat-grid .right { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.sp-donations .sp-feat-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 26px; display: flex; flex-direction: column; gap: 14px; transition: transform .15s ease, box-shadow .2s ease; }
.sp-donations .sp-feat-card:hover { transform: translateY(-2px); box-shadow: 0 22px 44px -24px rgba(10,15,30,0.20); }
.sp-donations .sp-feat-card .ico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-donations .sp-feat-card h3 { font-family: var(--sp-display); font-weight: 400; font-size: 24px; line-height: 1.15; color: var(--sp-ink); }
.sp-donations .sp-feat-card p { font-size: 13.5px; color: var(--sp-ink-2); line-height: 1.55; }
.sp-donations .sp-feat-card.tall { background: linear-gradient(160deg, var(--sp-blue) 0%, var(--sp-blue-deep) 100%); color: white; min-height: 420px; }
.sp-donations .sp-feat-card.tall .ico { background: rgba(255,255,255,0.18); color: white; }
.sp-donations .sp-feat-card.tall h3 { color: white; font-size: 30px; }
.sp-donations .sp-feat-card.tall p { color: rgba(255,255,255,0.82); }
.sp-donations .sp-feat-card.tall .receipt { margin-top: auto; background: white; color: var(--sp-ink); border-radius: 12px; padding: 14px 16px; font-size: 12px; }
.sp-donations .sp-feat-card.tall .receipt .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--sp-line); }
.sp-donations .sp-feat-card.tall .receipt .row:last-child { border-bottom: 0; padding-top: 10px; }
.sp-donations .sp-feat-card.tall .receipt .row b { font-weight: 600; }
.sp-donations .sp-feat-card.tall .receipt .row.tot b { font-family: var(--sp-display); font-size: 16px; }
.sp-donations .sp-feat-card.tall .receipt .stamp { display: inline-flex; align-items: center; gap: 6px; color: var(--sp-green); font-weight: 700; font-size: 11px; letter-spacing: 0.06em; }

/* Recurring chip mock */
.sp-donations .sp-rec-chips { display: flex; gap: 6px; padding: 8px; background: var(--sp-paper-2); border-radius: 12px; }
.sp-donations .sp-rec-chips .c { flex: 1; text-align: center; font-size: 12px; padding: 8px 0; border-radius: 8px; color: var(--sp-ink-2); font-weight: 600; }
.sp-donations .sp-rec-chips .c.on { background: var(--sp-green); color: white; box-shadow: 0 6px 14px -6px rgba(14,159,110,0.5); }

/* Year-end summary mock */
.sp-donations .sp-ye { background: var(--sp-paper-2); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
.sp-donations .sp-ye .av { width: 30px; height: 30px; border-radius: 8px; background: var(--sp-blue); color: white; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.sp-donations .sp-ye .ttl { font-size: 13px; color: var(--sp-ink); font-weight: 600; }
.sp-donations .sp-ye .sub { font-size: 11px; color: var(--sp-muted); }

/* Goal thermometer mock */
.sp-donations .sp-thermo { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; align-items: end; height: 70px; }
.sp-donations .sp-thermo .b { background: var(--sp-green); border-radius: 8px 8px 0 0; }
.sp-donations .sp-thermo .b.b1 { height: 40%; opacity: 0.55; }
.sp-donations .sp-thermo .b.b2 { height: 70%; opacity: 0.8; }
.sp-donations .sp-thermo .b.b3 { height: 100%; }

/* Donor recognition dots */
.sp-donations .sp-dots { display: flex; gap: 8px; }
.sp-donations .sp-dots .d { width: 32px; height: 32px; border-radius: 999px; display: grid; place-items: center; color: white; font-size: 11px; font-weight: 700; }
.sp-donations .sp-dots .d.b1 { background: var(--sp-accent); }
.sp-donations .sp-dots .d.b2 { background: var(--sp-blue); }
.sp-donations .sp-dots .d.b3 { background: var(--sp-green); }
.sp-donations .sp-dots .d.b4 { background: var(--sp-violet); }

/* Two-column with bullets (recurring) */
.sp-donations .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-donations .sp-bullets { list-style: none; padding: 0; margin: 24px 0 28px; display: flex; flex-direction: column; gap: 14px; }
.sp-donations .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-donations .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 2px; }
.sp-donations .sp-bullets li b { font-weight: 600; color: var(--sp-ink); margin-right: 6px; }
.sp-donations .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Dashboard mock (recurring) */
.sp-donations .sp-dash { background: #0A0F1E; color: white; border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.45); }
.sp-donations .sp-dash .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.10); }
.sp-donations .sp-dash .head .ttl { font-family: var(--sp-display); font-size: 18px; }
.sp-donations .sp-dash .head .pill { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: rgba(14,159,110,0.18); color: #4ADE80; font-weight: 700; }
.sp-donations .sp-dash .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 0; }
.sp-donations .sp-dash .stats .s { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; }
.sp-donations .sp-dash .stats .s .l { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.7; font-weight: 700; }
.sp-donations .sp-dash .stats .s .v { font-family: var(--sp-display); font-size: 30px; line-height: 1; margin-top: 6px; }
.sp-donations .sp-dash .stats .s .v.green { color: #4ADE80; }
.sp-donations .sp-dash .stats .s .sub { font-size: 11px; opacity: 0.65; margin-top: 4px; }
.sp-donations .sp-dash .rows { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
.sp-donations .sp-dash .rows .r { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 12px; }
.sp-donations .sp-dash .rows .r .av { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: white; }
.sp-donations .sp-dash .rows .r .av.a { background: var(--sp-blue); }
.sp-donations .sp-dash .rows .r .av.b { background: var(--sp-accent); }
.sp-donations .sp-dash .rows .r .av.c { background: var(--sp-green); }
.sp-donations .sp-dash .rows .r .nm { font-size: 13px; font-weight: 600; flex: 1; }
.sp-donations .sp-dash .rows .r .nm .sub { display: block; font-size: 10px; opacity: 0.6; font-weight: 500; letter-spacing: 0.04em; }
.sp-donations .sp-dash .rows .r .freq { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,0.10); font-weight: 600; letter-spacing: 0.04em; }
.sp-donations .sp-dash .rows .r .amt { font-family: var(--sp-display); font-size: 16px; }

/* Use cases (4-up) */
.sp-donations .sp-uses { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 40px; }
.sp-donations .sp-use { background: var(--sp-paper-2); border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; transition: transform .15s ease, box-shadow .2s ease; }
.sp-donations .sp-use:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -20px rgba(10,15,30,0.18); background: white; }
.sp-donations .sp-use .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px; }
.sp-donations .sp-use h3 { font-family: var(--sp-display); font-weight: 400; font-size: 22px; line-height: 1.15; color: var(--sp-ink); margin-bottom: 6px; }
.sp-donations .sp-use p { font-size: 13px; color: var(--sp-ink-2); line-height: 1.5; margin-bottom: 12px; }
.sp-donations .sp-use .ex { font-size: 11.5px; color: var(--sp-muted); border-top: 1px solid var(--sp-line); padding-top: 10px; font-style: italic; }

/* Donor wall mock */
.sp-donations .sp-wall { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 24px; box-shadow: 0 30px 60px -32px rgba(10,15,30,0.22); }
.sp-donations .sp-wall .head { text-align: center; padding-bottom: 16px; border-bottom: 1px solid var(--sp-line); margin-bottom: 16px; }
.sp-donations .sp-wall .head .ttl { font-family: var(--sp-display); font-size: 22px; }
.sp-donations .sp-wall .head .sub { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; margin-top: 4px; }
.sp-donations .sp-wall .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.sp-donations .sp-wall .cell { background: var(--sp-paper-2); border-radius: 12px; padding: 14px 8px; text-align: center; }
.sp-donations .sp-wall .cell .av { width: 36px; height: 36px; margin: 0 auto 6px; border-radius: 999px; display: grid; place-items: center; color: white; font-size: 13px; font-weight: 700; }
.sp-donations .sp-wall .cell .nm { font-size: 12px; font-weight: 600; color: var(--sp-ink); }
.sp-donations .sp-wall .cell .am { font-size: 10px; color: var(--sp-muted); margin-top: 2px; font-weight: 600; letter-spacing: 0.04em; }
.sp-donations .sp-wall .more { text-align: center; font-size: 12px; color: var(--sp-blue); font-weight: 600; margin-top: 14px; }

/* Final CTA dark band */
.sp-donations .sp-cta { background: radial-gradient(900px 320px at 50% 0%, rgba(31,95,224,0.18), transparent 60%), radial-gradient(700px 240px at 100% 100%, rgba(14,159,110,0.14), transparent 60%), #0A0F1E; color: white; padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
.sp-donations .sp-cta .inner { position: relative; max-width: 760px; margin: 0 auto; padding: 0 32px; }
.sp-donations .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.01em; margin: 18px 0 16px; }
.sp-donations .sp-cta h2 .accent { font-style: italic; color: #4ADE80; }
.sp-donations .sp-cta p { font-size: 15.5px; opacity: 0.85; max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-donations .sp-cta .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-donations .sp-section { padding: 64px 0; }
  .sp-donations .sp-hero { padding: 56px 0; }
  .sp-donations .sp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .sp-donations .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-donations .sp-feat-grid { grid-template-columns: 1fr; }
  .sp-donations .sp-feat-card.tall { min-height: 0; }
  .sp-donations .sp-uses { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .sp-donations .sp-wrap { padding: 0 20px; }
  .sp-donations .sp-feat-grid .right { grid-template-columns: 1fr; }
  .sp-donations .sp-uses { grid-template-columns: 1fr; }
  .sp-donations .sp-wall .grid { grid-template-columns: 1fr 1fr; }
}
`;

/* Inline icons */
const ICheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IPlay = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const IReceipt = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>);
const IRefresh = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>);
const IMail = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const ITarget = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IUsers = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const ICal = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IBuilding = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/></svg>);
const IZap = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IHeart = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);

const useCases = [
  { Icon: ICal, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)", title: "Annual funds", copy: "Yearly drives that compound year over year.", ex: "e.g. 'Annual Fund 2026' — $50K goal" },
  { Icon: ITarget, color: "#0E9F6E", bg: "rgba(14,159,110,0.10)", title: "Capital campaigns", copy: "Big-ticket goals like new fields, building, or equipment.", ex: "e.g. 'New Turf Field' — $250K · 18mo" },
  { Icon: IZap, color: "#FF6B35", bg: "rgba(255,107,53,0.10)", title: "Emergency appeals", copy: "Stand up an urgent ask in minutes — share, raise, close.", ex: "e.g. 'Storm Recovery' — $25K · 14 days" },
  { Icon: IRefresh, color: "#7B5BE0", bg: "rgba(123,91,224,0.10)", title: "Monthly giving", copy: "Sustainer programs that keep funding predictable.", ex: "e.g. '$25/mo Champions' — 200 donors" },
];

const donors = [
  { initials: "AS", name: "Alex S.", amt: "$500", color: "#FF6B35" },
  { initials: "TC", name: "The Chens", amt: "$250", color: "#1F5FE0" },
  { initials: "?", name: "Anonymous", amt: "$100", color: "#6B7489" },
  { initials: "MK", name: "Mike K.", amt: "$1,000", color: "#E04F8B" },
  { initials: "JF", name: "Johnson Fam.", amt: "$75", color: "#7B5BE0" },
  { initials: "JL", name: "Jen L.", amt: "$50", color: "#0E9F6E" },
];

const DonationCampaigns = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers/donations" });

  return (
    <>
      <SeoHead
        title="Donation Fundraisers — One-Time & Recurring Giving | Sponsorly"
        description="Accept one-time or recurring donations with automatic tax receipts, donor recognition, and goal tracking. Build sustainable funding — and keep all of it."
        path="/fundraisers/donations"
      />
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="sp-donations min-h-screen">
        <MarketingHeader />

        {/* HERO */}
        <section className="sp-hero">
          <div className="sp-wrap">
            <div className="sp-hero-grid">
              <div>
                <span className="sp-eyebrow">
                  <IHeart /> Donation fundraisers
                </span>
                <h1>
                  Make giving easy.<br />
                  Keep <span className="accent">all of it.</span>
                </h1>
                <p className="sub">
                  Accept one-time or recurring donations from individuals and businesses. Auto tax receipts, donor recognition, and goal tracking — so sustainable funding is just a link away.
                </p>
                <div className="sp-hero-ctas">
                  <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                    Launch your fundraiser <IArrow />
                  </Link>
                  <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                    <IPlay /> See a demo
                  </Link>
                </div>
                <div className="sp-hero-checks">
                  <span className="it"><span className="ck"><ICheck /></span> One-time + recurring</span>
                  <span className="it"><span className="ck"><ICheck /></span> Auto tax receipts</span>
                  <span className="it"><span className="ck"><ICheck /></span> Same-day payouts</span>
                </div>
              </div>

              <div className="sp-donate-card" aria-hidden="true">
                <div className="top">
                  <div>
                    <div className="meta">Centerville School Boosters</div>
                    <h4>Support our Annual Fund</h4>
                    <div className="sub">Ends Mar 31 — Goal $50,000</div>
                  </div>
                  <div className="pill"><span className="dot" /> $250 from Liz Chen</div>
                </div>
                <div className="raised">
                  <div>
                    <div className="v">$32,450</div>
                    <div className="l">raised so far</div>
                  </div>
                  <div className="pct">65%</div>
                </div>
                <div className="progress"><i /></div>
                <div className="pmeta">
                  <span><b style={{ color: "var(--sp-ink)" }}>284</b> donors</span>
                  <span><b style={{ color: "var(--sp-ink)" }}>$114</b> avg. gift</span>
                  <span>14 days left</span>
                </div>
                <div className="label">Make a gift</div>
                <div className="amts">
                  <div className="a">$25</div>
                  <div className="a">$50</div>
                  <div className="a on">$100</div>
                  <div className="a">$250</div>
                </div>
                <div className="donor">
                  <span className="av">LC</span>
                  <div>
                    <div className="nm">Liz Chen — recurring</div>
                    <div className="ti">Just now</div>
                  </div>
                  <span className="anon">+ 1 to the impact, anon.</span>
                </div>
                <a href="#" className="cta" onClick={(e) => e.preventDefault()}>
                  Donate $100 now
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES — Everything you need */}
        <section className="sp-section white">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow sp-eyebrow-blue">Built for fundraising</span>
            <h2 className="sp-display-h2">
              Everything you need for<br />
              <span className="accent-blue">successful</span> giving.
            </h2>
            <p className="sp-lead">
              The features that make donating easy and keep donors coming back — every one tuned for schools, teams, and PTOs.
            </p>

            <div className="sp-feat-grid" style={{ textAlign: "left" }}>
              <div className="sp-feat-card tall">
                <div className="ico"><IReceipt /></div>
                <h3>Automatic tax receipts. No paperwork.</h3>
                <p>Every gift triggers an IRS-compliant receipt — emailed in seconds with your 501(c)(3) info, donor info, deductibility, and a year-end summary at the end of the season.</p>
                <div className="receipt">
                  <div className="row"><span>Donation — Annual Fund</span><b>$100.00</b></div>
                  <div className="row"><span>Date</span><b>Apr 25, 2026</b></div>
                  <div className="row"><span>Receipt #</span><b>SP-08294</b></div>
                  <div className="row tot"><span>Tax-deductible</span><b>$100.00</b></div>
                  <div className="row"><span className="stamp"><ICheck /> IRS-ready</span><b style={{ color: "var(--sp-muted)", fontWeight: 500 }}>EIN 12-3456789</b></div>
                </div>
              </div>

              <div className="right">
                <div className="sp-feat-card">
                  <div className="ico" style={{ background: "rgba(14,159,110,0.10)", color: "var(--sp-green)" }}><IRefresh /></div>
                  <h3>Recurring giving</h3>
                  <p>Monthly, quarterly, or annual — donors pick their cadence, you stop chasing renewals.</p>
                  <div className="sp-rec-chips">
                    <div className="c">Monthly</div>
                    <div className="c on">Quarterly</div>
                    <div className="c">Annual</div>
                  </div>
                </div>

                <div className="sp-feat-card">
                  <div className="ico" style={{ background: "rgba(255,107,53,0.10)", color: "var(--sp-accent)" }}><IMail /></div>
                  <h3>Year-end summaries</h3>
                  <p>One-click consolidated PDFs sent to every donor in January.</p>
                  <div className="sp-ye">
                    <span className="av"><IMail /></span>
                    <div>
                      <div className="ttl">2025 tax summary</div>
                      <div className="sub">284 receipts · $32,450 total</div>
                    </div>
                  </div>
                </div>

                <div className="sp-feat-card">
                  <div className="ico" style={{ background: "rgba(14,159,110,0.10)", color: "var(--sp-green)" }}><ITarget /></div>
                  <h3>Goal thermometers</h3>
                  <p>Live progress bars that thank donors and rally everyone else.</p>
                  <div className="sp-thermo">
                    <div className="b b1" /><div className="b b2" /><div className="b b3" />
                  </div>
                </div>

                <div className="sp-feat-card">
                  <div className="ico" style={{ background: "rgba(123,91,224,0.10)", color: "var(--sp-violet)" }}><IUsers /></div>
                  <h3>Donor recognition</h3>
                  <p>A public donor wall on your campaign — anonymous-respecting.</p>
                  <div className="sp-dots">
                    <span className="d b1">AS</span>
                    <span className="d b2">TC</span>
                    <span className="d b3">MK</span>
                    <span className="d b4">JL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECURRING — sustainable funding */}
        <section className="sp-section alt">
          <div className="sp-wrap">
            <div className="sp-two">
              <div>
                <span className="sp-eyebrow">Sustainable funding</span>
                <h2 className="sp-display-h2">
                  Build <span className="accent-green">predictable</span><br /> recurring giving.
                </h2>
                <p className="sp-lead">
                  Recurring donors give 42% more annually than one-time donors. Convert your supporters into monthly champions with the tools other platforms charge extra for.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span><b>Push recurring opt-in at checkout</b> — negotiable defaults boost conversion.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Card-update emails</b> keep failed charges automated.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Smart reminders</b> ping lapsed donors at the right moment.</span></li>
                  <li><span className="dot"><ICheck /></span><span><b>Cohort analytics</b> show MRR, churn, and LTV per fundraiser.</span></li>
                </ul>
                <Link to="/signup" className="sp-btn sp-btn-primary">
                  Start your recurring program <IArrow />
                </Link>
              </div>

              <div className="sp-dash" aria-hidden="true">
                <div className="head">
                  <div className="ttl">Monthly Giving Dashboard</div>
                  <div className="pill">+12% mo/mo</div>
                </div>
                <div className="stats">
                  <div className="s">
                    <div className="l">MRR</div>
                    <div className="v green">$3,250</div>
                    <div className="sub">+$420 this month</div>
                  </div>
                  <div className="s">
                    <div className="l">Active subscribers</div>
                    <div className="v">47</div>
                    <div className="sub">+6 new this month</div>
                  </div>
                </div>
                <div className="rows">
                  <div className="r">
                    <span className="av a">CF</span>
                    <div className="nm">Chen family<span className="sub">Monthly · 11 mo</span></div>
                    <span className="freq">Monthly</span>
                    <span className="amt">$50</span>
                  </div>
                  <div className="r">
                    <span className="av b">GG</span>
                    <div className="nm">Garcia family<span className="sub">Quarterly · 4 q</span></div>
                    <span className="freq">Quarterly</span>
                    <span className="amt">$120</span>
                  </div>
                  <div className="r">
                    <span className="av c">JK</span>
                    <div className="nm">Jordan Kim<span className="sub">Annual · year 2</span></div>
                    <span className="freq">Annual</span>
                    <span className="amt">$500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="sp-section white">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow sp-eyebrow-blue">Perfect for</span>
            <h2 className="sp-display-h2">
              Donations that fit any kind of<br />campaign.
            </h2>
            <p className="sp-lead">
              One platform, every flavor of giving — pick the one that matches your goal.
            </p>

            <div className="sp-uses" style={{ textAlign: "left" }}>
              {useCases.map((u, i) => (
                <div className="sp-use" key={i}>
                  <div className="ico" style={{ background: u.bg, color: u.color }}><u.Icon /></div>
                  <h3>{u.title}</h3>
                  <p>{u.copy}</p>
                  <div className="ex">{u.ex}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RECOGNITION */}
        <section className="sp-section alt">
          <div className="sp-wrap">
            <div className="sp-two">
              <div>
                <span className="sp-eyebrow sp-eyebrow-accent">Recognition</span>
                <h2 className="sp-display-h2">
                  Celebrate your <span className="accent-accent">donors</span><br /> publicly.
                </h2>
                <p className="sp-lead">
                  Recognize your supporters with beautiful donor walls displayed on your fundraiser page. Three tiers of recognition, fully respectful of donor privacy.
                </p>
                <ul className="sp-bullets">
                  <li><span className="dot"><ICheck /></span><span>Automatic name listing</span></li>
                  <li><span className="dot"><ICheck /></span><span>Tiered recognition levels</span></li>
                  <li><span className="dot"><ICheck /></span><span>Anonymous option always honored</span></li>
                  <li><span className="dot"><ICheck /></span><span>Real-time updates as donations come in</span></li>
                </ul>
              </div>

              <div className="sp-wall" aria-hidden="true">
                <div className="head">
                  <div className="ttl">Our amazing donors</div>
                  <div className="sub">Annual Fund · 284 supporters</div>
                </div>
                <div className="grid">
                  {donors.map((d, i) => (
                    <div className="cell" key={i}>
                      <div className="av" style={{ background: d.color }}>{d.initials}</div>
                      <div className="nm">{d.name}</div>
                      <div className="am">{d.amt}</div>
                    </div>
                  ))}
                </div>
                <div className="more">+ 275 more supporters</div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="sp-cta">
          <div className="inner">
            <span className="sp-eyebrow sp-eyebrow-light">Get started</span>
            <h2>
              Ready to launch your<br />
              <span className="accent">donation campaign?</span>
            </h2>
            <p>
              Start accepting donations in minutes. No setup fees, no monthly costs — just the tools you need to succeed.
            </p>
            <div className="ctas">
              <Link to="/signup" className="sp-btn sp-btn-white sp-btn-lg">
                Get started free <IArrow />
              </Link>
              <Link to="/fundraisers" className="sp-btn sp-btn-outline-white sp-btn-lg">
                Explore all fundraiser types
              </Link>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
};

export default DonationCampaigns;