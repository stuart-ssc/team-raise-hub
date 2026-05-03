# Merchandise Sales Fundraiser — Updated Template

Build a dedicated landing layout for `Merchandise Sales` campaigns matching the mockup, parallel to how `EventLanding` works today. Roster-enabled features (pitch card) are preserved.

## What the mockup adds vs. today's generic items grid

Layout changes (visual only, no new data):
- Full-bleed hero with background image + 70% black overlay (per brand rule), no top nav bar
- Status pills: campaign type, "Shop open / closed", organization location
- Serif headline with italic accent word (uses existing `formatHeadline`)
- Raised total + progress bar + "X orders" inline
- Four hero stat tiles: **Raised**, **Orders**, **Items Left** (sum of available across items/variants), **Closes** (from `end_date`)
- Two-column body: items grid (left, 3-up) + sticky cart card (right) — same pattern as Event
- Per-item card: image, name, description, price, "X left", size dropdown (existing variants), quantity stepper, "Max N per person", auto badges ("New" if recently created, "Almost gone" if <10% stock)
- Cart card: line items, subtotal, **shipping**, platform fee, total, fee disclosure, "Continue to checkout" CTA, footer note "Ships by {date}. Pickup option at next checkout step." (only shown when configured)

## New fields to add to the Merchandise fundraiser editor

Added under a new **"Fulfillment"** sub-menu in the campaign editor sidebar (only visible for Merchandise Sales), mirroring the Event Location/Agenda pattern:

| Field | Type | Purpose |
|---|---|---|
| `merch_ships_by_date` | date | Drives "Ships by Mar 15" footer + cart note |
| `merch_pickup_available` | bool | Toggles "Pickup option at next checkout step" line |
| `merch_pickup_note` | text (optional) | Custom pickup instructions shown on cart |
| `merch_shipping_flat_rate` | decimal (optional) | Flat shipping shown in cart breakdown; if null, hide line |
| `merch_hero_subtitle` | text | Already covered by existing campaign `description`/tagline — reuse, no new column |

Auto-computed (no new fields):
- "Items Left" = sum of `quantity_available` across items + variants
- "Closes" = existing `end_date`
- "New" badge = item created within last 14 days
- "Almost gone" = `quantity_available / quantity_offered < 0.15`

## Technical work

```text
src/components/campaign-landing/
  merchandise/
    MerchandiseLanding.tsx         (new — modeled on EventLanding)
    MerchandiseHero.tsx            (new — stat tiles, progress)
    MerchandiseItemCard.tsx        (new — image/size/qty/badges)
    MerchandiseCartCard.tsx        (new — sticky right column)
```

- `MerchandiseLanding` accepts the same `SponsorshipLandingProps` shape Event uses (cart, updateQuantity, updateVariantQuantity, checkout step machine, donor/business/custom fields). When `checkoutStep !== "cart"`, falls back to the shared `SponsorshipLanding` checkout flow (same pattern as Event) so all existing donor info → business info → custom fields → payment steps work unchanged.
- Reuse `RosterPitchCard` from `EventLanding` (extract to `shared/RosterPitchCard.tsx`) and render it above the items grid when `attributedRosterMember` has any pitch content. This preserves all roster P2P features.
- Wire into `src/pages/CampaignLanding.tsx`: add a `campaign_type === 'merchandise sales'` branch that renders `<MerchandiseLanding>` and exclude that type from the legacy fallback grid (lines 963–966).
- Add a "Fulfillment" entry to `CampaignSectionNav` gated by `isMerchandise` prop, plus a new `MerchandiseFulfillmentSection.tsx` editor with the four fields above. Pass `isMerchandise` to both desktop and mobile nav instances in `CampaignEditor.tsx`.
- DB migration: add `merch_ships_by_date date`, `merch_pickup_available boolean default false`, `merch_pickup_note text`, `merch_shipping_flat_rate numeric` to `campaigns`. No RLS changes (inherits campaign policies).
- Checkout: include `merch_shipping_flat_rate` in the Stripe line items as a separate "Shipping" line when set, so the platform fee continues to compute off the items subtotal only (per project memory: 10% fee added at checkout).
- Hero overlay: 70% black overlay on background image (existing brand rule).
- Responsive: cart card stacks below items on `<lg`; tables-to-cards rule already satisfied since this layout is card-based.

## Questions before I build

1. **Shipping**: Should shipping be a single flat rate per order (mockup shows "$5.00"), or do you want per-item shipping later? I'll start with flat-rate only unless you say otherwise.
2. **Pickup**: Is the pickup option just a checkbox toggle that surfaces at checkout (collect address vs. pickup choice), or does it need its own pickup location/time fields? I'll default to a simple toggle + free-text note unless you want structured pickup details.
3. **"Closes" stat**: OK to just reuse the existing campaign `end_date`, or do you want a separate "pre-order closes" date distinct from the campaign end?
