

# Fix: Nonprofit Registration Failing Due to Missing RLS Policies

## Root Cause

When "Ky youth softball" tries to register, the `NonProfitSetupForm` performs 4 sequential database inserts. Two of them are blocked by Row Level Security:

| Step | Table | RLS Policy | Result |
|------|-------|-----------|--------|
| 1. Create organization | `organizations` | INSERT allowed for authenticated users | OK |
| 2. Create nonprofit details | `nonprofits` | **No INSERT policy exists** | **BLOCKED** |
| 3. Create default group | `groups` | INSERT requires `school_user` role | **BLOCKED** |
| 4. Create organization_user | `organization_user` | INSERT allowed when `user_id = auth.uid()` | OK |

Steps 2 and 3 fail because:
- The `nonprofits` table has RLS enabled but zero INSERT policies -- no one can insert.
- The `groups` table INSERT policy only checks the `school_user` table, which nonprofit registrants don't have records in.

The organization gets created (step 1), but then step 2 or 3 throws an RLS violation error, which is caught and shown as "Failed to create organization. Please try again." The user may also have orphaned organization records from previous attempts.

## Fix

### 1. Add INSERT policy on `nonprofits` table

Allow authenticated users to insert nonprofit details for organizations they just created. Since the `organization_user` record doesn't exist yet at this point in the flow, we need a permissive policy that allows the insert for authenticated users (the organization INSERT policy already gates who can create orgs).

```sql
CREATE POLICY "Authenticated users can create nonprofit details"
  ON public.nonprofits FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 2. Add INSERT policy on `groups` table for nonprofit registration

The existing groups INSERT policy only checks `school_user`. Add a second policy that allows authenticated users to create groups for organizations (needed during nonprofit setup to create the "General Fund" group).

```sql
CREATE POLICY "Authenticated users can create groups during org setup"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 3. Clean up orphaned organization records

Check for and remove any partial organization records from the user's failed registration attempts so they can register fresh.

### 4. Improve error handling in `NonProfitSetupForm.tsx`

Update the catch block to log the actual Supabase error message (not just a generic message) so future issues are easier to diagnose. Also consider rolling back the organization record if subsequent steps fail.

## Files to Change

| File/Resource | Change |
|---------------|--------|
| SQL Migration | Add INSERT RLS policies for `nonprofits` and `groups` tables |
| Database cleanup | Remove orphaned org records from failed attempts |
| `src/components/NonProfitSetupForm.tsx` | Improve error logging to include the actual error details in the toast |
