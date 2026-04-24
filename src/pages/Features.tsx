import { useState } from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

/**
 * Sponsorly Features — rebuilt to match the approved 2026 mockup.
 * Fully scoped under .sp-features so the rest of the app's design
 * system is untouched. Mirrors typography + tokens from
 * src/pages/Index.tsx and src/pages/Pricing.tsx.
 */

const SCOPED_CSS = `
.sp-features {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-accent: #FF6B35;
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
.sp-features .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-features .sp-italic { font-style: italic; }
.sp-features .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(31,95,224,0.08); color: var(--sp-blue); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-features .sp-eyebrow-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-features .sp-eyebrow-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-features .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-features .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-features .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-features .sp-btn:hover { transform: translateY(-1px); }
.sp-features .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-features .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-features .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-features .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-features .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-features .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-features .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-features .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-features .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* HERO */
.sp-features .sp-hero { position: relative; padding: 72px 0 48px; overflow: hidden; background:
  radial-gradient(900px 480px at 80% -10%, rgba(31,95,224,0.10), transparent 60%),
  radial-gradient(700px 360px at 5% 0%, rgba(14,159,110,0.08), transparent 60%),
  var(--sp-paper); }
.sp-features .sp-hero-inner { text-align: center; max-width: 880px; margin: 0 auto; }
.sp-features .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(46px, 6vw, 80px); line-height: 1.05; letter-spacing: -0.02em; margin: 22px 0 22px; color: var(--sp-ink); }
.sp-features .sp-hero h1 .accent { color: var(--sp-blue); font-style: italic; }
.sp-features .sp-hero p.sub { font-size: 17px; color: var(--sp-ink-2); max-width: 620px; margin: 0 auto 32px; line-height: 1.55; }
.sp-features .sp-anchor-nav { display: inline-flex; gap: 6px; padding: 6px; background: white; border: 1px solid var(--sp-line); border-radius: 999px; flex-wrap: wrap; justify-content: center; }
.sp-features .sp-anchor-nav a { padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--sp-ink-2); transition: background .15s ease, color .15s ease; }
.sp-features .sp-anchor-nav a:hover { background: var(--sp-paper-2); color: var(--sp-ink); }

/* GENERAL SECTION */
.sp-features .sp-section { padding: 96px 0; }
.sp-features .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-features .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-features .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-features .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-features .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-features .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-features .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 540px; }

/* PAYOUTS */
.sp-features .sp-two { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: start; }
.sp-features .sp-payout-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 24px 48px -28px rgba(10,15,30,0.20); }
.sp-features .sp-payout-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-features .sp-payout-head .id { font-size: 12px; color: var(--sp-muted); font-weight: 600; }
.sp-features .sp-payout-head .badge { font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); font-weight: 700; letter-spacing: 0.05em; }
.sp-features .sp-payout-amount { font-family: var(--sp-display); font-size: 48px; line-height: 1.1; color: var(--sp-ink); padding: 16px 0 6px; }
.sp-features .sp-payout-meta { font-size: 12px; color: var(--sp-muted); padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-features .sp-payout-rows { padding: 14px 0; }
.sp-features .sp-payout-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.sp-features .sp-payout-row .check { width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; flex: 0 0 22px; }
.sp-features .sp-payout-row .text { flex: 1; font-size: 13px; color: var(--sp-ink); }
.sp-features .sp-payout-row .when { font-size: 11px; color: var(--sp-muted); }
.sp-features .sp-payout-foot { padding-top: 12px; border-top: 1px solid var(--sp-line); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--sp-muted); }

.sp-features .sp-bullets { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; }
.sp-features .sp-bullet { display: flex; gap: 12px; align-items: flex-start; }
.sp-features .sp-bullet .check { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(31,95,224,0.10); color: var(--sp-blue); display: grid; place-items: center; margin-top: 1px; }
.sp-features .sp-bullet .body { font-size: 13.5px; color: var(--sp-ink-2); line-height: 1.5; }
.sp-features .sp-bullet .body strong { color: var(--sp-ink); font-weight: 600; }
.sp-features .sp-side-h { font-size: 17px; font-weight: 600; color: var(--sp-ink); margin-bottom: 8px; }
.sp-features .sp-side-p { font-size: 14px; color: var(--sp-muted); line-height: 1.6; }

.sp-features .sp-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }
.sp-features .sp-mini-card { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 18px; }
.sp-features .sp-mini-card .icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(31,95,224,0.10); color: var(--sp-blue); display: grid; place-items: center; margin-bottom: 10px; }
.sp-features .sp-mini-card h5 { font-size: 14px; font-weight: 600; margin: 0 0 4px; color: var(--sp-ink); }
.sp-features .sp-mini-card p { font-size: 12.5px; color: var(--sp-muted); margin: 0; line-height: 1.5; }

.sp-features .sp-strip { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; padding: 18px 24px; background: white; border: 1px solid var(--sp-line); border-radius: 14px; margin-top: 16px; }
.sp-features .sp-strip-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--sp-muted); font-weight: 500; }
.sp-features .sp-strip-item svg { color: var(--sp-blue); }

/* CAMPAIGNS / EMAIL */
.sp-features .sp-toggle-wrap { display: flex; justify-content: center; margin: 28px 0 24px; }
.sp-features .sp-toggle { display: inline-flex; padding: 4px; border-radius: 999px; background: var(--sp-paper-2); border: 1px solid var(--sp-line); }
.sp-features .sp-toggle button { padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--sp-ink-2); background: transparent; transition: all .2s ease; display: inline-flex; align-items: center; gap: 8px; }
.sp-features .sp-toggle button.active { background: var(--sp-ink); color: white; box-shadow: 0 4px 12px -4px rgba(10,15,30,0.25); }
.sp-features .sp-toggle .badge { font-size: 10px; padding: 2px 6px; border-radius: 999px; background: rgba(14,159,110,0.18); color: var(--sp-green); letter-spacing: 0.04em; }

.sp-features .sp-seq-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.sp-features .sp-seq-card { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 18px 20px; box-shadow: 0 16px 36px -22px rgba(10,15,30,0.18); }
.sp-features .sp-seq-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--sp-line); margin-bottom: 12px; }
.sp-features .sp-seq-head h5 { font-size: 14px; font-weight: 600; color: var(--sp-ink); margin: 0; }
.sp-features .sp-seq-head .pill { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); font-weight: 700; letter-spacing: 0.05em; }
.sp-features .sp-seq-step { display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; }
.sp-features .sp-seq-step .num { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 6px; background: rgba(31,95,224,0.10); color: var(--sp-blue); display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.sp-features .sp-seq-step .body { flex: 1; font-size: 12.5px; }
.sp-features .sp-seq-step .body .t { font-weight: 600; color: var(--sp-ink); }
.sp-features .sp-seq-step .body .d { color: var(--sp-muted); margin-top: 1px; font-size: 11.5px; }

.sp-features .sp-mail-meta { font-size: 11px; color: var(--sp-muted); margin-bottom: 6px; }
.sp-features .sp-mail-from { font-size: 12.5px; color: var(--sp-ink-2); margin-bottom: 8px; }
.sp-features .sp-mail-subject { font-size: 14px; font-weight: 600; color: var(--sp-ink); margin-bottom: 10px; }
.sp-features .sp-mail-body { font-size: 12.5px; color: var(--sp-ink-2); line-height: 1.55; margin-bottom: 12px; }
.sp-features .sp-mail-cta { display: inline-flex; padding: 8px 14px; border-radius: 8px; background: var(--sp-blue); color: white; font-size: 12px; font-weight: 600; }
.sp-features .sp-mail-divider { height: 1px; background: var(--sp-line); margin: 14px 0; }
.sp-features .sp-mail-tags { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10.5px; }
.sp-features .sp-mail-tags span { padding: 3px 7px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-muted); font-weight: 600; }

.sp-features .sp-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--sp-line); }
.sp-features .sp-kpi { }
.sp-features .sp-kpi .num { font-family: var(--sp-display); font-size: 44px; line-height: 1; color: var(--sp-blue); font-style: italic; }
.sp-features .sp-kpi .lbl { font-size: 12px; color: var(--sp-muted); margin-top: 6px; line-height: 1.4; max-width: 200px; }

/* CRM */
.sp-features .sp-crm-rows { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }
.sp-features .sp-crm-row { display: flex; gap: 14px; padding: 14px; border-radius: 12px; background: white; border: 1px solid var(--sp-line); transition: border-color .15s, box-shadow .15s; }
.sp-features .sp-crm-row.active { border-color: rgba(255,107,53,0.40); box-shadow: 0 12px 24px -16px rgba(255,107,53,0.22); }
.sp-features .sp-crm-row .icon { flex: 0 0 32px; width: 32px; height: 32px; border-radius: 8px; background: rgba(255,107,53,0.10); color: var(--sp-accent); display: grid; place-items: center; }
.sp-features .sp-crm-row h5 { font-size: 14px; font-weight: 600; margin: 0 0 2px; color: var(--sp-ink); }
.sp-features .sp-crm-row p { font-size: 12.5px; color: var(--sp-muted); margin: 0; line-height: 1.5; }

.sp-features .sp-db-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; box-shadow: 0 24px 48px -28px rgba(10,15,30,0.20); overflow: hidden; }
.sp-features .sp-db-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--sp-line); }
.sp-features .sp-db-head h5 { font-size: 14px; font-weight: 600; margin: 0; color: var(--sp-ink); }
.sp-features .sp-db-head .pill { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); font-weight: 700; letter-spacing: 0.05em; }
.sp-features .sp-db-row { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--sp-line); }
.sp-features .sp-db-row:last-child { border-bottom: none; }
.sp-features .sp-db-avatar { width: 32px; height: 32px; border-radius: 999px; display: grid; place-items: center; color: white; font-size: 12px; font-weight: 700; flex: 0 0 32px; }
.sp-features .sp-db-row .info { flex: 1; min-width: 0; }
.sp-features .sp-db-row .info .n { font-size: 13px; font-weight: 600; color: var(--sp-ink); }
.sp-features .sp-db-row .info .e { font-size: 11.5px; color: var(--sp-muted); }
.sp-features .sp-db-row .total { font-size: 13px; font-weight: 600; color: var(--sp-ink); font-variant-numeric: tabular-nums; }
.sp-features .sp-db-row .tag { font-size: 10px; padding: 3px 7px; border-radius: 999px; font-weight: 700; letter-spacing: 0.04em; }
.sp-features .sp-db-row .tag.gold { background: rgba(255,107,53,0.12); color: var(--sp-accent); }
.sp-features .sp-db-row .tag.silver { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-features .sp-db-row .tag.new { background: rgba(14,159,110,0.12); color: var(--sp-green); }

.sp-features .sp-db-foot { padding: 16px 20px; background: var(--sp-paper-2); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--sp-muted); }

.sp-features .sp-mini-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.sp-features .sp-mini-stat { background: white; border: 1px solid var(--sp-line); border-radius: 12px; padding: 16px; }
.sp-features .sp-mini-stat .lbl { font-size: 11px; color: var(--sp-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.sp-features .sp-mini-stat .num { font-family: var(--sp-display); font-size: 32px; color: var(--sp-ink); margin-top: 6px; }
.sp-features .sp-mini-stat .delta { font-size: 11px; color: var(--sp-green); font-weight: 600; margin-top: 2px; }
.sp-features .sp-mini-stat.alt .num { color: var(--sp-accent); }
.sp-features .sp-mini-stat.alt .delta { color: var(--sp-accent); }

/* AUTOMATION GRID */
.sp-features .sp-auto-head { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: end; margin-bottom: 36px; }
.sp-features .sp-auto-head .note { font-size: 14px; color: var(--sp-muted); line-height: 1.55; max-width: 380px; justify-self: end; }
.sp-features .sp-auto-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.sp-features .sp-auto-card { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; transition: transform .2s ease, box-shadow .2s ease; }
.sp-features .sp-auto-card:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -16px rgba(10,15,30,0.12); }
.sp-features .sp-auto-card.active { border-color: rgba(31,95,224,0.45); box-shadow: 0 16px 32px -18px rgba(31,95,224,0.25); }
.sp-features .sp-auto-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px; }
.sp-features .sp-auto-icon.blue { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-features .sp-auto-icon.green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-features .sp-auto-icon.accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-features .sp-auto-card h5 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: var(--sp-ink); }
.sp-features .sp-auto-card p { font-size: 13px; color: var(--sp-muted); margin: 0; line-height: 1.5; }

/* CTA */
.sp-features .sp-cta { padding: 96px 0 84px; background: linear-gradient(135deg, var(--sp-blue) 0%, var(--sp-blue-deep) 100%); color: white; text-align: center; position: relative; overflow: hidden; }
.sp-features .sp-cta::before { content: ""; position: absolute; inset: 0; background: radial-gradient(800px 400px at 50% -20%, rgba(255,255,255,0.18), transparent 60%); pointer-events: none; }
.sp-features .sp-cta-inner { position: relative; max-width: 720px; margin: 0 auto; padding: 0 32px; }
.sp-features .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(38px, 5vw, 64px); line-height: 1.05; margin: 18px 0 16px; font-weight: 400; }
.sp-features .sp-cta h2 .accent { font-style: italic; color: rgba(255,255,255,0.92); }
.sp-features .sp-cta p.sub { font-size: 16px; color: rgba(255,255,255,0.82); margin-bottom: 28px; }
.sp-features .sp-cta .actions { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Mobile */
@media (max-width: 900px) {
  .sp-features .sp-section { padding: 64px 0; }
  .sp-features .sp-two { grid-template-columns: 1fr; gap: 32px; }
  .sp-features .sp-mini-grid { grid-template-columns: 1fr; }
  .sp-features .sp-seq-cards { grid-template-columns: 1fr; }
  .sp-features .sp-kpi-row { grid-template-columns: 1fr 1fr; gap: 20px; }
  .sp-features .sp-auto-head { grid-template-columns: 1fr; align-items: start; }
  .sp-features .sp-auto-head .note { justify-self: start; }
  .sp-features .sp-auto-grid { grid-template-columns: 1fr; }
}
`;

