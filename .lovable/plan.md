

## What's broken
Edge function 500 on user reply "monday" (start date). Goal capture worked, but start_date entry crashes the function.

## Likely cause
In the last change I added deterministic date capture using `normalizeDate(...)`. The most probable failure modes:

1. `normalizeDate` is called with arguments it doesn't handle (e.g. `today` is a `Date` but the function expects a string, or vice-versa) → throws → uncaught → 500.
2. The new "end of <month>" / "beginning of <month>" / bare-month branch uses `MONTHS` as an object map but elsewhere in the file `MONTHS` may be defined as an array (or not defined at all in scope) → ReferenceError on the very first date turn.
3. `detectFieldFromAssistantText` was extended to detect start_date/end_date but uses a regex that throws or returns a value the downstream switch doesn't expect.

Need to view the current edge function to confirm which one — but plan stays the same regardless: wrap the new capture in try/catch, fix the `MONTHS` reference, and verify with logs.

## Fix

### A. Inspect logs + code first (during implementation)
- Read the current `supabase/functions/ai-campaign-builder/index.ts` around `normalizeDate`, `MONTHS`, and the new deterministic capture block.
- Pull recent edge function logs for `ai-campaign-builder` to see the exact stack trace.

### B. Harden the deterministic date capture
Wrap the new server-side date parsing in try/catch so a parser bug never 500s the whole function:
```ts
try {
  if (askedField === "start_date" || askedField === "end_date") {
    const iso = normalizeDate(lastUserMsgRaw, today);
    if (iso) updatedFields[askedField] = iso;
  }
} catch (e) {
  console.error("date capture failed", e);
}
```

### C. Fix `MONTHS` lookup in `normalizeDate`
Ensure `MONTHS` is a single consistent structure (object map: `{jan:1, january:1, feb:2, ...}`) defined once at module scope, and all branches (`end of`, `beginning of`, bare month, MM/DD/YYYY parsing) use it the same way. Remove any duplicate/shadowed definitions introduced in the last edit.

### D. Sanity-check `today` argument
Make sure every call site passes the same type (ISO string `YYYY-MM-DD`) and `normalizeDate` derives a `Date` internally — no `today.getUTCFullYear()` calls on a string.

### E. Keep the existing "model must call update_campaign_fields" prompt rule
No prompt changes needed for this fix.

## Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — fix `MONTHS` definition / usage, wrap deterministic date capture in try/catch, normalize `today` argument type.

## Verification
After the fix:
1. Reply "monday" to the start-date question → start_date should populate, no 500.
2. Reply "end of may" to the end-date question → end_date should populate to last day of May.
3. Check edge function logs are clean.

## Out of scope
- No frontend changes
- No item-collection logic changes
- No new fields

