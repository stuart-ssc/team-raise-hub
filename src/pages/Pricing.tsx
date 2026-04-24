import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

/**
 * Sponsorly Pricing — rebuilt to match the approved 2026 mockup.
 * Fully scoped under .sp-pricing so the rest of the app's design
 * system is untouched. Mirrors the typography + color tokens from
 * src/pages/Index.tsx.
 */

const SCOPED_CSS = `
.sp-pricing {
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
.sp-pricing .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-pricing .sp-italic { font-style: italic; }
.sp-pricing .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(31,95,224,0.08); color: var(--sp-blue); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-pricing .sp-eyebrow-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-pricing .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-pricing .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-pricing .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-pricing .sp-btn:hover { transform: translateY(-1px); }
.sp-pricing .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-pricing .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-pricing .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-pricing .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-pricing .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-pricing .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-pricing .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-pricing .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-pricing .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* HERO */
.sp-pricing .sp-hero { position: relative; padding: 72px 0 56px; overflow: hidden; background:
  radial-gradient(900px 480px at 80% -10%, rgba(31,95,224,0.10), transparent 60%),
  radial-gradient(700px 360px at 5% 0%, rgba(14,159,110,0.08), transparent 60%),
  var(--sp-paper); }
.sp-pricing .sp-hero-inner { text-align: center; max-width: 880px; margin: 0 auto; }
.sp-pricing .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(48px, 6.4vw, 88px); line-height: 1.0; letter-spacing: -0.02em; margin: 22px 0 22px; color: var(--sp-ink); }
.sp-pricing .sp-hero h1 .accent { color: var(--sp-blue); font-style: italic; }
.sp-pricing .sp-hero p.sub { font-size: 17px; color: var(--sp-ink-2); max-width: 580px; margin: 0 auto; line-height: 1.55; }

/* PLAN CARD */
.sp-pricing .sp-plan-section { padding: 24px 0 80px; }
.sp-pricing .sp-plan { background: white; border: 1px solid var(--sp-line); border-radius: 24px; box-shadow: 0 30px 60px -30px rgba(10,15,30,0.18); padding: 40px; }
.sp-pricing .sp-plan-top { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start; padding-bottom: 32px; border-bottom: 1px solid var(--sp-line); }
.sp-pricing .sp-plan-price { display: flex; align-items: baseline; gap: 10px; font-family: var(--sp-display); }
.sp-pricing .sp-plan-price .amount { font-size: 88px; line-height: 1; color: var(--sp-blue); font-style: italic; font-weight: 400; letter-spacing: -0.02em; }
.sp-pricing .sp-plan-price .per { font-size: 22px; color: var(--sp-ink-2); font-style: italic; }
.sp-pricing .sp-plan-tag { font-size: 14px; color: var(--sp-muted); margin-top: 10px; max-width: 360px; }
.sp-pricing .sp-plan-fee { background: rgba(31,95,224,0.06); border: 1px solid rgba(31,95,224,0.18); border-radius: 14px; padding: 14px 18px; max-width: 320px; }
.sp-pricing .sp-plan-fee .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--sp-blue); margin-bottom: 4px; }
.sp-pricing .sp-plan-fee p { font-size: 12.5px; color: var(--sp-ink-2); line-height: 1.5; margin: 0; }
.sp-pricing .sp-plan-features { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 32px; padding: 32px 0; }
.sp-pricing .sp-feat { display: flex; gap: 12px; align-items: flex-start; }
.sp-pricing .sp-feat .check { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 1px; }
.sp-pricing .sp-feat-title { font-size: 14px; font-weight: 600; color: var(--sp-ink); }
.sp-pricing .sp-feat-desc { font-size: 13px; color: var(--sp-muted); margin-top: 2px; }
.sp-pricing .sp-plan-bottom { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 24px; border-top: 1px solid var(--sp-line); flex-wrap: wrap; }
.sp-pricing .sp-plan-bottom .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.sp-pricing .sp-plan-bottom .nocc { font-size: 13px; color: var(--sp-muted); }

/* FEES SECTION */
.sp-pricing .sp-fees { padding: 80px 0; background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-pricing .sp-fees-head { text-align: center; max-width: 720px; margin: 0 auto 36px; }
.sp-pricing .sp-fees-head h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; margin: 16px 0 14px; color: var(--sp-ink); font-weight: 400; }
.sp-pricing .sp-fees-head h2 .accent { color: var(--sp-blue); font-style: italic; }
.sp-pricing .sp-fees-head p { font-size: 15px; color: var(--sp-muted); }
.sp-pricing .sp-toggle { display: inline-flex; padding: 4px; border-radius: 999px; background: var(--sp-paper-2); border: 1px solid var(--sp-line); margin: 0 auto 28px; }
.sp-pricing .sp-toggle-wrap { display: flex; justify-content: center; }
.sp-pricing .sp-toggle button { padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--sp-ink-2); background: transparent; transition: all .2s ease; display: inline-flex; align-items: center; gap: 8px; }
.sp-pricing .sp-toggle button.active { background: white; color: var(--sp-ink); box-shadow: 0 4px 12px -4px rgba(10,15,30,0.15); }
.sp-pricing .sp-toggle .badge { font-size: 10px; padding: 2px 6px; border-radius: 999px; background: rgba(14,159,110,0.14); color: var(--sp-green); letter-spacing: 0.04em; }
.sp-pricing .sp-fee-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 980px; margin: 0 auto; }
.sp-pricing .sp-fee-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 24px; transition: border-color .2s, box-shadow .2s; }
.sp-pricing .sp-fee-card.active { border-color: rgba(31,95,224,0.45); box-shadow: 0 20px 40px -20px rgba(31,95,224,0.25); }
.sp-pricing .sp-fee-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.sp-pricing .sp-fee-card h4 { font-family: var(--sp-display); font-size: 22px; font-weight: 400; line-height: 1.2; margin: 0; color: var(--sp-ink); max-width: 220px; }
.sp-pricing .sp-fee-card .tag { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; padding: 4px 8px; border-radius: 999px; text-transform: uppercase; }
.sp-pricing .sp-fee-card .tag-default { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-pricing .sp-fee-card .tag-opt { background: rgba(10,15,30,0.06); color: var(--sp-ink-2); }
.sp-pricing .sp-fee-rows { padding: 16px 0; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-pricing .sp-fee-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
.sp-pricing .sp-fee-row .label { color: var(--sp-ink-2); }
.sp-pricing .sp-fee-row .label .sub { display: block; font-size: 11px; color: var(--sp-muted); margin-top: 2px; }
.sp-pricing .sp-fee-row .val { color: var(--sp-ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.sp-pricing .sp-fee-row .val.minus { color: #C0392B; }
.sp-pricing .sp-fee-row .val.plus { color: var(--sp-ink); }
.sp-pricing .sp-fee-total { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; }
.sp-pricing .sp-fee-total .label { font-size: 13px; font-weight: 600; color: var(--sp-ink); text-transform: uppercase; letter-spacing: 0.08em; }
.sp-pricing .sp-fee-total .val { font-family: var(--sp-display); font-size: 36px; color: var(--sp-green); font-style: italic; }
.sp-pricing .sp-fee-card.muted .sp-fee-total .val { color: var(--sp-ink-2); }
.sp-pricing .sp-fee-notes { margin-top: 18px; }
.sp-pricing .sp-fee-notes li { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: var(--sp-muted); padding: 4px 0; }
.sp-pricing .sp-fee-notes li::before { content: ""; flex: 0 0 6px; width: 6px; height: 6px; border-radius: 999px; background: var(--sp-blue); margin-top: 8px; }
.sp-pricing .sp-fee-card.muted .sp-fee-notes li::before { background: var(--sp-muted); }
.sp-pricing .sp-fees-footnote { text-align: center; font-size: 13px; color: var(--sp-muted); margin-top: 28px; }

/* FEATURES GRID */
.sp-pricing .sp-features-section { padding: 80px 0; background: var(--sp-paper); }
.sp-pricing .sp-features-head { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: end; margin-bottom: 40px; }
.sp-pricing .sp-features-head h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; margin: 12px 0 0; color: var(--sp-ink); font-weight: 400; }
.sp-pricing .sp-features-head h2 .accent { color: var(--sp-green); font-style: italic; }
.sp-pricing .sp-features-head .note { font-size: 14px; color: var(--sp-muted); line-height: 1.55; max-width: 380px; justify-self: end; }
.sp-pricing .sp-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.sp-pricing .sp-feature-card { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; transition: transform .2s ease, box-shadow .2s ease; }
.sp-pricing .sp-feature-card:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -16px rgba(10,15,30,0.12); }
.sp-pricing .sp-feature-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px; }
.sp-pricing .sp-feature-icon.blue { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-pricing .sp-feature-icon.green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-pricing .sp-feature-icon.accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-pricing .sp-feature-card h5 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: var(--sp-ink); }
.sp-pricing .sp-feature-card p { font-size: 13px; color: var(--sp-muted); margin: 0; line-height: 1.5; }

/* COMPARISON TABLE */
.sp-pricing .sp-compare { padding: 80px 0; background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-pricing .sp-compare-head { text-align: center; max-width: 720px; margin: 0 auto 36px; }
.sp-pricing .sp-compare-head h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; margin: 16px 0 14px; color: var(--sp-ink); font-weight: 400; }
.sp-pricing .sp-compare-head h2 .accent { color: var(--sp-blue); font-style: italic; }
.sp-pricing .sp-compare-head p { font-size: 15px; color: var(--sp-muted); }
.sp-pricing .sp-table-wrap { max-width: 980px; margin: 0 auto; border: 1px solid var(--sp-line); border-radius: 18px; overflow: hidden; background: white; }
.sp-pricing table.sp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.sp-pricing table.sp-table th, .sp-pricing table.sp-table td { padding: 16px 18px; text-align: center; border-bottom: 1px solid var(--sp-line); }
.sp-pricing table.sp-table th:first-child, .sp-pricing table.sp-table td:first-child { text-align: left; color: var(--sp-ink-2); }
.sp-pricing table.sp-table thead th { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sp-muted); background: var(--sp-paper); }
.sp-pricing table.sp-table thead th.sponsorly { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-pricing table.sp-table tbody td.sponsorly { background: rgba(31,95,224,0.04); color: var(--sp-blue); font-weight: 600; }
.sp-pricing table.sp-table tbody td.bad { color: #C0392B; }
.sp-pricing table.sp-table tr.total td { background: var(--sp-ink); color: white; font-weight: 600; padding: 20px 18px; border-bottom: none; }
.sp-pricing table.sp-table tr.total td:first-child { color: white; }
.sp-pricing table.sp-table tr.total td.sponsorly { background: var(--sp-green); color: white; font-family: var(--sp-display); font-size: 22px; font-style: italic; }

/* FAQ */
.sp-pricing .sp-faq { padding: 80px 0; background: var(--sp-paper); }
.sp-pricing .sp-faq-grid { display: grid; grid-template-columns: 0.85fr 1.4fr; gap: 56px; align-items: start; }
.sp-pricing .sp-faq h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 52px); line-height: 1.05; margin: 16px 0 14px; color: var(--sp-ink); font-weight: 400; }
.sp-pricing .sp-faq h2 .accent { color: var(--sp-blue); font-style: italic; display: block; }
.sp-pricing .sp-faq-side p { font-size: 14px; color: var(--sp-muted); line-height: 1.55; margin-bottom: 24px; }
.sp-pricing .sp-faq-still { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 18px; }
.sp-pricing .sp-faq-still h5 { font-size: 13px; font-weight: 700; margin: 0 0 6px; color: var(--sp-ink); }
.sp-pricing .sp-faq-still p { font-size: 13px; color: var(--sp-muted); margin: 0; }
.sp-pricing .sp-faq-still a { color: var(--sp-blue); font-weight: 600; }
.sp-pricing .sp-faq-list { display: flex; flex-direction: column; gap: 10px; }
.sp-pricing .sp-faq-item { background: white; border: 1px solid var(--sp-line); border-radius: 14px; overflow: hidden; transition: border-color .2s ease; }
.sp-pricing .sp-faq-item.open { border-color: rgba(31,95,224,0.35); box-shadow: 0 12px 28px -16px rgba(31,95,224,0.18); }
.sp-pricing .sp-faq-q { width: 100%; text-align: left; background: transparent; padding: 18px 22px; font-size: 15px; font-weight: 600; color: var(--sp-ink); display: flex; justify-content: space-between; align-items: center; gap: 12px; cursor: pointer; }
.sp-pricing .sp-faq-q .chev { color: var(--sp-muted); transition: transform .2s ease; }
.sp-pricing .sp-faq-item.open .sp-faq-q .chev { transform: rotate(180deg); color: var(--sp-blue); }
.sp-pricing .sp-faq-a { padding: 0 22px 20px; font-size: 14px; color: var(--sp-ink-2); line-height: 1.6; }

/* FINAL CTA */
.sp-pricing .sp-cta { padding: 96px 0 84px; background: linear-gradient(135deg, var(--sp-blue) 0%, var(--sp-blue-deep) 100%); color: white; text-align: center; position: relative; overflow: hidden; }
.sp-pricing .sp-cta::before { content: ""; position: absolute; inset: 0; background: radial-gradient(800px 400px at 50% -20%, rgba(255,255,255,0.18), transparent 60%); pointer-events: none; }
.sp-pricing .sp-cta-inner { position: relative; max-width: 720px; margin: 0 auto; padding: 0 32px; }
.sp-pricing .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(38px, 5vw, 64px); line-height: 1.05; margin: 18px 0 16px; font-weight: 400; }
.sp-pricing .sp-cta h2 .accent { font-style: italic; color: rgba(255,255,255,0.92); }
.sp-pricing .sp-cta p.sub { font-size: 16px; color: rgba(255,255,255,0.82); margin-bottom: 28px; }
.sp-pricing .sp-cta .actions { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 22px; }
.sp-pricing .sp-cta .smol { font-size: 12px; color: rgba(255,255,255,0.65); letter-spacing: 0.05em; }

/* Mobile */
@media (max-width: 900px) {
  .sp-pricing .sp-plan { padding: 28px; }
  .sp-pricing .sp-plan-top { grid-template-columns: 1fr; }
  .sp-pricing .sp-plan-features { grid-template-columns: 1fr; }
  .sp-pricing .sp-fee-cards { grid-template-columns: 1fr; }
  .sp-pricing .sp-features-head { grid-template-columns: 1fr; align-items: start; }
  .sp-pricing .sp-features-head .note { justify-self: start; }
  .sp-pricing .sp-features-grid { grid-template-columns: 1fr; }
  .sp-pricing .sp-faq-grid { grid-template-columns: 1fr; gap: 32px; }
  .sp-pricing .sp-table-wrap { overflow-x: auto; }
}
`;

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="chev">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const features = [
  { title: "Unlimited fundraisers", desc: "Donations, sponsorships, events, merch — all in one place." },
  { title: "Built-in CRM and donor lists", desc: "Track every supporter and segment for outreach." },
  { title: "Automated tax receipts", desc: "501(c)(3) and EIN-ready receipts sent automatically." },
  { title: "Live dashboards & reports", desc: "Real-time progress, leaderboards, and campaign analytics." },
  { title: "Roster + P2P fundraising", desc: "Personal pages for every player, parent, or member." },
  { title: "Unlimited integrations", desc: "Stripe, email, SMS, Zapier — connect your stack." },
  { title: "Premium support", desc: "Real humans, fast responses, no upsells." },
  { title: "Unlimited admin seats", desc: "Add your whole board, staff, and volunteers." },
];

