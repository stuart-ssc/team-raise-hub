## Problem

On the Pledge fundraiser, the publish dialog still shows "Fundraiser should have at least one item before publishing" instead of validating Pledge Setup.

## Root cause

In `src/components/CampaignPublicationControl.tsx`, the campaign query embeds the type with the wrong column name:

```ts
campaign_type:campaign_type_id ( campaign_type )
```

The related table is `campaign_type` and its label column is `name` (not `campaign_type`). I verified directly in the database — the type row for this campaign is `{ id: ..., name: "Pledge" }`, and `pledge_scope`, `pledge_unit_label`, `pledge_event_date`, and `pledge_min_per_unit` are all populated.

Because the embedded column doesn't exist, `typeName` resolves to an empty string, `isPledge` is false, and the code falls into the else branch that checks `campaign_items`. That's why the item-required message keeps showing on a Pledge campaign.

## Fix

In `src/components/CampaignPublicationControl.tsx` (`checkPublicationRequirements`):

1. Change the embedded select from `campaign_type:campaign_type_id ( campaign_type )` to `campaign_type:campaign_type_id ( name )`.
2. Update `typeName` extraction to read `.name` instead of `.campaign_type`:
   ```ts
   const typeName = (campaign as any)?.campaign_type?.name || "";
   ```
3. Keep the rest of the logic identical: when `isPledge` is true, validate `pledge_scope`, `pledge_unit_label`, `pledge_event_date`, `pledge_min_per_unit` and skip the `campaign_items` check entirely.

No schema, RLS, or other component changes are needed.

## Result

For Pledge fundraisers, the publish dialog will show "Pledge setup is configured" (or list the missing pledge fields) and will no longer require a fundraiser item. Standard fundraisers continue to require at least one item.
