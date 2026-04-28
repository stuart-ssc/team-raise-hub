# Fix the public team page: clean URLs + make it discoverable

## Two issues found

### 1. The 404
The URL you tried (`/g/sample-school-111111/varsity-basketball-333333`) is the slug we actually stored in the database. The page's data query and routes are correct — but the production site at `sponsorly.io` was last published before the `/g/...` and `/o/...` routes were added, so the deployed bundle doesn't know that route exists and shows the marketing 404.

**Fix:** publish the project again after these changes. The routes already exist in the live preview.

### 2. The ugly slugs
You're right — `sample-school-111111` and `varsity-basketball-333333` look terrible. The slug generator we wrote is fine (it produces `sample-school`, `varsity-basketball`), but the existing rows for the demo school were seeded with UUID-prefix suffixes and never re-generated. We need to clean them up and prevent it happening again.

## What we'll do

### A. Clean up the slugs (migration)
- Re-generate `public_slug` for every existing group and organization using the existing `generate_*_public_slug` functions, so we get the friendly form (`sample-school` / `varsity-basketball`).
- Where two groups in the same org would collide (e.g., two "Boosters"), the function already appends `-2`, `-3` etc. — clean numeric suffixes only, no hex.
- Where an org name collides across the platform, same `-2`, `-3` rule.
- After cleanup, your URL becomes:
  `sponsorly.io/g/sample-school/varsity-basketball`

### B. Make the link easy to find
The "Share Public Page" button is currently buried in the Groups settings menu. We'll surface it in three high-traffic places:

1. **Main dashboard (`/dashboard`)** — In the active group header (the bar that says "Varsity Basketball • 3 / 0 players active"), add two buttons:
   - **View public page** → opens `/g/sample-school/varsity-basketball` in a new tab
   - **Share** → opens the existing share dialog (copy link / social / QR)
2. **Fundraisers list (`/dashboard/fundraisers`)** — Add a "View on team page" item to each campaign's `⋯` menu so coaches can jump from a fundraiser to the team hub.
3. **Sidebar footer** — Above "Help & Support", add a small "Your public team page" link when the active role has a group with a public hub.

For organization admins of nonprofits we'll also expose `/o/sample-org` from `/dashboard/settings` as a copyable URL with View / Share buttons.

### C. Republish
After the slug migration and UI changes, the project needs to be re-published so `sponsorly.io` picks up the new `/g/...` and `/o/...` routes. I'll remind you in the final message.

## Technical notes
- New small component: `src/components/public-hub/PublicHubLinkButton.tsx` (View + Share + QR menu) reused on the dashboard header, fundraiser cards, settings page, and sidebar.
- New hook: `src/hooks/usePublicHubUrl.ts` to resolve `/g/:orgSlug/:groupSlug` (or `/o/:orgSlug`) for any group/org id.
- Reuses existing `ShareHubDialog` and `QRDialog` — no new dialogs.
- New migration that runs `UPDATE groups SET public_slug = generate_group_public_slug(group_name, organization_id, id)` for every row, and the equivalent for `organizations`. Done in a single transaction so the unique indexes stay valid.
- Files touched:
  - new: `src/components/public-hub/PublicHubLinkButton.tsx`
  - new: `src/hooks/usePublicHubUrl.ts`
  - new: `supabase/migrations/<ts>_clean_public_slugs.sql`
  - edit: `src/pages/Campaigns.tsx` (group header + campaign row menu on `/dashboard/fundraisers`)
  - edit: `src/components/DashboardSidebar.tsx` (footer link)
  - edit: `src/pages/OrganizationSettings.tsx` (org-level hub URL field)

## Out of scope
- Letting users hand-pick their own slug (still auto-generated, can be a future setting).
- Custom domains per group.
- Changing the hub page design itself.
