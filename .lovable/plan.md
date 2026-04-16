

## Goal
Make the AI assistant offer selectable chips/buttons for choices (campaign type, group), and auto-confirm when only one option exists.

## Approach

### 1. Edge function returns structured suggestions
Add an optional `suggestions` block to the response from `ai-campaign-builder/index.ts`. The server (not the LLM) decides when to attach them, based on what's still missing:

- If `campaign_type_id` missing → attach `{ field: "campaign_type_id", options: [{label, value}...] }`
- If `group_id` missing → attach `{ field: "group_id", options: [...] }`
- If only one group exists and `group_id` missing → server pre-fills it into `updatedFields` and the AI is told via system prompt that the group is already chosen ("Confirm this campaign is for [Group Name]")

System prompt updated to instruct the AI: "When asking about campaign type or group, keep your message brief — the UI will show selectable buttons. Don't list options in text."

### 2. Auto-confirm single group
In the edge function, if `groups.length === 1` and `group_id` not yet collected, set `collectedFields.group_id` to that group's id before calling the LLM. The AI then naturally moves on to the next field. The preview panel reflects the auto-fill immediately.

### 3. Frontend: render suggestion chips in chat
In `AIChatPanel.tsx`:
- Extend `ChatMessage` type with optional `suggestions?: { field: string; options: {label, value}[] }`.
- Below the assistant bubble, render option buttons in a wrapped row (shadcn `Button` variant="outline", size="sm").
- Clicking a chip calls `onSuggestionClick(field, value, label)` which:
  - Sends the label as the user message ("Sponsorship") for natural conversation flow
  - The edge function still extracts via tool calling (label maps cleanly)
- Once a suggestion is clicked or message sent, suggestions on prior messages are hidden (they only apply to the latest assistant turn).

### 4. AICampaignBuilder.tsx wiring
- Receive `suggestions` from edge function response, attach to the new assistant message.
- New `handleSuggestionClick(label)` calls `handleSend(label)`.

## Files
- `supabase/functions/ai-campaign-builder/index.ts` — auto-fill single group, return `suggestions`, update system prompt
- `src/components/ai-campaign/AIChatPanel.tsx` — render suggestion chips, expose click handler
- `src/pages/AICampaignBuilder.tsx` — pass suggestions through, wire click handler

## Out of scope
Suggestions for free-text fields (name, description, dates). Only categorical/select fields get chips.

