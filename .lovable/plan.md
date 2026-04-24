## Goal

Rewrite `src/pages/Features.tsx` to match the uploaded 2026 Features mockup, using the same scoped-CSS pattern, typography, and color tokens as the homepage and the just-redesigned Pricing page.

The page will sit between the existing `MarketingHeader` and `MarketingFooter` and be fully self-contained (scoped under `.sp-features`) so it doesn't affect the rest of the app.

## Sections (top → bottom, matching the mockup)

1. **Hero** — paper background with soft radial gradients.
   - Eyebrow chip: "Features"
   - Display headline (centered): `Everything built for the way` + italic blue `teams actually raise.`
   - Subhead: "Built on top of Stripe. Automated email + SMS outreach. A donor CRM that turns over with your roster every season."
   - Anchor sub-nav row: pill-style links — Payouts · Email/SMS outreach · Donor CRM that turns · Automation — that scroll to the matching sections below.

2. **"Money in your bank — as fast as tomorrow."** (Payouts)
   - Two-column layout. Eyebrow chip "Powered by Stripe".
   - Left: Display headline with italic blue accent on `as fast as tomorrow.` + a faux "Payout #4624" card showing $12,450.00, three green-checked recent payout rows, and a "Powered by Stripe" footer note.
   - Right: H4 "Your Stripe account. Your bank. Your money." + 4 bullet points (Express onboarding ~5 min, Next-day payouts default, ACH transfers from Connected accounts, Per-campaign account routing).
   - Below: 3-up small feature cards — "Bank statements", "Payout/cash review", "Receipt agreements".
   - Bottom strip: 4 inline mini-stats with icons (Stripe Connect Express · Express onboarding · ~5 min · 100% supported).

3. **"Campaigns that follow up so you don't have to."** (Email/SMS automation)
   - Two-column. Eyebrow chip "Email + SMS outreach".
   - Left headline with italic accent on `follow up so you don't have to.` + supporting paragraph.
   - Toggle pills above two faux cards: "Email sequences" (active) / "SMS reminders" / "Web forms".
   - Two side-by-side faux UI cards: a sequence builder list (4–5 steps) and a sample email/SMS preview card (subject, body, primary CTA button).
   - Below: 4-up KPI strip (39%, 94%, 31×, 0) with labels (Donor open rate, SMS delivery rate, Higher response, No campaigns sent without consent).

4. **"One donor record that follows every athlete, every season."** (Donor CRM)
   - Two-column. Orange eyebrow chip "Donor CRM, built in".
   - Left headline with italic orange accent on `donor record`. Supporting copy + a 5-row vertical list of feature rows (Persistent supporter ID, Team-on-a-team rosters, 360° engagement, Inbox-grade history, Full transaction log) — each row has an orange icon tile, title, and short description.
   - Right: faux "Your School Donor Database" UI card showing 6 supporter rows (avatar, name, email, total given, badge), then a small "Lifetime giving over time" mini-chart with 2 stat tiles ($497 / $607) below.

5. **"Every detail handled for you."** (Automation grid)
   - Eyebrow chip "Automation".
   - Two-column header: left big italic headline; right small "Every feature you'd expect from a modern fundraising platform — and a few you wouldn't" note.
   - 3×3 grid of feature tiles (icon + title + description): Automated tax receipts, Matching gift engine, Live event dashboards, Fundraiser assistant, Bilingual landing pages, Role-based permissions, Built-in integrations, Custom labels & tags, Bulk import & export. One tile (Custom labels & tags) gets the highlighted "active" border.

6. **Final CTA band** — full-width blue gradient.
   - Tiny chip "Get started today"
   - Display headline white: `Every feature.` + italic `Zero platform fees.`
   - Subhead: "Every Sponsorly feature listed above is in every plan. Connect your Stripe account in 5 minutes and launch your first campaign today."
   - Two buttons: white pill "Get started free" + outlined ghost "Schedule a demo".

## Technical Approach

- File touched: **`src/pages/Features.tsx`** (full rewrite). No other files change.
- Wrap entire page content in `<div className="sp-features">` and inject a `SCOPED_CSS` constant via `<style>{SCOPED_CSS}</style>`, mirroring `src/pages/Index.tsx` and the new `src/pages/Pricing.tsx`.
- Reuse the same CSS variables (`--sp-blue`, `--sp-green`, `--sp-accent`, `--sp-ink`, `--sp-paper`, etc.) and font stack (Instrument Serif display + Geist UI).
- Reuse `MarketingHeader` and `MarketingFooter` (no changes).
- Use `useState` to handle the small in-section toggle (Email sequences / SMS / Web forms) and the anchor sub-nav.
- Inline SVG icons (check, chevron, mail, phone, repeat, building, etc.) — no new lucide imports needed; small inline SVGs match the homepage style.
- Add `overflow-x: hidden; max-width: 100vw;` on the wrapper to prevent any horizontal scrollbar.
- All anchor sub-nav links use simple hash-fragment scroll (`href="#payouts"` etc.) targeting `id`s on each section.

## Out of scope

- No backend/data changes.
- No header/footer/route changes.
- No new dependencies.
