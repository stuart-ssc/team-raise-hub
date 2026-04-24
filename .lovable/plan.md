# Redesign Fundraisers page + move to `/fundraisers`

Rebuild `src/pages/CampaignsOverview.tsx` to match the new mockup and the 2026 design language already shipped on `Features.tsx`, `Pricing.tsx`, and `Schools.tsx`. Move the route from `/campaigns-overview` to `/fundraisers`, with a redirect for back-compat.

## Routing changes

- `src/App.tsx`: change `<Route path="/campaigns-overview" element={<CampaignsOverview />} />` → `<Route path="/fundraisers" element={<CampaignsOverview />} />`, and add `<Route path="/campaigns-overview" element={<Navigate to="/fundraisers" replace />} />` for back-compat.
- Update existing `<Link to="/campaigns-overview">` references in:
  - `src/components/MarketingHeader.tsx` (nav label "Fundraisers")
  - `src/components/MarketingFooter.tsx` (footer "Fundraisers")
  - `src/pages/EventCampaigns.tsx`, `MerchandiseCampaigns.tsx`, `RosterCampaigns.tsx`, `DonationCampaigns.tsx`, `Nonprofits.tsx`, `Platform.tsx`
- Update `useLandingPageTracking` `pagePath` to `/fundraisers`.
- Update `document.title` to "Fundraisers — Sponsorly" and meta description.

## Design language (consistent with Features/Pricing/Schools)

- Scoped CSS under `.sp-fundraisers` so the dashboard is unaffected.
- Tokens: `--sp-blue #1F5FE0`, `--sp-green #0E9F6E`, `--sp-accent #FF6B35`, `--sp-paper #FAFAF7`, ink + line tokens.
- Display: **Instrument Serif** (with italic blue accent). UI: **Geist**. Pill chips, pill buttons, soft shadows, hairline borders. `overflow-x: hidden; max-width: 100vw`.

## Page structure (mockup, top → bottom)

1. **Hero** — centered eyebrow chip ("Fundraisers · Done right"), headline *"Every kind of **fundraiser,** done right."* with italic blue accent on "fundraiser,", subcopy, and 2 CTAs: blue "Get started free" + ghost "Explore fundraiser types ↓".
2. **Type cards grid** — eyebrow + heading "Pick the right tool. Or run several at once.", 2×3 grid of type cards (Donation, Sponsorship, Event, Pledge, Merchandise + sixth tile). Each card has an eyebrow icon, title (Instrument Serif), short copy, mini chip row for sub-options, and an "Explore [type] →" link.
3. **Dark stats band** — full-width black with 4 inline stats: `$23M+ raised`, `0% platform fee`, `8 min avg setup`, `94% campaigns funded`. First number in green Instrument Serif italic.
4. **Whatever you run intro** — eyebrow + centered heading "Whatever you run, the fundamentals just work." + subcopy.
5. **Three split feature blocks** (alternating image/text):
   - **Beautiful landing pages** — left = bullets; right = mock blue-purple gradient landing card with progress bar + orange "Donate now" CTA.
   - **Familiar e-commerce checkout** — left = mock white checkout card with item rows + payment methods; right = bullets.
   - **Supporters return year after year** — left = bullets; right = mock donor profile card with name, donor since, payment-on-file mini rows.
6. **Comparison table** — eyebrow + heading "Which type is right for you?" + 5-column comparison matrix (Donation / Sponsorship / Event / Pledge / Auction) × 6 rows (Annual giving, Recurring requests, Local biz partners, etc.) with green dot markers.
7. **Final CTA band** — full-width blue gradient: *"Ready to start your **first fundraiser?**"* + "Get started free" white button + outline-on-blue "Schedule a demo".
8. **MarketingHeader / MarketingFooter** — unchanged.

## Technical notes

- Single rewrite: `src/pages/CampaignsOverview.tsx` (file kept; component rename optional, but route + URL change to `/fundraisers`).
- Inject `SCOPED_CSS` string under `<style>` mirroring the pattern in `Features.tsx` / `Schools.tsx`.
- Drop unused shadcn `Card`/`Button` and most lucide imports — use inline SVG icons matching other redesigned pages.
- Keep `useLandingPageTracking` (with new path).
- Type cards link to existing `/campaigns/{type}` routes — no logic change.

## Out of scope

- No changes to `MarketingHeader`/`MarketingFooter` styling — only the link `href`.
- No changes to the per-type sub-pages (DonationCampaigns, etc.), other than updating the back-link to `/fundraisers`.
- No backend, asset, or schema changes.
