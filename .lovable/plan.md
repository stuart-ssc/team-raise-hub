# Public Group Hub Page

## What exists today
- `/c/:slug` — single fundraiser landing page (per campaign).
- `/schools/:state/:slug` & `/districts/:state/:slug` — marketing-directory pages built from the imported school list (not branded by the org and not driven by their own fundraisers).
- There is **no** public hub that aggregates all of a team/group's current fundraisers in one branded place.

## Proposal: `/g/:orgSlug/:groupSlug` (and `/o/:orgSlug` for nonprofits)
A shareable, public, branded landing page for each Group (e.g., "Lincoln HS Boys Soccer") listing all active fundraisers. Perfect for sharing on a team's website, Linktree, or social bio.

### Page content
1. **Branded header**
   - Organization logo + group name ("Lincoln HS — Boys Soccer")
   - Group's tagline / short description
   - Optional cover image
   - Location (city, state)
2. **Active fundraisers grid**
   - Card for each `published` campaign in that group
   - Image, name, type tag (Pledge / Sponsorship / Donation / Merch / Event), short blurb
   - Progress bar (raised / goal), days remaining
   - "Support this fundraiser" → `/c/:slug`
3. **Past / completed fundraisers** (collapsed section)
   - Total raised across all-time as a trust signal
4. **Share bar** — copy link, X, Facebook, email, QR code download
5. **Contact / follow** — group's public email or social links if provided
6. **Footer CTA** — "Powered by Sponsorly" (subtle, per brand)

### Where the link surfaces in-app
- `/dashboard/groups` — each group row gets a "Public page" share button (copy URL + QR).
- `/dashboard/settings` — show the org-level public hub URL.
- Inside a fundraiser editor — show "This fundraiser also appears on your team's public page: …".

## Data & schema
- Add `groups.public_slug` (text, unique per organization) — auto-generated from `group_name` via a trigger mirroring `generate_campaign_slug`.
- Add `groups.public_page_enabled` (bool, default `true`) — lets a group hide the hub.
- Add `groups.tagline` (text, nullable), `groups.cover_image_url` (text, nullable), `groups.public_contact_email` (text, nullable).
- Add `organizations.public_slug` (text, unique) for the org-level hub used by nonprofits.
- Public read RLS policies: anyone can `SELECT` a group/org row when `public_page_enabled = true`, and anyone can read its `published` campaigns (we already expose them via `/c/:slug`).

## New files
- `src/pages/GroupPublicHub.tsx` — main page (SEO head, branded header, fundraiser grid, share bar).
- `src/pages/OrgPublicHub.tsx` — same component, scoped to all groups under an org (used for nonprofits with one or many funds).
- `src/components/public-hub/FundraiserCard.tsx` — reused card with progress bar.
- `src/components/public-hub/ShareBar.tsx` — copy link + socials + QR.
- Routes in `src/App.tsx`:
  - `/g/:orgSlug/:groupSlug` → `GroupPublicHub`
  - `/o/:orgSlug` → `OrgPublicHub`
- Edge function `get-public-group-hub` (service-role read) returning org branding + list of published campaigns with computed totals — keeps RLS strict and avoids exposing internal columns.
- Dashboard surface: small "Share public page" button on `Groups.tsx` and `OrganizationSettings.tsx` that opens a dialog with URL + QR.

## SEO & social
- Use `SeoHead` with dynamic title/description.
- Hook into existing dynamic OG image edge function (per `mem://features/social-sharing-og-images-dynamic`) so previews show the group's branding.

## Out of scope for this pass
- Custom domains per group.
- Editable rich-text "About" blocks.
- Email signup form on the hub.

These can be follow-ups once the basic hub ships.
