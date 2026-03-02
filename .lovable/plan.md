

# Fix: Existing Users Incorrectly Shown Organization Setup Modal

## Problem

Stuart (stuartborders@gmail.com) has 2 active `organization_user` records (Booster Leader + Family Member), yet the dashboard shows the "Select school/non-profit" setup modal as if he has none.

## Root Cause

The SELECT policy on `organization_user` uses `user_belongs_to_organization(auth.uid(), organization_id)` -- a function that itself queries `organization_user`. While it's SECURITY DEFINER, there's a timing issue: when the Supabase client fires queries immediately after login, `auth.uid()` may not be set in the request headers yet, causing ALL organization_user queries to return empty.

Additionally, there's no simple "users can see their own records" policy. The current policy requires a circular lookup.

## Solution

Add a straightforward RLS policy: **users can always SELECT their own `organization_user` records** using `auth.uid() = user_id`. This eliminates the circular dependency entirely.

### Database Change

New migration:

```sql
-- Users should always be able to see their own organization_user records
CREATE POLICY "Users can view their own organization_user records"
  ON organization_user
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### No Frontend Changes

The hooks and components are all correct -- they just need the database to return data reliably.

## Files to Change

| Resource | Change |
|----------|--------|
| New SQL Migration | Add self-referencing SELECT policy on `organization_user` |