const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Bolt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
);

const Bank = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </svg>
);

const Mail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" />
  </svg>
);

const Users = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Repeat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const Tag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const Doc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

const Heart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const Globe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Plug = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5" />
  </svg>
);

const Upload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const Chart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const Sparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l1.9 5.5L19 10l-5.1 1.5L12 17l-1.9-5.5L5 10l5.1-1.5L12 3zM19 17l.9 2.5L22 20l-2.1.5L19 23l-.9-2.5L16 20l2.1-.5L19 17z" />
  </svg>
);

const supporters = [
  { initials: "JR", name: "Jamie Rodriguez", email: "jamie.rodriguez@email.com", total: "$1,240", tag: "gold", tagText: "GOLD", color: "#1F5FE0" },
  { initials: "SK", name: "Sarah Kim", email: "sarah.kim@email.com", total: "$875", tag: "gold", tagText: "GOLD", color: "#0E9F6E" },
  { initials: "MT", name: "Marcus Tanner", email: "marcus.t@email.com", total: "$640", tag: "silver", tagText: "SILVER", color: "#FF6B35" },
  { initials: "LW", name: "Lena Walsh", email: "lena.walsh@email.com", total: "$520", tag: "silver", tagText: "SILVER", color: "#8B5CF6" },
  { initials: "AP", name: "Aaron Park", email: "aaron.park@email.com", total: "$310", tag: "new", tagText: "NEW", color: "#1F5FE0" },
  { initials: "FB", name: "Fiona Brooks", email: "fiona.b@email.com", total: "$180", tag: "new", tagText: "NEW", color: "#F59E0B" },
];

