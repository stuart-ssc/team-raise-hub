## Rebuild Event Fundraisers page

Rebuild `src/pages/EventCampaigns.tsx` from scratch to match the uploaded mockup and align with the 2026 redesign style used by `DonationCampaigns.tsx` and `SponsorshipCampaigns.tsx`. Move the URL from `/campaigns/events` to `/fundraisers/events` with a redirect for the legacy path.

### Routing & navigation updates

- `src/App.tsx` — add `/fundraisers/events` as canonical route, change `/campaigns/events` to `<Navigate to="/fundraisers/events" replace />`.
- `src/pages/CampaignsOverview.tsx` — update href to `/fundraisers/events`.
- `src/pages/Nonprofits.tsx` — update `<Link to>` to `/fundraisers/events`.
- `src/pages/EventCampaigns.tsx` — update `useLandingPageTracking` pagePath, document title/meta, and replace any internal links accordingly.

### Page redesign (scoped `.sp-events`)

Use the same scoped-CSS pattern (Instrument Serif display + Geist UI, brand tokens `--sp-blue #1F5FE0`, `--sp-paper #FAFAF7`, `--sp-accent #FF6B35`, `--sp-green #0E9F6E`, `--sp-ink #0A0F1E`). Accent color for events = `--sp-accent` (orange), matching the mockup's "Get Tickets" button and italicized headline accents.

Sections (top to bottom, mirroring the mockup):

1. **MarketingHeader** (existing component).
2. **Hero — split two-column**
   - Left: eyebrow "EVENT FUNDRAISERS", display headline "Host events that *raise serious money.*" (orange italic accent), supporting paragraph, primary "Plan your event" + ghost "See a demo" buttons, three checkmark trust items (Mobile check-in · Group packages · Real-time tracking).
   - Right: mock "Annual Golf Scramble" ticket card with date/venue header, three ticket-tier rows (Individual Player, Foursome Package highlighted, Dinner Only) with quantity steppers, subtotal row, big orange "Get Tickets" CTA, plus a "57 tickets sold" toast pill.
3. **Flexible ticketing — split** (white background)
   - Left: eyebrow, display headline "Flexible *ticketing* for any event." (orange italic), copy, 5-item check list (Single/group, Early-bird pricing, VIP packages, Mobile check-in & QR scanning, Digital delivery via email/SMS).
   - Right: "Ticket Dashboard" mock card with three KPI tiles (127 sold, $12.7k revenue, 68% sell-through) and three progress bars (Early Bird sold-out, General Admission, VIP).
4. **Event types we support** (paper-2 alt background, centered)
   - Eyebrow "ALL SHAPES & SIZES", display headline "Event *types* we support." (blue italic), 3×2 grid of cards: Golf tournaments, Skills camps, Galas & dinners, Auctions, Field trips, Performances. Each card: small icon tile, title, description, three small chip tags.
5. **Maximize revenue with event sponsorships — split**
   - Left: eyebrow "EVENT SPONSORSHIP", display headline "Maximize revenue with *event sponsorships.*" (green italic), copy, 4-item check list, "Learn about sponsorships →" ghost button linking to `/fundraisers/sponsorships`.
   - Right: 2×2 grid of sponsor-package cards (Hole sponsor $500/hole, Beverage cart $1,500, Trophy presentation $750, Title sponsor $5,000) each with eyebrow micro-label and price in accent color.
6. **Results — dark navy band** (`#0A0F1E`)
   - Centered eyebrow "THE RESULTS", display headline "Event fundraising that *delivers.*" (orange italic), three large stat tiles (2.5× revenue increase, 40% less admin time, 95% attendee satisfaction) with colored numerals (orange/blue/green) on dark cards.
7. **Closing CTA** (paper background, centered)
   - Display headline "Plan your next *fundraising event.*" (orange italic), copy, primary "Get started free" + ghost "Explore all campaign types" → `/fundraisers`.
8. **MarketingFooter**.

### Technical details

- Single scoped `<style>` block injected via constant string (same pattern as DonationCampaigns/SponsorshipCampaigns).
- All visuals built with pure CSS + inline SVG icons; no new image assets needed.
- Keep `useLandingPageTracking({ pageType: 'marketing', pagePath: '/fundraisers/events' })`.
- Update `document.title` to "Event Fundraisers — Ticketing & Event Fundraising | Sponsorly" and meta description.
- No database, edge function, or schema changes.

### Files to edit

- `src/pages/EventCampaigns.tsx` (full rewrite)
- `src/App.tsx`
- `src/pages/CampaignsOverview.tsx`
- `src/pages/Nonprofits.tsx`
