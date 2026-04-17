

## Issue
The screenshot shows the acknowledgment ("Great, I'll set this up as a Sponsorship campaign.") and the next question ("What is the name of this campaign?") rendered inside the **same chat bubble**, just on two visual lines. The user wants them as **two separate bubbles**.

## Root cause
Currently the edge function returns one `assistantMessage` string with `\n\n` between the two parts. The frontend pushes that as a single message object, so it renders as one bubble.

## Fix

### A. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
- Return `assistantMessages: string[]` (array of 1–2 strings) instead of (or alongside) the single `assistantMessage`.
- Split on the existing `\n\n` boundary (or have the model emit two parts via the system prompt instructions). Keep `suggestions` attached only to the **last** message (the question).
- Maintain backward compatibility: if only one part, return a single-element array.

### B. Frontend (`src/pages/AICampaignBuilder.tsx`)
- In the response handler, iterate `data.assistantMessages` and push each as its own `ChatMessage`. Attach `suggestions` only to the last one.
- Fall back to `data.assistantMessage` if `assistantMessages` is missing.

### C. No changes to `AIChatPanel.tsx`
- It already renders each message in its own bubble. Suggestion chips already attach to the latest assistant message — still correct.

### Out of scope
- No styling changes
- No schema or phase changes
- Greeting/transition messages (single-part) unaffected

