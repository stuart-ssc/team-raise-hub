

## What's broken

**Screenshot 2 shows the smoking gun:** "Something went wrong when trying to create the campaign. It looks like the end date wasn't set correctly."

The user provided "Monday" (start) and "end of may" (end). The AI **acknowledged both dates correctly in text** ("Got it — starting **April 20, 2026**" / "Got it — ending **May 31, 2026**") but **never called `update_campaign_fields`** to actually save them. So when the user finally clicked "yes" on "Save as draft?", the server's `create_campaign_draft` validation found `end_date` missing and bailed out.

The "no answer chips" complaint matches the same root cause: when `start_date`/`end_date`/`description` were silently dropped by the model (no tool call), `stillToAskAbout[0]` stayed pinned to the missing field while the AI's text question moved on — so the chip the UI rendered (if any) was for the wrong field, or no chip rule matched for free-text fields like dates.

## Root cause

We already added a server-side **deterministic capture** safety net for `description` and `requires_business_info` (when the model forgets the tool call). **We never added the same safety net for `start_date` and `end_date`.** The dates are by far the most common field where the model just acknowledges in text without the tool call, because the model has to do format conversion ("Monday" → `2026-04-20`).

## Fix

### A. Server-side date capture (the main fix)
In `supabase/functions/ai-campaign-builder/index.ts`, extend `detectFieldFromAssistantText` to recognize when the assistant just asked about `start_date` or `end_date`, then add deterministic capture in the same block where description/yes-no capture happens:

- If the previous assistant message asked about start_date / end_date AND the user replied with non-skip free text, run `normalizeDate(userText, today)` server-side.
- If a valid ISO date comes back, set `updatedFields.start_date` (or `end_date`) directly.
- For `end_date`, if the user said "end of <month>", "end of may", "end of next month", etc., add a small extra parser: detect `/^end of (jan|feb|...|dec|january|february|...)/i`, compute the last day of that month, and use it.
- Sanity guard: if `end_date < start_date` after capture, drop end_date and let the AI re-ask.

This guarantees dates are captured even when the model skips the tool call.

### B. Strengthen the prompt for date fields (defense in depth)
Add a one-liner to rule #6: "When the user gives a date, your text reply MUST be accompanied by an `update_campaign_fields` tool call with the normalized YYYY-MM-DD value in the SAME turn. Acknowledging in text without the tool call is a bug."

### C. Better error message when create_campaign_draft fails
The user saw "It looks like the end date wasn't set correctly" — that's the AI's paraphrase. With the deterministic capture in (A), this shouldn't happen anymore. As a backstop:
- When `create_campaign_draft` fails because of missing dates AND we have date strings in any of the prior user messages, retry once after running them through the parser. (Optional polish — (A) alone fixes the case in the screenshot.)

### D. (Bonus) Recognize "end of <month>" in `normalizeDate`
Currently `normalizeDate("end of may", today)` returns null. Add a branch: if the input matches `/^end of (\w+)/`, look up the month, compute last day of that month for the inferred year. This means even if the model DID call the tool with `end_date: "end of may"`, we'd successfully normalize it instead of warning and dropping it.

## Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — extend `detectFieldFromAssistantText` for dates; add deterministic date capture; add "end of <month>" branch in `normalizeDate`; tighten rule #6 in the prompt.

## Out of scope
- No frontend changes
- No schema changes
- No item-collection logic changes

