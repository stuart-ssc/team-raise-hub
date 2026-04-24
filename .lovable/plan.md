## Goal

Rebuild `src/pages/Pricing.tsx` so it matches the uploaded mockup, using the same scoped-CSS pattern, typography (Instrument Serif display + Geist UI), and color tokens as the 2026 homepage (`src/pages/Index.tsx`).

The page will sit between the existing `MarketingHeader` and `MarketingFooter` and will be fully self-contained (scoped under `.sp-pricing`) so it does not affect the rest of the app's design system.

## Sections (top → bottom, matching the mockup)

1. **Hero** — paper background with soft blue/green radial gradients.
   - Eyebrow chip: "Pricing"
   - Display headline: `Free to launch.` + italic blue `Fair to everyone.`
   - Subhead: "$0 per month. No setup, no contracts. Choose who covers the platform fee per campaign — and switch at any time."

2. **$0 / month plan card** — large rounded white card on paper bg.
   - Left: `$0` (italic blue display) `/ month` + "Everything included. Forever for your organization."
   - Right pill: "+ Platform fee per donation" with subtext "You choose if donors cover it (default) or your org absorbs it."
   - 2-column feature grid with green check icons:
     - Unlimited fundraisers
     - Built-in CRM and donor lists
     - Automated tax receipts
     - Live dashboards & reports
     - Roster + P2P fundraising
     - Unlimited integrations
     - Premium support
     - Unlimited admin seats
   - Bottom row: primary "Start free →" button + ghost "See all features" + small text "No credit card required."

3. **"You choose who covers the fees."** section
   - Eyebrow: "How fees work"
   - Display headline with italic blue accent on "who covers the fees."
   - Subhead explaining per-campaign toggle.
   - Toggle pill (visual only, default state shown): "Donor covers fees (Default)" | "Platform takes 10% of the gift"
   - Two side-by-side example cards showing the math for a $100 gift:
     - Card A "Donor covers the processing fee" (active/highlighted): Gift $100 + Platform fee +$10.00 = Donor pays $110.00 → Your org receives **$100.00**
     - Card B "Platform takes 10% of the gift": Gift $100 + Donor pays $100 − Platform fee −$10.00 → Your org receives **$90.00**
   - Bullet notes under each card (matching mockup).
   - Footer note: "All fees include card processing. Change the setting per campaign at any time."

4. **"Every feature, free forever."** section (paper bg)
   - Eyebrow chip: "Included"
   - Display headline with italic green accent on "free forever."
   - Right side small note: "There is no feature gate. The Free plan is the only plan — 100% of features unlocked — for every school and nonprofit."
   - 3×3 feature grid (icon + title + 1-line description) with mockup items: Unlimited fundraisers, Donor CRM, Built-in tax receipts, Roster + P2P attribution, Branded landing pages, Custom analytics, Premium support, Bulk import & export, Unlimited integrations.

5. **"The math vs. the legacy platforms."** section
   - Eyebrow chip
   - Comparison table (4 columns: Sponsorly highlighted, Competitor A, B, C) with rows:
     - Platform fee (donor-covered option)
     - Platform fee (org-absorbed)
     - Monthly fee
     - Email + SMS automation
     - Built-in CRM
   - Bottom dark "Total funds on $10K raised" row showing Sponsorly $10,000 vs competitors lower amounts.

6. **"Questions, answered." FAQ** — two-column layout
   - Left column: heading + small "Still have questions?" card with email link.
   - Right column: stacked accordion items (first one open). Reuse the FAQ content already on the page (6–7 items) but restyle as plain bordered rows that match the mockup.

7. **Final CTA band** — full-width blue gradient (`--sp-blue` → deeper blue).
   - Small chip: "Ready when you are"
   - Display headline (white): `Start raising money,` + italic `not paying for software.`
   - Subhead about $0 setup / cancel anytime.
   - Two buttons: white pill "Start free →" + outlined ghost "Book a 15-min demo".
   - Tiny line: "Sponsorly™. Built by educators."

## Technical Approach

- File touched: **`src/pages/Pricing.tsx`** (full rewrite). No other files change.
- Wrap the entire page content in `<div className="sp-pricing">` and inject a `SCOPED_CSS` constant via `<style>{SCOPED_CSS}</style>`, mirroring the pattern used in `src/pages/Index.tsx`.
- Reuse the same CSS variables (`--sp-blue`, `--sp-green`, `--sp-accent`, `--sp-ink`, `--sp-paper`, etc.) and the same display/UI font stack so it visually matches the homepage.
- Reuse `MarketingHeader` and `MarketingFooter` (already updated). Add `overflow-x: hidden; max-width: 100vw;` to the wrapper to prevent any horizontal scrollbar.
- Keep the existing FAQ copy but restyle it; remove the old `Card`/`Accordion`/`Button` shadcn imports since the new layout uses scoped CSS only (a simple controlled `useState` accordion in plain JSX).
- Inline SVG icons for checks / feature tiles (no new lucide dependencies needed beyond what's already imported elsewhere — small inline SVGs keep the design crisp and match the homepage style).
- Tracking: keep the existing `useLandingPageTracking` hook call if it was present (it isn't on the current Pricing page, so no change needed).

## Out of scope

- No backend / data changes.
- No changes to header, footer, or other pages.
- No new routes.
