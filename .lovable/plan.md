

## Diagnosis

The screenshot shows three back-to-back failures of the same kind: you answered the "participant directions" question, the AI **claimed** it saved your answer ("I've saved 'Share on social' as the instructions…"), but it never actually called the `update_campaign_fields` tool. So:

- Server still sees `group_directions_addressed === false`
- `nextStep` re-injects "ask for participant directions"
- AI re-asks → no-repeat guard fires generic clarifier → eventually a third try succeeds

This is a **model tool-compliance bug**, not a flow bug. The model is saying "saved" without saving.

## Why we can't tell exactly why the model skipped the tool call

We log envelope metadata (msgCount, phase, collectedKeys, hasSuggestions) but **not** the prompt text or the model's raw response (text + tool_calls). So we can't see *what* the model returned vs. what we expected.

## Plan

### 1. Force the tool call before acknowledgment (server-side guard)
In the post-draft "participant directions" step, after the model responds:
- If the previous user message was a reply to the directions question AND the model's response did NOT include a `update_campaign_fields` tool call setting `group_directions` or `group_directions_addressed=true`:
  - Treat the user's reply as the answer:
    - If reply matches `/^(skip|no|none|n\/a|no thanks)$/i` → set `group_directions_addressed=true`
    - Otherwise → set `group_directions` = user's reply, `group_directions_addressed=true`
  - Persist to DB and to `updatedFields`
  - Let the existing `needsFollowUp` path re-run with directions now done, so the model moves on to the "all done" step

This same fallback pattern should be applied to other small free-text post-draft answers where the model has shown it sometimes forgets to call the tool (e.g. roster attribution yes/no, image skip).

### 2. Strengthen the system-prompt rule
Add an explicit rule for post-draft fields:
> "When the user answers a post-draft question (image, roster attribution, roster pick, participant directions), you MUST call `update_campaign_fields` in the SAME turn before writing your acknowledgment. Saying 'saved' or 'got it' without calling the tool is a bug."

### 3. Add full prompt + response logging (debug)
Add (gated behind an `AI_DEBUG_LOGS` env var so it's easy to flip) logging of:
- The system prompt + last 3 messages sent to the gateway
- The model's raw response: text content + tool_calls array (names + arguments)
- A diff of `collectedFields` before/after the turn

This is what you'd need next time the assistant misbehaves to know whether it's a missing tool call, a wrong tool call, or a parsing issue on our side.

### 4. Tighten the no-repeat guard
Right now the guard's clarifier ("Sorry, I didn't quite catch that…") fires whenever the question is repeated, but the user's answer was actually fine — they just got punished for the model's failure. Change it so:
- If a tool-fallback (step 1) was applied this turn, suppress the clarifier and use the normal acknowledge-and-advance flow
- Only show the clarifier when the model truly couldn't extract an answer

### Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — post-tool fallback for directions (and roster yes/no), strengthened prompt rule, debug logging behind env flag, guard refinement

### Out of scope
- Changing AI providers/models
- Persisting raw prompt/response logs to a DB table (env-gated console logs are enough for debugging)

