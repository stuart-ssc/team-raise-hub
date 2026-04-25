## Rebuild Merchandise Fundraisers page

Rebuild `src/pages/MerchandiseCampaigns.tsx` from scratch to match the uploaded mockup and align with the 2026 redesign style used by `DonationCampaigns.tsx`, `SponsorshipCampaigns.tsx`, and `EventCampaigns.tsx`. Move the URL from `/campaigns/merchandise` to `/fundraisers/merchandise` with a redirect for the legacy path.

### Routing & navigation updates

- `src/App.tsx` — add `/fundraisers/merchandise` as canonical route, change `/campaigns/merchandise` to `<Navigate to="/fundraisers/merchandise" replace />`.
- `src/pages/CampaignsOverview.tsx` — update href to `/fundraisers/merchandise`.
- `src/pages/MerchandiseCampaigns.tsx` — update `useLandingPageTracking` pagePath, document title/meta.

### Page redesign (scoped `.sp-merch`)

Use the same scoped-CSS pattern (Instrument Serif display + Geist UI, brand tokens `--sp-blue #1F5FE0`, `--sp-paper #FAFAF7`, `--sp-accent #FF6B35`, `--sp-green #0E9F6E`, `--sp-ink #0A0F1E`). Primary accent color for merchandise = `--sp-green` (matching the mockup's "View Cart" CTA and italicized headline accents).

Sections (top to bottom, mirroring the mockup):

1. **MarketingHeader**.
2. **Hero — split two-column**
   - Left: green eyebrow "MERCHANDISE FUNDRAISERS", display headline "Sell team gear with *zero hassle.*" (green italic), supporting paragraph, primary "Start selling" + ghost "See a demo" buttons, three checkmark trust items (Variant sizes · Inventory tracking · Sales attribution).
   - Right: mock "Spirit Wear Store" storefront card showing 2×2 product grid (Team Hoodie blue, Practice Jersey orange, Duffle Bag dark, Spirit Stick green) with placeholder product icons + price tags, a "New order" toast pill at top, and a green "View Cart (3)" CTA.
3. **Everything you need to sell online — split** (paper-2 alt background)
   - Left: blue eyebrow "CORE FEATURES", display headline "Everything you need to *sell online.*" (blue italic), copy "A complete e-commerce experience designed specifically for school and nonprofit fundraising — no Shopify subscription, no plugins, no headaches.", 5-item checklist (Product variants for sizes/colors/styles, Inventory tracking and low-stock alerts, Order management and status tracking, Fulfillment coordination and shipping, Pre-order capabilities for bulk orders).
   - Right: mock "Order management" dashboard card with three order rows (Sarah M. Hoodie L $67 fulfilled, Marcus Chen Jersey $35 in-progress, James Park Backpack $45 to-ship) and totals row (Total Sales $4,250 · Items 127).
4. **Perfect for every product type** (centered)
   - Blue eyebrow "SELL ANYTHING", display headline "Perfect for every *product type.*" (green italic), 4-card grid (Team apparel, Fundraising products, Custom merchandise, Seasonal items) with chip tags.
5. **Track who sells what — split**
   - Left: "Sales by team member" mock card with progress bars for 4 members (Jase M. $674 leader, Emma S. $478, Tyler K. $375, Riley K. $284), each with avatar circle and progress bar.
   - Right: orange eyebrow "MEMBER TRACKING", display headline "Track *who sells* what." (orange italic), copy, 4-item check list (Individual sales attribution, Leaderboard for friendly competition, Incentive tracking for top sellers, Personalized links for each player), "Learn about member campaigns →" ghost button to `/fundraisers` (or roster page).
6. **Numbers — dark navy band**
   - Centered green eyebrow "THE NUMBERS", display headline "Merchandise campaigns that *perform.*" (green italic), three stat tiles (35% higher AOV blue, 60% reduction in manual work green, 2× sales with seller tracking orange).
7. **Closing CTA** (paper background, centered)
   - Display headline "Open your *team store.*" (green italic), copy, primary "Get started free" + ghost "Explore all campaign types" → `/fundraisers`.
8. **MarketingFooter**.

### Technical details

- Single scoped `<style>` block injected via constant string (same pattern as other rebuilt pages).
- All visuals built with pure CSS + inline SVG icons; no new image assets needed.
- Update `useLandingPageTracking({ pageType: 'marketing', pagePath: '/fundraisers/merchandise' })`.
- Update `document.title` to "Merchandise Fundraisers — Team Stores & Spirit Wear | Sponsorly" and meta description.
- No database, edge function, or schema changes.

### Files to edit

- `src/pages/MerchandiseCampaigns.tsx` (full rewrite)
- `src/App.tsx`
- `src/pages/CampaignsOverview.tsx`
