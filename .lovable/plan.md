

The issue: when the user says "May 1" or "5/1/2026", the AI tool call may not produce a valid `YYYY-MM-DD` date, or it may interpret ambiguously. The edge function currently trusts whatever the AI returns and stores it raw in `updatedFields`. We need server-side date normalization plus a stronger AI instruction so verbal/short dates get converted reliably.

Let me check the current edge function date handling.

Looking at `supabase/functions/ai-campaign-builder/index.ts`:
- Tool definition says `start_date`/`end_date` should be `"YYYY-MM-DD"` strings
- No server-side validation/normalization — whatever the AI returns is stored
- System prompt says "Start date in YYYY-MM-DD format" but doesn't tell the AI to assume current/upcoming year, US mm/dd convention, or convert verbal dates

## Plan

### Goal
Accept natural date inputs ("May 1", "5/1", "5/1/2026", "next Friday", "May 1st 2026") and reliably normalize to `YYYY-MM-DD` (US mm/dd/yyyy convention) before storing.

### Changes

**1. `supabase/functions/ai-campaign-builder/index.ts` — add server-side date normalizer**

Add a `normalizeDate(input, today)` helper that handles:
- Already-ISO `YYYY-MM-DD` → pass through (validated)
- `M/D/YYYY`, `MM/DD/YYYY`, `M-D-YYYY` (US mm/dd) → reformat
- `M/D` or `M-D` (no year) → assume current year, but if the resulting date is in the past, roll to next year
- Verbal dates like "May 1", "May 1st", "May 1, 2026", "Jan 5" → parse month name + day, infer year as above
- Build dates using `Date.UTC(...)` to avoid timezone shifts; validate that the constructed date matches input parts (catches Feb 31, etc.)
- Return `null` for unparseable input (don't store garbage)

After processing the AI's tool call, run any returned `start_date` / `end_date` through `normalizeDate`. If normalization fails, drop the field (don't store invalid value) so the AI re-asks; log a warning.

Also normalize after `start_date` is set: if `end_date` is provided and parses to a date before `start_date`, drop it.

**2. Update system prompt (rule for dates)**

Add an explicit rule:
> "For start_date and end_date: accept ANY natural format the user provides (e.g. 'May 1', '5/1', '5/1/2026', 'next Friday'). When the user uses US-style M/D or M/D/YYYY, interpret as month/day/year. If the user omits the year, assume the current year unless that date has already passed — then assume next year. ALWAYS pass the date to the tool in `YYYY-MM-DD` format. After setting a date, briefly confirm it back in friendly format (e.g. 'Got it — starting May 1, 2026.')."

Also add today's date to the system prompt context (`Today is YYYY-MM-DD`) so the AI knows what "current year" / "next Friday" mean.

**3. No frontend changes needed** — the edge function returns normalized values in `updatedFields`, which already flows through to the preview pane.

### Files
- `supabase/functions/ai-campaign-builder/index.ts` — add `normalizeDate`, post-process tool-call date fields, expand system prompt with date rules + today's date

### Notes
- US mm/dd convention is project-appropriate (Sponsorly is US-only based on tax/EIN context).
- Using `Date.UTC` avoids the documented one-day-shift bug when constructing dates from parts.

