

## Goal
Make the **Headline Challenge** card visually pop and match the mockup: stronger color/border separation between zones, "Team Pot" → **"Team Raised"**, restructured top row, and a leaderboard that **lists every roster teammate alphabetically** even when no one has donated yet (so the team feels real on day 1).

## Changes

### 1. Top row restructured (matches mockup)
Replace the current header + separate "Team Pot" bar with a 2-column header row:

```text
┌──────────────────────────────┬──────────────────────────────┐
│ [Roster Challenge] [40 Days] │                  TEAM RAISED │
│ [Ends 5/29/2026]             │              $9,420 / $18,000│
│ Banner Sales                 │  ▓▓▓▓▓▓▓░░░░░░░░░░ progress │
│ Your Headline Challenge      │                              │
└──────────────────────────────┴──────────────────────────────┘
```

- Left column: pills, large title, subtitle.
- Right column (right-aligned): "TEAM RAISED" eyebrow, `$X / $Y`, slim `Progress` bar.
- Rename `Team Pot` → `Team Raised` everywhere it appears in this card.

### 2. Card structure: clear color & border separation
The card becomes a **bordered shell** with three visually distinct zones:

- **Header zone** — light `bg-muted/30` background, `border-b` divider. Holds the new top row above.
- **Left content zone** — white background (`bg-background`), right `border-r` divider on `lg:` and up. Contains: My Personal Goal, Your Personal Link, share buttons, tip line.
- **Right content zone** — subtle `bg-primary/[0.03]` tint to differentiate. Contains: Team Leaderboard heading + alphabetized member list.

On mobile (`<lg`), the divider stacks: zones get `border-t` between them instead of `border-r`, and the right zone tint stays as a soft visual separator.

Add a subtle accent stripe at the top: replace `border-l-4 border-l-primary` with `border-t-4 border-t-primary` so the whole card reads as one branded block.

### 3. Leaderboard — list **all roster teammates** (alphabetical fallback)
**Update `fetchLeaderboard`** in `src/components/PlayerDashboard.tsx` (~line 491–507):

- Remove the `.filter(entry => entry.totalRaised > 0)` line so every active teammate is included.
- Change the sort: if **any** teammate has `totalRaised > 0`, sort by `totalRaised desc` (current behavior). If **all** are zero, sort **alphabetically by `firstName, lastName`**.
- Keep the `.slice(0, 10)` cap so we still show the top 10 / first 10.

Display tweaks in the card:
- Drop the empty-state "No donations yet" block — we always have rows now. Instead, when the **logged-in player has $0 raised AND no teammate has either**, show a small inline note above the list: *"No donations yet — share your link to take the lead."*
- Each row keeps current structure (rank icon, name, "YOU" badge, amount). Rows with `$0` show `$0` in muted text instead of bold so leaders stand out visually.
- Above the list keep `TEAM LEADERBOARD` eyebrow + medal icon. Add `[entries.length] members` count next to it.

### 4. Color & border details (Sponsorly brand, no rainbow)
- Card outer: `border border-border rounded-lg overflow-hidden shadow-sm border-t-4 border-t-primary`.
- Header zone: `bg-muted/30 px-6 py-5 border-b`.
- Pill colors: keep `Roster Challenge` solid primary; `Days Left` outline primary; `Ends …` neutral outline.
- Team-Raised bar: `bg-primary` fill on a `bg-primary/10` track for stronger visibility than the current default.
- Personal-goal bar (left zone): keep `bg-primary` with `bg-muted` track.
- Right zone tint: `bg-primary/[0.03]` with internal padding `p-6`.
- Current user leaderboard row: keep `bg-primary/5 border border-primary/20` so it pops inside the tinted zone.

### 5. Out of scope
- Hero section, Other Campaigns grid, parent view, ManageGuardiansCard.
- Pitch recorder/QR/share dialogs.
- Schema or edge-function changes.

## Files touched
1. `src/components/PlayerDashboard.tsx`
   - `fetchLeaderboard` (~lines 491–507): remove zero-filter, add alphabetical fallback sort.
   - Headline Challenge JSX (~lines 990–1137): restructure header into 2-column row, rename "Team Pot" → "Team Raised", add zoned borders/backgrounds, drop empty leaderboard state, add member count + alphabetic-mode hint copy.

