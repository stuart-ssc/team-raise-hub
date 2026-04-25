# Rebuild Sponsorship Fundraisers Landing Page

Rebuild `src/pages/SponsorshipCampaigns.tsx` to match the approved mockup using the same scoped-CSS design system as `CampaignsOverview.tsx`, `DonationCampaigns.tsx`, and the rest of the redesigned marketing pages. Move the route from `/campaigns/sponsorships` to `/fundraisers/sponsorships`.

## URL change

- New canonical route: `/fundraisers/sponsorships`
- Old route `/campaigns/sponsorships` becomes a `<Navigate to="/fundraisers/sponsorships" replace />` redirect (preserves inbound links + tracking history).
- Update internal `<Link>` references to point at the new path:
  - `src/pages/CampaignsOverview.tsx`
  - `src/pages/ForBusinesses.tsx`
  - `src/pages/EventCampaigns.tsx`
- Update `useLandingPageTracking` `pagePath` to `/fundraisers/sponsorships`.

## Page sections (matching mockup, top to bottom)

1. **MarketingHeader** (existing, unchanged).

2. **Hero — split two-column** (paper background, soft blue + orange radial highlights)
   - Left: orange eyebrow chip "Sponsorship fundraisers", display-serif headline "Turn local businesses into *lasting partners.*" (italic blue accent on second line), supporting paragraph, two CTAs ("Start your sponsor program" primary blue pill, "See a demo" ghost), underline check row ("Tiered packages", "Auto asset collection", "Tax-deductible").
   - Right: Mock sponsor-package picker card — small URL crumb "sponsorly.io/c/wildcats-sponsor", title "Become a Wildcats sponsor", subtitle "Westlake HS Athletics · Fall 2026 Season", four package rows (Bronze $250 / Silver $500 / Gold $1,000 highlighted / Platinum $2,500) each with colored icon + benefit caption + "X LEFT" pill, a "RENEWAL · Joe's Pizza · 3rd year sponsor" toast at the bottom-left, "NEW SPONSOR · Acme Hardware — Gold tier" green pill at top-right, blue "Become a sponsor" CTA bar.

3. **"Build *lasting* business relationships." split** (white section, reverse layout: text left, mock right)
   - Left: blue eyebrow "For organizations", display headline with orange italic accent on "lasting", supporting copy, five green-check bullets (unlimited tiered packages; advertising placements; ongoing relationships; sponsor recognition displays; automatic season-over-season renewals).
   - Right: 3×2 grid of subtle paper "placement" cards with small colored icons + label + tiny caption: Stadium signage, Jersey sponsors, Naming rights, Program book ads, Digital displays, PA announcements.

4. **"Meaningful *community* engagement." split** (paper-2 alt section, mock left, text right)
   - Left: White sponsor-profile mock card with green top border, big orange "A" avatar + "Acme Hardware" + "PROUD GOLD SPONSOR · CENTRAL HIGH FOOTBALL" subtitle, three small stat tiles (5K+ impressions, 12 events, 3 years), four asset-fulfillment rows (Field signage · Live, Jersey patch · Delivered, PA announcements · Weekly, Program ad · Full page) each with green check.
   - Right: green eyebrow "For businesses", display headline with green italic accent on "community", supporting copy, five green-check bullets (local brand exposure; support causes with credibility; tax-deductible contributions; year-round visibility; auto-collected asset files for usage).

5. **"How sponsorship *fundraisers* work." dark band** (deep navy)
   - Centered eyebrow "The process", display headline with blue italic accent, supporting copy.
   - Horizontal 4-step rail with connecting line: 1 (filled blue circle, active) Create packages, 2 Share fundraiser, 3 Businesses purchase, 4 Collect assets — each step has a numbered circle + bold serif title + short description below.

6. **Final CTA — light gradient band** (paper background with soft blue/orange radial)
   - Display headline "Ready to build your *sponsor program?*" (italic blue accent on "sponsor program?"), supporting copy "Join the schools and nonprofits raising thousands through local business partnerships.", two CTAs: primary blue pill "Get started free" → `/signup`, ghost pill "I'm a business" → `/for-businesses`.

7. **MarketingFooter** (existing, unchanged).

## Design system (reused from existing redesigned pages)

- Scoped class root: `.sp-sponsorships` (mirrors `.sp-donations` / `.sp-fundraisers`).
- Tokens shared: `--sp-blue #1F5FE0`, `--sp-blue-deep #0B3FB0`, `--sp-green #0E9F6E`, `--sp-accent #FF6B35`, `--sp-violet #7B5BE0`, `--sp-amber #E0A21F`, `--sp-ink #0A0F1E`, `--sp-paper #FAFAF7`, `--sp-paper-2 #F2F3EE`, `--sp-line #E6E9F0`.
- Fonts: `Instrument Serif` for display, `Geist`/`Inter` for UI.
- Buttons: `.sp-btn-primary`, `.sp-btn-ghost`, `.sp-btn-white` — pill-shaped.
- Section primitives: `.sp-section`, `.sp-section.alt`, `.sp-section.white`, plus dark `.sp-process` band.
- All mock visuals are pure HTML/CSS — no images, no extra deps.
- Lucide-style inline SVGs for icons (matching the pattern used on the donations page).
- Responsive: hero stacks under ~960px; placement grid collapses to 2-up then 1-up; process rail stacks vertically on mobile.

## Technical notes

- Single `<style>{SCOPED_CSS}</style>` injection scoped under `.sp-sponsorships`.
- Document title set to `Sponsorship Fundraisers — Turn Local Businesses Into Lasting Partners | Sponsorly`; meta description updated to match new copy.
- Page is purely presentational — no data fetching changes required.

## Files to change

- `src/pages/SponsorshipCampaigns.tsx` — full rebuild.
- `src/App.tsx` — add `/fundraisers/sponsorships` route + redirect from old path.
- `src/pages/CampaignsOverview.tsx` — update sponsorships card link.
- `src/pages/ForBusinesses.tsx` — update internal sponsorships link.
- `src/pages/EventCampaigns.tsx` — update internal sponsorships link.
