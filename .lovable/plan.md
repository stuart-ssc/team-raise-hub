# Rebuild Event Landing to Match Mockup

The current EventLanding is a single-column cream page with a sticky bottom bar. The mockup shows a very different structure that needs to be implemented.

## Layout Structure (matching the mockup)

```text
┌──────────────────────────────────────────────────────┐
│ DARK HERO (background image, overlay)                │
│  • Type chip · accent badge · location pin           │
│  • Big serif title with italic accent                │
│  • Description paragraph                              │
│  • Italic red $raised + thin progress bar             │
│  • 4 STAT TILES overlay (Raised / Teams Sold /       │
│    Hole Sponsors / Days Left)                        │
└──────────────────────────────────────────────────────┘
┌──────────────────────────┬───────────────────────────┐
│ LEFT COLUMN (cream bg)   │ RIGHT SIDEBAR (sticky)    │
│                          │                           │
│ [Roster Pitch Card]      │ ┌───────────────────────┐ │
│  red left border         │ │ ■ Your tickets   0 it │ │
│  avatar + "buying        │ │                       │ │
│   tickets through"       │ │  No tickets yet       │ │
│  Coach name · title      │ │  Add a foursome...    │ │
│  italic quote            │ │                       │ │
│  video player            │ │  [Continue checkout]  │ │
│  3 italic mini-stats     │ │  ✓ Add player names   │ │
│                          │ │     on next step      │ │
│ THE DETAILS              │ └───────────────────────┘ │
│  "A good day, outdoors." │   (sticky as user        │
│  2x2 detail tiles        │    scrolls)              │
│                          │                           │
│ TICKETS & EXPERIENCES    │                           │
│  "Pick your spot."       │                           │
│  Stacked ticket cards    │                           │
│   w/ inline steppers     │                           │
│                          │                           │
│ DAY-OF AGENDA            │                           │
│  "How the day runs."     │                           │
│  Timeline rows           │                           │
└──────────────────────────┴───────────────────────────┘
```

## Changes

### 1. Hero — dark photo background
- Use `campaign.image_url` as background with a dark gradient overlay (matches the soccer-balls hero in mockup).
- Top-left chips row: `• Event` pill, accent campaign-type badge (green in mockup), `📍 Location name`.
- Title in white serif with italic accent word.
- Short description in muted white.
- Italic red `$X,XXX` followed by `XX% of goal`, then a thin red progress bar with a draggable-looking dot at current %, with goal label `Goal: $XX,XXX` on the right.
- **Stat tiles row** overlaid at the bottom of the hero (translucent dark cards): Raised, plus each `show_in_hero_stats` campaign_item rendered as `{sold}` big number + `of {offered}` subtitle + label, plus `Days Left` (with `Tee-off MMM D` subtitle).

### 2. Two-column body
- Wrap details/tickets/agenda in a left column (`lg:col-span-2`) with a sticky right sidebar (`lg:col-span-1`, `lg:sticky lg:top-6`).
- Background remains `--event-bg` cream.

### 3. Roster Pitch Card (top of left column)
- Only shown when `attributedRosterMember` has pitch content.
- Left red accent border, avatar circle, red eyebrow `★ YOU'RE BUYING TICKETS THROUGH`.
- Name in serif + role/title (uses new `organization_user.title` field, fallback to group/role).
- Italic quote = `pitchMessage`.
- Video player below (uses `pitchVideoUrl` / `pitchRecordedVideoUrl`).
- Footer row with 3 italic red stats (tickets via X, $ credited to team, leaderboard rank). For now render placeholders driven by data we already have on the roster member; if not present, hide the row.
- Add `attributedRosterMember` to `EventLandingProps` and accept it from `CampaignLanding.tsx` (already passed).

### 4. Sidebar cart
- New component mirrors the `SponsorshipLanding` cart panel visually but simplified:
  - Header: red square icon + "Your tickets" + `{count} items`.
  - Empty state: "No tickets yet — Add a foursome, single, or hole sponsorship to get started."
  - Selected state: list line items with name, qty, price; subtotal + 10% fee.
  - Primary `Continue to checkout` button (disabled when empty).
  - Footnote: `✓ You'll add player names on the next step.`
- Wire button to `onProceedToCheckout`. Reuse `cart`, `subtotal`, `total`, `selectedItemsCount`, `onUpdateQuantity`.
- Drop the bottom sticky bar.

### 5. Sections kept (left column)
- Details grid: keep the 2x2 tile layout but match mockup (red-tinted icon chips, smaller title eyebrow `THE DETAILS` in red, serif heading with italic accent).
- Tickets: keep the stacked `TicketCard`s exactly as today.
- Agenda: keep the timeline card with monospace red times.

### 6. Typography & color tokens
- Reuse `--event-bg`. Add `--event-accent` (red ~ `#D64545`) used for: eyebrows, italic prices, progress bar, agenda times, pitch card border, sidebar icon. Scope to event template only.
- Continue using `formatHeadline` for italic accents.

## Files to edit
- `src/components/campaign-landing/event/EventLanding.tsx` — full rewrite of layout (hero + 2 columns + pitch card + sidebar). Keep existing `TicketCard`, `DetailTile`, `QtyStepper`, `SectionHeading` helpers.
- `src/index.css` — add `--event-accent` token.
- `src/pages/CampaignLanding.tsx` — already passes `attributedRosterMember`; just confirm prop typing.

## Out of scope (handled later)
- Attendee-name collection step in checkout (still falls through to `SponsorshipLanding` for donor-info → payment).
- Editor UI for the `organization_user.title` field (data already in DB).
