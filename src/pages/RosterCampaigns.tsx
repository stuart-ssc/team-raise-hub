import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";
import { SeoHead } from "@/components/seo/SeoHead";

/**
 * Roster Fundraisers — rebuilt 2026 to match approved mockup.
 * Scoped under .sp-roster. Violet accent palette + warm cream paper.
 */

const SCOPED_CSS = `
.sp-roster {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-accent: #FF6B35;
  --sp-violet: #7C3AED;
  --sp-violet-deep: #5B21B6;
  --sp-violet-soft: rgba(124,58,237,0.10);
  --sp-amber: #E0A21F;
  --sp-pink: #E04F8B;
  --sp-ink: #0A0F1E;
  --sp-ink-2: #2B3345;
  --sp-muted: #6B7489;
  --sp-line: #E8E2D6;
  --sp-paper: #FAF7F2;
  --sp-paper-2: #F2EEE3;
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
.sp-roster .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-roster .sp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: var(--sp-violet-soft); color: var(--sp-violet); font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.sp-roster .sp-eyebrow-blue { background: rgba(31,95,224,0.08); color: var(--sp-blue); }
.sp-roster .sp-eyebrow-accent { background: rgba(255,107,53,0.10); color: var(--sp-accent); }
.sp-roster .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.sp-roster .sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; white-space: nowrap; }
.sp-roster .sp-btn:hover { transform: translateY(-1px); }
.sp-roster .sp-btn-lg { padding: 14px 24px; font-size: 15px; }
.sp-roster .sp-btn-primary { background: var(--sp-violet); color: white; box-shadow: 0 6px 18px -6px rgba(124,58,237,0.55); }
.sp-roster .sp-btn-primary:hover { background: var(--sp-violet-deep); }
.sp-roster .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-roster .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }

/* Sections */
.sp-roster .sp-section { padding: 96px 0; }
.sp-roster .sp-section.alt { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-roster .sp-display-h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-roster .sp-display-h2 .accent-violet { color: var(--sp-violet); font-style: italic; }
.sp-roster .sp-display-h2 .accent-blue { color: var(--sp-blue); font-style: italic; }
.sp-roster .sp-display-h2 .accent-accent { color: var(--sp-accent); font-style: italic; }
.sp-roster .sp-lead { font-size: 15.5px; color: var(--sp-ink-2); line-height: 1.6; max-width: 600px; }
.sp-roster .sp-center { text-align: center; }
.sp-roster .sp-center .sp-display-h2 { max-width: 760px; margin-left: auto; margin-right: auto; }
.sp-roster .sp-center .sp-lead { margin: 0 auto; }

/* HERO */
.sp-roster .sp-hero { position: relative; padding: 80px 0 72px; overflow: hidden; background:
  radial-gradient(900px 480px at 90% -10%, rgba(124,58,237,0.12), transparent 60%),
  radial-gradient(700px 360px at -5% 0%, rgba(31,95,224,0.07), transparent 60%),
  var(--sp-paper); }
.sp-roster .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-roster .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.6vw, 72px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-roster .sp-hero h1 .accent { color: var(--sp-violet); font-style: italic; }
.sp-roster .sp-hero p.sub { font-size: 16.5px; color: var(--sp-ink-2); max-width: 520px; margin: 0 0 28px; line-height: 1.55; }
.sp-roster .sp-hero-ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; }
.sp-roster .sp-hero-checks { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--sp-line); }
.sp-roster .sp-hero-checks .it { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sp-ink-2); font-weight: 500; }
.sp-roster .sp-hero-checks .it .ck { width: 18px; height: 18px; border-radius: 999px; background: var(--sp-violet-soft); color: var(--sp-violet); display: grid; place-items: center; }

/* Leaderboard mock */
.sp-roster .sp-lb { background: white; border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.30); position: relative; }
.sp-roster .sp-lb .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-roster .sp-lb .top .meta { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sp-muted); font-weight: 700; }
.sp-roster .sp-lb .top h4 { font-family: var(--sp-display); font-size: 22px; line-height: 1.15; margin-top: 6px; color: var(--sp-ink); }
.sp-roster .sp-lb .top .det { font-size: 12px; color: var(--sp-muted); margin-top: 2px; }
.sp-roster .sp-lb .row { display: grid; grid-template-columns: 28px 1fr auto; gap: 14px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--sp-line); }
.sp-roster .sp-lb .row:last-of-type { border-bottom: 0; }
.sp-roster .sp-lb .row .av { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; font-family: var(--sp-display); font-style: italic; font-size: 14px; color: white; }
.sp-roster .sp-lb .row .av.gold { background: var(--sp-amber); }
.sp-roster .sp-lb .row .av.silver { background: #94A3B8; }
.sp-roster .sp-lb .row .av.bronze { background: #B97A4A; }
.sp-roster .sp-lb .row .av.std { background: var(--sp-violet); }
.sp-roster .sp-lb .row .body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.sp-roster .sp-lb .row .body .nm { font-size: 13px; color: var(--sp-ink); font-weight: 600; }
.sp-roster .sp-lb .row .body .nm .it { display: block; font-size: 11px; color: var(--sp-muted); font-weight: 500; margin-top: 2px; }
.sp-roster .sp-lb .row .bar { height: 5px; background: var(--sp-paper-2); border-radius: 999px; overflow: hidden; margin-top: 4px; }
.sp-roster .sp-lb .row .bar > i { display: block; height: 100%; border-radius: 999px; background: var(--sp-violet); }
.sp-roster .sp-lb .row .am { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }
.sp-roster .sp-lb .foot { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; margin-top: 6px; border-top: 1px solid var(--sp-line); }
.sp-roster .sp-lb .foot .l { font-size: 11px; color: var(--sp-muted); font-weight: 600; }
.sp-roster .sp-lb .foot .v { font-family: var(--sp-display); font-size: 18px; color: var(--sp-ink); }
.sp-roster .sp-lb-toast { position: absolute; right: -12px; top: -14px; background: white; border: 1px solid var(--sp-line); border-radius: 999px; padding: 8px 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 18px 36px -20px rgba(10,15,30,0.30); }
.sp-roster .sp-lb-toast .av { width: 20px; height: 20px; border-radius: 999px; background: var(--sp-violet); display: grid; place-items: center; color: white; font-size: 10px; font-weight: 700; }
.sp-roster .sp-lb-toast .t { font-size: 11.5px; color: var(--sp-ink); font-weight: 600; }
.sp-roster .sp-lb-toast .s { font-size: 10.5px; color: var(--sp-muted); margin-top: 1px; }

/* Toolkit grid */
.sp-roster .sp-tools { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 48px; }
.sp-roster .sp-tool { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; transition: transform .15s ease, box-shadow .2s ease; display: flex; flex-direction: column; gap: 10px; }
.sp-roster .sp-tool:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -20px rgba(10,15,30,0.18); }
.sp-roster .sp-tool .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 4px; }
.sp-roster .sp-tool h3 { font-family: var(--sp-display); font-weight: 400; font-size: 22px; line-height: 1.15; color: var(--sp-ink); }
.sp-roster .sp-tool p { font-size: 13px; color: var(--sp-ink-2); line-height: 1.5; }

/* Two-column with bullets */
.sp-roster .sp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sp-roster .sp-bullets { list-style: none; padding: 0; margin: 24px 0 8px; display: flex; flex-direction: column; gap: 14px; }
.sp-roster .sp-bullets li { display: flex; gap: 12px; align-items: flex-start; }
.sp-roster .sp-bullets li .dot { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 999px; background: var(--sp-violet-soft); color: var(--sp-violet); display: grid; place-items: center; margin-top: 2px; }
.sp-roster .sp-bullets li b { font-weight: 600; color: var(--sp-ink); margin-right: 6px; }
.sp-roster .sp-bullets li span { font-size: 14px; color: var(--sp-ink-2); line-height: 1.5; }

/* Player dashboard mock */
.sp-roster .sp-pd { background: white; border: 1px solid var(--sp-line); border-radius: 18px; overflow: hidden; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.20); }
.sp-roster .sp-pd .head { background: linear-gradient(160deg, var(--sp-violet) 0%, var(--sp-violet-deep) 100%); color: white; padding: 22px; display: flex; align-items: center; gap: 14px; }
.sp-roster .sp-pd .head .av { width: 44px; height: 44px; border-radius: 999px; background: rgba(255,255,255,0.18); color: white; display: grid; place-items: center; font-family: var(--sp-display); font-style: italic; font-size: 18px; }
.sp-roster .sp-pd .head .nm { font-family: var(--sp-display); font-size: 20px; line-height: 1.1; }
.sp-roster .sp-pd .head .meta { font-size: 11px; opacity: 0.85; margin-top: 4px; letter-spacing: 0.04em; }
.sp-roster .sp-pd .body { padding: 22px; }
.sp-roster .sp-pd .raised { display: flex; justify-content: space-between; align-items: baseline; }
.sp-roster .sp-pd .raised .v { font-family: var(--sp-display); font-size: 36px; line-height: 1; color: var(--sp-ink); }
.sp-roster .sp-pd .raised .g { font-size: 12px; color: var(--sp-muted); }
.sp-roster .sp-pd .pmeta { display: flex; justify-content: space-between; font-size: 11px; color: var(--sp-muted); margin: 8px 0 6px; font-weight: 600; }
.sp-roster .sp-pd .progress { height: 8px; background: var(--sp-paper-2); border-radius: 999px; overflow: hidden; }
.sp-roster .sp-pd .progress > i { display: block; height: 100%; width: 70%; background: linear-gradient(90deg, var(--sp-violet), #A78BFA); }
.sp-roster .sp-pd .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
.sp-roster .sp-pd .stats .s { background: var(--sp-paper-2); border-radius: 12px; padding: 12px; text-align: center; }
.sp-roster .sp-pd .stats .s .v { font-family: var(--sp-display); font-size: 22px; color: var(--sp-ink); line-height: 1; }
.sp-roster .sp-pd .stats .s .l { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sp-muted); margin-top: 6px; font-weight: 700; }
.sp-roster .sp-pd .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sp-roster .sp-pd .actions .a { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 700; }
.sp-roster .sp-pd .actions .a.pri { background: var(--sp-violet); color: white; }
.sp-roster .sp-pd .actions .a.sec { background: var(--sp-paper-2); color: var(--sp-ink); border: 1px solid var(--sp-line); }

/* Video card mock */
.sp-roster .sp-vid { background: white; border: 1px solid var(--sp-line); border-radius: 18px; overflow: hidden; box-shadow: 0 30px 60px -28px rgba(10,15,30,0.22); }
.sp-roster .sp-vid .thumb { aspect-ratio: 16/10; background:
  radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 60%),
  linear-gradient(160deg, var(--sp-violet) 0%, var(--sp-violet-deep) 100%);
  position: relative; display: grid; place-items: center; }
.sp-roster .sp-vid .thumb .play { width: 64px; height: 64px; border-radius: 999px; background: rgba(255,255,255,0.95); color: var(--sp-violet); display: grid; place-items: center; box-shadow: 0 18px 36px -10px rgba(0,0,0,0.3); }
.sp-roster .sp-vid .thumb .new { position: absolute; top: 12px; left: 12px; background: var(--sp-accent); color: white; font-size: 10px; padding: 4px 10px; border-radius: 6px; font-weight: 700; letter-spacing: 0.12em; }
.sp-roster .sp-vid .thumb .dur { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.6); color: white; font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-variant-numeric: tabular-nums; }
.sp-roster .sp-vid .cap { padding: 18px 20px 8px; font-family: var(--sp-display); font-size: 18px; line-height: 1.25; color: var(--sp-ink); font-style: italic; }
.sp-roster .sp-vid .att { display: flex; align-items: center; gap: 10px; padding: 8px 20px 18px; font-size: 11.5px; color: var(--sp-muted); border-top: 1px solid var(--sp-line); margin-top: 8px; padding-top: 12px; }
.sp-roster .sp-vid .att .av { width: 22px; height: 22px; border-radius: 999px; background: var(--sp-violet); color: white; display: grid; place-items: center; font-size: 10px; font-weight: 700; }
.sp-roster .sp-vid .att b { color: var(--sp-ink); font-weight: 600; }

/* Why-it-works grid */
.sp-roster .sp-why { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 48px; }
.sp-roster .sp-why .c { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; text-align: center; }
.sp-roster .sp-why .c .ico { width: 38px; height: 38px; border-radius: 10px; margin: 0 auto 10px; display: grid; place-items: center; }
.sp-roster .sp-why .c h3 { font-family: var(--sp-display); font-size: 20px; color: var(--sp-ink); }
.sp-roster .sp-why .c p { font-size: 12.5px; color: var(--sp-ink-2); line-height: 1.5; margin-top: 6px; }

/* Numbers dark band */
.sp-roster .sp-numbers { background: #0A0F1E; color: white; padding: 96px 0; text-align: center; }
.sp-roster .sp-numbers .sp-eyebrow { background: rgba(124,58,237,0.20); color: #C4B5FD; }
.sp-roster .sp-numbers h2 { font-family: var(--sp-display); font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; letter-spacing: -0.01em; color: white; margin: 14px 0 16px; }
.sp-roster .sp-numbers h2 .accent { color: #C4B5FD; font-style: italic; }
.sp-roster .sp-numbers p.sub { font-size: 15.5px; opacity: 0.78; max-width: 540px; margin: 0 auto 48px; line-height: 1.55; }
.sp-roster .sp-numbers .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 960px; margin: 0 auto; }
.sp-roster .sp-numbers .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 36px 24px; }
.sp-roster .sp-numbers .stat .v { font-family: var(--sp-display); font-size: 60px; line-height: 1; }
.sp-roster .sp-numbers .stat .v.violet { color: #C4B5FD; }
.sp-roster .sp-numbers .stat .v.orange { color: var(--sp-accent); }
.sp-roster .sp-numbers .stat .v.green { color: #4ADE80; }
.sp-roster .sp-numbers .stat .l { font-family: var(--sp-display); font-style: italic; font-size: 18px; margin-top: 10px; opacity: 0.95; }
.sp-roster .sp-numbers .stat .s { font-size: 12px; opacity: 0.6; margin-top: 6px; }

/* Final CTA */
.sp-roster .sp-cta { background:
  radial-gradient(900px 320px at 50% 0%, rgba(124,58,237,0.16), transparent 60%),
  radial-gradient(700px 240px at 100% 100%, rgba(255,107,53,0.10), transparent 60%),
  var(--sp-paper);
  padding: 100px 0; text-align: center; }
.sp-roster .sp-cta h2 { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.01em; margin: 0 0 16px; color: var(--sp-ink); }
.sp-roster .sp-cta h2 .accent { font-style: italic; color: var(--sp-violet); }
.sp-roster .sp-cta p { font-size: 15.5px; color: var(--sp-ink-2); max-width: 540px; margin: 0 auto 28px; line-height: 1.55; }
.sp-roster .sp-cta .ctas { display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* Responsive */
@media (max-width: 980px) {
  .sp-roster .sp-section { padding: 64px 0; }
  .sp-roster .sp-hero { padding: 56px 0; }
  .sp-roster .sp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .sp-roster .sp-two { grid-template-columns: 1fr; gap: 40px; }
  .sp-roster .sp-tools { grid-template-columns: 1fr 1fr; }
  .sp-roster .sp-why { grid-template-columns: 1fr 1fr; }
  .sp-roster .sp-numbers .stats { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .sp-roster .sp-wrap { padding: 0 20px; }
  .sp-roster .sp-tools { grid-template-columns: 1fr; }
  .sp-roster .sp-why { grid-template-columns: 1fr; }
}
`;

