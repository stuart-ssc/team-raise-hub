## Add dedication info to Stripe metadata

Currently dedication data is saved to the `orders` row but not sent to Stripe. This makes Stripe-side records (Dashboard, exports, receipts) inconsistent with Sponsorly's records.

### Change

In `supabase/functions/create-stripe-checkout/index.ts`, when `isDonationFlow` is true and dedication info is present, add two metadata keys to:

- `session.metadata` (top-level checkout session)
- `payment_intent_data.metadata` (one-time donations)
- `subscription_data.metadata` (recurring donations)

Keys:
- `dedication_type` — `"in_honor_of"` | `"in_memory_of"` | `""`
- `dedication_name` — donor-entered name, or `""`

This keeps the existing DB write unchanged and simply mirrors the same two fields into Stripe so support, exports, and any future receipt automation see the same values on both sides.

### Out of scope

- Surfacing dedication on Stripe-generated receipts (would need a custom receipt template).
- Editing dedication after checkout.
