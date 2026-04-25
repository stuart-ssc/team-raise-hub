# Rebuild Donation Fundraisers Landing Page

Rebuild `src/pages/DonationCampaigns.tsx` to match the approved mockup using the same scoped-CSS design system used in `CampaignsOverview.tsx`, `Pricing.tsx`, `Schools.tsx`, and `Features.tsx`. Move the route from `/campaigns/donations` to `/fundraisers/donations` (with a redirect from the old path).

## URL change

- New canonical route: `/fundraisers/donations`
- Old route `/campaigns/donations` becomes a `<Navigate to="/fundraisers/donations" replace />` redirect (so existing inbound links and tracking history still work).
- Update internal links in `Nonprofits.tsx` and `CampaignsOverview.tsx` to point to the new path.
- Update `useLandingPageTracking` `pagePath` to `/fundraisers/donations`.

## Page sections (matching mockup, top to bottom)

1. **MarketingHeader** (existing, unchanged).
2. **Hero — split two-column**
   - Left: green eyebrow chip "Donation fundraisers", display-serif headline "Make giving easy. Keep *all of it.*" (italic accent), supporting paragraph, two CTAs ("Launch your fundraiser" primary blue pill, "See a demo" ghost), and a small row of three check items ("One-time + recurring", "Auto tax receipts", "Same-day payouts").
   - Right: Mock donation card — campaign title "Support our Annual Fund", small "$250 from Liz Chen" pill, raised amount + green progress bar with 65% label, suggested amount chips ($25/$50/$100 selected/$250), donor avatar + "+1 to the impact, anonymous", orange "Donate $100 now" CTA.
3. **"Everything you need for *successful* giving" feature grid** (white section)
   - Eyebrow "Built for fundraising", centered display headline with italic accent.
   - Asymmetric grid: a tall blue feature card on the left ("Automatic tax receipts. No paperwork.") with a small mock receipt at the bottom; right column stacked 2x2 of smaller cards: "Recurring giving" (with monthly/quarterly/annual chip mock), "Year-end summaries" (mock email row), "Goal thermometers" (mock progress bars), "Donor recognition" (colored avatar dots).
4. **"Build *predictable* recurring giving" split section** (paper background)
   - Left: green eyebrow "Sustainable funding", display headline with green italic accent, supporting copy, four bullet rows (push recurring opt-in at checkout; card-update emails; smart reminders before card expires; cohort analytics — MRR, churn, LTV), primary blue pill CTA "Start your recurring program".
   - Right: Dark dashboard mock "Monthly Giving Dashboard" with two stat tiles (MRR $3,250, Active Subscribers 47) and three subscriber rows with monthly chips.
5. **"Donations that fit any kind of campaign"** (white section)
   - Centered eyebrow + display headline.
   - 4-column row of subtle paper cards: Annual funds, Capital campaigns, Emergency appeals, Monthly giving. Each card has a small colored icon, title, short description, and an example line ("e.g., 'Annual Fund' · $50K goal").
6. **"Celebrate your *donors* publicly" recognition split** (paper background)
   - Left: orange eyebrow "Recognition", display headline with orange italic accent, supporting copy, four checkmark bullets (automatic donor wall, tiered recognition levels, anonymous option, real-time updates).
   - Right: Mock "Our amazing donors" card with colored donor tiles + "+275 more supporters".
7. **Final CTA — dark band**
   - Deep navy/blue background, large display headline "Ready to launch your *donation campaign?*" with green italic accent, supporting copy, two CTAs ("Get started free" primary white pill, "Explore all fundraiser types" outline-white pill linking to `/fundraisers`).
8. **MarketingFooter** (existing, unchanged).

## Design system (reused from existing redesigned pages)

- Scoped class root: `.sp-donations` (mirrors `.sp-fundraisers` pattern).
- Tokens: `--sp-blue: #1F5FE0`, `--sp-blue-deep: #0B3FB0`, `--sp-green: #0E9F6E`, `--sp-accent: #FF6B35`, `--sp-ink: #0A0F1E`, `--sp-paper: #FAFAF7`, `--sp-paper-2: #F2F3EE`, `--sp-line: #E6E9F0`.
- Fonts: `Instrument Serif` for display headlines (italic for accent words), `Geist`/`Inter` for UI/body.
- Buttons: `.sp-btn`, `.sp-btn-primary`, `.sp-btn-ghost`, `.sp-btn-white`, `.sp-btn-outline-white` — all pill-shaped.
- Section primitives: `.sp-section`, `.sp-section.alt`, `.sp-section.white`.
- Mock cards: white surface, 18px border-radius, 1px `--sp-line` border, soft shadow on hover.

## Technical notes

- All page-specific CSS is injected via a single `<style>{SCOPED_CSS}</style>` element at the top of the component, scoped under `.sp-donations` so nothing leaks into the rest of the app (same approach as `CampaignsOverview.tsx`).
- All mock visuals are pure HTML/CSS (no images required) so the page stays lightweight.
- Responsive: hero collapses to single column under ~960px; feature grid collapses to 1 column under ~720px; "fits any kind" 4-up collapses to 2-up then 1-up.
- Update document title to `Donation Fundraisers — One-Time & Recurring Giving | Sponsorly` and meta description (kept similar to existing).
- Lucide icons used inline where small marks are needed (Check, Heart, Receipt, RefreshCw, Target, etc.).

## Files to change

- `src/pages/DonationCampaigns.tsx` — full rebuild.
- `src/App.tsx` — add `/fundraisers/donations` route, redirect old `/campaigns/donations` path.
- `src/pages/CampaignsOverview.tsx` — update donation card link to `/fundraisers/donations`.
- `src/pages/Nonprofits.tsx` — update donation link to `/fundraisers/donations`.