/* Inline icons */
const ICheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IArrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IPlay = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const IPlayLg = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>);
const IUser = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const ITrend = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>);
const IVideo = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>);
const ILink = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>);
const IQR = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="14"/><line x1="18" y1="14" x2="18" y2="14"/><line x1="14" y1="18" x2="14" y2="18"/><line x1="21" y1="21" x2="21" y2="21"/></svg>);
const ITarget = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IHeart = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IUsers = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const ITrophy = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>);
const IGift = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const IShare = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>);

const tools = [
  { Icon: IUser, color: "#7C3AED", bg: "rgba(124,58,237,0.10)",
    title: "Personal fundraising page",
    copy: "Each player gets their own page with photo, story, goal, and live progress." },
  { Icon: ITrend, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)",
    title: "Real-time leaderboard",
    copy: "Ranked leaderboards for the team — and parents — see live standings." },
  { Icon: IVideo, color: "#FF6B35", bg: "rgba(255,107,53,0.10)",
    title: "Video pitches",
    copy: "Players record short personal appeals — the most powerful conversion tool." },
  { Icon: ILink, color: "#0E9F6E", bg: "rgba(14,159,110,0.10)",
    title: "Personal links",
    copy: "Unique URLs every player can text and share with friends and family." },
  { Icon: IQR, color: "#E0A21F", bg: "rgba(224,162,31,0.12)",
    title: "Custom QR codes",
    copy: "One tap to the player's donation page — perfect for in-person events." },
  { Icon: ITarget, color: "#E04F8B", bg: "rgba(224,79,139,0.10)",
    title: "Progress tracking",
    copy: "Individual and team milestones to keep momentum strong all season." },
];