const featureGrid = [
  { icon: "blue", title: "Unlimited fundraisers", desc: "Run as many campaigns as you need across teams, clubs, and seasons." },
  { icon: "green", title: "Donor CRM", desc: "Built-in supporter database with tags, lists, and giving history." },
  { icon: "accent", title: "Built-in tax receipts", desc: "Automated, IRS-compliant receipts the moment a donation clears." },
  { icon: "blue", title: "Roster + P2P attribution", desc: "Personal links for every player. Credit goes where it's earned." },
  { icon: "green", title: "Branded landing pages", desc: "Beautiful, mobile-friendly pages with your logo, colors, and story." },
  { icon: "accent", title: "Custom analytics", desc: "Live dashboards, leaderboards, and exportable reports." },
  { icon: "blue", title: "Premium support", desc: "Real humans on chat & email. Setup help included." },
  { icon: "green", title: "Bulk import & export", desc: "CSV import for rosters and donors. Export anything, anytime." },
  { icon: "accent", title: "Unlimited integrations", desc: "Stripe, Zapier, SMS, email, calendar — connect your tools." },
];

const faqs = [
  {
    q: "Is it really free for my organization?",
    a: "Yes. There are no monthly fees, no setup costs, and no per-campaign charges for your organization. You can launch unlimited campaigns and add unlimited admins at $0. The only fee is a 10% platform fee per donation — by default it's added on top so donors cover it and your org receives 100%, or you can absorb it per-campaign.",
  },
  {
    q: "Can I switch fee modes?",
    a: "Yes. The setting is per campaign and you can change it at any time. Some campaigns absorb the fee (donor pays a clean $100, you net ~$90); most have donors cover it (donor pays $110, you net $100).",
  },
  {
    q: "What about card processing fees?",
    a: "Card processing is included in the 10% platform fee. There are no separate Stripe charges, no surprise deductions on your payout — what you see is what you get.",
  },
  {
    q: "How do payouts work?",
    a: "Funds are deposited directly to your organization's bank account through Stripe Connect, typically in 2 business days. You can view every payout, donation, and refund in your dashboard.",
  },
  {
    q: "Is there a contract or minimum term?",
    a: "No contracts and no minimums. Use Sponsorly for one campaign or for the next ten years — it's the same $0/month either way.",
  },
  {
    q: "Who is 'unlimited' really for?",
    a: "Schools, PTOs, booster clubs, marching bands, sports teams, and registered nonprofits. We don't gate features by org size — every account gets the full platform.",
  },
  {
    q: "Where is my data?",
    a: "All data is stored on encrypted, US-based infrastructure. You own it. Export to CSV at any time, and we'll never sell or share your donor information.",
  },
  {
    q: "Do you support 501(c)(3) and tax receipts?",
    a: "Yes. Verified 501(c)(3) organizations get automatic, IRS-compliant donor receipts and an annual tax summary delivered every January.",
  },
];

