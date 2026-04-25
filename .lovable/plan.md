# SEO Metadata Audit + Crawler Protection

## Goals
1. Every marketing (public) page ships unique title, description, canonical, and OG/Twitter tags.
2. No private route (/dashboard, /system-admin, /portal, auth, checkout, orders, receipts) is crawlable — defended both by `robots.txt` and a `<meta name="robots" content="noindex, nofollow">` on the page itself.

---

## Current state

**Marketing pages with FULL `<Helmet>` metadata (good):**
- `Pricing.tsx`, `FAQ.tsx`

**Marketing pages with only `document.title` (missing description/canonical/OG):**
- `CampaignsOverview.tsx` (`/fundraisers`)
- `SponsorshipCampaigns.tsx` (`/fundraisers/sponsorships`)
- `DonationCampaigns.tsx` (`/fundraisers/donations`)
- `EventCampaigns.tsx` (`/fundraisers/events`)
- `MerchandiseCampaigns.tsx` (`/fundraisers/merchandise`)
- `RosterCampaigns.tsx` (`/fundraisers/roster`)
- `ForBusinesses.tsx` (`/for-businesses`)
- `Schools.tsx` (`/schools`)
- `Nonprofits.tsx` (`/nonprofits`)

**Marketing pages with NO metadata at all:**
- `Index.tsx` (`/`) — relies only on `index.html` defaults
- `Platform.tsx` (`/platform`)
- `Features.tsx` (`/features`)
- `Contact.tsx` (`/contact`)
- `Terms.tsx` (`/terms`)
- `PrivacyPolicy.tsx` (`/privacy`)
- `DataProcessingAgreement.tsx` (`/dpa`)

**robots.txt:** disallows `/dashboard*` and `/system-admin*`, but **misses** `/portal*`, `/login`, `/signup`, `/set-password`, `/checkout/*`, `/orders/*`, `/donor-receipts`, `/native-features`, `/fundraiser-unsubscribe`, `/dashboard/*` private sub-routes (covered via wildcard but worth being explicit).

State landing pages (`/schools/:state`), school landing pages, and campaign landing pages already use `<Helmet>` with `index, follow` — leave as-is.

---

## Plan

### Step 1 — Add proper `<Helmet>` metadata to every public marketing page

Replace `useEffect(() => { document.title = ... })` (and add where missing) with a `<Helmet>` block at the top of the JSX containing:
- `<title>` — keyword-targeted, unique per page
- `<meta name="description">` — 140–160 chars, page-specific
- `<link rel="canonical" href="https://sponsorly.io{path}">`
- `<meta name="robots" content="index, follow">`
- OG: `og:title`, `og:description`, `og:url`, `og:type=website`, `og:image` (existing logo)
- Twitter: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`

Pages to update (titles are illustrative — final copy will mirror page content):

| Page | Title | Path |
|---|---|---|
| `Index.tsx` | Sponsorly — 100% Fundraising for Schools, Teams & Non-Profits | `/` |
| `Platform.tsx` | Platform — All-in-One Fundraising Software | `/platform` |
| `Features.tsx` | Features — Built for Modern Fundraising Teams | `/features` |
| `Schools.tsx` | Sponsorly for Schools — Fundraising for Teams, Clubs & PTOs | `/schools` |
| `Nonprofits.tsx` | Sponsorly for Nonprofits — Fundraising for 501(c)(3)s | `/nonprofits` |
| `ForBusinesses.tsx` | For Businesses — Local Sponsorship Network | `/for-businesses` |
| `CampaignsOverview.tsx` | Fundraiser Types — Five Ways to Raise on Sponsorly | `/fundraisers` |
| `SponsorshipCampaigns.tsx` | Sponsorship Fundraisers — Local Business Partners | `/fundraisers/sponsorships` |
| `DonationCampaigns.tsx` | Donation Fundraisers — One-Time & Recurring Giving | `/fundraisers/donations` |
| `EventCampaigns.tsx` | Event Fundraisers — Ticketing & Event Fundraising | `/fundraisers/events` |
| `MerchandiseCampaigns.tsx` | Merchandise Fundraisers — Team Stores & Spirit Wear | `/fundraisers/merchandise` |
| `RosterCampaigns.tsx` | Roster Fundraisers — Peer-to-Peer Team Fundraising | `/fundraisers/roster` |
| `Contact.tsx` | Contact Sponsorly — Talk to Our Team | `/contact` |
| `Terms.tsx` | Terms of Service | `/terms` |
| `PrivacyPolicy.tsx` | Privacy Policy | `/privacy` |
| `DataProcessingAgreement.tsx` | Data Processing Agreement | `/dpa` |

Each description will be hand-written from the page's actual hero/value-prop content.

### Step 2 — Harden crawler protection for private areas

**A. Update `public/robots.txt`** to add:
```
Disallow: /portal
Disallow: /portal/*
Disallow: /login
Disallow: /signup
Disallow: /set-password
Disallow: /checkout/
Disallow: /checkout/*
Disallow: /orders/
Disallow: /orders/*
Disallow: /donor-receipts
Disallow: /native-features
Disallow: /fundraiser-unsubscribe
```

**B. Add a small `<NoIndex>` Helmet component** at `src/components/seo/NoIndex.tsx`:
```tsx
<Helmet>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="googlebot" content="noindex, nofollow" />
</Helmet>
```

**C. Render `<NoIndex />` inside the shared layouts** so every private page gets it for free, with no per-page edits:
- `src/components/DashboardPageLayout.tsx` (covers `/dashboard/*`)
- `src/pages/SystemAdmin/` shared layout (`SystemAdminLayout` per memory) — covers `/system-admin/*`
- `src/pages/DonorPortal/` shared layout — covers `/portal/*`

**D. Add `<NoIndex />` directly to standalone private pages** that don't use those layouts:
- `Login.tsx`, `Signup.tsx`, `SetPassword.tsx`
- `CheckoutSuccess.tsx`, `OrderDetails.tsx`
- `DonorReceiptPortal.tsx`, `FundraiserUnsubscribe.tsx`
- `NativeFeatures.tsx`

### Step 3 — Verify

- Spot-check 3 marketing pages in the preview to confirm `<title>` and `<meta>` render in the document head.
- Spot-check `/dashboard` and `/portal` to confirm `noindex` meta is present.
- Confirm `robots.txt` responds at `/robots.txt`.

---

## Out of scope
- Sitemap regeneration (`sitemap-main.xml` is current — no new public marketing routes added).
- Dynamic OG images (already handled by existing edge function for campaign/school/district pages).
- Server-side rendering of meta tags (Cloudflare Worker already handles crawler bots per existing setup).
