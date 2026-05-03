# Sponsorship Fundraiser — New Landing Template

Replace the current sponsorship landing layout with the design in the attached screenshot. Applies to all campaigns where `campaign_type.name = 'Sponsorship'`. Roster-enabled (P2P) attribution is preserved.

## Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Sponsorly  ▸  [Org · Group]                       [Share]   │
├─────────────────────────────────────────────────────────────┤
│  HERO (dark, hero image w/ overlay)                         │
│   • Sponsorship pill · "14 days left" pill · Group · School │
│   • H1 with optional serif-italic accent word               │
│     "Put your *logo* on the gym wall."                      │
│   • Description                                             │
│   • $X raised · progress bar · Goal $Y                      │
│   • 4 stat tiles: Raised | Sponsors | Avg | Days left       │
├─────────────────────────────────────────────────────────────┤
│ ┌── Pitch card (roster member OR campaign) ──┐ ┌── Cart ──┐ │
│ │ Avatar · "You're sponsoring · #11"         │ │ Items    │ │
│ │ Name · Role · Quote · Video                │ │ Subtotal │ │
│ │ Footer: $1,800 · 6 sponsors · 28% (P2P)    │ │ Fee 10%  │ │
│ └────────────────────────────────────────────┘ │ Total    │ │
│                                                │ Logo     │ │
│  TIERS — "Pick your level."                    │ upload   │ │
│  Bronze · Silver "Most popular" · Gold         │ CTA      │ │
│  (rendered from campaign_items)                └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│  THE SPONSOR WALL — "Already on the wall."                  │
│  Grid of business tiles (logo if present, else name)        │
│  Trailing "YOUR LOGO HERE" placeholder tile                 │
└─────────────────────────────────────────────────────────────┘
```

## Functionality preserved

- `/c/{slug}` and `/c/{slug}/{rosterMemberSlug}` routes work identically.
- Roster pitch overrides campaign pitch (existing cascading logic).
- Cart → donor info → business info → custom fields → Stripe checkout flow unchanged.
- 10% platform fee, fee model, variants, recurring items, inventory, view tracking, SEO head all carry over.
- Logo upload at checkout is **optional**; sponsors can upload later via the existing post-purchase flow.
- Sponsor wall lists businesses from completed orders (reuses `useCampaignSponsors`); business name shows when there's no logo yet — created via the existing checkout business-account step.

## Schema (one migration)

`campaigns`
- `hero_accent_word text` — optional word rendered serif-italic in the H1.

`campaign_items` (these ARE the tier cards)
- `is_most_popular boolean default false` — blue "Most popular" ribbon.
- `feature_bullets jsonb default '[]'` — array of short strings shown as ✓ list.

All nullable/defaulted, so existing data still renders.

## Code changes

1. **New components** under `src/components/campaign-landing/sponsorship/`:
   - `SponsorshipLanding.tsx` — top-level layout.
   - `SponsorshipHero.tsx` — dark hero, pills, accent-word H1, progress, 4 stat tiles ("days left" from `end_date`, "avg" = raised / sponsor count).
   - `PitchCard.tsx` — extracted from existing pitch block, with optional per-fundraiser stats footer when a roster member is attributed.
   - `TierGrid.tsx` + `TierCard.tsx` — render `campaign_items` with bullets, "Most popular" ribbon, qty stepper, "X of N left".
   - `CartSidebar.tsx` — sticky right rail: subtotal, platform fee, total, optional logo upload, "Continue to checkout".
   - `SponsorWall.tsx` — uses `useCampaignSponsors`; falls back to business name when no logo; trailing "Your logo here" tile.

2. **Routing** in `CampaignLanding.tsx`: when `campaign_type.name.toLowerCase() === 'sponsorship'`, render `<SponsorshipLanding />` and skip the legacy item/checkout JSX (mirrors the existing `pledge` branch). Pledge branch untouched.

3. **Editor updates** (`src/components/campaign-editor/`):
   - Campaign details: "Hero accent word" input (Sponsorship type only).
   - Items editor: "Mark as most popular" checkbox + repeatable "Feature bullets" inputs (Sponsorship only).

4. **Types**: extend `CampaignData` and `CampaignItem` interfaces with the new fields.

## Out of scope

Sponsorship only. Pledge, Merchandise, Event, etc. keep the existing layout and will each get their own template iteration after this one ships.