const Pricing = () => {
  const [feeMode, setFeeMode] = useState<"donor" | "platform">("donor");
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs</title>
        <meta name="description" content="Sponsorly is 100% free for schools, sports teams, clubs, and PTOs. No monthly fees, no setup, no contracts — just a small platform fee per donation that donors can cover." />
        <link rel="canonical" href="https://sponsorly.io/pricing" />
        <meta property="og:title" content="Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs" />
        <meta property="og:description" content="Sponsorly is 100% free for schools, sports teams, clubs, and PTOs. No monthly fees, no setup, no contracts." />
        <meta property="og:url" content="https://sponsorly.io/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sponsorly.io/lovable-uploads/Sponsorly-Logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs" />
        <meta name="twitter:description" content="Sponsorly is 100% free for schools, sports teams, clubs, and PTOs. No monthly fees, no setup, no contracts." />
        <meta name="twitter:image" content="https://sponsorly.io/lovable-uploads/Sponsorly-Logo.png" />
      </Helmet>
      <MarketingHeader />

      <main className="flex-1">
        <div className="sp-pricing">
          <style>{SCOPED_CSS}</style>

          {/* HERO */}
          <section className="sp-hero">
            <div className="sp-wrap">
              <div className="sp-hero-inner">
                <span className="sp-eyebrow">Pricing</span>
                <h1>
                  Free to launch. <span className="accent">Fair to everyone.</span>
                </h1>
                <p className="sub">
                  $0 per month. No setup, no contracts. Choose who covers the platform fee per campaign — and switch at any time.
                </p>
              </div>
            </div>
          </section>

          {/* PLAN CARD */}
          <section className="sp-plan-section">
            <div className="sp-wrap">
              <div className="sp-plan">
                <div className="sp-plan-top">
                  <div>
                    <div className="sp-plan-price">
                      <span className="amount">$0</span>
                      <span className="per">/ month</span>
                    </div>
                    <p className="sp-plan-tag">Everything included. Forever, for your organization.</p>
                  </div>
                  <div className="sp-plan-fee">
                    <div className="pill">
                      <CheckIcon />
                      Platform fee per donation
                    </div>
                    <p>You choose if donors cover it (default) or your org absorbs it.</p>
                  </div>
                </div>

                <div className="sp-plan-features">
                  {features.map((f) => (
                    <div className="sp-feat" key={f.title}>
                      <span className="check"><CheckIcon /></span>
                      <div>
                        <div className="sp-feat-title">{f.title}</div>
                        <div className="sp-feat-desc">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sp-plan-bottom">
                  <div className="actions">
                    <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                      Start free <span aria-hidden>→</span>
                    </Link>
                    <Link to="/features" className="sp-btn sp-btn-ghost sp-btn-lg">
                      See all features
                    </Link>
                  </div>
                  <span className="nocc">No credit card required · Setup in under 5 minutes</span>
                </div>
              </div>
            </div>
          </section>

          {/* FEES */}
          <section className="sp-fees">
            <div className="sp-wrap">
              <div className="sp-fees-head">
                <span className="sp-eyebrow">How fees work</span>
                <h2>You choose <span className="accent">who covers the fees.</span></h2>
                <p>
                  Per campaign, decide whether the donor covers the small platform fee or your organization absorbs it.
                  It's a single toggle — switch any time, no penalty.
                </p>
              </div>

              <div className="sp-toggle-wrap">
                <div className="sp-toggle" role="tablist" aria-label="Fee mode">
                  <button
                    role="tab"
                    aria-selected={feeMode === "donor"}
                    className={feeMode === "donor" ? "active" : ""}
                    onClick={() => setFeeMode("donor")}
                  >
                    Donor covers fees <span className="badge">DEFAULT</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={feeMode === "platform"}
                    className={feeMode === "platform" ? "active" : ""}
                    onClick={() => setFeeMode("platform")}
                  >
                    Platform takes 10% of the gift
                  </button>
                </div>
              </div>

              <div className="sp-fee-cards">
                {/* Donor covers */}
                <div className={`sp-fee-card ${feeMode === "donor" ? "active" : "muted"}`}>
                  <div className="sp-fee-card-head">
                    <h4>Donor covers the processing fee</h4>
                    <span className="tag tag-default">Default</span>
                  </div>
                  <div className="sp-fee-rows">
                    <div className="sp-fee-row">
                      <span className="label">
                        Gift amount
                        <span className="sub">What the donor wants to give</span>
                      </span>
                      <span className="val">$100.00</span>
                    </div>
                    <div className="sp-fee-row">
                      <span className="label">
                        + Platform fee (10%)
                        <span className="sub">Added on top at checkout</span>
                      </span>
                      <span className="val plus">+$10.00</span>
                    </div>
                    <div className="sp-fee-row">
                      <span className="label">Donor pays total</span>
                      <span className="val">$110.00</span>
                    </div>
                  </div>
                  <div className="sp-fee-total">
                    <span className="label">Your org receives</span>
                    <span className="val">$100.00</span>
                  </div>
                  <ul className="sp-fee-notes">
                    <li>Most donors say yes — fee transparency is a one-line checkbox at checkout.</li>
                    <li>100% of the intended gift lands in your bank account.</li>
                    <li>Best for most campaigns — recommended default.</li>
                  </ul>
                </div>

                {/* Platform takes */}
                <div className={`sp-fee-card ${feeMode === "platform" ? "active" : "muted"}`}>
                  <div className="sp-fee-card-head">
                    <h4>Platform takes 10% of the gift</h4>
                    <span className="tag tag-opt">Optional</span>
                  </div>
                  <div className="sp-fee-rows">
                    <div className="sp-fee-row">
                      <span className="label">
                        Gift amount
                        <span className="sub">What the donor agrees to pay</span>
                      </span>
                      <span className="val">$100.00</span>
                    </div>
                    <div className="sp-fee-row">
                      <span className="label">Donor pays</span>
                      <span className="val">$100.00</span>
                    </div>
                    <div className="sp-fee-row">
                      <span className="label">
                        − Platform fee (10%)
                        <span className="sub">Deducted from your payout</span>
                      </span>
                      <span className="val minus">−$10.00</span>
                    </div>
                  </div>
                  <div className="sp-fee-total">
                    <span className="label">Your org receives</span>
                    <span className="val">$90.00</span>
                  </div>
                  <ul className="sp-fee-notes">
                    <li>Cleanest donor experience — they pay exactly the headline price.</li>
                    <li>Useful for memberships, ticketed events, or merch with set prices.</li>
                    <li>Switch back to donor-covered any time.</li>
                  </ul>
                </div>
              </div>

              <p className="sp-fees-footnote">
                All fees include card processing. Change the setting per campaign at any time.
              </p>
            </div>
          </section>

          {/* FEATURES GRID */}
          <section className="sp-features-section">
            <div className="sp-wrap">
              <div className="sp-features-head">
                <div>
                  <span className="sp-eyebrow sp-eyebrow-green">Included</span>
                  <h2>Every feature, <span className="accent">free forever.</span></h2>
                </div>
                <p className="note">
                  There is no feature gate. The Free plan is the only plan — 100% of features unlocked — for every school and nonprofit.
                </p>
              </div>

              <div className="sp-features-grid">
                {featureGrid.map((f) => (
                  <div className="sp-feature-card" key={f.title}>
                    <div className={`sp-feature-icon ${f.icon}`}>
                      <CheckIcon />
                    </div>
                    <h5>{f.title}</h5>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* COMPARISON */}
          <section className="sp-compare">
            <div className="sp-wrap">
              <div className="sp-compare-head">
                <span className="sp-eyebrow">Compare</span>
                <h2>The math vs. <span className="accent">the legacy platforms.</span></h2>
                <p>Using a simple $10K raise as a benchmark, here's what your organization actually keeps with Sponsorly compared to the big 3 legacy fundraising platforms.</p>
              </div>

              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th className="sponsorly">Sponsorly</th>
                      <th>Platform A</th>
                      <th>Platform B</th>
                      <th>Platform C</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Platform fee (donor-covered option)</td>
                      <td className="sponsorly">0%</td>
                      <td className="bad">5%</td>
                      <td className="bad">8.5%</td>
                      <td className="bad">5%</td>
                    </tr>
                    <tr>
                      <td>Platform fee (org-absorbed)</td>
                      <td className="sponsorly">10%</td>
                      <td className="bad">15%</td>
                      <td className="bad">—</td>
                      <td className="bad">—</td>
                    </tr>
                    <tr>
                      <td>Monthly fee</td>
                      <td className="sponsorly">$0/mo</td>
                      <td className="bad">$99/mo</td>
                      <td className="bad">$199/mo</td>
                      <td className="bad">—</td>
                    </tr>
                    <tr>
                      <td>Email + SMS automation</td>
                      <td className="sponsorly">Included</td>
                      <td className="bad">$79/mo add-on</td>
                      <td className="bad">Add-on</td>
                      <td className="bad">$79/mo</td>
                    </tr>
                    <tr>
                      <td>Built-in CRM</td>
                      <td className="sponsorly">Included</td>
                      <td className="bad">No</td>
                      <td className="bad">$149/mo</td>
                      <td className="bad">Per-seat</td>
                    </tr>
                    <tr className="total">
                      <td>Total funds on $10K raised</td>
                      <td className="sponsorly">$10,000</td>
                      <td>$8,500</td>
                      <td>$8,150</td>
                      <td>$9,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="sp-faq">
            <div className="sp-wrap">
              <div className="sp-faq-grid">
                <div className="sp-faq-side">
                  <span className="sp-eyebrow">FAQ</span>
                  <h2>
                    Questions, <span className="accent">answered.</span>
                  </h2>
                  <p>
                    The few things that genuinely set Sponsorly apart from the
                    rest — every fee, feature, and contract clause — are no
                    secret. If something isn't here, ask.
                  </p>
                  <div className="sp-faq-still">
                    <h5>Still have questions?</h5>
                    <p>
                      Talk to our team:{" "}
                      <a href="mailto:hello@sponsorly.io">hello@sponsorly.io</a>
                    </p>
                  </div>
                </div>

                <div className="sp-faq-list">
                  {faqs.map((item, i) => {
                    const open = openFaq === i;
                    return (
                      <div className={`sp-faq-item ${open ? "open" : ""}`} key={item.q}>
                        <button
                          className="sp-faq-q"
                          onClick={() => setOpenFaq(open ? -1 : i)}
                          aria-expanded={open}
                        >
                          <span>{item.q}</span>
                          <ChevronIcon />
                        </button>
                        {open && <div className="sp-faq-a">{item.a}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="sp-cta">
            <div className="sp-cta-inner">
              <span className="sp-eyebrow sp-eyebrow-light">Ready when you are</span>
              <h2>
                Start raising money,<br />
                <span className="accent sp-italic">not paying for software.</span>
              </h2>
              <p className="sub">
                $0 setup. $0 per month. Cancel anytime — though we don't think you'll want to.
              </p>
              <div className="actions">
                <Link to="/signup" className="sp-btn sp-btn-white sp-btn-lg">
                  Start free <span aria-hidden>→</span>
                </Link>
                <Link to="/contact" className="sp-btn sp-btn-outline-white sp-btn-lg">
                  Book a 15-min demo
                </Link>
              </div>
              <div className="smol">Sponsorly™ · Built by educators</div>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Pricing;
