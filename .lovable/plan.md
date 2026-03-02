
# Auto-Complete Orders for Non-Sponsorship Campaigns

## Problem
Currently, all orders are set to `succeeded` status after payment. Only sponsorship campaigns (where `requires_business_info = true`) actually need the purchaser to upload assets before the order can be marked `completed`. Non-sponsorship campaigns should go straight to `completed`.

## Approach
Check if the campaign has required assets (via `campaign_required_assets` table) or `requires_business_info = true`. If neither, set the order status to `completed` instead of `succeeded`.

## Changes

### 1. `supabase/functions/stripe-webhook/index.ts`
- After getting the order's campaign info (line ~113), also fetch `requires_business_info` from the campaign
- Check if `campaign_required_assets` has any rows for that campaign
- If no assets required and `requires_business_info` is false, set status to `completed` instead of `succeeded`

### 2. `supabase/functions/verify-checkout-session/index.ts`
- Same logic: after confirming payment, check if the campaign requires assets
- If not, set status to `completed` instead of `succeeded`

### 3. `supabase/functions/create-manual-order/index.ts`
- Same logic for manual orders: check if campaign requires assets, set status accordingly

### Technical Detail

In each function, after determining the `campaign_id`, run:
```typescript
// Check if campaign requires asset uploads
const { data: campaign } = await supabaseAdmin
  .from('campaigns')
  .select('requires_business_info')
  .eq('id', campaignId)
  .single();

const { count: assetCount } = await supabaseAdmin
  .from('campaign_required_assets')
  .select('id', { count: 'exact', head: true })
  .eq('campaign_id', campaignId);

const requiresAssets = campaign?.requires_business_info || (assetCount ?? 0) > 0;
const orderStatus = requiresAssets ? 'succeeded' : 'completed';
```

Then use `orderStatus` instead of the hardcoded `'succeeded'` string when updating/inserting the order.

This is a minimal change -- 3 edge functions updated with the same pattern. No database schema changes needed.
