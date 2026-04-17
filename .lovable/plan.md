

## Issue
For sponsorship campaigns, the AI prompts "What's the name of this sponsorship level?" — but a sponsorship "item" can be either a tier (Platinum Sponsor) OR a specific thing being sponsored (Large Banner, Scoreboard Ad). The wording is too narrow.

## Root cause
In `src/lib/ai/campaignSchema.ts`, `itemNounForCampaignType` returns `"sponsorship level"` for sponsorship campaigns, and the `name` field's `prompt` template uses `What's the name of this {itemNoun}?`.

## Fix

### A. Broaden the item noun for sponsorships
In `campaignSchema.ts` `itemNounForCampaignType`:
- `sponsorship` → `"sponsorship item"` (instead of `"sponsorship level"`)

### B. Add an example hint per campaign type
Add a new helper `itemExamplesForCampaignType(type)` returning a short examples string:
- sponsorship → `"e.g. Large Banner, Event Sponsor, Platinum Sponsor"`
- merchandise → `"e.g. T-Shirt, Hoodie, Mug"`
- event → `"e.g. General Admission, VIP Ticket, Table for 8"`
- donation → `"e.g. Friend, Supporter, Champion"`
- default → `"e.g. Item Name"`

### C. Update the `name` field prompt to include examples + ordinal ("first")
Change the `name` field's `prompt` (or build the question dynamically in the edge function) so it asks:
> "What's the name of your **first** {itemNoun}? ({examples})"

For subsequent items (after one is saved and user picks "Add another"), drop "first":
> "What's the name of your next {itemNoun}? ({examples})"

This requires the edge function to know `itemsAdded` when constructing the name prompt — it already does.

### D. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
- When emitting the `name` field question, replace the templated prompt with a dynamically built string using `itemNoun`, `itemExamples`, and `itemsAdded` (0 → "first", >0 → "next").
- Also update the system-prompt guidance so the model knows sponsorship items can be either tiers OR sponsored objects — don't assume tiers.

### Out of scope
- No UI / styling changes
- No schema or phase changes
- Other field prompts (cost, quantity, etc.) unchanged

