

The user clarified the design intent: every field defined in the schema should be prompted by the AI. `required: false` only means the user can skip without blocking save — it does NOT mean the AI should silently omit it.

Currently, the system prompt only tells the AI what's "still missing" via `getMissingRequiredFields`, so optional fields (description, requires_business_info) get treated as fully skippable and the AI breezes past them.

## Fix (one file: `supabase/functions/ai-campaign-builder/index.ts`)

### A. Add a "fields to ask about" list separate from required
Build a second list — every field in `allFields` that isn't yet collected AND hasn't been explicitly skipped (tracked via a `<field>_skipped` flag in `collectedFields`). Inject this into the system prompt as `## Still To Ask About` alongside the existing `## Still Missing` (required-only) list.

### B. Update Rule 9 to enforce sequential prompting
Rewrite to: "Walk through every field in `## Still To Ask About` one at a time, in order. For optional fields, the user may answer or say 'skip'. For required fields, they must answer. Do not finalize/save until every field has either a value or a skip flag."

### C. Deterministic skip detection
When the latest user message is "skip" / "no" / "no thanks" / "none" AND the last assistant turn asked about a specific optional field, set `collectedFields.<field>_skipped = true` server-side so the AI won't loop.

### D. Gate the "Ready to save?" prompt
Only allow the AI to ask "Ready to save as a draft?" when `## Still To Ask About` is empty (every field answered or skipped).

### E. Suggestion chips for each field
Extend the suggestions block so when the next un-asked field is `description` it emits a free-text prompt (no chips), and when it's a boolean like `requires_business_info` it emits Yes/No/Skip chips. Existing chip emission for `campaign_type_id` and `group_id` stays.

## Out of scope
- No frontend changes (chat already handles free-text and skip naturally)
- Schema definitions in `campaignSchema.ts` stay as-is — `required` still controls save-blocking only
- Post-draft flow unchanged

