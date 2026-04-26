/**
 * Shared scoped CSS for the Sponsorly audience landing pages
 * (Sports Teams, Booster Clubs, Marching Bands, PTOs & PTAs, Nonprofits).
 * Mirrors the 2026 marketing redesign tokens used in Schools, Pledge,
 * and Roster pages, scoped under .sp-aud so the rest of the app stays
 * untouched.
 */
export const AUDIENCE_SCOPED_CSS = `
.sp-aud {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-accent: #FF6B35;
  --sp-violet: #7C3AED;
  --sp-pink: #EC4899;
  --sp-ink: #0A0F1E;
  --sp-ink-2: #2B3345;
  --sp-muted: #6B7489;
  --sp-line: #E6E9F0;
  --sp-paper: #FAFAF7;
  --sp-paper-2: #F2F3EE;
  --sp-card: #FFFFFF;
  --sp-display: "Instrument Serif", "Cormorant Garamond", Georgia, serif;
  --sp-ui: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --sp-theme: var(--sp-blue);
  --sp-theme-deep: var(--sp-blue-deep);
  --sp-theme-soft: rgba(31,95,224,0.10);

  background: var(--sp-paper);
  color: var(--sp-ink);
  font-family: var(--sp-ui);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
  overflow-x: hidden;
  max-width: 100vw;
}
.sp-aud.theme-blue   { --sp-theme: #1F5FE0; --sp-theme-deep: #0B3FB0; --sp-theme-soft: rgba(31,95,224,0.10); }
.sp-aud.theme-green  { --sp-theme: #0E9F6E; --sp-theme-deep: #0A7A55; --sp-theme-soft: rgba(14,159,110,0.12); }
.sp-aud.theme-accent { --sp-theme: #FF6B35; --sp-theme-deep: #E0531B; --sp-theme-soft: rgba(255,107,53,0.12); }
.sp-aud.theme-violet { --sp-theme: #7C3AED; --sp-theme-deep: #5B21B6; --sp-theme-soft: rgba(124,58,237,0.12); }
.sp-aud.theme-teal   { --sp-theme: #0E8A8A; --sp-theme-deep: #0A6F6F; --sp-theme-soft: rgba(14,138,138,0.12); }
.sp-aud.theme-pink   { --sp-theme: #D6336C; --sp-theme-deep: #B02659; --sp-theme-soft: rgba(214,51,108,0.12); }

.sp-aud .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
.sp-aud .sp-wrap-wide { max-width: 1280px; margin: 0 auto; padding: 0 32px; }

.sp-aud .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-aud .sp-italic { font-style: italic; }

/* Eyebrow label */
.sp-aud .sp-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--sp-blue);
}
.sp-aud .sp-eyebrow.green { color: var(--sp-green); }
.sp-aud .sp-eyebrow.accent { color: var(--sp-accent); }
.sp-aud .sp-eyebrow.violet { color: var(--sp-violet); }
.sp-aud .sp-eyebrow.blue { color: var(--sp-blue); }
.sp-aud .sp-eyebrow.teal { color: #0E8A8A; }
.sp-aud .sp-eyebrow.pink { color: #D6336C; }

/* Chip */
.sp-aud .sp-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background: var(--sp-theme-soft);
  color: var(--sp-theme);
  font-size: 12px; font-weight: 600;
}
.sp-aud .sp-chip-dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.sp-aud .sp-chip.green { background: rgba(14,159,110,0.10); color: var(--sp-green); }
.sp-aud .sp-chip.green .sp-chip-dot { animation: sp-pulse 1.6s ease-in-out infinite; }
@keyframes sp-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(1.4); } }

/* Buttons */
.sp-aud .sp-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px;
  border-radius: 999px;
  font-weight: 600; font-size: 14px;
  transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
  white-space: nowrap;
  border: none; cursor: pointer; text-decoration: none;
}
.sp-aud .sp-btn:hover { transform: translateY(-1px); }
.sp-aud .sp-btn-lg { padding: 14px 26px; font-size: 15px; }
.sp-aud .sp-btn-primary { background: var(--sp-theme); color: white; box-shadow: 0 6px 18px -6px color-mix(in srgb, var(--sp-theme) 55%, transparent); }
.sp-aud .sp-btn-primary:hover { background: var(--sp-theme-deep); }
.sp-aud .sp-btn-ghost { background: rgba(10,15,30,0.06); color: var(--sp-ink); }
.sp-aud .sp-btn-ghost:hover { background: rgba(10,15,30,0.10); }
.sp-aud .sp-btn-on-dark { background: rgba(255,255,255,0.10); color: white; }
.sp-aud .sp-btn-on-dark:hover { background: rgba(255,255,255,0.18); }

/* Sections */
.sp-aud section { padding: 96px 0; }
.sp-aud section.alt { background: white; border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-aud section.cream { background: var(--sp-paper-2); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-aud .sp-sec-head { text-align: center; max-width: 760px; margin: 0 auto 56px; }
.sp-aud .sp-sec-head h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(34px, 4.2vw, 52px); line-height: 1.06; letter-spacing: -0.01em; color: var(--sp-ink); margin: 14px 0 16px; }
.sp-aud .sp-sec-head h2 em { font-style: italic; color: var(--sp-theme); }
.sp-aud .sp-sec-head p { color: var(--sp-muted); font-size: 16px; }

/* Hero */
.sp-aud .sp-hero { padding: 80px 0 88px; position: relative; overflow: hidden; }
.sp-aud .sp-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
.sp-aud .sp-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.4vw, 68px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 18px; color: var(--sp-ink); }
.sp-aud .sp-hero h1 em { font-style: italic; color: var(--sp-theme); }
.sp-aud .sp-hero .sp-sub { font-size: 17px; line-height: 1.55; color: var(--sp-ink-2); max-width: 560px; margin: 0 0 24px; }
.sp-aud .sp-hero .sp-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.sp-aud .sp-hero .sp-micro { display: flex; gap: 18px; flex-wrap: wrap; color: var(--sp-muted); font-size: 13px; }
.sp-aud .sp-hero-card {
  position: relative; aspect-ratio: 9 / 11; max-height: 560px;
  border-radius: 24px; overflow: hidden;
  background-size: cover; background-position: center;
  box-shadow: 0 40px 80px -30px rgba(10,15,30,0.35), 0 8px 20px -10px rgba(10,15,30,0.18);
}
.sp-aud .sp-hero-card .sp-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.70) 100%); }
.sp-aud .sp-hero-card .sp-badge {
  position: absolute; top: 18px; right: 18px;
  background: white; color: var(--sp-ink);
  padding: 8px 14px; border-radius: 999px;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 6px 18px -6px rgba(0,0,0,0.4);
}
.sp-aud .sp-hero-card .sp-badge span { font-size: 10px; color: var(--sp-muted); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
.sp-aud .sp-hero-card .sp-cap { position: absolute; left: 22px; right: 22px; bottom: 22px; color: white; }
.sp-aud .sp-hero-card .sp-cap h4 { font-family: var(--sp-display); font-size: 22px; margin: 0 0 6px; font-weight: 400; }
.sp-aud .sp-hero-card .sp-cap-row { display: flex; justify-content: space-between; font-size: 12px; opacity: 0.85; margin-bottom: 8px; }
.sp-aud .sp-hero-card .sp-bar { height: 4px; background: rgba(255,255,255,0.25); border-radius: 999px; overflow: hidden; }
.sp-aud .sp-hero-card .sp-bar > div { height: 100%; background: white; border-radius: 999px; }

/* Pillars */
.sp-aud .sp-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.sp-aud .sp-pillar { background: var(--sp-card); border: 1px solid var(--sp-line); border-radius: 18px; padding: 28px; transition: transform .25s, box-shadow .25s, border-color .25s; }
.sp-aud .sp-pillar:hover { transform: translateY(-4px); box-shadow: 0 10px 30px -12px rgba(10,15,30,0.18); border-color: var(--sp-theme-soft); }
.sp-aud .sp-pillar .sp-ico { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.sp-aud .sp-pillar h4 { font-family: var(--sp-display); font-size: 22px; font-weight: 400; line-height: 1.15; margin: 0 0 8px; }
.sp-aud .sp-pillar p { color: var(--sp-muted); font-size: 14.5px; line-height: 1.55; margin: 0 0 16px; }
.sp-aud .sp-pillar ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.sp-aud .sp-pillar li { font-size: 13px; color: var(--sp-ink-2); padding-left: 18px; position: relative; }
.sp-aud .sp-pillar li::before { content: "→"; position: absolute; left: 0; color: var(--sp-theme); font-weight: 600; }

/* Fundraisers grid */
.sp-aud .sp-fund { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.sp-aud .sp-fund-card { background: var(--sp-card); border: 1px solid var(--sp-line); border-radius: 18px; padding: 22px; transition: transform .25s, box-shadow .25s, border-color .25s; }
.sp-aud .sp-fund-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px -12px rgba(10,15,30,0.18); border-color: var(--sp-theme-soft); }
.sp-aud .sp-fund-card .sp-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sp-aud .sp-fund-card .sp-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.sp-aud .sp-fund-card .sp-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sp-muted); }
.sp-aud .sp-fund-card h5 { font-family: var(--sp-display); font-size: 18px; font-weight: 400; margin: 0 0 6px; }
.sp-aud .sp-fund-card p { color: var(--sp-muted); font-size: 13.5px; line-height: 1.55; margin: 0 0 16px; min-height: 60px; }
.sp-aud .sp-stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 14px; border-top: 1px solid var(--sp-line); }
.sp-aud .sp-stat-row > div { display: flex; flex-direction: column; }
.sp-aud .sp-stat-row b { font-family: var(--sp-display); font-size: 18px; font-weight: 400; }
.sp-aud .sp-stat-row span { font-size: 10px; color: var(--sp-muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }

/* CRM split */
.sp-aud .sp-crm-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 56px; align-items: center; }
.sp-aud .sp-crm-grid h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(32px, 3.8vw, 44px); line-height: 1.08; letter-spacing: -0.01em; margin: 14px 0 16px; }
.sp-aud .sp-crm-grid h2 em { font-style: italic; color: var(--sp-theme); }
.sp-aud .sp-check-list { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-direction: column; gap: 14px; }
.sp-aud .sp-check-list li { display: flex; gap: 12px; font-size: 14.5px; color: var(--sp-ink-2); line-height: 1.5; }
.sp-aud .sp-check-list .sp-tick { flex-shrink: 0; width: 22px; height: 22px; border-radius: 999px; background: var(--sp-theme-soft); color: var(--sp-theme); display: flex; align-items: center; justify-content: center; margin-top: 1px; }
.sp-aud .sp-check-list b { color: var(--sp-ink); font-weight: 600; }
.sp-aud .sp-crm-mock { background: white; border: 1px solid var(--sp-line); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px -20px rgba(10,15,30,0.18); }
.sp-aud .sp-crm-mock .sp-mock-head { padding: 14px 18px; border-bottom: 1px solid var(--sp-line); display: flex; justify-content: space-between; align-items: center; }
.sp-aud .sp-crm-mock .sp-mock-title { font-weight: 600; font-size: 13px; }
.sp-aud .sp-crm-mock .sp-mock-search { font-size: 11px; color: var(--sp-muted); background: var(--sp-paper-2); padding: 4px 10px; border-radius: 999px; }
.sp-aud .sp-crm-mock table { width: 100%; border-collapse: collapse; }
.sp-aud .sp-crm-mock th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sp-muted); padding: 12px 18px; border-bottom: 1px solid var(--sp-line); }
.sp-aud .sp-crm-mock td { padding: 12px 18px; font-size: 13px; border-bottom: 1px solid var(--sp-line); }
.sp-aud .sp-crm-mock tr:last-child td { border-bottom: none; }
.sp-aud .sp-donor { display: flex; gap: 10px; align-items: center; }
.sp-aud .sp-av { width: 28px; height: 28px; border-radius: 999px; color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-aud .sp-nm { font-weight: 600; color: var(--sp-ink); font-size: 13px; }
.sp-aud .sp-role { font-size: 11px; color: var(--sp-muted); }
.sp-aud .sp-pill { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.sp-aud .sp-pill.blue { background: rgba(31,95,224,0.10); color: var(--sp-blue); }
.sp-aud .sp-pill.green { background: rgba(14,159,110,0.12); color: var(--sp-green); }
.sp-aud .sp-pill.orange { background: rgba(255,107,53,0.12); color: var(--sp-accent); }
.sp-aud .sp-pill.violet { background: rgba(124,58,237,0.12); color: var(--sp-violet); }
.sp-aud .sp-amt { font-family: var(--sp-display); font-size: 16px; }

/* Campaign examples */
.sp-aud .sp-camp-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; }
.sp-aud .sp-camp-list { display: flex; flex-direction: column; gap: 12px; }
.sp-aud .sp-camp-row { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 18px 22px; display: grid; grid-template-columns: 36px 1fr auto; gap: 18px; align-items: center; transition: border-color .2s, transform .2s; }
.sp-aud .sp-camp-row:hover { border-color: var(--sp-theme-soft); transform: translateX(2px); }
.sp-aud .sp-camp-row .sp-num { width: 32px; height: 32px; border-radius: 999px; background: var(--sp-paper-2); color: var(--sp-ink-2); font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.sp-aud .sp-camp-row h5 { font-family: var(--sp-display); font-size: 18px; font-weight: 400; margin: 0 0 4px; }
.sp-aud .sp-camp-row p { font-size: 13px; color: var(--sp-muted); margin: 0; line-height: 1.5; }
.sp-aud .sp-camp-row .sp-res { text-align: right; }
.sp-aud .sp-camp-row .sp-res b { font-family: var(--sp-display); font-size: 20px; font-weight: 400; display: block; }
.sp-aud .sp-camp-row .sp-res span { font-size: 10px; color: var(--sp-green); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.sp-aud .sp-camp-photo { position: relative; min-height: 380px; border-radius: 18px; overflow: hidden; background-size: cover; background-position: center; box-shadow: 0 20px 50px -20px rgba(10,15,30,0.28); }
.sp-aud .sp-camp-photo::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.78) 100%); }
.sp-aud .sp-quote { position: absolute; left: 24px; right: 24px; bottom: 24px; color: white; }
.sp-aud .sp-quote p { font-family: var(--sp-display); font-size: 18px; line-height: 1.4; font-style: italic; margin: 0 0 12px; }
.sp-aud .sp-quote .sp-cite b { display: block; font-family: var(--sp-ui); font-size: 13px; font-weight: 600; }
.sp-aud .sp-quote .sp-cite { font-size: 12px; opacity: 0.85; }

/* Stats strip */
.sp-aud .sp-stats-strip { padding: 80px 0; color: white; text-align: center; }
.sp-aud .sp-stats-strip h3 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(28px, 3.2vw, 40px); margin: 0 0 12px; }
.sp-aud .sp-stats-strip .sp-sub { color: rgba(255,255,255,0.78); font-size: 15px; max-width: 640px; margin: 0 auto 36px; line-height: 1.55; }
.sp-aud .sp-stats-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 760px; margin: 0 auto; }
.sp-aud .sp-stats-3 .sp-big { font-family: var(--sp-display); font-size: clamp(40px, 5vw, 60px); line-height: 1; }
.sp-aud .sp-stats-3 .sp-lbl { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-top: 8px; }

/* Sister pages */
.sp-aud .sp-sister-head { text-align: center; max-width: 720px; margin: 0 auto 36px; }
.sp-aud .sp-sister-head h3 { font-family: var(--sp-display); font-size: clamp(24px, 2.8vw, 32px); font-weight: 400; margin: 0 0 8px; }
.sp-aud .sp-sister-head p { color: var(--sp-muted); font-size: 14.5px; }
.sp-aud .sp-sister-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; max-width: 1000px; margin: 0 auto; }
.sp-aud .sp-sister-link { background: white; border: 1px solid var(--sp-line); border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; color: var(--sp-ink); text-decoration: none; transition: border-color .2s, transform .2s; }
.sp-aud .sp-sister-link:hover { border-color: var(--sp-theme-soft); transform: translateY(-2px); }
.sp-aud .sp-sister-link .sp-ico { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.sp-aud .sp-sister-link .sp-nm { font-weight: 600; font-size: 14px; flex: 1; }
.sp-aud .sp-sister-link .sp-arr { color: var(--sp-muted); }

/* Sister cards (image-topped grid) */
.sp-aud .sp-sister-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.sp-aud .sp-sister-card {
  background: var(--sp-card);
  border: 1px solid var(--sp-line);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.sp-aud .sp-sister-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 42px -18px rgba(10,15,30,0.22);
  border-color: var(--sp-theme-soft);
}
.sp-aud .sp-sister-card .sp-sc-img {
  width: 100%;
  aspect-ratio: 16 / 10;
  background-size: cover;
  background-position: center;
  background-color: var(--sp-paper-2);
}
.sp-aud .sp-sister-card .sp-sc-body {
  padding: 22px 24px 24px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex: 1;
}
.sp-aud .sp-sister-card .sp-sc-text { min-width: 0; }
.sp-aud .sp-sister-card .sp-sc-body h4 {
  font-family: var(--sp-ui);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: var(--sp-ink);
  margin: 0 0 6px;
  line-height: 1.25;
}
.sp-aud .sp-sister-card .sp-sc-body p {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--sp-muted);
  margin: 0;
}
.sp-aud .sp-sister-card .sp-sc-arr {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  transition: transform .2s ease;
}
.sp-aud .sp-sister-card:hover .sp-sc-arr { transform: translateX(4px); }
@media (max-width: 960px) {
  .sp-aud .sp-sister-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 620px) {
  .sp-aud .sp-sister-cards { grid-template-columns: 1fr; }
}

/* Final CTA */
.sp-aud .sp-final-cta { background: var(--sp-ink); color: white; text-align: center; padding: 96px 0; }
.sp-aud .sp-final-cta h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(36px, 4.4vw, 56px); line-height: 1.05; margin: 14px 0 16px; }
.sp-aud .sp-final-cta h2 em { font-style: italic; color: var(--sp-theme); }
.sp-aud .sp-final-cta .sp-sub { color: rgba(255,255,255,0.8); font-size: 16px; max-width: 560px; margin: 0 auto 28px; }
.sp-aud .sp-final-cta .sp-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* Hub page */
.sp-aud .sp-hub-hero { padding: 96px 0 56px; text-align: center; }
.sp-aud .sp-hub-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(48px, 6vw, 84px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px auto; max-width: 1000px; color: var(--sp-ink); }
.sp-aud .sp-hub-hero h1 em { font-style: italic; }
.sp-aud .sp-hub-hero p { color: var(--sp-muted); font-size: 17px; max-width: 620px; margin: 0 auto; line-height: 1.55; }
.sp-aud .sp-hub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 48px 0 96px; }
.sp-aud .sp-hub-card { background: white; border: 1px solid var(--sp-line); border-radius: 22px; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; min-height: 240px; transition: transform .25s, box-shadow .25s, border-color .25s; text-decoration: none; color: inherit; }
.sp-aud .sp-hub-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px -20px rgba(10,15,30,0.25); border-color: var(--sp-theme-soft); }
.sp-aud .sp-hub-card.wide { grid-column: span 2; grid-template-columns: 1fr 2fr; }
.sp-aud .sp-hub-card .sp-body { padding: 28px; display: flex; flex-direction: column; justify-content: space-between; }
.sp-aud .sp-hub-card .sp-ico { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.sp-aud .sp-hub-card h3 { font-family: var(--sp-display); font-size: 28px; font-weight: 400; margin: 0 0 8px; }
.sp-aud .sp-hub-card p { color: var(--sp-muted); font-size: 14px; line-height: 1.55; margin: 0 0 16px; }
.sp-aud .sp-hub-card .sp-arr { color: var(--sp-blue); font-weight: 600; font-size: 14px; }
.sp-aud .sp-hub-card .sp-photo { background-size: cover; background-position: center; min-height: 240px; }

/* Responsive */
@media (max-width: 980px) {
  .sp-aud .sp-hero-grid,
  .sp-aud .sp-crm-grid,
  .sp-aud .sp-camp-grid,
  .sp-aud .sp-hub-grid { grid-template-columns: 1fr; gap: 32px; }
  .sp-aud .sp-hub-card,
  .sp-aud .sp-hub-card.wide { grid-column: auto; grid-template-columns: 1fr; }
  .sp-aud .sp-hub-card .sp-photo { min-height: 200px; }
  .sp-aud .sp-pillars { grid-template-columns: 1fr; }
  .sp-aud .sp-fund { grid-template-columns: 1fr 1fr; }
  .sp-aud .sp-sister-grid { grid-template-columns: 1fr 1fr; }
  .sp-aud .sp-stats-3 { grid-template-columns: 1fr; gap: 32px; }
  .sp-aud section { padding: 64px 0; }
}
@media (max-width: 560px) {
  .sp-aud .sp-fund { grid-template-columns: 1fr; }
  .sp-aud .sp-camp-row { grid-template-columns: 28px 1fr; }
  .sp-aud .sp-camp-row .sp-res { grid-column: 1 / -1; text-align: left; padding-top: 8px; border-top: 1px dashed var(--sp-line); }
  .sp-aud .sp-sister-grid { grid-template-columns: 1fr; }
  .sp-aud .sp-wrap, .sp-aud .sp-wrap-wide { padding: 0 20px; }
}
`;