const why = [
  { Icon: IHeart, color: "#7C3AED", bg: "rgba(124,58,237,0.10)",
    title: "Genuine empathy",
    copy: "Players are someone's child or neighbor — donors give to the human, not the team." },
  { Icon: IUsers, color: "#1F5FE0", bg: "rgba(31,95,224,0.10)",
    title: "Extended reach",
    copy: "Each player taps into their own friends-and-family network beyond the booster list." },
  { Icon: ITrophy, color: "#FF6B35", bg: "rgba(255,107,53,0.10)",
    title: "Friendly competition",
    copy: "Leaderboards turn the season into a game — players push each other to the top." },
  { Icon: IGift, color: "#0E9F6E", bg: "rgba(14,159,110,0.10)",
    title: "Tactile reciprocity",
    copy: "A personal ask creates an obligation a generic team email never will." },
];

const RosterCampaigns = () => {
  useLandingPageTracking({ pageType: "marketing", pagePath: "/fundraisers/roster" });

  return (
    <div className="sp-roster">
      <SeoHead
        title="Roster Fundraisers — Peer-to-Peer Team Fundraising | Sponsorly"
        description="Give every player, student, or member their own fundraising page with personal links, a live leaderboard, and team totals. Gamify giving with roster fundraisers."
        path="/fundraisers/roster"
      />
      <style>{SCOPED_CSS}</style>
      <MarketingHeader />

      {/* HERO */}
      <section className="sp-hero">
        <div className="sp-wrap sp-hero-grid">
          <div>
            <span className="sp-eyebrow">Roster Fundraisers</span>
            <h1>Gamify giving. Watch your team <span className="accent">compete.</span></h1>
            <p className="sub">
              Give every player, student, or member their own fundraising page — with personal links,
              a live leaderboard, and team totals. Then watch them go.
            </p>
            <div className="sp-hero-ctas">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                Enable roster tracking <IArrow />
              </Link>
              <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                <IPlay /> See a demo
              </Link>
            </div>
            <div className="sp-hero-checks">
              <span className="it"><span className="ck"><ICheck /></span> Personal pages</span>
              <span className="it"><span className="ck"><ICheck /></span> Live leaderboard</span>
              <span className="it"><span className="ck"><ICheck /></span> Auto attribution</span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="sp-lb">
              <div className="top">
                <div>
                  <div className="meta">Sponsorly · Fundraiser leaderboard</div>
                  <h4>Team Leaderboard</h4>
                  <div className="det">Wildcats Football · 22 players</div>
                </div>
              </div>
              <div className="row">
                <div className="av gold">1</div>
                <div className="body">
                  <div className="nm">Jase Martinez<span className="it">QB · #11 · Sr</span></div>
                  <div className="bar"><i style={{ width: "100%" }} /></div>
                </div>
                <div className="am">$1,740</div>
              </div>
              <div className="row">
                <div className="av silver">2</div>
                <div className="body">
                  <div className="nm">Riley Williams<span className="it">RB · #21 · Jr</span></div>
                  <div className="bar"><i style={{ width: "56%" }} /></div>
                </div>
                <div className="am">$980</div>
              </div>
              <div className="row">
                <div className="av bronze">3</div>
                <div className="body">
                  <div className="nm">Marcus Chen<span className="it">WR · #82 · So</span></div>
                  <div className="bar"><i style={{ width: "39%" }} /></div>
                </div>
                <div className="am">$675</div>
              </div>
              <div className="row">
                <div className="av std">4</div>
                <div className="body">
                  <div className="nm">Cara Lindstrom-Davis<span className="it">LB · #44 · Sr</span></div>
                  <div className="bar"><i style={{ width: "36%" }} /></div>
                </div>
                <div className="am">$620</div>
              </div>
              <div className="foot">
                <span className="l">Team total</span>
                <span className="v">$12,470</span>
              </div>
            </div>
            <div className="sp-lb-toast">
              <span className="av">VIP</span>
              <div>
                <div className="t">Jase opened the lead</div>
                <div className="s">+$160 in last hour</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLKIT */}
      <section className="sp-section alt">
        <div className="sp-wrap sp-center">
          <span className="sp-eyebrow">The Toolkit</span>
          <h2 className="sp-display-h2">
            Everything for <span className="accent-violet">peer-to-peer</span> success.
          </h2>
          <p className="sp-lead">Roster campaigns turn the team into the marketing engine. Here's what each player gets.</p>
        </div>
        <div className="sp-wrap">
          <div className="sp-tools">
            {tools.map((t, i) => (
              <div key={i} className="sp-tool">
                <div className="ico" style={{ background: t.bg, color: t.color }}>
                  <t.Icon />
                </div>
                <h3>{t.title}</h3>
                <p>{t.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAYER COMMAND CENTER */}
      <section className="sp-section">
        <div className="sp-wrap sp-two">
          <div>
            <span className="sp-eyebrow">Player Experience</span>
            <h2 className="sp-display-h2">
              Every player gets their own <span className="accent-violet">command center.</span>
            </h2>
            <p className="sp-lead">
              Players log in to a personal dashboard with everything they need to raise — share buttons,
              recent donations, suggested prospects, and tips for what to do next.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span><b>Personal goals</b>with progress visualizations</span></li>
              <li><span className="dot"><ICheck /></span><span><b>One-tap social sharing</b>across every channel</span></li>
              <li><span className="dot"><ICheck /></span><span><b>See who donated</b>and thank them in a tap</span></li>
              <li><span className="dot"><ICheck /></span><span><b>Smart day-of cues</b>to ride your momentum</span></li>
            </ul>
          </div>

          <div className="sp-pd">
            <div className="head">
              <div className="av">JM</div>
              <div>
                <div className="nm">Jake Martinez</div>
                <div className="meta">#11 · Jr · Wildcats Football</div>
              </div>
            </div>
            <div className="body">
              <div className="raised">
                <div className="v">$1,740</div>
                <div className="g">of $2,500 goal</div>
              </div>
              <div className="pmeta"><span>70%</span><span>5 days left</span></div>
              <div className="progress"><i /></div>
              <div className="stats">
                <div className="s"><div className="v">16</div><div className="l">Donors</div></div>
                <div className="s"><div className="v">24</div><div className="l">Shares</div></div>
                <div className="s"><div className="v">87%</div><div className="l">Momentum</div></div>
              </div>
              <div className="actions">
                <div className="a pri"><IShare /> Share</div>
                <div className="a sec"><IQR /> QR code</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO APPEALS */}
      <section className="sp-section alt">
        <div className="sp-wrap sp-two">
          <div className="sp-vid">
            <div className="thumb">
              <span className="new">NEW</span>
              <div className="play"><IPlayLg /></div>
              <span className="dur">0:42</span>
            </div>
            <div className="cap">"I'm going to D.C. for nationals — every dollar gets us closer."</div>
            <div className="att">
              <span className="av">JM</span>
              <span><b>Jake M.</b> · 2026-04 · 14,200 views</span>
            </div>
          </div>

          <div>
            <span className="sp-eyebrow sp-eyebrow-accent">Video Appeals</span>
            <h2 className="sp-display-h2">
              Personal appeals that <span className="accent-accent">convert.</span>
            </h2>
            <p className="sp-lead">
              Donors are 4× more likely to give when they see a player's face. Built-in video pitches
              turn empathy into action — and let supporters feel personally invested.
            </p>
            <ul className="sp-bullets">
              <li><span className="dot"><ICheck /></span><span>60-second appeals shot directly from phone</span></li>
              <li><span className="dot"><ICheck /></span><span>Auto-embed at the top of every contact page</span></li>
              <li><span className="dot"><ICheck /></span><span>Players can record once and re-use</span></li>
              <li><span className="dot"><ICheck /></span><span>Email previews show full-engaging clip</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="sp-section">
        <div className="sp-wrap sp-center">
          <span className="sp-eyebrow">The Psychology</span>
          <h2 className="sp-display-h2">
            Why <span className="accent-violet">roster fundraisers</span> work.
          </h2>
          <p className="sp-lead">Peer-to-peer fundraising consistently outperforms team-only fundraisers.</p>
        </div>
        <div className="sp-wrap">
          <div className="sp-why">
            {why.map((w, i) => (
              <div key={i} className="c">
                <div className="ico" style={{ background: w.bg, color: w.color }}>
                  <w.Icon />
                </div>
                <h3>{w.title}</h3>
                <p>{w.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="sp-numbers">
        <div className="sp-wrap">
          <span className="sp-eyebrow">The Numbers</span>
          <h2>The numbers speak for <span className="accent">themselves.</span></h2>
          <p className="sub">Roster fundraisers out-raise team-only fundraisers, every season.</p>
          <div className="stats">
            <div className="stat">
              <div className="v violet">3×</div>
              <div className="l">More reach</div>
              <div className="s">vs. single-link campaigns</div>
            </div>
            <div className="stat">
              <div className="v orange">47%</div>
              <div className="l">Higher participation</div>
              <div className="s">when peer attribution is on</div>
            </div>
            <div className="stat">
              <div className="v green">2.5×</div>
              <div className="l">Revenue increase</div>
              <div className="s">with roster mode enabled</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sp-cta">
        <div className="sp-wrap sp-center">
          <h2>Ready to <span className="accent">gamify</span> your fundraising?</h2>
          <p>Turn your next campaign into a team competition. Enable roster attribution and watch engagement soar.</p>
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

export default RosterCampaigns;
