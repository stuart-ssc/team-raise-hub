import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";

/**
 * Sponsorly homepage — rebuilt to match the approved 2026 mockup.
 * Styling is fully scoped via inline <style> + arbitrary Tailwind values
 * so it does not affect the rest of the application's design system.
 */

const SCOPED_CSS = `
.sp-home {
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
.sp-home .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-home .sp-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-blue); }
.sp-home .sp-wrap { max-width: 1280px; margin: 0 auto; padding: 0 32px; }
.sp-home .sp-wrap-wide { max-width: 1440px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-home .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-home .sp-btn:hover { transform: translateY(-1px); }
.sp-home .sp-btn-lg { padding: 16px 28px; font-size: 15px; }
.sp-home .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-home .sp-btn-primary:hover { background: var(--sp-blue-deep); box-shadow: 0 10px 24px -8px rgba(31,95,224,0.65); }
.sp-home .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-home .sp-btn-ghost:hover { background: rgba(10,15,30,0.09); }
.sp-home .sp-btn-ghost-dark { background: rgba(255,255,255,0.1); color: white; }
.sp-home .sp-btn-ghost-dark:hover { background: rgba(255,255,255,0.18); }

/* Chips */
.sp-home .sp-chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(31,95,224,0.08); color: var(--sp-blue); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
.sp-home .sp-chip .sp-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--sp-blue); }
.sp-home .sp-chip-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-home .sp-chip-green .sp-dot { background: var(--sp-green); animation: spPulse 1.6s ease-in-out infinite; }
.sp-home .sp-chip-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-home .sp-chip-accent .sp-dot { background: var(--sp-accent); }
@keyframes spPulse { 0%,100% { opacity:1; transform:scale(1);} 50% { opacity:.4; transform:scale(1.4);} }

/* Hero */
.sp-home .sp-hero { position: relative; padding: 40px 0 120px; overflow: hidden; background:
  radial-gradient(1200px 600px at 85% -10%, rgba(31,95,224,0.12), transparent 60%),
  radial-gradient(800px 400px at 10% 10%, rgba(14,159,110,0.10), transparent 60%),
  var(--sp-paper); }
.sp-home .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; padding-top: 48px; }
.sp-home .sp-hero-headline { font-family: var(--sp-display); font-size: clamp(56px, 7.2vw, 104px); line-height: 0.98; letter-spacing: -0.02em; margin: 22px 0 28px; color: var(--sp-ink); font-weight: 400; }
.sp-home .sp-hl-mark { position: relative; display: inline-block; color: var(--sp-blue); white-space: nowrap; font-style: italic; }
.sp-home .sp-hl-mark::after { content: ""; position: absolute; left: -2%; right: -2%; bottom: 6%; height: 22%; background: rgba(255,107,53,0.28); z-index: -1; transform: skew(-6deg); }
.sp-home .sp-hero-sub { font-size: 19px; color: var(--sp-ink-2); max-width: 520px; line-height: 1.55; margin-bottom: 32px; }
.sp-home .sp-hero-ctas { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 40px; }
.sp-home .sp-hero-trust { display: flex; gap: 28px; align-items: center; padding-top: 28px; border-top: 1px solid var(--sp-line); font-size: 13px; color: var(--sp-muted); flex-wrap: wrap; }
.sp-home .sp-hero-trust-item { display: flex; align-items: center; gap: 8px; }
.sp-home .sp-hero-trust-item svg { color: var(--sp-green); flex: 0 0 16px; }
.sp-home .sp-hero-visual { position: relative; aspect-ratio: 4/5; max-height: 640px; }
.sp-home .sp-hero-card { position: absolute; inset: 0; border-radius: 24px; overflow: hidden; box-shadow: 0 40px 80px -30px rgba(10,15,30,0.35), 0 8px 20px -10px rgba(10,15,30,0.18); opacity: 0; transform: scale(0.98) translateY(8px); transition: opacity .8s ease, transform .8s ease; }
.sp-home .sp-hero-card.active { opacity: 1; transform: scale(1) translateY(0); }
.sp-home .sp-hero-photo { width: 100%; height: 100%; background-size: cover; background-position: center; position: relative; }
.sp-home .sp-hero-photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, rgba(8,28,74,0.75)); }
.sp-home .sp-hero-photo-caption { position: absolute; left: 24px; right: 24px; bottom: 24px; color: white; z-index: 2; }
.sp-home .sp-hero-photo-caption h4 { font-family: var(--sp-display); font-size: 28px; margin: 0 0 4px; font-weight: 400; }
.sp-home .sp-bar { height: 6px; background: rgba(255,255,255,0.2); border-radius: 999px; overflow: hidden; margin-top: 8px; }
.sp-home .sp-bar-fill { height: 100%; background: var(--sp-green); border-radius: 999px; }
.sp-home .sp-hero-float { position: absolute; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); border: 1px solid rgba(10,15,30,0.06); border-radius: 14px; box-shadow: 0 10px 30px -12px rgba(10,15,30,0.18); padding: 12px 14px; font-size: 12px; animation: spFloat 6s ease-in-out infinite; }
@keyframes spFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-8px);} }
.sp-home .sp-hero-float.f1 { top: 28px; right: -18px; }
.sp-home .sp-hero-float.f2 { bottom: 108px; left: -24px; animation-delay: -2s; }
.sp-home .sp-notif-head { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; }
.sp-home .sp-notif-dot { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; color: white; }
.sp-home .sp-notif-dot.green { background: var(--sp-green); }
.sp-home .sp-notif-dot.blue { background: var(--sp-blue); }
.sp-home .sp-notif-title { font-size: 11px; font-weight: 700; color: var(--sp-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.sp-home .sp-notif-main { font-weight: 600; color: var(--sp-ink); font-size: 13px; }
.sp-home .sp-notif-sub { color: var(--sp-muted); font-size: 11px; margin-top: 2px; }

/* Hero Variant B: Leaderboard */
.sp-home .sp-hero-board { position: absolute; inset: 0; background: white; border-radius: 24px; box-shadow: 0 40px 80px -30px rgba(10,15,30,0.35), 0 8px 20px -10px rgba(10,15,30,0.18); padding: 28px; display: flex; flex-direction: column; overflow: hidden; }
.sp-home .sp-board-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--sp-line); }
.sp-home .sp-board-head h3 { font-family: var(--sp-display); font-size: 26px; margin: 0; font-weight: 400; }
.sp-home .sp-board-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--sp-line); }
.sp-home .sp-board-item:last-child { border-bottom: none; }
.sp-home .sp-rank { width: 28px; font-family: var(--sp-display); font-size: 28px; color: var(--sp-muted); text-align: center; }
.sp-home .sp-rank.r1 { color: var(--sp-accent); }
.sp-home .sp-team-avatar { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-weight: 700; color: white; font-size: 14px; flex: 0 0 44px; }
.sp-home .sp-team-info { flex: 1; min-width: 0; }
.sp-home .sp-team-name { font-weight: 600; font-size: 14px; }
.sp-home .sp-team-meta { color: var(--sp-muted); font-size: 11px; display: flex; gap: 8px; align-items: center; }
.sp-home .sp-team-raised { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); }
.sp-home .sp-team-raised .small { font-size: 12px; color: var(--sp-muted); }

/* Hero Variant C: Fundraiser preview */
.sp-home .sp-hero-campaign { position: absolute; inset: 0; background: white; border-radius: 24px; box-shadow: 0 40px 80px -30px rgba(10,15,30,0.35), 0 8px 20px -10px rgba(10,15,30,0.18); overflow: hidden; }
.sp-home .sp-c-browser { height: 32px; background: #EEF0F5; display: flex; align-items: center; gap: 6px; padding: 0 14px; border-bottom: 1px solid var(--sp-line); }
.sp-home .sp-c-browser .sp-bdot { width: 10px; height: 10px; border-radius: 999px; background: #CBD0DB; }
.sp-home .sp-c-url { margin-left: 14px; background: white; height: 20px; border-radius: 999px; padding: 0 12px; display: flex; align-items: center; font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: var(--sp-muted); flex: 1; }
.sp-home .sp-c-img { height: 52%; background-size: cover; background-position: center; position: relative; }
.sp-home .sp-c-tag { position: absolute; top: 14px; left: 14px; padding: 4px 10px; background: white; border-radius: 999px; font-size: 10px; font-weight: 700; color: var(--sp-accent); letter-spacing: 0.06em; text-transform: uppercase; }
.sp-home .sp-c-body { padding: 18px 20px; }
.sp-home .sp-c-title { font-family: var(--sp-display); font-size: 24px; line-height: 1.1; margin: 0 0 6px; font-weight: 400; }
.sp-home .sp-c-desc { color: var(--sp-muted); font-size: 12px; margin-bottom: 14px; }
.sp-home .sp-c-stats { display: flex; justify-content: space-between; font-size: 11px; color: var(--sp-muted); margin-bottom: 6px; }
.sp-home .sp-c-stats b { color: var(--sp-ink); font-family: var(--sp-display); font-size: 20px; display: block; margin-bottom: 2px; font-weight: 400; }
.sp-home .sp-c-bar { height: 6px; background: #EEF0F5; border-radius: 999px; overflow: hidden; margin-bottom: 14px; }
.sp-home .sp-c-bar-fill { height: 100%; background: linear-gradient(90deg, var(--sp-blue), var(--sp-green)); border-radius: 999px; }
.sp-home .sp-c-donate { display: flex; gap: 8px; margin-top: 10px; }
.sp-home .sp-c-pill { flex: 1; padding: 10px; border-radius: 10px; background: var(--sp-paper-2); text-align: center; font-weight: 600; font-size: 13px; }
.sp-home .sp-c-pill.solid { background: var(--sp-blue); color: white; }

.sp-home .sp-hero-dots { position: absolute; bottom: -36px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.sp-home .sp-hero-dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(10,15,30,0.15); cursor: pointer; transition: all .3s; border: none; padding: 0; }
.sp-home .sp-hero-dot.active { width: 28px; background: var(--sp-blue); }

/* Trust bar */
.sp-home .sp-trust-bar { padding: 48px 0; background: var(--sp-paper); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-home .sp-trust-label { text-align: center; font-size: 12px; font-weight: 600; color: var(--sp-muted); letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 24px; }
.sp-home .sp-marquee { overflow: hidden; position: relative; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.sp-home .sp-marquee-track { display: flex; gap: 64px; animation: spScroll 40s linear infinite; width: max-content; }
@keyframes spScroll { to { transform: translateX(-50%); } }
.sp-home .sp-trust-logo { display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 28px; font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink-2); opacity: 0.7; white-space: nowrap; font-style: italic; }
.sp-home .sp-trust-logo .sp-badge { width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center; color: white; font-family: var(--sp-ui); font-weight: 700; font-size: 13px; font-style: normal; }

/* Sections */
.sp-home .sp-section { padding: 120px 0; position: relative; }
.sp-home .sp-sec-head { text-align: center; max-width: 720px; margin: 0 auto 72px; }
.sp-home .sp-sec-head h2 { font-family: var(--sp-display); font-size: clamp(44px, 5.4vw, 72px); line-height: 1.02; margin: 14px 0 18px; letter-spacing: -0.01em; font-weight: 400; }
.sp-home .sp-sec-head p { color: var(--sp-ink-2); font-size: 18px; line-height: 1.55; margin: 0; }

/* Feature grid */
.sp-home .sp-feature-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: auto auto auto; gap: 20px; }
.sp-home .sp-feat { padding: 32px; background: white; border: 1px solid var(--sp-line); border-radius: 18px; transition: transform .25s, box-shadow .25s, border-color .25s; position: relative; overflow: hidden; min-height: 320px; display: flex; flex-direction: column; }
.sp-home .sp-feat:hover { transform: translateY(-4px); box-shadow: 0 10px 30px -12px rgba(10,15,30,0.18); border-color: rgba(31,95,224,0.2); }
.sp-home .sp-feat-ico { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; background: rgba(31,95,224,0.08); color: var(--sp-blue); margin-bottom: 20px; }
.sp-home .sp-feat h3 { font-family: var(--sp-display); font-size: 30px; line-height: 1.1; margin: 0 0 10px; font-weight: 400; }
.sp-home .sp-feat p { color: var(--sp-muted); font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
.sp-home .sp-feat-viz { margin-top: auto; }
.sp-home .sp-feat-big { grid-column: 1; grid-row: 1 / 3; background: linear-gradient(160deg, var(--sp-blue) 0%, #2E3BD6 100%); color: white; border: none; padding: 40px; }
.sp-home .sp-feat-big h3 { font-size: 44px; }
.sp-home .sp-feat-big p { color: rgba(255,255,255,0.8); font-size: 15px; }
.sp-home .sp-feat-big .sp-feat-ico { background: rgba(255,255,255,0.14); color: white; }
.sp-home .sp-feat-outreach { grid-column: 1; grid-row: 3; background: linear-gradient(160deg, var(--sp-ink) 0%, #1C2235 100%); color: white; border: none; padding: 40px; }
.sp-home .sp-feat-outreach h3 { color: white; font-size: 36px; }
.sp-home .sp-feat-outreach p { color: rgba(255,255,255,0.7); font-size: 14px; }
.sp-home .sp-feat-outreach .sp-feat-ico { background: rgba(14,159,110,0.2); color: var(--sp-green); }
.sp-home .sp-feat-wide { grid-column: 2 / 4; min-height: 280px; }
.sp-home .sp-feat-wide .sp-feat-row { display: flex; gap: 32px; align-items: center; height: 100%; }
.sp-home .sp-feat-wide .sp-feat-row > .sp-feat-left { flex: 1; min-width: 0; }
.sp-home .sp-feat-wide .sp-feat-row > .sp-feat-viz { flex: 1.1; margin-top: 0; }

.sp-home .sp-receipt { margin-top: auto; background: white; border-radius: 12px; padding: 18px; color: var(--sp-ink); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.3); transform: rotate(-1.5deg); font-size: 12px; }
.sp-home .sp-receipt-row { display: flex; justify-content: space-between; padding: 4px 0; }
.sp-home .sp-receipt-row.hl { font-weight: 700; border-top: 1px dashed var(--sp-line); margin-top: 6px; padding-top: 10px; }
.sp-home .sp-receipt-row .strike { color: #B00020; text-decoration: line-through; font-size: 11px; }
.sp-home .sp-receipt-row.good { color: var(--sp-green); }

/* How it works (dark) */
.sp-home .sp-how { background: var(--sp-ink); color: white; padding: 120px 0; }
.sp-home .sp-how .sp-sec-head h2 { color: white; }
.sp-home .sp-how .sp-sec-head p { color: rgba(255,255,255,0.7); }
.sp-home .sp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; position: relative; }
.sp-home .sp-steps::before { content: ""; position: absolute; top: 36px; left: 8%; right: 8%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.2), transparent); }
.sp-home .sp-step { position: relative; z-index: 2; }
.sp-home .sp-step-num { width: 72px; height: 72px; border-radius: 999px; background: var(--sp-ink); border: 1px solid rgba(255,255,255,0.2); display: grid; place-items: center; font-family: var(--sp-display); font-size: 32px; margin: 0 auto 24px; position: relative; }
.sp-home .sp-step-num::before { content: ""; position: absolute; inset: -6px; border-radius: 999px; background: conic-gradient(from 0deg, var(--sp-blue), var(--sp-green), var(--sp-accent), var(--sp-blue)) border-box; -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: spSpin 8s linear infinite; }
@keyframes spSpin { to { transform: rotate(360deg); } }
.sp-home .sp-step h4 { font-family: var(--sp-display); font-size: 26px; margin: 0 0 8px; text-align: center; font-weight: 400; }
.sp-home .sp-step p { color: rgba(255,255,255,0.7); font-size: 14px; text-align: center; line-height: 1.55; }
.sp-home .sp-step-time { display: block; text-align: center; margin-top: 10px; color: var(--sp-green); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

/* Templates */
.sp-home .sp-templates { background: var(--sp-paper); }
.sp-home .sp-template-tabs { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 48px; }
.sp-home .sp-template-tab { padding: 10px 18px; border-radius: 999px; font-size: 14px; font-weight: 600; background: white; border: 1px solid var(--sp-line); color: var(--sp-ink-2); cursor: pointer; transition: all .2s; }
.sp-home .sp-template-tab:hover { border-color: var(--sp-ink-2); }
.sp-home .sp-template-tab.active { background: var(--sp-ink); color: white; border-color: var(--sp-ink); }
.sp-home .sp-template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.sp-home .sp-template-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; overflow: hidden; transition: transform .25s, box-shadow .25s; }
.sp-home .sp-template-card:hover { transform: translateY(-6px); box-shadow: 0 40px 80px -30px rgba(10,15,30,0.35); }
.sp-home .sp-template-img { aspect-ratio: 4/3; background-size: cover; background-position: center; position: relative; }
.sp-home .sp-template-img::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, rgba(8,28,74,0.5)); }
.sp-home .sp-template-tag { position: absolute; top: 14px; left: 14px; z-index: 2; padding: 4px 10px; background: rgba(255,255,255,0.95); border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.sp-home .sp-template-body { padding: 20px 22px; }
.sp-home .sp-template-body h4 { font-family: var(--sp-display); font-size: 22px; margin: 0 0 6px; font-weight: 400; }
.sp-home .sp-template-body .meta { color: var(--sp-muted); font-size: 12px; display: flex; justify-content: space-between; align-items: center; }
.sp-home .sp-template-body .raised { font-family: var(--sp-display); color: var(--sp-green); font-size: 18px; }

/* Testimonials */
.sp-home .sp-testimonials { background: var(--sp-paper-2); }
.sp-home .sp-t-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
.sp-home .sp-t-card { background: white; border-radius: 18px; padding: 32px; border: 1px solid var(--sp-line); display: flex; flex-direction: column; transition: transform .25s, box-shadow .25s; }
.sp-home .sp-t-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px -12px rgba(10,15,30,0.18); }
.sp-home .sp-t-card.feature { background: var(--sp-ink); color: white; border: none; }
.sp-home .sp-t-quote { font-family: var(--sp-display); font-size: 26px; line-height: 1.15; margin: 0 0 24px; letter-spacing: -0.01em; flex: 1; font-weight: 400; }
.sp-home .sp-t-card.feature .sp-t-quote { color: white; }
.sp-home .sp-t-card.feature .sp-t-quote::before { content: "\\201C"; font-size: 80px; line-height: 0; position: relative; top: 26px; margin-right: 4px; color: var(--sp-green); }
.sp-home .sp-t-meta { display: flex; align-items: center; gap: 12px; margin-top: auto; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-home .sp-t-card.feature .sp-t-meta { border-color: rgba(255,255,255,0.12); }
.sp-home .sp-t-avatar { width: 44px; height: 44px; border-radius: 999px; background-size: cover; background-position: center; background-color: var(--sp-blue); flex: 0 0 44px; }
.sp-home .sp-t-person { font-weight: 600; font-size: 14px; }
.sp-home .sp-t-role { font-size: 12px; color: var(--sp-muted); }
.sp-home .sp-t-card.feature .sp-t-role { color: rgba(255,255,255,0.6); }
.sp-home .sp-t-stars { color: var(--sp-accent); font-size: 14px; margin-bottom: 16px; letter-spacing: 2px; }
.sp-home .sp-t-result { margin-top: 20px; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: rgba(14,159,110,0.1); color: var(--sp-green); border-radius: 999px; font-size: 12px; font-weight: 600; align-self: flex-start; }
.sp-home .sp-t-card.feature .sp-t-result { background: rgba(255,255,255,0.08); color: #7AE2B8; }

/* Pricing teaser */
.sp-home .sp-pricing { background: radial-gradient(800px 400px at 80% 20%, rgba(14,159,110,0.12), transparent 60%), var(--sp-paper-2); padding: 120px 0; }
.sp-home .sp-pt-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 64px; align-items: center; }
.sp-home .sp-pt-left h2 { font-family: var(--sp-display); font-size: clamp(48px, 6vw, 80px); line-height: 1; margin: 8px 0 20px; letter-spacing: -0.01em; font-weight: 400; }
.sp-home .sp-pt-left h2 span { color: var(--sp-green); font-style: italic; }
.sp-home .sp-pt-left p { font-size: 18px; color: var(--sp-ink-2); margin-bottom: 28px; line-height: 1.55; }
.sp-home .sp-pt-list { list-style: none; padding: 0; margin: 0 0 32px; }
.sp-home .sp-pt-list li { display: flex; gap: 12px; padding: 10px 0; font-size: 15px; color: var(--sp-ink-2); align-items: center; }
.sp-home .sp-pt-list li svg { flex: 0 0 20px; color: var(--sp-green); }
.sp-home .sp-pt-card { background: white; border: 1px solid var(--sp-line); border-radius: 24px; padding: 40px; box-shadow: 0 40px 80px -30px rgba(10,15,30,0.35); position: relative; }
.sp-home .sp-pt-card::before { content: ""; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, var(--sp-blue), var(--sp-green), var(--sp-accent)); border-radius: 26px; z-index: -1; opacity: 0.6; filter: blur(12px); }
.sp-home .sp-pt-price { font-family: var(--sp-display); font-size: 96px; line-height: 1; font-weight: 400; }
.sp-home .sp-pt-price sub { font-size: 16px; font-family: var(--sp-ui); color: var(--sp-muted); vertical-align: top; font-weight: 400; margin-left: 6px; margin-top: 16px; display: inline-block; }
.sp-home .sp-pt-caption { font-weight: 600; color: var(--sp-ink-2); margin-top: 8px; }
.sp-home .sp-pt-rows { margin-top: 28px; padding-top: 28px; border-top: 1px solid var(--sp-line); }
.sp-home .sp-pt-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
.sp-home .sp-pt-row b { font-family: var(--sp-display); font-size: 18px; font-weight: 400; }
.sp-home .sp-pt-row.accent b { color: var(--sp-green); }

/* Final CTA */
.sp-home .sp-final-cta { padding: 140px 0; background: var(--sp-ink); color: white; position: relative; overflow: hidden; }
.sp-home .sp-final-cta::before { content: ""; position: absolute; inset: 0; background: radial-gradient(900px 500px at 20% 80%, rgba(31,95,224,0.3), transparent 60%), radial-gradient(700px 400px at 80% 20%, rgba(14,159,110,0.25), transparent 60%); }
.sp-home .sp-fc-inner { text-align: center; position: relative; }
.sp-home .sp-fc-inner h2 { font-family: var(--sp-display); font-size: clamp(56px, 8vw, 120px); line-height: 1; margin: 12px 0 24px; letter-spacing: -0.02em; font-weight: 400; }
.sp-home .sp-fc-inner h2 span { font-style: italic; color: var(--sp-green); }
.sp-home .sp-fc-inner p { color: rgba(255,255,255,0.7); max-width: 560px; margin: 0 auto 40px; font-size: 18px; }
.sp-home .sp-fc-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* Responsive */
@media (max-width: 1100px) {
  .sp-home .sp-hero-grid { grid-template-columns: 1fr; }
  .sp-home .sp-hero-visual { max-width: 520px; margin: 0 auto; width: 100%; }
  .sp-home .sp-hero-headline { font-size: clamp(48px, 8vw, 72px); }
  .sp-home .sp-feature-grid { grid-template-columns: repeat(2, 1fr); }
  .sp-home .sp-feat-big { grid-column: span 2; grid-row: auto; }
  .sp-home .sp-feat-outreach { grid-column: span 2; grid-row: auto; }
  .sp-home .sp-feat-wide { grid-column: span 2; grid-row: auto; }
  .sp-home .sp-feat-wide .sp-feat-row { flex-direction: column; align-items: stretch; }
  .sp-home .sp-steps { grid-template-columns: repeat(2, 1fr); }
  .sp-home .sp-steps::before { display: none; }
  .sp-home .sp-template-grid { grid-template-columns: 1fr 1fr; }
  .sp-home .sp-t-grid { grid-template-columns: 1fr; }
  .sp-home .sp-pt-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .sp-home .sp-section { padding: 80px 0; }
  .sp-home .sp-feature-grid { grid-template-columns: 1fr; }
  .sp-home .sp-feat-big, .sp-home .sp-feat-outreach, .sp-home .sp-feat-wide { grid-column: auto; }
  .sp-home .sp-steps { grid-template-columns: 1fr; }
  .sp-home .sp-template-grid { grid-template-columns: 1fr; }
  .sp-home .sp-hero-headline { font-size: 56px; }
  .sp-home .sp-wrap, .sp-home .sp-wrap-wide { padding: 0 20px; }
  .sp-home .sp-hero-trust { gap: 16px; }
}
`;

