

## Goal
Make the player hero feel like the mockup: a **gradient navy hero**, a **dynamic, campaign-aware headline** that adapts based on whether the active campaign is roster-attribution or team-only, and a **bottom action bar** with **Record My Pitch**, **Show My QR**, and **Share Link** — replacing the bland flat card currently rendered.

## What changes

### 1. Hero visuals (gradient + tighter layout)
- Add a brand gradient: `bg-gradient-to-r from-sidebar via-sidebar to-primary/40` plus a subtle radial overlay (`bg-[radial-gradient(...)]`) for the glow seen in the mockup. Wrap content in a relative container so the gradient sits behind text.
- Player Card on the right: keep dark glassmorphic tile (`bg-white/5 border-white/10`), add small "PLAYER CARD" eyebrow + jersey/role line, large initials watermark, role line `GUARD · VARSITY BASKETBALL` style — pulled from `rosterMembership` (group name + role label) when available, otherwise a generic "Player · {Team}".
- Stat tiles: tighten to mockup style — small uppercase eyebrow, big number in white, supporting line in muted white. Three tiles (My Raised / Team Rank / Supporters). Add the `↑ up from #N` helper line **only** if we have the rank-history data — we don't, so omit it (no fake numbers).

### 2. Intelligent, campaign-aware headline
Replace the single static "passing X" sentence with logic based on the **headline campaign type**:

| Active headline campaign | Headline copy (italic + brand gradient text on the variable part) |
|---|---|
| Roster-attribution AND user has someone above on leaderboard | `You're $X away from passing {FirstName}.` |
| Roster-attribution AND user is #1 | `You're #1 on the team — keep widening the lead.` |
| Roster-attribution AND user has $0 raised | `Share your link to land your first donation.` |
| Roster-attribution AND user has no personal goal yet | `Set a personal goal and start raising for {Campaign}.` |
| Team-only campaign (no roster attribution) | `Your team is ${remaining} from the {Campaign} goal — every share helps.` |
| No active campaign | `No active campaigns yet — check back soon.` |

The variable phrase ("$X away from passing Avery", "$2,400 from the goal", etc.) gets `text-primary-foreground/90 italic` styling like the green phrase in the mockup, but tinted with our brand blue light tone (no green — sticks to brand).

Greeting line above stays `GOOD MORNING, {FIRSTNAME}` (uppercased eyebrow), then the big sentence.

### 3. Pills row above the greeting (only what we can power)
The mockup shows "6-day streak" and "Climbed 2 spots this week" — we can't compute either without history. Instead, show **real, campaign-intelligent pills**:
- `Roster Challenge` (when headline is roster-attribution) — primary tint
- `{N} Days Left` (when `end_date` exists) — amber tint if ≤7 days, else neutral
- `{N} Supporters` (compact) — neutral

These replace the gamification chips so the row still has visual texture but every pill is real.

### 4. Bottom action bar (the missing row from the mockup)
Inside the hero, after the stat tiles, a divider then a flex row matching the mockup:

- **Left side**: a context line — *if* the headline campaign is roster-attribution: `Tip: players who share 3+ times raise 3× more.` *Otherwise*: `Share the team page to help reach the goal.` (Static, branded copy — no fake quest progress like "2 / 3".)
- **Right side**, three buttons:
  - **Record My Pitch** — primary white-on-navy button, opens a new `<RecordPitchDialog>` that wraps `CampaignPitchEditor` (already exists) for the **player's `roster_member_campaign_links` row** for the headline campaign. Saves pitch_message / pitch_image_url / pitch_recorded_video_url for the player's personal link. Only shown when headline is roster-attribution AND the player has a `roster_member_campaign_links` row. Uses existing `CampaignPitchEditor` save path which already targets `roster_member_campaign_links`.
  - **Show My QR** — outline white button, opens a new `<QRDialog>` that renders a QR code for `headline.personalUrl` (or the team URL when no personal link). Use the lightweight `qrcode.react` package (or render via `qrcode` lib already in deps — fall back to dynamic import if missing).
  - **Share Link** — outline white button, fires existing `shareLink(headline.personalUrl, headline.name, true)`.

When there is **no headline campaign**, hide the action bar entirely.

### 5. New small components (same file or extracted)
- `PlayerHeroBar` (gradient hero block — replaces current hero JSX inside `PlayerDashboard.tsx`)
- `RecordPitchDialog` (lightweight `<Dialog>` wrapping `CampaignPitchEditor` — new file `src/components/player/RecordPitchDialog.tsx`)
- `QRDialog` (new file `src/components/player/QRDialog.tsx`, uses `qrcode.react`)

### 6. Dependency
- Add `qrcode.react` for the QR component (small, ~5KB). If you'd prefer no new dep, I'll generate the QR via Google Charts URL — say which.

## Files touched
1. `src/components/PlayerDashboard.tsx` — replace hero JSX (lines ~779–846) with new gradient hero + dynamic headline + action bar; add `pitchDialogOpen` / `qrDialogOpen` state.
2. `src/components/player/RecordPitchDialog.tsx` — **new**, wraps `CampaignPitchEditor`.
3. `src/components/player/QRDialog.tsx` — **new**, renders QR for the personal/team URL.
4. `package.json` — add `qrcode.react` (unless you say otherwise).

## What's still NOT built (kept honest)
- "6-day streak", "Climbed N spots this week", "LV 7 / 2840 XP" ring, daily quest progress bar — no source data. Replaced with real, intelligent pills + the share tip line.
- If you later want streaks/levels, we'd need a `player_activity` table and a daily aggregation cron — say the word and I'll plan it as a follow-up.

## Out of scope
- Headline Challenge card, Other Campaigns grid, parent view, sidebar/header.
- Any other gamification.

