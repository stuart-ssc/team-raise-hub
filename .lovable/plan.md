

## Issue
Items are stored in `campaign_items.cost` as **decimal dollars** (per project memory: "Store currency as decimal dollars (`500` = $500), do not convert from cents"). The preview list is currently formatting `cost` with something like `(cost / 100).toFixed(2)`, turning $500 into $50000.00 and $300 into $30000.00.

## Fix
In `src/components/ai-campaign/AICampaignPreview.tsx`, in the Campaign Items list rendering, change the cost formatting from a divide-by-100 format to a direct dollar format:

- Replace `$${(item.cost / 100).toFixed(2)}` (or similar) with `$${Number(item.cost).toFixed(2)}`.

That's it — single-line numeric format change, no schema or fetch changes.

## Out of scope
- No edge function changes (already storing dollars correctly).
- No changes to other cost displays elsewhere in the app.

