

## Issue
On item #2, the AI:
1. Skips the **description** prompt (jumps from name → cost).
2. Doesn't show option chips because chips for required string fields (`name`, `cost` after name) aren't emitted, and the optional-field "Skip" chip only appears when description is actually being asked.

Root cause: for string fields (`name`, `description`, `size`), the edge function relies on the LLM to drive the question + tool-call sequence (lines 773-774 of `supabase/functions/ai-campaign-builder/index.ts`). With prior item context in history, the LLM "learns" to compress steps and skips the optional description step on subsequent items.

## Fix

### 1. Deterministically capture `name` after a name prompt
In `supabase/functions/ai-campaign-builder/index.ts` around line 738-775, extend the deterministic capture to handle `next.key === "name"` and `next.key === "size"`: when those are the awaited field and the user replied with a non-empty short message that isn't a skip word, set `currentItemDraft[next.key] = raw` and mark `deterministicItemCaptured = true`. This guarantees the server advances the draft before the next turn so the system prompt can force the *next* field (description).

### 2. Force description prompt + Skip chip
The system prompt already names the next field correctly via `getNextItemField`. The fix in #1 ensures `description` becomes the next field after name is captured. Also tighten the system prompt's "Current Step" wording (around line 320) to add: "Do NOT skip optional fields; always ask them so the user can choose to skip."

### 3. Always provide a Skip chip for any optional field
Suggestions builder (around lines 1350-1363) already emits a Skip chip when `next && !next.required`. Once #1 forces `description` to actually be the asked field, the chip will render automatically — no change required here.

## Files to change
- `supabase/functions/ai-campaign-builder/index.ts`
  - Add deterministic capture for `name` and `size` string fields.
  - Strengthen the items system prompt: "ask every field in order, including optional ones — never skip an optional field on the user's behalf."

## Out of scope
- No UI changes in `AICampaignBuilder.tsx` or chat components.
- No DB / schema changes.
- The R2 upload timeout in the build error is a transient infra issue, not a code bug.

