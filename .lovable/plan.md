

# Make Goal Amount, Start/End Date Required + Walk Through All Fields

## Problem
1. `goal_amount`, `start_date`, and `end_date` are currently optional — they should be required.
2. Once the 3 original required fields are collected, the AI tells the user to "create draft" instead of continuing to ask about remaining fields (description, requires_business_info).

## Changes

### 1. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
- Add `goal_amount`, `start_date`, `end_date` to `REQUIRED_KEYS` array (line 7)
- Mark those 3 fields as `required: true` in `FIELD_DEFS` (lines 22-24)
- Update system prompt rule #8: instead of "let the user know they can create the draft", change to "continue asking about optional fields one at a time. Once ALL fields have been addressed (collected or skipped), confirm the campaign is ready to create."

### 2. Client schema (`src/lib/ai/campaignSchema.ts`)
- Set `required: true` on `goal_amount`, `start_date`, `end_date` fields to match

### 3. Preview component (`src/components/ai-campaign/AICampaignPreview.tsx`)
- No structural changes needed — it already reads `required` from the schema and shows "Needed" badges for missing required fields. The progress bar and "Create Draft" button gate on `readyToCreate` which is computed server-side.

### 4. Page component (`src/pages/AICampaignBuilder.tsx`)
- No changes needed — `readyToCreate` comes from the edge function response.

## Files Modified
- `supabase/functions/ai-campaign-builder/index.ts` — REQUIRED_KEYS, FIELD_DEFS, system prompt rule #8
- `src/lib/ai/campaignSchema.ts` — mark 3 fields required

## Redeploy
Edge function auto-deploys on save.

