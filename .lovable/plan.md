

## Root Cause

When the user picked "Sponsorship" via the choice chip, the AI **acknowledged the selection in text** ("Great, I'll set this up as a Sponsorship") but **did not call `update_campaign_fields`**. So `campaign_type_id` was never recorded.

On the next turn, the suggestions block in the edge function (`index.ts` lines 640-647) saw `nextMissing === "campaign_type_id"` was still true and re-emitted the campaign type chips — making it look like the question was being re-asked.

This is a model reliability issue: Gemini occasionally skips the tool call when the user input is short and the answer feels "obvious." We need a server-side safety net.

## Fix

### File: `supabase/functions/ai-campaign-builder/index.ts`

**1. Server-side deterministic mapping for choice-chip answers** (primary fix)

Before calling the AI, inspect the latest user message. If it exactly matches the `name` of a campaign type or the `group_name` of a group (case-insensitive), set the corresponding field in `updatedFields` directly. This guarantees the value is captured even if the AI later forgets to call the tool.

```ts
// After computing autoFilledGroupName, before building the system prompt
const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content?.trim().toLowerCase();
if (lastUserMsg) {
  if (!updatedFields.campaign_type_id) {
    const matchedType = types.find((t) => t.name.toLowerCase() === lastUserMsg);
    if (matchedType) updatedFields.campaign_type_id = matchedType.id;
  }
  if (!updatedFields.group_id) {
    const matchedGroup = grps.find((g) => g.group_name.toLowerCase() === lastUserMsg);
    if (matchedGroup) updatedFields.group_id = matchedGroup.id;
  }
}
```

This runs BEFORE the AI call, so the AI sees the field as already collected and moves on naturally.

**2. Strengthen Rule 13 in the system prompt**

Change Rule 13 from "CONFIRM it explicitly" to make tool-calling mandatory:

> "When the user picks or describes a campaign type, you MUST call `update_campaign_fields` with the matching `campaign_type_id` in the SAME response where you confirm the choice. The same applies to group selection. Do not just acknowledge — the tool call is required to record the selection."

### Out of scope
- No frontend changes
- Post-draft flow unchanged
- The numeric-input → label mapping in `AIChatPanel` already works correctly; the issue was downstream of that