const automationCards = [
  { icon: "blue", Icon: Doc, title: "Automated tax receipts", desc: "IRS-compliant receipts the moment a donation clears. No spreadsheets, no chasing." },
  { icon: "accent", Icon: Heart, title: "Matching gift engine", desc: "Show donors when their employer doubles the gift — and submit the request from the dashboard." },
  { icon: "green", Icon: Chart, title: "Live event dashboards", desc: "Project a real-time leaderboard at your gala or game. Updates the moment a gift comes in." },
  { icon: "accent", Icon: Sparkles, title: "Fundraiser assistant", desc: "AI-drafted emails, pages, and social posts written in your school's voice. You hit send." },
  { icon: "green", Icon: Globe, title: "Bilingual landing pages", desc: "One-click translation for English/Spanish supporter pages. Reach every parent." },
  { icon: "blue", Icon: Lock, title: "Role-based permissions", desc: "Principals, ADs, coaches, and parent leaders each see exactly what they need — nothing more." },
  { icon: "accent", Icon: Plug, title: "Built-in integrations", desc: "Stripe, Zapier, Google, Slack, calendar — connect once, sync everywhere." },
  { icon: "blue", Icon: Tag, title: "Custom labels & tags", desc: "Tag donors by season, sport, alumni year, or anything else. Filter and segment in one click.", active: true },
  { icon: "green", Icon: Upload, title: "Bulk import & export", desc: "Bring rosters and donors over from your old platform. Export anything, anytime." },
];

