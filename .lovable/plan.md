# Multi-size quantities on merchandise items

## Problem
On the new Merchandise landing template, items with size variants use a single dropdown + single quantity stepper. Selecting a new size moves the existing quantity over, so a shopper can't buy 1 Small Tank Top AND 2 Medium Tank Tops in the same card — it's treated as one size at a time.

The underlying cart state already supports per-variant quantities (`item.selectedVariants` is a `{ [variantId]: qty }` map, and the cart sidebar already renders one line per variant). The only thing blocking multi-size purchases is the product card UI.

## Fix — `src/components/campaign-landing/merchandise/MerchandiseLanding.tsx`

Rework the `MerchItemCard` component for items with variants:

1. Remove the size `Select` + single shared `QtyStepper`.
2. Render a compact size list — one row per variant — each with:
   - Size label (e.g. "S", "M", "L")
   - "X left" or "Sold out" hint
   - Its own `QtyStepper` bound to `item.selectedVariants[variantId]`, capped by that variant's `quantity_available` (and `max_items_purchased` if set)
   - Disabled stepper when the variant is sold out
3. Drop the `handleVariantChange` quantity-migration logic — each size is now independent.
4. Keep the existing single `QtyStepper` path for items without variants (unchanged).
5. Update the small footer hint under the card to summarize total selected across sizes (e.g. "3 selected") instead of the single-variant "X left in size M" line.

Layout target (variants):

```text
Size      Qty
─────────────────
S  (8 left)   [- 0 +]
M  (12 left)  [- 2 +]
L  (Sold out) [- 0 +]  (disabled)
```

Use a tight 2-column grid so the card stays roughly the same height as today on desktop; stack vertically on mobile if it overflows.

## What does NOT change
- Cart sidebar rendering (already itemizes per variant).
- `onUpdateVariantQuantity` signature and parent state in `CampaignLanding.tsx`.
- Checkout flow, totals, max-per-person enforcement at the item level.
- Non-variant items.
- Database schema.

## Acceptance
- On `/c/ss-sample-merchanise-campaign`, a tank-top card shows steppers for every defined size.
- Setting Small=1 and Medium=2 produces two separate line items in the cart sidebar with the correct subtotal, and proceeds through checkout normally.
- Sold-out sizes show as disabled and can't be incremented.
- Items without variants behave exactly as before.