

## Goal
Redesign the supervisor (coach / club sponsor / booster leader / executive director / program director) dashboard at `/dashboard` to mirror the visual language of the participant `PlayerDashboard` and follow the provided coach mockup. Add new sections (hero with KPIs + season progress, Needs Attention, Recent Activity, Roster) on top of the existing Campaigns and Donors blocks.

## Scope
- File touched: `src/pages/Dashboard.tsx` only (the supervisor branch — the participant `<PlayerDashboard />` branch is untouched).
- All new data is read from existing tables (`campaigns`, `orders`, `donor_profiles`, `organization_user`, `rosters`, `roster_member_campaign_links`, `membership_requests`). No schema, RLS, or edge-function changes.
- Respects existing `useActiveGroup()` filtering, `useOrganizationUser()`, and the Manage / Add Fundraiser routing already in place.

## Layout (top → bottom)

```text
┌──────────────────────────── HERO (dark sidebar gradient) ─────────────────────────────┐
│ [Season pill] [+$X this week pill] [N/M players active pill]    [+ Add Fundraiser] [Send Roster Blast]
│ GOOD MORNING, {FIRST_NAME}
│ {Group or Org Name} raised ${total} toward ${goal}.            
│ {N campaigns live · M donors · K of L players have recorded their pitch.}
│ SEASON GOAL  ▓▓▓▓▓░░░░░░░░░░░░░░░  3% TO ${goal}
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐
│ │ ACTIVE       │ AMOUNT      │ TOTAL       │ LEFT TO     │
│ │ CAMPAIGNS    │ RAISED      │ DONORS      │ RAISE       │
│ │ 5            │ $28,450     │ 147         │ $1.06M      │
│ │ 2 ending<14d │ across 147  │ +22 this wk │ at pace:71d │
│ └─────────────┴─────────────┴─────────────┴─────────────┘
└────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────── Needs your attention ─────────┐ ┌─────── Recent activity ─────────┐
│ • Approve N membership requests       →  │ │ • Aunt Mel gave $50 to Taylor   │
│ • Review {campaigns w/o pitch} players →  │ │ • Sam Diallo recorded pitch     │
│ • Connect payment account (if any)    →  │ │ • Jeremy gave $250 to Jordan    │
│ • Schedule thank-you for X new donors →  │ │ • ... last 7 events             │
└──────────────────────────────────────────┘ └─────────────────────────────────┘

┌─────────────────── Fundraisers (existing table, restyled) ────────────────────────┐
│  ... rows stay the same: name • group • $raised/$goal+% • dates • status • Manage │
└────────────────────────────────────────────────────────────────────────────────────┘

┌─────────── Roster — {Active Group} ───────┐ ┌────── Donors (existing) ────────┐
│ # · Avatar · Name · Last active           │ │ Name · Email · Total · Segment  │
│ $raised · supporters · pitch status       │ │ ... existing top-10             │
└──────────────────────────────────────────┘ └─────────────────────────────────┘
```

Mobile (<768px): each two-column row stacks; tables fall back to existing card variants.

## Detailed changes — `src/pages/Dashboard.tsx`

### 1. New data fetches (added to the supervisor branch only)
- **Roster (current group)**: query `organization_user` joined with `profiles` and `roster_member_campaign_links` to get top players for the active group sorted by `attributed_total` (sum of `orders.items` price × qty where `attributed_roster_member_id = ou.id` & status in `succeeded`/`completed`). Use the same aggregation pattern as `PlayerDashboard.fetchLeaderboard`. Show top 8.
- **Pitch status per player**: derive from `roster_member_campaign_links` + a `pitch_video_url` / `pitch_recorded_at` field on the link row (already present in P2P feature). Player has "Pitch recorded" if any link has a non-null pitch URL; "No pitch" if links exist but none recorded; "Invite pending" if the org_user has no `user_id` (invite not accepted); "Inactive" if last sign-in older than 14 days (skipped if data unavailable — fall back to "No pitch").
- **Recent activity (last 10)**: union of three sources, sorted by timestamp desc:
  - Recent `orders` (donor name + amount + campaign + attributed roster member name if any).
  - Recent `roster_member_campaign_links.pitch_recorded_at` (player + "recorded their pitch").
  - Recent `organization_user` joins (player + "joined the roster") within the last 14 days.
- **This-week totals**: sum `orders.created_at >= 7d ago` for the +$X-this-week pill.
- **Season goal**: sum of `goal_amount` across active campaigns for the active group (already computed as `totalGoalAmount`).
- **Players-active counters**: count of `organization_user` rows (participant permission) for the active group; "active" = has logged in within 30 days OR has any attributed donation.
- **Pitch-recorded count**: distinct roster members with at least one recorded pitch link.

### 2. Hero block (new)
Replace the existing four plain stat cards + section with one full-width hero card styled like `PlayerDashboard`'s hero:
- Container: `rounded-xl bg-gradient-to-br from-sidebar via-sidebar to-primary/40 text-sidebar-foreground` + radial-glow overlay.
- Top-left pills: season name (placeholder "Spring 2026" — replaced by current season label = `{Q} {YYYY}` derived client-side), `+$X this week`, `{active}/{total} players active`.
- Top-right action buttons: **+ Add Fundraiser** (existing route `/dashboard/fundraisers/ai-builder`) and **Send Roster Blast** (placeholder route `/dashboard/messages?compose=roster` — wired to existing messages page).
- Greeting line: `GOOD {MORNING|AFTERNOON|EVENING}, {LASTNAME or FIRSTNAME uppercased}`.
- Headline: `{ActiveGroup or Org} raised $XXk toward $YYk.` with the dollar amounts in italic gradient text (mirrors PlayerDashboard pattern).
- Sub-copy: `N campaigns live · M donors · K of L players have recorded their pitch.`
- Season goal bar (white-on-translucent track, primary fill).
- Stats row of four glass-style tiles: Active Campaigns, Amount Raised, Total Donors, Left to Raise — each with a value + sub-label (matches existing computed values; sub-labels list things like "2 ending in <14 days", "+22 new this week", "at current pace: ~Xd").

