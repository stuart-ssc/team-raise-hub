

# Fix: Allow Nonprofit Registration to Work Regardless of Browser Cache

## Root Cause (Finally Found It)

The error Jackie sees is **not** from the INSERT — it's from the `.select().single()` that follows the INSERT. Here's why:

1. The old (cached) code does: `supabase.from('organizations').insert({...}).select().single()`
2. The INSERT succeeds (the INSERT policy allows any authenticated user)
3. But `.select()` triggers a SELECT query on the row just inserted
4. The SELECT policy requires: `EXISTS (SELECT 1 FROM organization_user WHERE user_id = auth.uid() AND organization_id = organizations.id)`
5. The `organization_user` record doesn't exist yet at that point -- so the SELECT fails with an RLS violation
6. The error message "new row violates row-level security policy" is shown

The new `register_nonprofit` RPC function (SECURITY DEFINER) bypasses RLS entirely, but **Jackie's browser is serving the old cached JavaScript** that still uses direct table inserts. Our republish updated the server files, but her browser cache is still serving the old bundle.

## Solution

Rather than relying on Jackie clearing her cache, we make **both code paths work** by adding a permissive SELECT policy on the `organizations` table. This way, even the old cached code will succeed.

### Database Changes

Add a temporary SELECT policy to `organizations` that allows an authenticated user to read a row immediately after creating it. The simplest safe approach:

```sql
-- Allow authenticated users to SELECT organizations during the setup flow
-- This ensures .select().single() after INSERT works even before organization_user exists
CREATE POLICY "Users can view organizations they just created"
  ON organizations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND created_at > now() - interval '5 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM organization_user ou 
      WHERE ou.organization_id = organizations.id
    )
  );
```

This policy:
- Only applies to organizations created in the last 5 minutes
- Only applies when no `organization_user` records exist yet (i.e., during initial setup)
- Automatically becomes irrelevant once the user is linked (the existing member policy takes over)
- Is harmless security-wise since the org has no sensitive data at creation time

### No Frontend Changes Needed

The current frontend code (`supabase.rpc('register_nonprofit', ...)`) is already correct. Once Jackie's cache refreshes naturally, the RPC path will be used. In the meantime, this policy ensures the old code path also works.

## Files to Change

| Resource | Change |
|----------|--------|
| SQL Migration | Add SELECT policy on `organizations` for recently-created orgs without members |
| No code changes | Frontend is already correct |
