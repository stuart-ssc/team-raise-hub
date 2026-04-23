

## Goal
Reskin the manager-facing `/dashboard/fundraisers` list to match the visual style and UX of the participant "My Fundraising" page — large, stacked fundraiser cards with a colored accent stripe, badges, a stat strip (Goal / Supporters / Avg Gift / Top Gift), and a link bar with Copy / QR / Share / Open actions — and add a **Manage** button to each card that links to the editor.

## Scope
- Only edits `src/pages/Campaigns.tsx` (the page mounted at `/dashboard/fundraisers`).
- Reuses existing primitives already in the project: `Card`, `Badge`, `Button`, `ShareMenu`, `QRDialog`, `pickBrandLogo`, plus the `cn`/format helpers.
- Keeps existing data fetching, RLS-aware filtering, search, status filters (Active / Published / Drafts / Pending / Expired / All / Deleted), delete, and restore behavior intact.
- Donor/business "Outreach Campaigns" surfaces are untouched.

## Changes — `src/pages/Campaigns.tsx`

### 1. New card layout (replaces the current mobile card + desktop table)
Render fundraisers as a single vertical list of large cards on **all** breakpoints (no separate desktop table). Each card mirrors the `CampaignCard` from `MyFundraising.tsx`:

- Left colored accent stripe (`w-1.5`):
  - Emerald when `enable_roster_attribution` is true ("Roster"),
  - Sky otherwise ("Team").
- Header row:
  - Fundraiser name (serif, large) + small external-link icon to `/c/{slug}` when slug exists.
  - Type pill (Roster / Team) using the same emerald/sky tinted badge.
  - Status badge: Published (Globe) / Draft (Eye) / Pending (AlertCircle) / Expired (AlertCircle) — same logic as today.
  - Group name as subtle text under the title.
  - Right side: `DaysLeftChip` (reused style — green / amber / red based on days remaining).
- Stat strip (4 columns, stacks on mobile):
  - **Goal** — `$raised / $goal` with progress bar tinted to match the stripe.
  - **Supporters** — derived from a new lightweight count (see Technical notes); fall back to "—" if not available without an extra query (we'll show donation count from existing data if present, otherwise "—").
  - **Dates** — formatted start–end range.
  - **Type** — campaign type name (e.g., "Sponsorships").
- Link bar (muted background, rounded, border):
  - Monospace truncated URL `sponsorly.io/c/{slug}`.
  - Icon buttons: Copy link, Show QR (opens `QRDialog`), Share (`ShareMenu`), Open in new tab.
  - Disabled / hidden gracefully when the fundraiser has no `slug` (drafts).
- **Manage button** (primary action, right-aligned in the link bar row):
  - `<Button onClick={() => navigate('/dashboard/fundraisers/{id}/edit')}>Manage</Button>`.
  - Followed by the existing overflow `MoreHorizontal` dropdown for Delete (when `isDeletable`) or a Restore button when `filterBy === "deleted"`.

### 2. Toolbar (kept, lightly restyled)
- Keep the search input, status `Select` (Active / Published / Drafts / Pending Verification / Expired / All / Deleted), and the "Add Fundraiser" dropdown (Create manually / Create with AI) exactly as they are.
- Remove the mobile-only Sort row (not needed — cards already display all info; default sort: most recently updated first, then alphabetical).
- Optionally add a view toggle (List / Compact) matching MyFundraising. **Decision: omit for now** — single list view to keep the change focused. Can add later.

### 3. Empty state
- Replace the table empty row with a centered `Card` containing the existing copy ("No fundraisers found") and the existing primary CTA ("Let's Create a Fundraiser" → `/dashboard/fundraisers/new`).

### 4. QR dialog wiring
- Add local state `qrDialogCampaign: Campaign | null`.
- Render a single `<QRDialog>` at the bottom of the page driven by that state, using the campaign's public `/c/{slug}` URL. Pass `campaignName` and best-available logo via `pickBrandLogo` (group/school/org logos are already nullable — pass `null` for any not on the existing query; no schema changes needed).

### 5. Delete / restore
- Keep `AlertDialog` for delete confirmation, `handleDeleteCampaign`, `handleRestoreCampaign`, and `isDeletable` exactly as today. Just relocate the trigger into the new card's overflow menu.

### 6. Cleanup
- Remove the now-unused desktop `Table` block and all related imports (`Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `Progress` — replaced by an inline progress bar div, `useIsMobile` if no longer needed).
- Add imports: `Trophy`, `Copy`, `QrCode`, `Share2`, `Link2`, `Clock`, `Globe`, `Eye`, `AlertCircle` (already present), plus `ShareMenu`, `QRDialog`, `pickBrandLogo`, and the `cn` helper.

## Technical notes
- No schema or query changes. The existing `fetchCampaigns` already returns everything needed (name, slug, group, type, goal, raised, dates, status, roster flag).
- "Supporters" / "Avg gift" / "Top gift" stats from MyFundraising rely on per-roster-member data that's not in the manager-list query. We'll show **only the stats already available**: Goal/Raised + progress, Type, Group, Dates. The card shape stays identical to MyFundraising, just with these four stat columns instead of Goal/Supporters/Avg/Top — keeps the visual rhythm without a heavier query.
- All existing routes, filters, and permissions are preserved.

## Verification
- `/dashboard/fundraisers` shows a stacked list of fundraiser cards (no table) with the same visual language as `/dashboard/my-fundraising`.
- Each card has a green or blue accent stripe, name + type/status badges, group + dates, a goal progress bar, and a link bar with Copy / QR / Share / Open + a **Manage** button that opens the editor.
- Search, the status filter dropdown, and "Add Fundraiser" still work exactly as before.
- Drafts (no slug) hide the link-bar action icons but still show the Manage button.
- Delete and Restore flows work via the card overflow menu.

