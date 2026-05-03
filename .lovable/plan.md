## Donation Fundraiser Landing Template

Build a dedicated donation experience that renders when `campaign_type.name === 'donation'`. Visually and structurally it mirrors `SponsorshipLanding` (hero, pitch card, sticky cart sidebar, mobile cart bar, fee alert, supporter feed) but swaps the items grid for an amount-picker UX matching the attached mockup.

### Page layout

```text
┌─────────────────────────────────────────────────────────────┐
│ HERO  (dark, image overlay, accent-word headline)           │
│ chips: "Donation" · "Live now" · location                   │
│ $raised · supporters · progress bar                         │
│ 4 stat tiles: Raised · Supporters · Avg gift · Days left    │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────────────┬──────────────────────────┐
│ MAIN (lg:col-span-2)             │ STICKY CART (right)      │
│                                  │                          │
│ [Roster pitch card if present]   │ ♥ Your gift              │
│                                  │ One-time / Monthly  $X   │
│ MAKE A GIFT — "Pick an amount."  │ Subtotal       $X        │
│  • amount chips $25/50/100/...   │ Platform fee   $X        │
│  • custom $ input (min $5)       │ Total          $X        │
│  • toggle: monthly gift          │ Fee explainer alert      │
│  • toggle: dedicate gift         │ [Continue to checkout]   │
│      └ conditional Type + Name   │ Stripe / 100% reaches…   │
│                                  │                          │
│ WHERE IT GOES — allocation rows  │                          │
│ (only if allocations defined)    │                          │
│                                  │                          │
│ RECENT SUPPORTERS feed           │                          │
└──────────────────────────────────┴──────────────────────────┘
Mobile: sticky bottom cart bar (mirrors SponsorshipLanding)
```

### Files

- **New** `src/components/campaign-landing/donation/DonationLanding.tsx` — main component, structured like `SponsorshipLanding.tsx`. Reuses `DonorInfoForm`, `BusinessInfoForm`, `CustomFieldsRenderer`, supporter feed, fee Alert, sticky mobile bar, and the same checkout step state machine (`cart` → `donor-info` → `business-info` → `custom-fields` → `payment`).
- **New** `src/components/campaign-landing/shared/landingHelpers.ts` — extract `getDaysLeft`, `formatHeadline`, `getVideoEmbedUrl`, `StatTile` from `SponsorshipLanding` so both templates share them.
- **Edit** `src/components/campaign-landing/sponsorship/SponsorshipLanding.tsx` — import shared helpers (no behavior change).
- **Edit** `src/pages/CampaignLanding.tsx` — add a branch alongside `'sponsorship'` and `'pledge'`: when type is `'donation'`, render `<DonationLanding …/>` and skip the legacy hero + items grid for that type.

### Donation state (component-local, lifted via callbacks)

- `selectedAmount: number` (chip OR custom input; default 100)
- `isRecurring: boolean`
- `dedication: { enabled: boolean; type: 'in_honor_of' | 'in_memory_of'; name: string }`
- Derived: `subtotal = selectedAmount`, `platformFee = fee_model === 'org_absorbs' ? 0 : subtotal * 0.10`, `total = subtotal + platformFee`.

To reuse the existing checkout pipeline, the donation is submitted as a single synthetic line item (`name: "Donation"`, `cost: selectedAmount`, `quantity: 1`, `is_recurring`, `recurring_interval: 'month'` when monthly). Dedication metadata is attached to the order.

### Database additions (migration)

Add optional columns to `campaigns` (all nullable, with sensible runtime defaults if absent):

- `donation_suggested_amounts jsonb` — defaults to `[25, 50, 100, 250, 500, 1000]`
- `donation_min_amount numeric` — defaults to `5`
- `donation_allow_recurring boolean` — defaults to `true`
- `donation_allow_dedication boolean` — defaults to `true`
- `donation_allocations jsonb` — array of `{ percent, label, description, amount }` for the "Where it goes" card; if null/empty, hide the section

Add to `orders` (or piggyback on existing `metadata` JSONB if present):

- `dedication_type text`, `dedication_name text` — captured at checkout for donation campaigns

No RLS changes required (columns inherit existing campaign/order policies).

### Reused / unchanged

- Hero pattern, pitch card, supporter feed (`useCampaignSponsors`), fee Alert copy, "Have an account? Sign in" inline link, DonorInfoForm cleanup, sticky mobile cart bar — all carried over from sponsorship.
- Stripe checkout edge function untouched: donations flow through the existing single-line-item Stripe Connect session with `is_recurring` honored.

### Out of scope for this pass

- Campaign-editor UI to manage `donation_suggested_amounts` and `donation_allocations` (follow-up task).
- Full Stripe subscription billing wiring beyond recording `is_recurring` on the order.
