

## Issue
User typed `10000` for the fundraising goal. AI replied "Got it — goal of **$100.00**" and the goal didn't appear on the preview card.

## Root cause hypothesis
The edge function (or its tool schema) is treating the goal as **cents** instead of **dollars**, so `10000` → `$100.00`. Per project memory: *"Store currency as decimal dollars (`500` = $500), do not convert from cents."* Two likely culprits:

1. The system prompt / tool schema in `ai-campaign-builder/index.ts` instructs the model to convert dollar input into cents, OR formats `goal_amount` for display by dividing by 100.
2. The model is dividing on its own and then storing the divided value into `collectedFields.goal_amount`, which is why the preview card (left) shows nothing or wrong value — it may be reading `goal_amount` expecting dollars.

Also, the preview card not updating suggests `AICampaignPreview` reads `collectedFields.goal_amount` but the field is either missing, named differently, or stored in a place the card doesn't read until the draft is created.

## Investigation needed
1. `supabase/functions/ai-campaign-builder/index.ts` — search for `goal_amount`, `cents`, `/ 100`, `* 100`, and the system prompt text around fundraising goal.
2. `src/components/ai-campaign/AICampaignPreview.tsx` — confirm how `goal_amount` is read/formatted and whether it expects dollars or cents.
3. `src/pages/AICampaignBuilder.tsx` — confirm `goal_amount` is passed straight through to `campaigns.insert` (which expects dollars per memory).

## Plan

### 1. Edge function (`ai-campaign-builder/index.ts`)
- Update the system prompt: explicitly state "Goal amount is stored in **whole dollars**. If the user types `10000`, store `10000` and confirm as `$10,000.00`. Do NOT convert to cents."
- Remove any `* 100` / `/ 100` math on `goal_amount` in tool handling or display formatting.
- Ensure the assistant's confirmation message formats with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)` on the raw dollar value (no division).
- Add a small server-side guard: if the model returns `goal_amount` as a string with `$` or commas, strip them and parse as a plain number (dollars).

### 2. Preview card (`AICampaignPreview.tsx`)
- Confirm it reads `collectedFields.goal_amount` and renders as dollars (no `/100`). Fix if needed so it shows the goal as soon as it's captured (before draft is saved).
- If the goal is being rendered conditionally on `campaignId`, surface it from `collectedFields` immediately.

### 3. Page (`AICampaignBuilder.tsx`)
- Verify `handleCreateDraft` passes `goal_amount` straight through (already does). No change expected unless the value is being mangled upstream.

### 4. Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — prompt + sanitization
- `src/components/ai-campaign/AICampaignPreview.tsx` — display fix if needed

### 5. Out of scope
- Changing how `campaigns.goal_amount` is stored in the DB (it's already dollars).
- Refactoring item `cost` handling (separate field, also dollars).

