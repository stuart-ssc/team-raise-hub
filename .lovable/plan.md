

## Problem
The AI assistant in the campaign builder degrades over the course of a conversation:
1. Sometimes double-prompts (asks the same question twice in a row, no acknowledgement)
2. Stops returning structured `suggestions` (option selects) midway through
3. Eventually "stalls" — no response, no error visible to user

## Investigation needed
Read the edge function and the page that drives the loop:
- `supabase/functions/ai-campaign-builder/index.ts` — system prompt, tool schema, message history shape, error handling, response shape
- `src/pages/AICampaignBuilder.tsx` — how messages are accumulated/sent, how `suggestions` are merged into the message stream, error handling on `invoke`

I'll inspect these before finalizing a fix plan, but the most likely root causes — based on the symptoms and the file excerpts already in context — are:

### Likely root causes

**A. Conversation context grows unbounded.** Every turn we re-send the full chat history plus a server-computed `nextStep` instruction plus the entire `collectedFields` snapshot. As the conversation grows (basics → 8 extended detail Q&As → items, each with 6+ sub-questions), the prompt balloons and the model:
- forgets the structured-suggestion rule (it's buried far above)
- loses track of where it is in the flow → repeats prompts
- eventually hits a token/timeout limit → silent failure / "stall"

**B. `nextStep` injection competes with chat history.** The server appends a fresh "Next step: …" instruction every turn. Once we're deep into items, the model sometimes obeys the chat history (which already showed it asked the question) and sometimes obeys `nextStep` (which tells it to ask again) → double-prompt.

**C. Suggestions are attached to the *last* assistant message only.** When the model sends a multi-line response or splits into two messages, the suggestion metadata gets dropped or attached to the wrong message → user sees a question with no chips.

**D. No error surfacing.** If the edge function 429s, times out, or returns a malformed JSON, `AICampaignBuilder` likely just stops appending — looks like a "stall" with no toast.

## Plan

### 1. Trim and stabilize the prompt sent to the model
- Cap chat history sent to the model to the **last N turns** (e.g. last 16 messages). Always keep the system prompt + a compact "state snapshot" (collectedFields summary + currentItemDraft + phase) instead of relying on the full transcript for state.
- Move all flow state (phase, current field being asked, items already saved) into a **single structured "STATE" block** prepended to the system prompt every turn. This becomes the source of truth so the model doesn't have to infer state from a long transcript.

### 2. Eliminate double-prompts
- On the server, after computing `nextStep`, check whether the **immediately previous assistant message already asked that exact question**. If yes, instead of re-prompting, instruct the model to acknowledge the user's last answer and move forward (or, if the answer was unclear, ask a clarifying follow-up — not a verbatim repeat).
- Add an explicit rule to the system prompt: *"Never repeat your previous question verbatim. If the user's reply is unclear, ask a brief clarifier instead."*

### 3. Make suggestions reliable
- Always attach `suggestions` to the **final** assistant message in the turn (the one rendered last), and only when `nextStep` defines a choice/image_upload prompt.
- In `AIChatPanel`, this is already handled (it scans the latest turn). Confirm the server only ever returns one assistant message per turn for the items phase to remove ambiguity.
- Add a server-side guarantee: when `phase === "items"` and we're asking a field with predefined options (e.g. `is_recurring`, `recurring_interval`), `suggestions` must be present.

### 4. Surface stalls and recover
- Wrap the `supabase.functions.invoke` call in `AICampaignBuilder` with a timeout (e.g. 30s) and error toast on failure (rate limit, network, malformed response).
- On error, set `isLoading=false` and append a system-style assistant message: *"Hmm, I lost my train of thought — could you repeat that?"* with a "Retry" chip.
- Log the request/response shape in the edge function so we can debug stalls via Supabase function logs.

### 5. Inspect & confirm before coding
Before writing changes I'll read the current edge function and page to verify the exact message/response shape and tool-calling pattern (so the trim/state-block changes don't break the existing tool flow).

### Files likely to change
- `supabase/functions/ai-campaign-builder/index.ts` — history trimming, STATE block, no-repeat guard, guaranteed suggestions, better logs
- `src/pages/AICampaignBuilder.tsx` — invoke timeout + error toast + recovery message
- `src/components/ai-campaign/AIChatPanel.tsx` — minor: render a visible error/retry state if a turn fails

### Out of scope
- Switching AI models or providers
- Persisting conversation across reloads
- Redesigning the items collection flow