// Tiny inline SVG helpers
const Check = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);
const Play = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const HERO_VARIANTS = ["a", "b", "c"] as const;
type HeroVariant = (typeof HERO_VARIANTS)[number];

const Index = () => {
  const location = useLocation();
  useLandingPageTracking({ pageType: "home", pagePath: location.pathname });

  const [heroIdx, setHeroIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "sports" | "clubs" | "pto" | "events" | "music">("all");

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_VARIANTS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  const heroVariant: HeroVariant = HERO_VARIANTS[heroIdx];

  const trustLogos = [
    { initials: "LH", name: "Lincoln High", color: "#1F5FE0" },
    { initials: "WL", name: "Westlake Wildcats", color: "#0E9F6E" },
    { initials: "EV", name: "Evergreen MS", color: "#FF6B35" },
    { initials: "PC", name: "Pinecrest Robotics", color: "#8B5CF6" },
    { initials: "NH", name: "North Hills Theater", color: "#EC4899" },
    { initials: "RS", name: "Riverside PTO", color: "#06B6D4" },
    { initials: "OK", name: "Oak Grove Band", color: "#F59E0B" },
    { initials: "ML", name: "Maple Leaf HS", color: "#1F5FE0" },
  ];

  const templates: { cat: "sports" | "clubs" | "pto" | "events" | "music"; img: string; tag: string; title: string; meta: string; raised: string }[] = [
    { cat: "sports", img: "https://images.unsplash.com/photo-1552667466-07770ae110d0?w=900&q=80", tag: "Sports", title: "Varsity Season Fund", meta: "uniforms · travel · gear", raised: "$12k avg" },
    { cat: "music", img: "https://images.unsplash.com/photo-1519683109079-d5f539e1542f?w=900&q=80", tag: "Band", title: "Marching Band Trip", meta: "charter buses · hotels", raised: "$24k avg" },
    { cat: "pto", img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80", tag: "PTO", title: "Annual Fund Drive", meta: "recurring gifts · matching", raised: "$38k avg" },
    { cat: "sports", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&q=80", tag: "Booster", title: "Booster Club Membership", meta: "tiered memberships", raised: "$18k avg" },
    { cat: "events", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80", tag: "Event", title: "Fun Run / Jog-a-thon", meta: "per-lap pledges", raised: "$14k avg" },
    { cat: "clubs", img: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=900&q=80", tag: "Robotics", title: "Competition Team", meta: "parts · travel · entry", raised: "$22k avg" },
  ];
  const visibleTemplates = activeTab === "all" ? templates : templates.filter((t) => t.cat === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden max-w-[100vw]">
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <MarketingHeader />

      <main className="sp-home flex-1">
        {/* HERO */}
        <section className="sp-hero">
          <div className="sp-wrap-wide sp-hero-grid">
            <div>
              <span className="sp-chip sp-chip-green"><span className="sp-dot" /> 847 fundraisers raising right now</span>
              <h1 className="sp-hero-headline">
                Raise more.<br />
                Keep <span className="sp-hl-mark">all of it.</span>
              </h1>
              <p className="sp-hero-sub">
                The fundraising platform built for school teams, clubs, and PTOs.
                Zero platform fees, same-day payouts, and seven ways to run a fundraiser —
                so every dollar you raise ends up where it belongs.
              </p>
              <div className="sp-hero-ctas">
                <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">Start a fundraiser — free</Link>
                <Link to="/features" className="sp-btn sp-btn-ghost sp-btn-lg"><Play /> Watch a 90-sec tour</Link>
              </div>
              <div className="sp-hero-trust">
                <div className="sp-hero-trust-item"><Check /> No monthly fee</div>
                <div className="sp-hero-trust-item"><Check /> Same-day payouts</div>
                <div className="sp-hero-trust-item"><Check /> Live in minutes</div>
              </div>
            </div>

            <div className="sp-hero-visual">
              {/* Variant A: Photo */}
              <div className={`sp-hero-card ${heroVariant === "a" ? "active" : ""}`}>
                <div className="sp-hero-photo" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80')" }}>
                  <div className="sp-hero-photo-caption">
                    <h4>Lincoln HS Track Team</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
                      <span>$24,840 raised of $30,000</span>
                      <span>82%</span>
                    </div>
                    <div className="sp-bar"><div className="sp-bar-fill" style={{ width: "82%" }} /></div>
                  </div>
                </div>
                <div className="sp-hero-float f1">
                  <div className="sp-notif-head">
                    <div className="sp-notif-dot green">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    </div>
                    <div>
                      <div className="sp-notif-title">New donation</div>
                      <div className="sp-notif-main">$250 from the Chen family</div>
                    </div>
                  </div>
                  <div className="sp-notif-sub">Go Lincoln! 🏆 2 seconds ago</div>
                </div>
                <div className="sp-hero-float f2">
                  <div className="sp-notif-head">
                    <div className="sp-notif-dot blue">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    </div>
                    <div>
                      <div className="sp-notif-title">Payout</div>
                      <div className="sp-notif-main">$4,120 → Lincoln HS</div>
                    </div>
                  </div>
                  <div className="sp-notif-sub">Arrived 11:42 AM today</div>
                </div>
              </div>

              {/* Variant B: Leaderboard */}
              <div className={`sp-hero-card ${heroVariant === "b" ? "active" : ""}`}>
                <div className="sp-hero-board">
                  <div className="sp-board-head">
                    <h3>Top Teams this Week</h3>
                    <span className="sp-chip sp-chip-green"><span className="sp-dot" /> Live</span>
                  </div>
                  {[
                    { rank: 1, badge: "WL", grad: "linear-gradient(135deg, #FF6B35, #F7931E)", name: "Westlake Wildcats — Varsity Soccer", meta: "⚽ Soccer · 314 donors", raised: "$48k", goal: "$50k" },
                    { rank: 2, badge: "EV", grad: "linear-gradient(135deg, #1F5FE0, #0B3FB0)", name: "Evergreen Middle Band", meta: "🎺 Band · 267 donors", raised: "$38k", goal: "$40k" },
                    { rank: 3, badge: "PC", grad: "linear-gradient(135deg, #0E9F6E, #0A7553)", name: "Pinecrest Robotics", meta: "🤖 Club · 189 donors", raised: "$32k", goal: "$35k" },
                    { rank: 4, badge: "RS", grad: "linear-gradient(135deg, #8B5CF6, #6D28D9)", name: "Riverside PTO", meta: "🏫 PTO · 412 donors", raised: "$28k", goal: "$30k" },
                    { rank: 5, badge: "NH", grad: "linear-gradient(135deg, #EC4899, #BE185D)", name: "North Hills Theater", meta: "🎭 Club · 156 donors", raised: "$22k", goal: "$25k" },
                  ].map((t) => (
                    <div key={t.rank} className="sp-board-item">
                      <div className={`sp-rank ${t.rank === 1 ? "r1" : ""}`}>{t.rank}</div>
                      <div className="sp-team-avatar" style={{ background: t.grad }}>{t.badge}</div>
                      <div className="sp-team-info">
                        <div className="sp-team-name">{t.name}</div>
                        <div className="sp-team-meta"><span>{t.meta}</span></div>
                      </div>
                      <div className="sp-team-raised">{t.raised}<span className="small"> / {t.goal}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variant C: Fundraiser preview */}
              <div className={`sp-hero-card ${heroVariant === "c" ? "active" : ""}`}>
                <div className="sp-hero-campaign">
                  <div className="sp-c-browser">
                    <span className="sp-bdot" /><span className="sp-bdot" /><span className="sp-bdot" />
                    <div className="sp-c-url">sponsorly.io/c/hawks-basketball-2026</div>
                  </div>
                  <div className="sp-c-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1000&q=80')" }}>
                    <div className="sp-c-tag">Hawks × PTO</div>
                  </div>
                  <div className="sp-c-body">
                    <h3 className="sp-c-title">Hawks Basketball — New Uniforms & Travel</h3>
                    <p className="sp-c-desc">Help us send all 18 players to State. Every dollar goes to the team.</p>
                    <div className="sp-c-stats">
                      <div><b>$18,420</b>raised</div>
                      <div><b>204</b>donors</div>
                      <div><b>11</b>days left</div>
                    </div>
                    <div className="sp-c-bar"><div className="sp-c-bar-fill" style={{ width: "74%" }} /></div>
                    <div style={{ fontSize: 11, color: "var(--sp-muted)" }}>74% of $25,000 goal</div>
                    <div className="sp-c-donate">
                      <div className="sp-c-pill">$25</div>
                      <div className="sp-c-pill">$50</div>
                      <div className="sp-c-pill">$100</div>
                      <div className="sp-c-pill solid">Donate</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sp-hero-dots">
                {HERO_VARIANTS.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`Show hero variant ${i + 1}`}
                    onClick={() => setHeroIdx(i)}
                    className={`sp-hero-dot ${i === heroIdx ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="sp-trust-bar">
          <div className="sp-wrap">
            <div className="sp-trust-label">Trusted by 500+ schools, clubs &amp; PTOs across the country</div>
            <div className="sp-marquee">
              <div className="sp-marquee-track">
                {[...trustLogos, ...trustLogos].map((l, i) => (
                  <div key={i} className="sp-trust-logo">
                    <span className="sp-badge" style={{ background: l.color }}>{l.initials}</span>
                    {l.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="sp-section">
          <div className="sp-wrap">
            <div className="sp-sec-head">
              <span className="sp-eyebrow">Built to win</span>
              <h2>Everything your program needs, nothing it doesn&rsquo;t.</h2>
              <p>One platform, seven ways to fundraise, zero fees to get in the way.</p>
            </div>
            <div className="sp-feature-grid">
              {/* Big feature */}
              <div className="sp-feat sp-feat-big">
                <div className="sp-feat-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 7v2h22V7L12 2zm-5 9v7h2v-7H7zm4 0v7h2v-7h-2zm4 0v7h2v-7h-2zm-8 8h14v2H7v-2z" /></svg>
                </div>
                <h3>Zero platform fees.<br /><span style={{ opacity: 0.7 }}>Ever.</span></h3>
                <p>Other platforms take up to 20% before your team sees a dime. We take nothing — keep 100% of what you raise. Each donor pays a small application fee that covers your transaction costs and use of Sponsorly.</p>
                <div className="sp-receipt">
                  <div className="sp-receipt-row"><span>Total raised</span><span>$10,000.00</span></div>
                  <div className="sp-receipt-row"><span>Platform fee (other guys)</span><span className="strike">−$800.00</span></div>
                  <div className="sp-receipt-row good"><span>Platform fee (Sponsorly)</span><span>$0.00</span></div>
                  <div className="sp-receipt-row hl"><span>Your team keeps</span><span>$10,000.00</span></div>
                </div>
              </div>

              {/* Outreach (dark) */}
              <div className="sp-feat sp-feat-outreach">
                <div className="sp-feat-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" /><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" /></svg>
                </div>
                <h3>Automated outreach.<br /><span style={{ opacity: 0.7 }}>On autopilot.</span></h3>
                <p>Personalized email, text, and social prompts go out to your roster, alumni, and past donors — the moment your fundraiser launches, and again at the perfect follow-up beats. No spreadsheets, no BCC lists, no nagging parents.</p>
                <div className="sp-feat-viz" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 12px", borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(31,95,224,0.25)", color: "#9FBCFF", display: "grid", placeItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" /></svg>
                    </div>
                    <div style={{ flex: 1, fontSize: 12 }}>Launch email · <b>482 sent</b></div>
                    <div style={{ fontSize: 10, color: "var(--sp-green)", fontWeight: 700 }}>63% open</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 12px", borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(14,159,110,0.22)", color: "#7AE2B8", display: "grid", placeItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                    </div>
                    <div style={{ flex: 1, fontSize: 12 }}>SMS nudge · <b>Day 3 reminder</b></div>
                    <div style={{ fontSize: 10, color: "var(--sp-green)", fontWeight: 700 }}>Queued</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 12px", borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,107,53,0.22)", color: "#FFB088", display: "grid", placeItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                    </div>
                    <div style={{ flex: 1, fontSize: 12 }}>Share kit · <b>Auto-generated</b></div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Ready</div>
                  </div>
                </div>
              </div>

              {/* Same-day payouts */}
              <div className="sp-feat">
                <div className="sp-feat-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0022 15V9a2 2 0 00-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" /></svg>
                </div>
                <h3>Same-day payouts</h3>
                <p>Donations hit your bank account the same business day. No waiting weeks for a check.</p>
                <div className="sp-feat-viz" style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--sp-paper-2)", borderRadius: 10 }}>
                  <div style={{ fontFamily: "var(--sp-display)", fontSize: 28 }}>$4,120</div>
                  <div style={{ flex: 1, fontSize: 11, color: "var(--sp-muted)" }}>Transferred<br /><b style={{ color: "var(--sp-green)", fontFamily: "var(--sp-ui)" }}>Today, 11:42 AM</b></div>
                  <div style={{ color: "var(--sp-green)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                  </div>
                </div>
              </div>

              {/* Fundraising options */}
              <div className="sp-feat">
                <div className="sp-feat-ico" style={{ background: "rgba(14,159,110,0.1)", color: "var(--sp-green)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>
                <h3>Fundraising options</h3>
                <p>Standard donations with recurring options, event ticketing, sponsorships, pledges, and merchandise sales.</p>
                <div className="sp-feat-viz" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="sp-chip sp-chip-green">Sponsorships</span>
                  <span className="sp-chip">Donations</span>
                  <span className="sp-chip sp-chip-accent">Events</span>
                  <span className="sp-chip">Pledges</span>
                  <span className="sp-chip sp-chip-green">Merchandise</span>
                </div>
              </div>

              {/* Beautiful pages */}
              <div className="sp-feat">
                <div className="sp-feat-ico" style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
                </div>
                <h3>Beautiful fundraiser pages</h3>
                <p>Every fundraiser gets a page donors actually want to share. Mobile-first.</p>
                <div className="sp-feat-viz" style={{ display: "flex", gap: 4 }}>
                  <div style={{ flex: 1, aspectRatio: "3/4", background: "linear-gradient(180deg,#8B5CF6,#1F5FE0)", borderRadius: 6 }} />
                  <div style={{ flex: 1, aspectRatio: "3/4", background: "linear-gradient(180deg,#FF6B35,#EC4899)", borderRadius: 6 }} />
                  <div style={{ flex: 1, aspectRatio: "3/4", background: "linear-gradient(180deg,#0E9F6E,#06B6D4)", borderRadius: 6 }} />
                </div>
              </div>

              {/* Live dashboards */}
              <div className="sp-feat">
                <div className="sp-feat-ico" style={{ background: "rgba(6,182,212,0.1)", color: "#06B6D4" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18v-2H5V3H3zm16 13l-5-5-3 3-4-4-1.5 1.5L11 16l3-3 4 4 1-1z" /></svg>
                </div>
                <h3>Live dashboards</h3>
                <p>Track donations, donors, and shares in real time. Built for coaches and parents.</p>
                <div className="sp-feat-viz" style={{ padding: 8, background: "var(--sp-paper-2)", borderRadius: 10, height: 60, display: "flex", alignItems: "end", gap: 3 }}>
                  {[30, 55, 42, 78, 65, 90, 100].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: i >= 5 ? "var(--sp-green)" : "var(--sp-blue)", height: `${h}%`, borderRadius: 2 }} />
                  ))}
                </div>
              </div>

              {/* Wide: roster gamification */}
              <div className="sp-feat sp-feat-wide">
                <div className="sp-feat-row">
                  <div className="sp-feat-left">
                    <div className="sp-feat-ico" style={{ background: "rgba(255,107,53,0.1)", color: "var(--sp-accent)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10v2h3a1 1 0 011 1v3a5 5 0 01-5 5 5 5 0 01-4 2 5 5 0 01-4-2 5 5 0 01-5-5V5a1 1 0 011-1h3V2zm0 4H5v2a3 3 0 002 2.83V6zm10 0v4.83A3 3 0 0019 8V6h-2zm-5 10a1 1 0 00-1 1v2H8v2h8v-2h-3v-2a1 1 0 00-1-1z" /></svg>
                    </div>
                    <h3>Roster gamification</h3>
                    <p>Turn your roster into a friendly competition. Players, parents, and teams climb a live leaderboard, unlock badges, and hit streaks — fundraising that feels like the sport they love.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <span className="sp-chip sp-chip-accent">Leaderboards</span>
                      <span className="sp-chip">Badges</span>
                      <span className="sp-chip sp-chip-green">Streaks</span>
                      <span className="sp-chip">Team vs. team</span>
                    </div>
                  </div>
                  <div className="sp-feat-viz" style={{ background: "var(--sp-paper-2)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--sp-muted)", letterSpacing: ".12em", textTransform: "uppercase" }}>Team Leaderboard</span>
                      <span style={{ fontSize: 10, color: "var(--sp-muted)" }}>Week 3</span>
                    </div>
                    {[
                      { rank: 1, name: "Maya R.", amt: "$2,840", pct: 92, bg: "linear-gradient(135deg,#FFD54A,#FF8A3D)", fg: "#5B3200", barBg: "linear-gradient(90deg,var(--sp-accent),#FF8A3D)", emoji: "🔥" },
                      { rank: 2, name: "Jordan K.", amt: "$2,290", pct: 74, bg: "#E9ECF3", fg: "var(--sp-ink-2)", barBg: "var(--sp-blue)", badge: "★" },
                      { rank: 3, name: "Ana S.", amt: "$1,780", pct: 58, bg: "#E9ECF3", fg: "var(--sp-ink-2)", barBg: "var(--sp-blue)" },
                    ].map((r) => (
                      <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--sp-line)" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 999, background: r.bg, display: "grid", placeItems: "center", fontFamily: "var(--sp-display)", fontSize: 12, color: r.fg }}>{r.rank}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</div>
                          <div style={{ height: 4, background: "#EEF0F5", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${r.pct}%`, background: r.barBg, borderRadius: 999 }} />
                          </div>
                        </div>
                        <div style={{ fontFamily: "var(--sp-display)", fontSize: 14 }}>{r.amt}</div>
                        {r.emoji && <div style={{ fontSize: 12 }}>{r.emoji}</div>}
                        {r.badge && <div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--sp-green)", display: "grid", placeItems: "center", color: "white", fontSize: 9, fontWeight: 700 }}>{r.badge}</div>}
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(14,159,110,0.08)", color: "var(--sp-green)", padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, background: "var(--sp-green)", borderRadius: 999, display: "inline-block" }} />
                        New badge unlocked · &ldquo;First $1k&rdquo;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="sp-how">
          <div className="sp-wrap">
            <div className="sp-sec-head">
              <span className="sp-eyebrow" style={{ color: "var(--sp-green)" }}>How it works</span>
              <h2>From zero to raising<br />in under 10 minutes.</h2>
              <p>Four steps. No gatekeepers. No credit card needed to start.</p>
            </div>
            <div className="sp-steps">
              {[
                { n: 1, t: "Connect to Stripe", d: "Link your program's bank account in a few clicks. Stripe handles secure payments — we never touch your money.", time: "2 minutes" },
                { n: 2, t: "Create a Fundraiser", d: "Customize your program's branding, use AI Fundraiser Assistant to create a fundraiser. Launch a beautiful, shareable landing page.", time: "5 minutes" },
                { n: 3, t: "Share with your Community", d: "Text, email, social, QR — supporters check out in two taps on any phone.", time: "instantly" },
                { n: 4, t: "Cash in the Bank", d: "Same-day payouts to your program's account. Receipts sent automatically.", time: "same day" },
              ].map((s) => (
                <div key={s.n} className="sp-step">
                  <div className="sp-step-num">{s.n}</div>
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                  <span className="sp-step-time">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEMPLATES */}
        <section className="sp-section sp-templates">
          <div className="sp-wrap">
            <div className="sp-sec-head">
              <span className="sp-eyebrow">Fundraising options</span>
              <h2>Find your starting line.</h2>
              <p>Proven fundraising tools for programs like yours — customized in minutes, not days.</p>
            </div>
            <div className="sp-template-tabs">
              {[
                { k: "all", l: "All" },
                { k: "sports", l: "Sports" },
                { k: "clubs", l: "Clubs" },
                { k: "pto", l: "PTO / PTA" },
                { k: "events", l: "Events" },
                { k: "music", l: "Marching Bands" },
              ].map((t) => (
                <button
                  key={t.k}
                  type="button"
                  className={`sp-template-tab ${activeTab === t.k ? "active" : ""}`}
                  onClick={() => setActiveTab(t.k as typeof activeTab)}
                >
                  {t.l}
                </button>
              ))}
            </div>
            <div className="sp-template-grid">
              {visibleTemplates.map((t, i) => (
                <div key={i} className="sp-template-card">
                  <div className="sp-template-img" style={{ backgroundImage: `url('${t.img}')` }}>
                    <div className="sp-template-tag">{t.tag}</div>
                  </div>
                  <div className="sp-template-body">
                    <h4>{t.title}</h4>
                    <div className="meta"><span>{t.meta}</span><span className="raised">{t.raised}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="sp-section sp-testimonials">
          <div className="sp-wrap">
            <div className="sp-sec-head">
              <span className="sp-eyebrow">Real coaches. Real parents.</span>
              <h2>The people who run the show.</h2>
            </div>
            <div className="sp-t-grid">
              <div className="sp-t-card feature">
                <div className="sp-t-stars">★★★★★</div>
                <p className="sp-t-quote">We switched to Sponsorly and raised more in six weeks than we did in the entire last season. The zero-fee thing isn&rsquo;t a gimmick — it&rsquo;s the whole game.</p>
                <div className="sp-t-result"><Check size={12} /> +168% vs. prior platform</div>
                <div className="sp-t-meta">
                  <div className="sp-t-avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80')" }} />
                  <div>
                    <div className="sp-t-person">Coach Marcus Reyes</div>
                    <div className="sp-t-role">Lincoln HS · Track &amp; Field</div>
                  </div>
                </div>
              </div>
              <div className="sp-t-card">
                <div className="sp-t-stars">★★★★★</div>
                <p className="sp-t-quote">Our PTO volunteers figured it out in an afternoon. Parents donate on their phones. Receipts go out on their own. Our job got a lot smaller.</p>
                <div className="sp-t-result"><Check size={12} /> 412 donors in 3 weeks</div>
                <div className="sp-t-meta">
                  <div className="sp-t-avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80')" }} />
                  <div>
                    <div className="sp-t-person">Jenna Park</div>
                    <div className="sp-t-role">Riverside Elementary PTO</div>
                  </div>
                </div>
              </div>
              <div className="sp-t-card">
                <div className="sp-t-stars">★★★★★</div>
                <p className="sp-t-quote">The peer-to-peer setup let every kid on the team run their own page. They shared it with grandparents and friends. It spread way beyond our bubble.</p>
                <div className="sp-t-result"><Check size={12} /> $48k on a $30k goal</div>
                <div className="sp-t-meta">
                  <div className="sp-t-avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80')" }} />
                  <div>
                    <div className="sp-t-person">Danielle Brooks</div>
                    <div className="sp-t-role">Westlake HS · Soccer Booster</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING TEASER */}
        <section className="sp-pricing" id="pricing">
          <div className="sp-wrap sp-pt-grid">
            <div className="sp-pt-left">
              <span className="sp-eyebrow">Pricing</span>
              <h2>Free to get in.<br /><span>Free to stay.</span></h2>
              <p>No contracts. No monthly minimums. No platform fee on a single dollar donated. Donors cover a small standard processing fee at checkout — that&rsquo;s optional, and 94% opt in.</p>
              <ul className="sp-pt-list">
                <li><Check size={20} /> Unlimited fundraisers</li>
                <li><Check size={20} /> Unlimited donors &amp; donations</li>
                <li><Check size={20} /> Full donor CRM &amp; exports</li>
                <li><Check size={20} /> Email + chat support, real humans</li>
              </ul>
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">Start your first fundraiser →</Link>
            </div>
            <div className="sp-pt-card">
              <span className="sp-chip sp-chip-green"><span className="sp-dot" /> Everyone gets this</span>
              <div style={{ marginTop: 16 }}>
                <div className="sp-pt-price">$0<sub>/month</sub></div>
                <div className="sp-pt-caption">for your whole organization, forever</div>
              </div>
              <div className="sp-pt-rows">
                <div className="sp-pt-row accent"><span>Platform fee</span><b>0%</b></div>
                <div className="sp-pt-row"><span>Processing fee (donor-covered)</span><b>2.9% + 30¢</b></div>
                <div className="sp-pt-row"><span>Monthly software fee</span><b>$0</b></div>
                <div className="sp-pt-row"><span>Setup cost</span><b>$0</b></div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="sp-final-cta">
          <div className="sp-wrap sp-fc-inner">
            <span className="sp-eyebrow" style={{ color: "var(--sp-green)" }}>Game time</span>
            <h2>Your next season.<br /><span>Fully funded.</span></h2>
            <p>Join school sports teams, clubs, and PTOs raising smarter with Sponsorly. It takes about 8 minutes to go live.</p>
            <div className="sp-fc-btns">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">Start a fundraiser — free</Link>
              <Link to="/features" className="sp-btn sp-btn-ghost-dark sp-btn-lg">Explore features →</Link>
            </div>
            <div style={{ marginTop: 40, display: "flex", gap: 28, justifyContent: "center", fontSize: 13, color: "rgba(255,255,255,0.6)", flexWrap: "wrap" }}>
              <span>✓ No credit card required</span>
              <span>✓ Set up in minutes</span>
              <span>✓ Cancel anytime (but you won&rsquo;t want to)</span>
            </div>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
};

export default Index;