import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { SeoHead } from "@/components/seo/SeoHead";
import { allStates } from "@/lib/stateUtils";
import heroImage from "@/assets/schools-hero.png";
import teamImage from "@/assets/team-collaboration.jpg";

/**
 * Sponsorly for Schools — rebuilt to match the approved 2026 mockup.
 * Fully scoped under .sp-schools so the rest of the app's design
 * system is untouched. Mirrors typography + tokens from
 * src/pages/Features.tsx and src/pages/Pricing.tsx.
 */

const SCOPED_CSS = `
.sp-schools {
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
.sp-schools .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-schools .sp-italic { font-style: italic; }
.sp-schools .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(31,95,224,0.08); color: var(--sp-blue); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-schools .sp-eyebrow-green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-schools .sp-eyebrow-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-schools .sp-eyebrow-light { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.92); }
.sp-schools .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-schools .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-schools .sp-btn:hover { transform: translateY(-1px); }
.sp-schools .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-schools .sp-btn-primary { background: var(--sp-blue); color: white; box-shadow: 0 6px 18px -6px rgba(31,95,224,0.55); }
.sp-schools .sp-btn-primary:hover { background: var(--sp-blue-deep); }
.sp-schools .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-schools .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-schools .sp-btn-white { background: white; color: var(--sp-ink); }
.sp-schools .sp-btn-white:hover { background: rgba(255,255,255,0.92); }
.sp-schools .sp-btn-outline-white { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
.sp-schools .sp-btn-outline-white:hover { background: rgba(255,255,255,0.10); }

/* Section primitives */
.sp-schools .sp-section { padding: 96px 0; }
.sp-schools .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-schools .sp-section.white { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-schools .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-schools .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-schools .sp-display-h2 .accent-green { color: var(--sp-green); font-style: italic; }
.sp-schools .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-schools .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 540px; }

/* HERO */
.sp-schools .sp-hero { position: relative; padding: 72px 0 64px; overflow: hidden; background:
  radial-gradient(900px 480px at 80% -10%, rgba(31,95,224,0.10), transparent 60%),
  radial-gradient(700px 360px at 5% 0%, rgba(14,159,110,0.08), transparent 60%),
  var(--sp-paper); }
.sp-schools .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
.sp-schools .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(46px, 5.8vw, 80px); line-height: 1.02; letter-spacing: -0.02em; margin: 22px 0 22px; color: var(--sp-ink); }
.sp-schools .sp-hero h1 .accent { color: var(--sp-green); font-style: italic; }
.sp-schools .sp-hero p.sub { font-size: 17px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-schools .sp-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
.sp-schools .sp-hero-meta { display: flex; gap: 20px; margin-top: 22px; font-size: 12px; color: var(--sp-muted); }
.sp-schools .sp-hero-meta span::before { content: "•"; margin-right: 8px; color: var(--sp-line); }
.sp-schools .sp-hero-meta span:first-child::before { display: none; }

.sp-schools .sp-hero-card { position: relative; }
.sp-schools .sp-hero-card .frame { position: relative; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.35); transform: rotate(2deg); }
.sp-schools .sp-hero-card .frame img { width: 100%; height: 100%; display: block; object-fit: cover; }
.sp-schools .sp-hero-card .frame .frame-label { position: absolute; left: 18px; bottom: 18px; color: white; font-family: var(--sp-display); font-size: 22px; line-height: 1.1; text-shadow: 0 2px 12px rgba(0,0,0,0.4); }
.sp-schools .sp-hero-card .frame .frame-label small { display: block; font-family: var(--sp-ui); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.85; margin-bottom: 4px; font-weight: 600; }
.sp-schools .sp-hero-stat { position: absolute; top: -14px; right: -14px; background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 12px 16px; box-shadow: 0 14px 28px -14px rgba(10,15,30,0.30); transform: rotate(-3deg); }
.sp-schools .sp-hero-stat .lbl { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-muted); font-weight: 600; }
.sp-schools .sp-hero-stat .val { font-family: var(--sp-display); font-size: 26px; color: var(--sp-ink); line-height: 1.1; }

/* Programs strip */
.sp-schools .sp-programs { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-top: 32px; }
.sp-schools .sp-program { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 18px 14px; text-align: center; transition: transform .15s ease, box-shadow .2s ease; }
.sp-schools .sp-program:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -16px rgba(10,15,30,0.18); }
.sp-schools .sp-program .ico { width: 38px; height: 38px; border-radius: 999px; display: grid; place-items: center; margin: 0 auto 10px; }
.sp-schools .sp-program h4 { font-size: 13px; font-weight: 600; color: var(--sp-ink); margin-bottom: 2px; }
.sp-schools .sp-program p { font-size: 11px; color: var(--sp-muted); }

/* Two-column section */
.sp-schools .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-schools .sp-bullets { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-direction: column; gap: 14px; }
.sp-schools .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-schools .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: rgba(14,159,110,0.12); color: var(--sp-green); display: grid; place-items: center; margin-top: 2px; }
.sp-schools .sp-bullets li b { font-weight: 600; color: var(--sp-ink); margin-right: 6px; }
.sp-schools .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Dashboard mock */
.sp-schools .sp-dash { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 18px; box-shadow: 0 28px 56px -32px rgba(10,15,30,0.25); }
.sp-schools .sp-dash-bar { display: flex; gap: 6px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--sp-line); }
.sp-schools .sp-dash-bar .dot { width: 9px; height: 9px; border-radius: 999px; background: var(--sp-line); }
.sp-schools .sp-dash-bar .dot.r { background: #FF7A6B; }
.sp-schools .sp-dash-bar .dot.y { background: #FFC93C; }
.sp-schools .sp-dash-bar .dot.g { background: #5DCB8A; }
.sp-schools .sp-dash-bar .url { margin-left: 12px; flex: 1; height: 22px; background: var(--sp-paper-2); border-radius: 6px; }
.sp-schools .sp-dash-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px 0; }
.sp-schools .sp-dash-stat { background: var(--sp-paper); border: 1px solid var(--sp-line); border-radius: 12px; padding: 14px; }
.sp-schools .sp-dash-stat .lbl { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sp-muted); font-weight: 600; }
.sp-schools .sp-dash-stat .val { font-family: var(--sp-display); font-size: 30px; color: var(--sp-ink); line-height: 1.1; margin-top: 4px; }
.sp-schools .sp-dash-chart { background: var(--sp-paper); border: 1px solid var(--sp-line); border-radius: 12px; padding: 14px; }
.sp-schools .sp-dash-chart .ttl { font-size: 12px; color: var(--sp-muted); font-weight: 600; }
.sp-schools .sp-dash-chart svg { width: 100%; height: 90px; margin-top: 8px; }

/* Image card (teams) */
.sp-schools .sp-image-card { position: relative; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 60px -32px rgba(10,15,30,0.32); }
.sp-schools .sp-image-card img { width: 100%; height: 100%; display: block; object-fit: cover; aspect-ratio: 5 / 4; }

/* Mini feature cards */
.sp-schools .sp-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 40px; }
.sp-schools .sp-mini { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 20px; }
.sp-schools .sp-mini .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px; background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-schools .sp-mini h4 { font-size: 15px; font-weight: 600; color: var(--sp-ink); margin-bottom: 4px; }
.sp-schools .sp-mini p { font-size: 13px; color: var(--sp-muted); line-height: 1.5; }

/* Programs list mock */
.sp-schools .sp-list-card { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 18px; box-shadow: 0 28px 56px -32px rgba(10,15,30,0.20); }
.sp-schools .sp-list-card .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--sp-line); }
.sp-schools .sp-list-card .head h5 { font-size: 13px; font-weight: 600; color: var(--sp-ink); letter-spacing: 0.04em; text-transform: uppercase; }
.sp-schools .sp-list-card .head .pill { font-size: 11px; padding: 3px 10px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-ink-2); font-weight: 600; }
.sp-schools .sp-list-row { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--sp-line); }
.sp-schools .sp-list-row:last-child { border-bottom: 0; }
.sp-schools .sp-list-row .swatch { width: 28px; height: 28px; border-radius: 8px; flex: 0 0 28px; display: grid; place-items: center; color: white; font-weight: 700; font-size: 12px; }
.sp-schools .sp-list-row .info { flex: 1; }
.sp-schools .sp-list-row .info .nm { font-size: 14px; font-weight: 600; color: var(--sp-ink); }
.sp-schools .sp-list-row .info .sub { font-size: 12px; color: var(--sp-muted); }
.sp-schools .sp-list-row .amt { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); }
.sp-schools .sp-list-row .badge { font-size: 10px; letter-spacing: 0.10em; text-transform: uppercase; color: var(--sp-green); font-weight: 700; padding: 3px 8px; background: rgba(14,159,110,0.12); border-radius: 999px; margin-left: 8px; }

/* Smarter Safer Free */
.sp-schools .sp-trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }
.sp-schools .sp-trio-card { background: var(--sp-paper-2); border: 1px solid var(--sp-line); border-radius: 18px; padding: 28px 24px; text-align: center; }
.sp-schools .sp-trio-card .ico { width: 44px; height: 44px; border-radius: 999px; display: grid; place-items: center; margin: 0 auto 14px; background: white; border: 1px solid var(--sp-line); }
.sp-schools .sp-trio-card h4 { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); margin-bottom: 6px; }
.sp-schools .sp-trio-card p { font-size: 13px; color: var(--sp-ink-2); line-height: 1.5; }

/* Trust band */
.sp-schools .sp-trust { background: linear-gradient(135deg, var(--sp-blue) 0%, var(--sp-blue-deep) 100%); color: white; padding: 64px 0; }
.sp-schools .sp-trust .ttl { text-align: center; font-family: var(--sp-display); font-size: clamp(20px, 2vw, 26px); max-width: 720px; margin: 0 auto 8px; line-height: 1.3; }
.sp-schools .sp-trust .sub { text-align: center; font-size: 13px; opacity: 0.85; max-width: 720px; margin: 0 auto 36px; }
.sp-schools .sp-trust-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.sp-schools .sp-trust-stat { text-align: center; }
.sp-schools .sp-trust-stat .v { font-family: var(--sp-display); font-size: clamp(48px, 6vw, 72px); line-height: 1; letter-spacing: -0.02em; }
.sp-schools .sp-trust-stat .l { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.85; margin-top: 8px; font-weight: 600; }

/* Browse by state */
.sp-schools .sp-state-wrap { max-width: 1180px; margin: 40px auto 0; }
.sp-schools .sp-state-grid { display: grid; grid-template-columns: repeat(4, 1fr); column-gap: 56px; row-gap: 8px; align-items: start; }
.sp-schools .sp-state-letter { font-family: var(--sp-display); font-weight: 400; font-size: 56px; line-height: 1; color: var(--sp-blue); padding: 28px 0 10px; border-bottom: 1px solid var(--sp-line); margin-bottom: 14px; }
.sp-schools .sp-state-letter:first-child { padding-top: 0; }
.sp-schools .sp-state-link { display: block; padding: 6px 0; font-size: 15px; color: var(--sp-ink); transition: color .15s ease; }
.sp-schools .sp-state-link:hover { color: var(--sp-blue); }
@media (max-width: 980px) {
  .sp-schools .sp-state-grid { grid-template-columns: repeat(2, 1fr); column-gap: 32px; }
}
@media (max-width: 560px) {
  .sp-schools .sp-state-grid { grid-template-columns: 1fr; }
}

/* Final CTA dark */
.sp-schools .sp-cta-dark { background: #0A0F1E; color: white; padding: 96px 0; text-align: center; position: relative; overflow: hidden; }
.sp-schools .sp-cta-dark::before { content: ""; position: absolute; inset: 0; background:
  radial-gradient(800px 300px at 50% -10%, rgba(31,95,224,0.35), transparent 60%),
  radial-gradient(600px 240px at 50% 110%, rgba(14,159,110,0.20), transparent 60%); pointer-events: none; }
.sp-schools .sp-cta-dark .inner { position: relative; max-width: 720px; margin: 0 auto; padding: 0 32px; }
.sp-schools .sp-cta-dark h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 60px); line-height: 1.05; letter-spacing: -0.01em; margin: 18px 0 16px; }
.sp-schools .sp-cta-dark h2 .accent { color: var(--sp-green); font-style: italic; }
.sp-schools .sp-cta-dark p { font-size: 15.5px; opacity: 0.78; max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-schools .sp-cta-dark .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Eyebrow row centered */
.sp-schools .sp-center { text-align: center; }
.sp-schools .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-schools .sp-center .sp-lead { margin: 0 auto; }

/* Responsive */
@media (max-width: 980px) {
  .sp-schools .sp-section { padding: 64px 0; }
  .sp-schools .sp-hero-grid, .sp-schools .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-schools .sp-programs { grid-template-columns: repeat(3, 1fr); }
  .sp-schools .sp-mini-grid, .sp-schools .sp-trio, .sp-schools .sp-trust-stats { grid-template-columns: 1fr; }
  .sp-schools .sp-hero-card .frame { transform: none; }
  .sp-schools .sp-hero-stat { right: 8px; top: -8px; }
}
@media (max-width: 560px) {
  .sp-schools .sp-wrap { padding: 0 20px; }
  .sp-schools .sp-programs { grid-template-columns: repeat(2, 1fr); }
}
`;

