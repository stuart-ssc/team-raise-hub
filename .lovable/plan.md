# Redesign Schools page (`/schools`)

Rebuild `src/pages/Schools.tsx` to match the new mockup and the 2026 design language already shipped on `Features.tsx` and `Pricing.tsx`. All styles will be scoped under `.sp-schools` so the dashboard/app stay untouched.

## Design language (consistent with Features/Pricing)
- Background: `#FAFAF7` (sp-paper) with cream alt sections `#F2F3EE` and white sections.
- Display font: **Instrument Serif** (italic green accent for the hero phrase, blue elsewhere where appropriate).
- UI font: **Geist**.
- Brand tokens reused: `--sp-blue #1F5FE0`, `--sp-green #0E9F6E`, `--sp-accent #FF6B35`, `--sp-ink #0A0F1E`.
- Pill eyebrows, pill buttons, soft shadows, 1px hairline borders — same primitives as Features.
- `overflow-x: hidden; max-width: 100vw;` on the page wrapper to prevent horizontal scroll.

## Page structure (matches mockup top → bottom)

1. **Hero** — left-aligned text + right-aligned framed image card
   - Eyebrow chip: "Built for K-12 Schools"
   - Headline (Instrument Serif): *"Everything your school needs to **fundraise smarter.**"* — last phrase in green italic.
   - Subcopy + two CTAs: blue "Start free → 5 min setup" + ghost "Book a demo".
   - Right column: existing `schools-hero.png` in a tilted card with a small floating "$2,225" stat chip.

2. **Programs strip** ("Certified for every school program")
   - Centered eyebrow + heading.
   - 6-up tile row: Sports Teams, PTOs & PTAs, Music Programs, Booster Clubs, Academic Clubs, Arts Clubs — each with a colored circular icon (rotating accent colors per tile).

3. **"See every dollar. Across every program."** (alt cream band)
   - Two-column: left = heading + 4 bullet rows (Pay-as-you-play, Automated payouts, Self-serve reports, Automatic tax receipts).
   - Right = mock dashboard card (Total Raised $82,400 / Active Campaigns 18 / line chart placeholder).

4. **"Your teams raise more when they own it"** (white band)
   - Image card on the left (existing `team-collaboration.jpg`), copy + eyebrow on the right.
   - Below: 3 small feature cards — *Launch in minutes*, *Organize your roster*, *Look like a brand*.

5. **"Support multiple programs from one account"** (alt cream band)
   - Left: faux PTO program list card (4 rows: Lincoln Athletics, Drama Club, PTO General, Robotics Team, Theater Spring Musical) with colored category dots and amounts.
   - Right: heading + 3 check-bullets.

6. **Smarter. Safer. Free.** (white band)
   - 3-column feature cards: *Setup is simple*, *Zero platform fee*, *Leaders set/already use it* — each with circled icon and 2 lines of copy.

7. **Trust band** (full-width blue gradient)
   - Centered subtitle + 3 large stats: 500+ schools, $23M+ raised, 60,000+ supporters.

8. **Browse schools by state** (white band)
   - Eyebrow + centered heading + render existing `<StateBrowser />` (kept as-is, no logic change).

9. **Final CTA** (dark navy band)
   - Eyebrow chip on dark, large display heading: *"Ready to transform your **school's fundraising?**"* (italic green accent on the second phrase).
   - Two buttons: white "Book a demo" + outline-on-dark "Explore features".

10. **MarketingHeader / MarketingFooter** unchanged.

## Technical notes
- Single file rewrite: `src/pages/Schools.tsx`.
- Inject a `SCOPED_CSS` string (mirroring the pattern in `Features.tsx` / `Pricing.tsx`) inside a `<style>` tag, all selectors prefixed with `.sp-schools`.
- Keep imports for `MarketingHeader`, `MarketingFooter`, `StateBrowser`, `heroImage`, `teamImage`. Drop unused `Card`/`Button`/icon imports — replace icons with inline SVGs to match Features/Pricing convention.
- Preserve existing `useEffect` that sets `document.title` + meta description.
- No route changes, no data changes, no new dependencies.

## Out of scope
- No changes to `StateBrowser`, `MarketingHeader`, `MarketingFooter`, or any other page.
- No changes to backend, routes, or assets.
