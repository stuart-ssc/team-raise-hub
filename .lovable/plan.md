# Rebuild Event Template to Match Mockup

The current `EventLanding` extends `SponsorshipLanding`, so it inherits the dark hero, big stat tiles, and "Sponsorship opportunities" item grid — none of which match the mockup. Replace it with a dedicated event template.

## Visual direction (from mockup)

- Cream/off-white background (`#FAF7F2`-ish), no dark hero, no full-bleed photo overlay.
- Editorial serif display font for H1/H2 with **italic red accent word** ("A good *day,* outdoors.", "Pick your *spot.*", "How the *day* runs.").
- Small uppercase red eyebrow labels ("THE DETAILS", "TICKETS & EXPERIENCES", "DAY-OF AGENDA").
- Soft white cards with subtle border, rounded corners, generous spacing.
- Red price in serif italic on ticket cards.
- Inline ticket cards (full-width, stacked) — not a sidebar cart.
- Quantity stepper inline on each card (no separate "Choose" button).
- Agenda timeline: monospace red times in left column, bold title + muted description in right column.

## New component: `src/components/campaign-landing/event/EventLanding.tsx` (rewrite)

Sections, top to bottom:

1. **Hero (light)** — campaign name (with italic red accent word), short description, optional progress bar in cream tone. No giant stat-tile grid; replaced by inline progress + a single line: "$X raised · N attendees · M days left".
2. **Pitch card** (existing roster-aware block stays — already rendered by `CampaignLanding.tsx`).
3. **The details** — 2×2 grid of detail tiles (Date, Where, Format, Includes) with pink-tinted icon chip on the left, uppercase label, bold value, muted subtitle. Editable heading + accent ("A good *day,* outdoors.").
4. **Tickets & experiences** — heading "Pick your *spot.*"; full-width stacked cards from `campaign_items` with:
   - Item name (serif), description, ✓ feature bullets row.
   - Right column: italic red price, "X of Y left" / "Unlimited" / "N spots open".
   - Quantity stepper (− / value / +) wired to the existing `onUpdateQuantity` / `onUpdateVariantQuantity`.
5. **Day-of agenda** — heading "How the *day* runs."; single card with timeline rows (mono red time + bold title + muted description).
6. **Sticky bottom checkout bar** (replaces sidebar) — appears once any quantity > 0: shows "N items · $total" and a "Continue to checkout" button. On click, runs the existing `onProceedToCheckout` and reuses the existing `CheckoutStepsPanel` rendered in a centered sheet/modal for donor info → business → custom fields → payment.
7. Dynamic hero stat tiles based on `campaign_items.show_in_hero_stats` are folded into a small inline metric row under the hero (Raised / Days left / per-item rollups like "14 of 32 Teams").

## Styling

- Add a `event-cream` background token (or local `bg-[hsl(var(--event-bg))]` using a new CSS var) to `index.css`.
- Add a serif display font for headings (Playfair Display / similar) scoped to `.event-landing` to avoid global impact.
- Reuse existing `formatHeadline` for accent-word italic styling; verify it renders italic + primary color (it does).

## Wiring

- `src/pages/CampaignLanding.tsx` already routes `campaign_type === 'event'` to `EventLanding` and passes `eventFields`, cart props, checkout step state — no changes needed besides ensuring the props it already passes are consumed by the new layout.
- Stop extending `SponsorshipLanding`. `EventLanding` becomes a standalone template.

## Files

- Rewrite `src/components/campaign-landing/event/EventLanding.tsx`.
- Add `event-landing` styles + CSS vars to `src/index.css` (cream bg, serif display font import).
- No DB changes (all needed columns shipped in the previous migration).

Approve to rebuild.
