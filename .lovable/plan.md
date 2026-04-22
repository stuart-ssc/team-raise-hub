

## Goal
Redesign **My Fundraising** (`/dashboard/my-fundraising`) to match the new mockup: editorial header, hero stat strip, status tabs with sort/view toggles, and a denser, more scannable campaign card layout with a left accent stripe, inline link bar, and a "Pro Tip" footer. Keep the existing data, parent view, pitch editor, and ManageGuardiansCard wired up.

## What changes (top → bottom)

### 1. Page header
- Editorial serif `H1` "My Fundraising" (use `font-serif` Tailwind class — site already uses Georgia-style for emphasis).
- Subheading: "Manage every fundraiser you've ever been part of. Grab your links, check the stats, and celebrate the wins." (new copy)
- Right-aligned dark `Upload donors` button (icon + label). Wire to `/dashboard/donors?upload=1` (existing donor import flow); if route differs, link to existing donor upload modal trigger on the Donors page.

### 2. Hero stat strip (3 cards)
Replace current 3 summary cards with a new row:

- **Lifetime Raised** — large dark navy card (`bg-[hsl(var(--foreground))] text-background`), small green square icon, big serif `$2,095`, subline `Across {N} campaigns · you've personally driven {X}% of team pot`, mini sparkline on the right. Sparkline: lightweight `recharts` `<LineChart>` (already in deps) of monthly raised totals over last 6 months; if no data, render a flat baseline.
- **Unique Supporters** — white card, soft slate icon tile, serif number, subline `Family, friends & fans`.
- **Best Rank** — white card, soft cream icon tile, serif `#3`, subline = name of campaign with that rank.

All three numbers use a serif font (`font-serif`) for the editorial feel.

### 3. Status filter row
- Segmented pill tabs: `Active (n)`, `Past (n)`, `All (n)`. Counts derived from campaign end dates vs today (Active = `end_date >= today` or null; Past = `end_date < today`).
- Right side: `Recent activity ▼` sort dropdown with options: *Recent activity*, *Most raised*, *Goal progress*, *Ending soonest*.
- Right-most: 2 view-toggle icon buttons (list / compact). Compact view collapses each card to one row (title + amount + link). Default = list.

### 4. Campaign card (redesigned)
Each card becomes a single white card with a left **accent stripe** colored by campaign type:
- Green stripe + green `Roster` pill when `enableRosterAttribution = true`.
- Blue stripe + blue `Team` pill when `enableRosterAttribution = false`.
- Add small `Pitch` pill (mic icon) next to type pill when the campaign has a pitch recorded.

Card body layout:

```text
┌─ Title (serif)  [Roster] [Pitch]                        [⏱ 31 days left] ─┐
│  Started Mar 20 · Ends May 21    Rank #3 of 8                              │
│                                                                            │
│  MY PERSONAL GOAL          SUPPORTERS    AVG GIFT     TOP GIFT             │
│  $285 / $1,000   28%       4             $71          $150                 │
│  ▓▓▓▓░░░░░░░░ progress                                Aunt Mel             │
│                                                                            │
│  ─────────────────────────────────────────────────────────────────────     │
│  🔗 sponsorly.com/give/tp11/banner       [Copy][QR][Share][↗][🎙 Pitch]    │
└────────────────────────────────────────────────────────────────────────────┘
```

Details:
- Header eyebrow row: `Started {date} · Ends {date}` and, for roster cards, `Rank #N of M` to the right of dates.
- Days-left chip top-right: green/neutral when `>14`, amber `7–14`, red-tinted `<7` (e.g. `Donation Station` → red `10 days left` per mockup). Hidden for past campaigns.
- 4-column stat strip:
  - **MY PERSONAL GOAL** (roster) or **TEAM GOAL** (non-roster). Show `$raised / $goal` in serif, `%` right-aligned over the bar, then a thin 4px progress bar tinted with the stripe color.
  - **SUPPORTERS** (uniqueSupporters)
  - **AVG GIFT** (`totalRaised / donationCount`, $0 if none)
  - **TOP GIFT** dollar amount + donor first-name line below. Requires fetching the single largest order per campaign — extend `get-roster-member-stats` to return `topGiftAmount` and `topGiftDonorName`, with safe fallback `—` when none.
