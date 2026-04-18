

## Bug

Screenshot shows the campaign items table:
- "large banner" → **$50000.00** (should be $500.00)
- "add another" → **$30000.00** (should be $300.00)

Two issues:
1. **Price is 100x too large** — user typed `500` and `300` (dollars), but the DB stored `50000` / `30000`. Classic dollars-vs-cents mismatch.
2. **Item name "add another"** — confirms the prior bug where the literal "add another" string was captured as the second item's name. Even though we fixed `justStartedNewItem` in the last turn, this row was created **before** that fix shipped. (Not a new regression — just leftover bad data the user is seeing.)

## Investigation needed

Read `supabase/functions/ai-campaign-builder/index.ts` to find where `cost` is parsed from the user reply and inserted into `campaign_items`. Per project memory: **store currency as decimal dollars** (`500` = $500). The bug is almost certainly that we're multiplying by 100 (treating user input as dollars and converting to cents) before insert, but the rest of the platform displays it as if it's already dollars — so $500 renders as $50,000.

Also check the item display formatter on the campaign editor page to confirm it's not the display side that's wrong.

## Plan

### Fix 1: Store item cost as decimal dollars (not cents)
**File:** `supabase/functions/ai-campaign-builder/index.ts`

- Locate the cost capture / item insert path.
- Remove any `* 100` / cents conversion. Store the raw number the user typed (e.g. `500` → `500`).
- Strip `$` and commas before parsing (`Number(raw.replace(/[$,]/g, ''))`).
- Validate it's a positive number; reject NaN/0/negative with a re-prompt.

### Fix 2: Confirm display is dollars
**File:** `src/pages/CampaignEditor.tsx` (and/or `src/components/campaign-editor/CampaignItemsSection.tsx`)

- Verify the table formats `cost` as `$${cost.toFixed(2)}` with no `/100` division (and no `*100` either). If it currently divides by 100, leave that alone — the source of truth is "store as dollars" per memory, so any divider would mean other parts of the codebase store cents. Need to read the file to be sure.

### Fix 3 (data cleanup, optional)
- Offer to delete the two bad rows (`large banner $50000`, `add another $30000`) for this campaign so the user can re-add them cleanly. Will confirm with user before running any DB write.

### Out of scope
- Re-fixing the "add another → name" bug (already fixed in last turn; this row predates the fix).
- Fee model copy.
- Item image upload.

