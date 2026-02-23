

# Fix: Nonprofit Registration Still Failing

## Investigation Results

After thorough investigation, here is what I found:

### The database function IS correctly deployed
The `register_nonprofit` SECURITY DEFINER function exists, is owned by `postgres` (which has `bypassrls = true`), and the SQL is correct. All 4 user type roles exist in the database.

### The frontend code IS correct
`NonProfitSetupForm.tsx` calls `supabase.rpc('register_nonprofit', ...)` -- no direct table inserts remain anywhere in the codebase.

### The errors are from BEFORE the fix fully deployed
The 3 "row-level security policy" errors in the database logs all occurred at ~21:05 UTC -- just minutes after the migration was created (20:53 UTC) but likely before the frontend code finished redeploying. There are **zero database errors after that point**.

### The user has NOT successfully re-tried since the fix deployed
The user (jackie.watson@thecribsoftball.com) has no organization record, meaning no successful registration. But there are also no new errors, meaning they likely:
- Tried during the brief window when the DB function existed but the old frontend code was still running
- OR are testing on the **published production site** which may not have been republished with the latest code

## Recommended Actions

### 1. Republish the production site
If the user is testing on sponsorly.io or team-raise-hub.lovable.app, the published site needs to be updated with the latest code that uses the RPC call.

### 2. Ask the user to try again on the preview URL
The preview URL has the latest code. Have Jackie try registering there to confirm the fix works.

### 3. Add a safety net -- grant EXECUTE permission explicitly
As a precaution, ensure the `register_nonprofit` function is callable by the `authenticated` role (it should already be, but let's be explicit).

```sql
GRANT EXECUTE ON FUNCTION public.register_nonprofit TO authenticated;
```

### 4. Clean up any orphaned data
Verify and remove any partial records from failed attempts so Jackie gets a clean start.

## Files to Change

| File/Resource | Change |
|---------------|--------|
| SQL Migration | `GRANT EXECUTE` on `register_nonprofit` to `authenticated` role; clean up any orphaned data |
| No frontend changes needed | The code is already correct |

