

# Fix: Persistent "Unauthorized" Error in Roster Link Generation

## Problem
The `generate-roster-member-links` function has `verify_jwt = true` in `config.toml`, which means the Supabase gateway already validates the JWT before the function runs. However, the function then calls `supabaseClient.auth.getUser()` using the anon client, which fails in the Deno edge runtime due to an async context mismatch. This is a known issue documented in your project's architecture.

## Fix
**File:** `supabase/functions/generate-roster-member-links/index.ts`

Remove the anon/authenticated client entirely. Instead, extract the JWT token from the `Authorization` header and call `supabaseAdmin.auth.getUser(token)` on the admin client. This is the same pattern used in `save-campaign-pitch` and other working edge functions.

### Changes:
1. Remove the `supabaseClient` creation (lines 22-30)
2. Extract the token from the Authorization header manually
3. Call `supabaseAdmin.auth.getUser(token)` instead of `supabaseClient.auth.getUser()`

### Updated auth block (replaces lines 22-41):
```typescript
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const authHeader = req.headers.get('Authorization');
if (!authHeader) throw new Error('No authorization header');

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
if (authError || !user) throw new Error('Unauthorized');
```

No other changes needed -- all database queries already use `supabaseAdmin`.
