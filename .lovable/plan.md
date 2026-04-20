

## Goal
Trim the in-card team leaderboard to **top 5** with a "View full leaderboard →" link, and create a new **Campaign Leaderboard page** that matches the dashboard card style and shows the full ranked roster.

## Changes

### 1. Trim in-card leaderboard (PlayerDashboard.tsx)
- Change `.slice(0, 10)` in the render to `.slice(0, 5)`. Keep `fetchLeaderboard` returning up to 10 (cheap, used for "gap to next" math) — only the visible slice changes.
- Update the header member count to read `Top 5 of {leaderboard.length}+` when there are more than 5 members. Otherwise just `{leaderboard.length} members`.
- Below the list, add a right-aligned link button:
  ```
  View full leaderboard →
  ```
  - Routes to `/c/{headline.slug}/leaderboard`.
  - Styled `Button variant="link" size="sm"` with primary color, chevron-right icon.
  - Only rendered when `headline?.slug` exists.

### 2. New page: Campaign Leaderboard
Create `src/pages/CampaignLeaderboard.tsx`, route `/c/:slug/leaderboard`. **Public route** (no auth required) so players can share it; matches the existing `/c/:slug` campaign-landing pattern.

**Layout** (mirrors the headline-challenge card style for visual continuity):
- Page wrapper: white background, max-w-4xl, centered, py-10.
- **Header card** (same `border-t-4 border-t-primary` accent + `bg-muted/30` header zone as the dashboard card):
  - Back link: `← Back to {Campaign}` → `/c/{slug}`.
  - Pills row: `Roster Challenge` (if `enable_roster_attribution`), `{N} Days Left` (if `end_date`).
  - Title: campaign name.
  - Right side: `TEAM RAISED` eyebrow, `$X / $Y`, slim primary progress bar.
- **Leaderboard list** (full roster, no slice cap):
  - Same row styling as the dashboard card: `bg-primary/[0.03]` zone, rounded rows, rank icons (gold/silver/bronze for top 3, `#N` for the rest), `YOU` badge for the signed-in user when applicable, `$0` rendered muted.
  - Sort logic identical to dashboard: by `totalRaised desc`; alphabetical fallback if everyone is at $0.
  - Member-count line at top: `{N} members on the roster`.
  - Empty/all-zero state: same italic *"No donations yet — share your link to take the lead."* note.
- **Footer**: small CTA card — `Want to climb the board? Share your link.` with a `Share` button (uses `navigator.share` / clipboard fallback for the campaign URL).

### 3. Data fetching for the new page
- Resolve campaign by `slug` from `campaigns` table (publicly readable).
- Call existing edge function or replicate the logic from `fetchLeaderboard`:
  - Fetch all `organization_user` rows with `roster_id` matching the campaign's roster(s) and `active_user = true`.
  - Fetch profiles for names.
  - Aggregate `orders.items` totals where `attributed_roster_member_id` is in the roster set and status in `('succeeded','completed')`.
- Get team total/goal directly from the campaign record (`amount_raised`, `goal_amount`).
- If the user is logged in, mark their row with `isCurrentUser`.

To keep this clean and DRY, extract the roster-leaderboard aggregation into a small helper `src/lib/leaderboard.ts` exporting `fetchRosterLeaderboard(rosterIds, currentUserId?)` returning `LeaderboardEntry[]`. Both `PlayerDashboard.tsx` and the new page import it.

### 4. Routing (App.tsx)
Add a public route **above** the catch-all and after the existing `/c/:slug` routes:
```
<Route path="/c/:slug/leaderboard" element={<CampaignLeaderboard />} />
```
This sits alongside `/c/:slug/:rosterMemberSlug`. Since `leaderboard` is a fixed string and React Router does literal segment matching with both routes registered, we'll order it **before** `/c/:slug/:rosterMemberSlug` so the literal wins. (Verified pattern: React Router v6 prioritizes static segments over dynamic ones automatically, but explicit ordering keeps it obvious.)

## Files touched
1. **`src/components/PlayerDashboard.tsx`** — slice leaderboard render to 5; add "View full leaderboard →" link button; tweak member-count label.
2. **`src/lib/leaderboard.ts`** — *new*, shared `fetchRosterLeaderboard` helper.
3. **`src/pages/CampaignLeaderboard.tsx`** — *new*, full-leaderboard page.
4. **`src/App.tsx`** — add `/c/:slug/leaderboard` route, import `CampaignLeaderboard`.

## Out of scope
- Styling changes to the hero, family-members card, or other-campaigns grid.
- Pagination for >100-member rosters (current `max_rows=1000` Supabase limit handles realistic team sizes).
- SEO/OG tags for the leaderboard page.
- Per-roster filtering on the leaderboard page (shows all roster members across the campaign's rosters, same as current dashboard logic).

