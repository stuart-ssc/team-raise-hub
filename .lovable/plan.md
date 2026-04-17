

The user clarified the hallucinated group_id appeared right after selecting a campaign type with a number — meaning the previous safety net (which maps a user's typed text to a type/group) misfired and assigned the campaign type label to the wrong field, OR the AI itself fabricated the group_id when prompted.

Looking at the recent fix: when user types "4" → `AIChatPanel.maybeMapNumericInput` converts it to "Sponsorship" → sent as user message → server-side deterministic mapping in the edge function checks if the lowercased message matches a `campaign_type` name OR a `group_name`. Both checks run independently. So "sponsorship" sets `campaign_type_id` correctly. But the AI then, on the same turn, may have called `update_campaign_fields` and hallucinated a `group_id` because the system prompt instructs it to "fill in what you can."

The display showing `33333333-3333-3333-3333-...` is a hallucinated UUID written by the AI via `update_campaign_fields`.

## Fix (one file: `supabase/functions/ai-campaign-builder/index.ts`)

### A. Validate IDs against the loaded lists every turn
After merging `updatedFields` from any tool calls, drop any `group_id` or `campaign_type_id` that doesn't exist in the fetched `grps` / `types` lists. This prevents hallucinated UUIDs from ever reaching the insert or the UI:

```ts
if (updatedFields.group_id && !grps.find((g) => g.id === updatedFields.group_id)) {
  console.warn("Dropping invalid group_id:", updatedFields.group_id);
  delete updatedFields.group_id;
}
if (updatedFields.campaign_type_id && !types.find((t) => t.id === updatedFields.campaign_type_id)) {
  console.warn("Dropping invalid campaign_type_id:", updatedFields.campaign_type_id);
  delete updatedFields.campaign_type_id;
}
```

### B. Pre-insert validation in `create_campaign_draft` tool branch
Before the campaigns insert, double-check both IDs exist. If not, return a structured error so the AI re-asks rather than hitting the DB constraint:

```ts
if (!grps.find((g) => g.id === insertData.group_id)) {
  // return error: "Invalid group selected. Please pick from the list."
}
```

### C. Strengthen system prompt Rule 13
Add: "NEVER invent or guess UUIDs. ONLY use IDs that appear verbatim in the `## Available Groups` and `## Available Campaign Types` lists. If the user hasn't picked a group yet, leave `group_id` empty and ask them — do not fabricate a value to fill the slot."

### Out of scope
- No frontend changes
- Post-draft flow unchanged
- The numeric-input mapping and the existing name-match safety net stay as-is