### 3. Needs your attention card (new)
Two-column grid with "Recent activity" on the right (`grid lg:grid-cols-2 gap-4`).
Items dynamically built (only show non-zero counts):
- `pendingRequestsCount` → "Approve N new membership invites" → `/dashboard/users?tab=pending`.
- Players w/ no pitch on any link (only when `enable_roster_attribution` campaigns exist) → `/dashboard/rosters`.
- Each entry in `unconnectedGroups` → "Connect payment for {group}" → opens existing `GroupPaymentSetupDialog`.
- New donors in last 7 days → "Schedule thank-you for N new donors" → `/dashboard/donors`.
Right-aligned colored count chip + chevron arrow per item. If no items, show "All clear ✓".

### 4. Recent activity card (new)
Right-side companion to "Needs your attention". Renders up to 7 events with a small colored dot, primary line ("Aunt Mel gave $50 to Taylor Park"), and meta line ("2h ago · Banner Sales"). "View all" links to `/dashboard/donors` (donations are the dominant type).

### 5. Fundraisers (Campaigns) card — restyled
Keep existing data fetch, mobile-card fallback, Manage button, and Add Fundraiser CTA. Visual touch-ups:
- Section header gets the count summary line ("N active · M scheduled · $X raised this season").
- Add a small status filter (`Select` for "All types / Active / Scheduled / Lagging / Hot") that filters the `campaigns` array client-side. "Lagging" = <25% raised w/ <30 days left; "Hot" = ≥80% raised — used as Badge tags on the row.
- Amount Raised column shows `$raised / $goal` and a thin progress bar with %.
- Dates column shows formatted range plus "X days left" (red when <14 days).
- Existing Manage button kept; add a `MoreHorizontal` overflow placeholder.

### 6. Roster — {Active Group} card (new, bottom-left)
Visible only when an `activeGroup` is selected and at least one participant exists.
- Header: `Roster — {group_name}` with sub-text `N players · sorted by amount raised`.
- Right-side actions: Export (CSV — wired to existing `CsvExportDialog` if present, else placeholder `Download` icon), `+ Invite player` → `/dashboard/users?invite=participant&group={id}`.
- Row layout matches mockup: `#rank · Avatar (initials) · Name · #jersey + last-active meta · $amount + supporters count · Pitch badge · message + overflow icons`.
- Pitch badge variants (green: "Pitch recorded", grey: "No pitch", amber: "Invite pending", muted: "Inactive").
- Top 8 only; "View all" links to `/dashboard/rosters`.

### 7. Donors card — kept, restyled
- Existing fetch + table preserved.
- Add a search input (purely client-side filter over `donors` array) and a `View All` button (already present).
- Email-icon action button per row → `mailto:` (no DB changes).

### 8. Existing alerts
- `Pending Membership Requests` and per-group `Connect payment account` alert cards (currently top of supervisor branch) are removed from the top — the same items now appear in the new "Needs your attention" list and stay clickable. This avoids duplication and matches the mockup's single attention column.

## Visual / branding rules
- Dark hero only (everything else stays on white card backgrounds — matches Core memory rule).
- No gradients on body cards — only the hero uses the sidebar gradient.
- 1rem (16px) icons throughout; status dots are 0.5rem solid circles.
- All status / segment / activity strings remain Title Case ("Pitch Recorded", "Champion", etc.).
- Currency rendered as decimal dollars with `toLocaleString()` (no cents conversion).
- Cards convert to single-column stack at `<768px`; the Roster + Donors tables fall back to the same mobile card pattern already in `Dashboard.tsx`.

## Out of scope
- No changes to the participant/parent `PlayerDashboard` branch.
- No new tables, columns, RLS, or edge functions.
- "Send Roster Blast" wires to the existing `/dashboard/messages` page only — we do not build a new compose flow here.
- "Bring in a local business sponsor" callout and "Coach Tip" banner from page 2 of the PDF are deferred (separate follow-up).

## Verification
- Coach / Club Sponsor / Booster Leader / Executive Director / Program Director see the new dashboard at `/dashboard`.
- Participants and Family Members continue to see `PlayerDashboard` (unchanged).
- Hero shows correct greeting, group/org name, totals, season-goal progress, and 4 KPI tiles using live data.
- "Needs your attention" surfaces real pending requests, unconnected payment groups, players without pitches, and recent donors needing thank-you.
- "Recent activity" lists the most recent 7 donations / pitch recordings / roster joins for the active group.
- Fundraisers card retains existing Manage and Add Fundraiser flows; row Manage button still routes to `/dashboard/fundraisers/{id}/edit`; type filter and Hot/Lagging tags work.
- Roster card lists top 8 players in active group, sorted by attributed total, with correct pitch-status badges and Invite Player CTA.
- Donors card unchanged in data, search input filters client-side.
- All views responsive: cards stack at <768px and tables convert to card layouts.

