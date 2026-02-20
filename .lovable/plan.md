

# Fix: Organization Registration RLS Policy

## Problem

"Ky Youth Softball" (and any new nonprofit) gets **"new row violates row-level security policy"** when trying to register. The database logs show 4 repeated failures.

**Root cause**: The `organizations` table only has an INSERT policy for system admins (`is_system_admin(auth.uid())`). The `NonProfitSetupForm` inserts into `organizations` using the client SDK as a regular authenticated user -- which is blocked by RLS.

## Fix

Add a single RLS policy to the `organizations` table that allows any authenticated user to insert a new organization. This is safe because:
- Users can only create orgs, not read/update/delete others' orgs (those policies are already scoped)
- After creating the org, the user creates an `organization_user` record linking themselves to it

### Database Migration

```sql
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);
```

That is the only change needed. No code changes required -- the `NonProfitSetupForm` already has the correct insert logic; it was just being blocked by the missing policy.

## Verification

After applying, a new user selecting "Non-Profit" during registration will be able to successfully create their organization, group, and organization_user records without errors.
