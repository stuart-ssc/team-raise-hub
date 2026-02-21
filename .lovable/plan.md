

# Skip Organization Setup for Invited Users

## Problem
When a user receives an invitation and sets up their account, they land on the Dashboard and see the "Welcome to Sponsorly" modal asking them to choose School, Non-Profit, or Supporter -- even though the invite process already created their `organization_user` record with the correct organization, group, and role.

## Root Cause
The `useOrganizationUser` hook queries with RLS, which relies on `user_belongs_to_organization()`. While this *should* work for invited users (since their record exists), there's a timing/caching issue or the `.single()` call may fail if anything is slightly off. The Dashboard then sees `organizationUser === null` and shows the setup modal.

## Solution
Add a pre-check in the Dashboard's setup modal logic: before showing the modal, explicitly verify whether the user already has an `organization_user` record. If they do, force a page reload or re-fetch instead of showing the modal. This ensures invited users go straight to their dashboard.

### Changes

**1. `src/hooks/useOrganizationUser.tsx`**
- Add a fallback query using `.maybeSingle()` instead of `.single()` to handle edge cases where `.single()` throws an error (e.g., multiple records).
- If multiple records exist, pick the first active one instead of returning null.

**2. `src/pages/Dashboard.tsx`**
- Before showing the setup modal, add a direct check: query `organization_user` for `user_id = auth.uid()` and `active_user = true`.
- If a record exists but `useOrganizationUser` returned null (race condition or RLS timing), trigger a re-fetch rather than showing the modal.

**3. `src/components/OrganizationSetupModal.tsx`**  
- Add an early check when the modal opens: query for existing `organization_user` records for the current user.
- If a record is found, immediately call `onComplete()` with that data and skip the type selection entirely.
- This acts as a safety net -- even if the Dashboard logic misses it, the modal itself won't force unnecessary steps.

### Technical Details

In `OrganizationSetupModal.tsx`, add this effect at the top:

```typescript
useEffect(() => {
  if (!open || !userId) return;
  
  const checkExistingOrgUser = async () => {
    const { data } = await supabase
      .from('organization_user')
      .select(`*, user_type:user_type_id(...), organization:organization_id(...), groups:group_id(...)`)
      .eq('user_id', userId)
      .eq('active_user', true)
      .limit(1)
      .maybeSingle();
    
    if (data) {
      // User already has an org record (e.g., from invitation) -- skip setup
      onComplete(data);
    }
  };
  
  checkExistingOrgUser();
}, [open, userId]);
```

In `useOrganizationUser.tsx`, change `.single()` to `.maybeSingle()` with a fallback to handle multiple records gracefully:

```typescript
// Replace .single() with .limit(1).maybeSingle()
.eq('active_user', true)
.limit(1)
.maybeSingle();
```

This ensures that:
- Invited users skip the modal entirely and go straight to their dashboard
- Users with multiple org records don't get an error
- The fix is defensive and won't break self-registration flows
