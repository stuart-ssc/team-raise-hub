## Problem

The Fulfillment section (with the new heading/subheading inputs) never appears in the campaign editor, even on Merchandise campaigns like `kbc-huge-bourbon-raffle-26`.

**Root cause:** `src/pages/CampaignEditor.tsx` (line 264) looks up the campaign type by name:

```ts
.ilike("name", "Merchandise Sales")  // plural
```

But the actual row in `campaign_type` is named **"Merchandise Sale"** (singular). The query returns null, `merchandiseTypeId` is never set, `isMerchandiseCampaign` stays false, and `CampaignSectionNav` never renders the Fulfillment nav item.

(Side note: the campaign currently open in the editor — `a478d995…` "Tiger Tamer Golf Scramble" — is an Event campaign, so it would not show Fulfillment regardless. But the bug above is what's blocking it on the bourbon raffle and all other merchandise campaigns.)

## Fix

In `src/pages/CampaignEditor.tsx`, change the lookup string from `"Merchandise Sales"` to `"Merchandise Sale"` (or use `ilike "Merchandise%"` to be tolerant of either).

Recommended:

```ts
.ilike("name", "Merchandise Sale")
```

No other changes needed — once `merchandiseTypeId` resolves correctly, the existing nav entry and `MerchandiseFulfillmentSection` (which already includes the heading/subheading inputs) will render automatically on merchandise campaigns.