- Bottom link bar: muted background, link-icon prefix, URL truncated, then icon buttons: Copy, QR, Share, Open (external), and (roster only) `Re-record pitch` filled green button on the far right that opens the existing `PitchEditor` inline below the card (preserves current behavior).
- Non-roster cards omit the pitch button entirely.
- Empty/no-personal-link state keeps the existing "Personal fundraising link not set up yet" copy but rendered as a slim notice strip above the link bar.

### 5. Pro Tip footer card
Slim card below the campaign list, sky-tinted (`bg-sky-50 border-sky-100`), small lightning icon, copy: *"Pitch videos raise **3.2×** more. Record once, share everywhere."* Only shown when at least one roster card exists and `enableRosterAttribution` campaigns are present.

### 6. Connected family banner (replaces full ManageGuardiansCard placement)
At the **top of the page** (just under the page header, above the hero stats), when the player has at least one connected guardian, show a slim banner card:

```text
👥  Morgan Parent is connected as your family member.  They can see your progress and help share your links.   [+ Invite another]
```

- Pulls the existing connected-guardian list from `ManageGuardiansCard`'s data hook (reuse the same query: parents where `linked_organization_user_id = current player's organization_user.id`).
- Lists up to 2 names inline; if more, append `and N others`.
- `Invite another` button opens the existing invite-guardian dialog used by `ManageGuardiansCard`.
- The full `ManageGuardiansCard` (with management UI) stays at the bottom of the page unchanged for editing/removing — the top banner is purely a status nudge.
- Hidden entirely when no guardians are connected (the existing card's empty-state CTA at the bottom remains the entry point).

### 7. Parent view
Parent view (`isParentView`) keeps the same redesigned layout but:
- Page title becomes `{Child}'s Fundraising` (existing logic).
- Connected-family banner is replaced by the existing `MyConnectedStudentsCard` at the bottom (no change).
- Each campaign card shows the child name as a small badge next to the campaign title; "MY PERSONAL GOAL" label becomes "GOAL".

### 8. Empty state
When `stats.length === 0`: keep the existing empty card but restyle to match (serif heading, trophy icon, same copy).

### 9. Loading state
Replace current 2 large skeletons with: 3 stat-card skeletons in a row + 2 full-width campaign-card skeletons (shape matches new card).

## Data / backend touches
- **`get-roster-member-stats` edge function**: extend response with `topGiftAmount: number | null` and `topGiftDonorName: string | null` (largest single order line for that roster member on that campaign). Safe defaults so existing callers don't break.
- **No DB schema changes.** All new visuals are derived from existing fields (`status`, `end_date`, `goal_amount`, etc.) plus the two new fields above.

## Files to modify
1. `src/pages/MyFundraising.tsx` — full layout rewrite (header, hero, tabs, sort/view, redesigned cards, pro-tip card, connected-family top banner). Keep all existing fetch logic, state, parent view, QR, pitch editor, ManageGuardiansCard, MyConnectedStudentsCard.
2. `src/components/ManageGuardiansCard.tsx` — export the underlying connected-guardian data (or a small hook `useConnectedGuardians(orgUserId)`) so the top banner can reuse it without duplicating the query.
3. `supabase/functions/get-roster-member-stats/index.ts` — add `topGiftAmount` + `topGiftDonorName` to response.

## Out of scope
- Sidebar, header (org switcher), notifications bell.
- Donor upload flow itself (only the entry button changes).
- Compact view rendering details beyond a 1-row collapse — Active/Past/All filter and sort dropdown logic are in scope; deeper saved-view persistence is not.
- Campaign Leaderboard sub-page (already done in earlier turn).