/* Inline icons */
const ITrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const IUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IMusic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
);
const IHeart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const IGrad = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);
const ITheater = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3 -2 6 -2 6 2 6 2 -3 6 -6 6 -6 -6 -6 -6z"/><path d="M10 14s3 -2 6 -2 6 2 6 2 -3 6 -6 6 -6 -6 -6 -6z"/></svg>
);
const ICheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const IRoster = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/><path d="M7 17h4"/></svg>
);
const IBrand = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/><path d="M3 12h18"/></svg>
);
const IShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const ISparkle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8"/></svg>
);
const IPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);

/* State directory — 4 balanced columns, letter-grouped, matches mockup */
const StateDirectory = () => {
  const groups = allStates.reduce((acc, state) => {
    const letter = state.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(state);
    return acc;
  }, {} as Record<string, typeof allStates>);

  const letters = Object.keys(groups).sort();

  // Balance into 4 columns by total row count (letter header counts as 1 row)
  const columns: string[][] = [[], [], [], []];
  const colWeight = [0, 0, 0, 0];
  letters.forEach((l) => {
    const weight = 1 + groups[l].length;
    let target = 0;
    for (let i = 1; i < 4; i++) if (colWeight[i] < colWeight[target]) target = i;
    columns[target].push(l);
    colWeight[target] += weight;
  });

  return (
    <div className="sp-state-grid">
      {columns.map((colLetters, ci) => (
        <div key={ci}>
          {colLetters.map((letter) => (
            <div key={letter}>
              <div className="sp-state-letter">{letter}</div>
              {groups[letter].map((state) => (
                <Link
                  key={state.abbreviation}
                  to={`/schools/${state.slug}`}
                  className="sp-state-link"
                >
                  {state.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Schools = () => {
  const programs = [
    { Icon: ITrophy, title: "Sports Teams", sub: "Varsity & JV", bg: "rgba(31,95,224,0.10)", color: "#1F5FE0", to: "/schools/sports-teams" },
    { Icon: IUsers, title: "PTOs & PTAs", sub: "Parent groups", bg: "rgba(14,159,110,0.10)", color: "#0E9F6E", to: "/schools/pto-pta" },
    { Icon: IMusic, title: "Music Programs", sub: "Band & orchestra", bg: "rgba(255,107,53,0.10)", color: "#FF6B35", to: "/schools/marching-bands" },
    { Icon: IHeart, title: "Booster Clubs", sub: "Athletics & arts", bg: "rgba(123,91,224,0.10)", color: "#7B5BE0", to: "/schools/booster-clubs" },
    { Icon: IGrad, title: "Academic Clubs", sub: "Honor & STEM", bg: "rgba(224,162,31,0.12)", color: "#E0A21F", to: "/fundraisers" },
    { Icon: ITheater, title: "Arts Clubs", sub: "Theater & dance", bg: "rgba(224,79,139,0.10)", color: "#E04F8B", to: "/fundraisers" },
  ];

  const programList = [
    { color: "#1F5FE0", letter: "L", name: "Lincoln Athletics", sub: "All sports • 6 teams", amt: "$18,420", badge: "Active" },
    { color: "#0E9F6E", letter: "P", name: "PTO General Fund", sub: "School-wide", amt: "$11,250", badge: "Active" },
    { color: "#FF6B35", letter: "D", name: "Drama Club", sub: "Spring musical", amt: "$5,830", badge: "Active" },
    { color: "#7B5BE0", letter: "R", name: "Robotics Team", sub: "Equipment fund", amt: "$3,910", badge: "Active" },
    { color: "#E04F8B", letter: "T", name: "Theater Boosters", sub: "Production crew", amt: "$2,140", badge: "New" },
  ];

  return (
    <>
      <SeoHead
        title="Sponsorly for Schools — Fundraising for Teams, Clubs & PTOs"
        description="Powerful fundraising platform for K-12 schools. Manage sports teams, clubs, band, theater, and PTOs in one place — with 100% of donations going to your programs."
        path="/schools"
      />
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="sp-schools min-h-screen">
        <MarketingHeader />

        {/* HERO */}
        <section className="sp-hero">
          <div className="sp-wrap">
            <div className="sp-hero-grid">
              <div>
                <span className="sp-eyebrow sp-eyebrow-green">Built for K-12 Schools</span>
                <h1 className="sp-display">
                  Everything your school needs to <span className="accent">fundraise smarter.</span>
                </h1>
                <p className="sub">
                  One platform for teams, clubs, and PTOs — with zero platform fees, automated payouts, and tools that every program leader can run on their own.
                </p>
                <div className="sp-hero-ctas">
                  <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                    Start free <IArrow />
                  </Link>
                  <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">Book a demo</Link>
                </div>
                <div className="sp-hero-meta">
                  <span>5-minute setup</span>
                  <span>No contracts</span>
                  <span>100% to programs</span>
                </div>
              </div>
              <div className="sp-hero-card">
                <div className="frame" style={{ aspectRatio: "4 / 5" }}>
                  <img src={heroImage} alt="High school students working together on a fundraising campaign" />
                  <div className="frame-label">
                    <small>Westlake H.S.</small>
                    All Programs
                  </div>
                </div>
                <div className="sp-hero-stat">
                  <div className="lbl">Today</div>
                  <div className="val">$2,225</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMS STRIP */}
        <section className="sp-section white">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow">Every Program Is One Platform</span>
            <h2 className="sp-display-h2">
              Certified for <span className="accent-blue">every school program.</span>
            </h2>
            <p className="sp-lead">
              From varsity football to spring musicals, Sponsorly equips every team and club with the same world-class fundraising tools.
            </p>
            <div className="sp-programs">
              {programs.map((p, i) => (
                <Link to={p.to} className="sp-program" key={i} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="ico" style={{ background: p.bg, color: p.color }}>
                    <p.Icon />
                  </div>
                  <h4>{p.title}</h4>
                  <p>{p.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SEE EVERY DOLLAR */}
        <section className="sp-section alt">
          <div className="sp-wrap">
            <div className="sp-two">
              <div>
                <span className="sp-eyebrow">School-Wide Visibility</span>
                <h2 className="sp-display-h2">
                  See every dollar.<br />
                  <span className="accent-blue">Across every program.</span>
                </h2>
                <p className="sp-lead">
                  Principals and athletic directors finally get a unified dashboard tracking every fundraiser, team, and club campaign — with real-time donor receipts and audit-ready reports.
                </p>
                <ul className="sp-bullets">
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Pay-as-you-play —</b> no contracts, no monthly fees, every program is in.</span>
                  </li>
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Automated payouts —</b> nightly transfers go straight to the right group.</span>
                  </li>
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Self-serve reports —</b> coaches and parents see live progress, no spreadsheet chasing.</span>
                  </li>
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Automatic tax receipts —</b> IRS-compliant receipts sent the moment a donation is made.</span>
                  </li>
                </ul>
              </div>
              <div className="sp-dash">
                <div className="sp-dash-bar">
                  <span className="dot r" /><span className="dot y" /><span className="dot g" />
                  <div className="url" />
                </div>
                <div className="sp-dash-stats">
                  <div className="sp-dash-stat">
                    <div className="lbl">Total raised</div>
                    <div className="val">$82,400</div>
                  </div>
                  <div className="sp-dash-stat">
                    <div className="lbl">Active campaigns</div>
                    <div className="val">18</div>
                  </div>
                </div>
                <div className="sp-dash-chart">
                  <div className="ttl">Year-to-date growth</div>
                  <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="schGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#1F5FE0" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="#1F5FE0" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,72 C30,68 50,60 80,54 C110,48 135,52 160,40 C190,26 220,30 250,18 C275,8 290,6 300,4 L300,90 L0,90 Z" fill="url(#schGrad)" />
                    <path d="M0,72 C30,68 50,60 80,54 C110,48 135,52 160,40 C190,26 220,30 250,18 C275,8 290,6 300,4" fill="none" stroke="#1F5FE0" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAMS RAISE MORE */}
        <section className="sp-section white">
          <div className="sp-wrap">
            <div className="sp-two">
              <div className="sp-image-card">
                <img src={teamImage} alt="Students collaborating on a school fundraising project" />
              </div>
              <div>
                <span className="sp-eyebrow sp-eyebrow-accent">For Coaches & Sponsors</span>
                <h2 className="sp-display-h2">
                  Your teams raise more <span className="accent-accent">when they own it.</span>
                </h2>
                <p className="sp-lead">
                  Coaches and advisors run their own fundraisers with guardrails. You keep oversight; they get the tools — no more chasing spreadsheets and group texts.
                </p>
              </div>
            </div>
            <div className="sp-mini-grid">
              <div className="sp-mini">
                <div className="ico"><IZap /></div>
                <h4>Launch in minutes</h4>
                <p>Pre-built campaign templates for sports seasons, equipment drives, and travel tournaments.</p>
              </div>
              <div className="sp-mini">
                <div className="ico" style={{ background: "rgba(14,159,110,0.10)", color: "#0E9F6E" }}><IRoster /></div>
                <h4>Organize your roster</h4>
                <p>Upload rosters in seconds. Players get personal links so every dollar gets attributed correctly.</p>
              </div>
              <div className="sp-mini">
                <div className="ico" style={{ background: "rgba(255,107,53,0.10)", color: "#FF6B35" }}><IBrand /></div>
                <h4>Look like a brand</h4>
                <p>Customizable, mobile-first donation pages with your school's colors, logos, and team imagery.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MULTIPLE PROGRAMS */}
        <section className="sp-section alt">
          <div className="sp-wrap">
            <div className="sp-two">
              <div className="sp-list-card">
                <div className="head">
                  <h5>Westlake H.S. — Programs</h5>
                  <span className="pill">5 active</span>
                </div>
                {programList.map((row, i) => (
                  <div className="sp-list-row" key={i}>
                    <div className="swatch" style={{ background: row.color }}>{row.letter}</div>
                    <div className="info">
                      <div className="nm">{row.name}</div>
                      <div className="sub">{row.sub}</div>
                    </div>
                    <div className="amt">{row.amt}</div>
                    <span className="badge">{row.badge}</span>
                  </div>
                ))}
              </div>
              <div>
                <span className="sp-eyebrow sp-eyebrow-green">Multi-Program Ready</span>
                <h2 className="sp-display-h2">
                  Support multiple programs <span className="accent-green">from one account.</span>
                </h2>
                <p className="sp-lead">
                  Booster clubs, PTOs, and athletic departments get every team in one place — under one chart of accounts, with funds clearly allocated and instantly reportable.
                </p>
                <ul className="sp-bullets">
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Unlimited sub-accounts —</b> every program, every team.</span>
                  </li>
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Per-program reports —</b> board-ready exports in two clicks.</span>
                  </li>
                  <li>
                    <span className="dot"><ICheck /></span>
                    <span><b>Shared donor CRM —</b> supporters see every campaign you run, in one place.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SMARTER SAFER FREE */}
        <section className="sp-section white">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow">Why Schools Choose Sponsorly</span>
            <h2 className="sp-display-h2">
              Smarter. Safer. <span className="accent-green">Free.</span>
            </h2>
            <p className="sp-lead">
              No software fees, no per-transaction surprises — just the modern fundraising stack your district has been waiting for.
            </p>
            <div className="sp-trio">
              <div className="sp-trio-card">
                <div className="ico" style={{ color: "#1F5FE0" }}><ISparkle /></div>
                <h4>Setup is simple</h4>
                <p>Add your school, invite leaders, and launch your first campaign in under 10 minutes.</p>
              </div>
              <div className="sp-trio-card">
                <div className="ico" style={{ color: "#0E9F6E" }}><IShield /></div>
                <h4>Zero platform fees</h4>
                <p>Schools and PTOs never pay a platform fee. Donors cover an optional small fee at checkout.</p>
              </div>
              <div className="sp-trio-card">
                <div className="ico" style={{ color: "#FF6B35" }}><IUsers /></div>
                <h4>Leaders already use it</h4>
                <p>Mobile-first dashboards mean every coach, sponsor, and parent can run their part with zero training.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAND */}
        <section className="sp-trust">
          <div className="sp-wrap">
            <div className="ttl">Trusted by schools to raise the resources needed to invest in their students.</div>
            <div className="sub">A few numbers our customers rack up every month on Sponsorly — because they value every kid's story.</div>
            <div className="sp-trust-stats">
              <div className="sp-trust-stat">
                <div className="v">500+</div>
                <div className="l">Schools & Programs</div>
              </div>
              <div className="sp-trust-stat">
                <div className="v">$23M+</div>
                <div className="l">Raised for Schools</div>
              </div>
              <div className="sp-trust-stat">
                <div className="v">60,000+</div>
                <div className="l">Supporters Engaged</div>
              </div>
            </div>
          </div>
        </section>

        {/* BROWSE BY STATE */}
        <section className="sp-section white">
          <div className="sp-wrap sp-center">
            <span className="sp-eyebrow"><IPin /> Find Your State</span>
            <h2 className="sp-display-h2">
              Browse <span className="accent-blue">schools by state.</span>
            </h2>
            <p className="sp-lead">
              Find schools and districts in your state already raising more — and faster — with Sponsorly.
            </p>
          </div>
          <div className="sp-state-wrap sp-wrap">
            <StateDirectory />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="sp-cta-dark">
          <div className="inner">
            <span className="sp-eyebrow sp-eyebrow-light">Ready When You Are</span>
            <h2>
              Ready to transform <br />your <span className="accent">school's fundraising?</span>
            </h2>
            <p>
              Join 500+ schools using Sponsorly to run smarter campaigns, keep every dollar, and engage their community like never before.
            </p>
            <div className="ctas">
              <Link to="/contact" className="sp-btn sp-btn-white sp-btn-lg">Book a demo</Link>
              <Link to="/features" className="sp-btn sp-btn-outline-white sp-btn-lg">Explore features</Link>
            </div>
          </div>
        </section>

        {/* Audience sub-page cross-links */}
        <section style={{ background: "white", borderTop: "1px solid #E6E9F0", borderBottom: "1px solid #E6E9F0", padding: "72px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 32px" }}>
              <h3 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, fontSize: "clamp(28px, 3.2vw, 40px)", lineHeight: 1.1, margin: "0 0 10px", color: "#0A0F1E" }}>
                Built for every group on campus.
              </h3>
              <p style={{ color: "#6B7489", fontSize: 15, margin: 0 }}>
                Choose your group to see how Sponsorly fits the way you actually fundraise.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, maxWidth: 1000, margin: "0 auto" }}>
              {[
                { to: "/schools/sports-teams", label: "Sports Teams", color: "#1F5FE0" },
                { to: "/schools/booster-clubs", label: "Booster Clubs", color: "#0E9F6E" },
                { to: "/schools/marching-bands", label: "Marching Bands", color: "#FF6B35" },
                { to: "/schools/pto-pta", label: "PTOs & PTAs", color: "#7C3AED" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#FAFAF7", border: "1px solid #E6E9F0", borderRadius: 14,
                    padding: "16px 18px", color: "#0A0F1E", textDecoration: "none",
                    fontWeight: 600, fontSize: 14, transition: "transform .2s, border-color .2s",
                  }}
                >
                  <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: item.color, marginRight: 10, verticalAlign: "middle" }} />{item.label}</span>
                  <span style={{ color: "#6B7489" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
};

export default Schools;