const Features = () => {
  const [seqMode, setSeqMode] = useState<"email" | "sms" | "web">("email");

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <div className="sp-features">
          <style>{SCOPED_CSS}</style>

          {/* HERO */}
          <section className="sp-hero">
            <div className="sp-wrap">
              <div className="sp-hero-inner">
                <span className="sp-eyebrow">Features</span>
                <h1>
                  Everything built for the way <span className="accent">teams actually raise.</span>
                </h1>
                <p className="sub">
                  Built on top of Stripe. Automated email + SMS outreach. A donor CRM that turns over with your roster every season.
                </p>
                <nav className="sp-anchor-nav" aria-label="Page sections">
                  <a href="#payouts">Payouts</a>
                  <a href="#outreach">Email/SMS outreach</a>
                  <a href="#crm">Donor CRM</a>
                  <a href="#automation">Automation</a>
                </nav>
              </div>
            </div>
          </section>

          {/* PAYOUTS */}
          <section id="payouts" className="sp-section">
            <div className="sp-wrap">
              <div className="sp-two">
                <div>
                  <span className="sp-eyebrow">Powered by Stripe</span>
                  <h2 className="sp-display-h2">
                    Money in your bank — <span className="accent-blue">as fast as tomorrow.</span>
                  </h2>
                  <p className="sp-lead" style={{ marginBottom: 24 }}>
                    Sponsorly is built on Stripe — the same payments backbone trusted by millions of businesses. When a supporter donates, the funds move directly from the donor's card to your school's connected bank account. Most settlements take a single business day.
                  </p>
                  <div className="sp-payout-card">
                    <div className="sp-payout-head">
                      <span className="id">Payout #4624</span>
                      <span className="badge">SETTLED</span>
                    </div>
                    <div className="sp-payout-amount">$12,450.00</div>
                    <div className="sp-payout-meta">Arriving in account ending in •••4127 — tomorrow morning</div>
                    <div className="sp-payout-rows">
                      <div className="sp-payout-row">
                        <span className="check"><Check /></span>
                        <span className="text">Booster Cards from 92 supporters</span>
                        <span className="when">2 hours ago</span>
                      </div>
                      <div className="sp-payout-row">
                        <span className="check"><Check /></span>
                        <span className="text">Annual fund recurring gifts</span>
                        <span className="when">today, 11:42 am</span>
                      </div>
                      <div className="sp-payout-row">
                        <span className="check"><Check /></span>
                        <span className="text">Banquet ticket sales batched</span>
                        <span className="when">today, 9:08 am</span>
                      </div>
                    </div>
                    <div className="sp-payout-foot">
                      <span>Powered by Stripe Connect</span>
                      <span>Next-day payout</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="sp-side-h">Your Stripe account. Your bank. Your money.</h3>
                  <p className="sp-side-p">
                    We never touch your funds. You connect a Stripe account in about 5 minutes, and your organization is the legal recipient of every dollar — there's no holding period, no escrow, no surprise delays.
                  </p>
                  <div className="sp-bullets">
                    <div className="sp-bullet">
                      <span className="check"><Check /></span>
                      <div className="body"><strong>Express onboarding</strong> — verified in ~5 min by school admins, no Stripe dashboard required.</div>
                    </div>
                    <div className="sp-bullet">
                      <span className="check"><Check /></span>
                      <div className="body"><strong>Next-day payouts by default</strong> — adjustable to weekly or monthly batches.</div>
                    </div>
                    <div className="sp-bullet">
                      <span className="check"><Check /></span>
                      <div className="body"><strong>ACH transfers from connected accounts</strong> — with deposit details masked at signin.</div>
                    </div>
                    <div className="sp-bullet">
                      <span className="check"><Check /></span>
                      <div className="body"><strong>Per-campaign account routing</strong> — split team and booster funds at source.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sp-mini-grid">
                <div className="sp-mini-card">
                  <div className="icon"><Bank /></div>
                  <h5>Bank statements</h5>
                  <p>Match every Sponsorly payout to a line on your bank statement. No reconciliation guesswork.</p>
                </div>
                <div className="sp-mini-card">
                  <div className="icon"><Doc /></div>
                  <h5>Payout/cash review</h5>
                  <p>Treasurers see every gift, fee, and deposit before the funds move — with full export.</p>
                </div>
                <div className="sp-mini-card">
                  <div className="icon"><Check /></div>
                  <h5>Receipt agreements</h5>
                  <p>Connected-account terms are accepted in-app, so your district has the paper trail it needs.</p>
                </div>
              </div>

              <div className="sp-strip">
                <div className="sp-strip-item"><Bolt /> Stripe Connect Express</div>
                <div className="sp-strip-item"><Check /> Express onboarding</div>
                <div className="sp-strip-item"><Bolt /> ~5 min setup</div>
                <div className="sp-strip-item"><Check /> 100% US banks supported</div>
              </div>
            </div>
          </section>

          {/* OUTREACH */}
          <section id="outreach" className="sp-section alt">
            <div className="sp-wrap">
              <div style={{ maxWidth: 720 }}>
                <span className="sp-eyebrow">Email + SMS outreach</span>
                <h2 className="sp-display-h2">
                  Campaigns that <span className="accent-blue">follow up so you don't have to.</span>
                </h2>
                <p className="sp-lead">
                  We built email and SMS sequences into the platform — automatic. Multi-step trigger and CTA sequences let you queue a goal, draft your message in seconds, and let supporters take it from here.
                </p>
              </div>

              <div className="sp-toggle-wrap">
                <div className="sp-toggle" role="tablist" aria-label="Outreach mode">
                  <button role="tab" aria-selected={seqMode === "email"} className={seqMode === "email" ? "active" : ""} onClick={() => setSeqMode("email")}>
                    Email sequences <span className="badge">DEFAULT</span>
                  </button>
                  <button role="tab" aria-selected={seqMode === "sms"} className={seqMode === "sms" ? "active" : ""} onClick={() => setSeqMode("sms")}>
                    SMS reminders
                  </button>
                  <button role="tab" aria-selected={seqMode === "web"} className={seqMode === "web" ? "active" : ""} onClick={() => setSeqMode("web")}>
                    Web forms
                  </button>
                </div>
              </div>

              <div className="sp-seq-cards">
                <div className="sp-seq-card">
                  <div className="sp-seq-head">
                    <h5>New donor welcome series</h5>
                    <span className="pill">5 STEPS · ACTIVE</span>
                  </div>
                  <div className="sp-seq-step">
                    <span className="num">1</span>
                    <div className="body">
                      <div className="t">Trigger</div>
                      <div className="d">First-time gift on any campaign</div>
                    </div>
                  </div>
                  <div className="sp-seq-step">
                    <span className="num">2</span>
                    <div className="body">
                      <div className="t">Welcome email — Day 0</div>
                      <div className="d">"Thank you" + tax receipt + roster member video</div>
                    </div>
                  </div>
                  <div className="sp-seq-step">
                    <span className="num">3</span>
                    <div className="body">
                      <div className="t">SMS — Day 3</div>
                      <div className="d">Optional thank-you text to mobile</div>
                    </div>
                  </div>
                  <div className="sp-seq-step">
                    <span className="num">4</span>
                    <div className="body">
                      <div className="t">Goal update email — Day 7</div>
                      <div className="d">"Here's what your gift unlocked" with progress bar</div>
                    </div>
                  </div>
                  <div className="sp-seq-step">
                    <span className="num">5</span>
                    <div className="body">
                      <div className="t">Wrap email — final day</div>
                      <div className="d">Recap + invite to follow next campaign</div>
                    </div>
                  </div>
                </div>

                <div className="sp-seq-card">
                  <div className="sp-seq-head">
                    <h5>Sample message preview</h5>
                    <span className="pill">EMAIL · DRAFT</span>
                  </div>
                  <div className="sp-mail-meta">From: Madison Booster Club &lt;hello@madisonboosters.org&gt;</div>
                  <div className="sp-mail-from">To: Sarah Kim · sarah.kim@email.com</div>
                  <div className="sp-mail-subject">Your gift unlocked the team van fund 🚐</div>
                  <div className="sp-mail-body">
                    Hi Sarah — thank you for backing our spring drive. Your $50 gift, plus 91 others like it, just pushed us past 60% of our team van goal. We sent you a tax receipt separately for your records.
                  </div>
                  <a className="sp-mail-cta" href="#">See campaign progress</a>
                  <div className="sp-mail-divider" />
                  <div className="sp-mail-tags">
                    <span>Personalized</span><span>Auto receipt</span><span>Track open</span><span>Suppress if unsubscribed</span>
                  </div>
                </div>
              </div>

              <div className="sp-kpi-row">
                <div className="sp-kpi">
                  <div className="num">39%</div>
                  <div className="lbl">Donor open rate on Sponsorly sequences vs ~22% nonprofit avg</div>
                </div>
                <div className="sp-kpi">
                  <div className="num">94%</div>
                  <div className="lbl">SMS delivery rate on opted-in numbers</div>
                </div>
                <div className="sp-kpi">
                  <div className="num">3.1×</div>
                  <div className="lbl">Higher response on multi-step campaigns vs one-off blasts</div>
                </div>
                <div className="sp-kpi">
                  <div className="num">0</div>
                  <div className="lbl">Campaigns sent without explicit donor consent</div>
                </div>
              </div>
            </div>
          </section>

          {/* CRM */}
          <section id="crm" className="sp-section">
            <div className="sp-wrap">
              <div className="sp-two">
                <div>
                  <span className="sp-eyebrow sp-eyebrow-accent">Donor CRM, built in</span>
                  <h2 className="sp-display-h2">
                    One <span className="accent-accent">donor record</span> that follows every athlete, every season.
                  </h2>
                  <p className="sp-lead">
                    When a parent gives in 6th grade, the school still has that relationship when their senior goes off to college. Sponsorly keeps the donor tied to the program — not to the year, the team, or the coach who set up the campaign.
                  </p>
                  <div className="sp-crm-rows">
                    <div className="sp-crm-row">
                      <div className="icon"><Users /></div>
                      <div>
                        <h5>Persistent supporter ID</h5>
                        <p>Every donor gets a single record across every season, sport, and student tied to your school.</p>
                      </div>
                    </div>
                    <div className="sp-crm-row">
                      <div className="icon"><Repeat /></div>
                      <div>
                        <h5>Team-on-a-team rosters</h5>
                        <p>Move a player to varsity, change coaches, swap clubs — gifts and history stay attached to the school program.</p>
                      </div>
                    </div>
                    <div className="sp-crm-row active">
                      <div className="icon"><Heart /></div>
                      <div>
                        <h5>360° engagement</h5>
                        <p>See gifts, ticket purchases, opens, clicks, and event attendance — one timeline per supporter.</p>
                      </div>
                    </div>
                    <div className="sp-crm-row">
                      <div className="icon"><Mail /></div>
                      <div>
                        <h5>Inbox-grade history</h5>
                        <p>Every email, SMS, and receipt sent to a supporter is stamped on their record — searchable in one click.</p>
                      </div>
                    </div>
                    <div className="sp-crm-row">
                      <div className="icon"><Doc /></div>
                      <div>
                        <h5>Full transaction log</h5>
                        <p>Every gift, refund, fee, and payout — exportable to your accounting system anytime.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="sp-db-card">
                    <div className="sp-db-head">
                      <h5>Madison Booster Club · Donor database</h5>
                      <span className="pill">324 ACTIVE</span>
                    </div>
                    {supporters.map((s) => (
                      <div className="sp-db-row" key={s.email}>
                        <div className="sp-db-avatar" style={{ background: s.color }}>{s.initials}</div>
                        <div className="info">
                          <div className="n">{s.name}</div>
                          <div className="e">{s.email}</div>
                        </div>
                        <div className="total">{s.total}</div>
                        <span className={`tag ${s.tag}`}>{s.tagText}</span>
                      </div>
                    ))}
                    <div className="sp-db-foot">
                      <span>Showing 6 of 324</span>
                      <span>+12 added this week</span>
                    </div>
                  </div>

                  <div className="sp-mini-stats">
                    <div className="sp-mini-stat">
                      <div className="lbl">Lifetime giving</div>
                      <div className="num">$497</div>
                      <div className="delta">+18% vs last season</div>
                    </div>
                    <div className="sp-mini-stat alt">
                      <div className="lbl">Avg gift</div>
                      <div className="num">$67</div>
                      <div className="delta">across 7,420 supporters</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AUTOMATION */}
          <section id="automation" className="sp-section alt">
            <div className="sp-wrap">
              <div className="sp-auto-head">
                <div>
                  <span className="sp-eyebrow sp-eyebrow-green">Automation</span>
                  <h2 className="sp-display-h2">
                    Every detail <span className="accent-blue">handled for you.</span>
                  </h2>
                </div>
                <p className="note">
                  Every feature you'd expect from a modern fundraising platform — and a few you wouldn't. All included on the Free plan.
                </p>
              </div>

              <div className="sp-auto-grid">
                {automationCards.map((c) => {
                  const IconComp = c.Icon;
                  return (
                    <div className={`sp-auto-card ${c.active ? "active" : ""}`} key={c.title}>
                      <div className={`sp-auto-icon ${c.icon}`}><IconComp /></div>
                      <h5>{c.title}</h5>
                      <p>{c.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="sp-cta">
            <div className="sp-cta-inner">
              <span className="sp-eyebrow sp-eyebrow-light">Get started today</span>
              <h2>
                Every feature.<br />
                <span className="accent">Zero platform fees.</span>
              </h2>
              <p className="sub">
                Every Sponsorly feature listed above is in every plan. Connect your Stripe account in 5 minutes and launch your first campaign today.
              </p>
              <div className="actions">
                <Link to="/signup" className="sp-btn sp-btn-white sp-btn-lg">
                  Get started free <span aria-hidden>→</span>
                </Link>
                <Link to="/contact" className="sp-btn sp-btn-outline-white sp-btn-lg">
                  Schedule a demo
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Features;
