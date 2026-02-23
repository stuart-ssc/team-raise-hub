

# Fix: Duplicate Key Error in accept-parent-invitation Edge Function

## Problem

The edge function checks for an existing record using `linked_organization_user_id`, but the database unique constraint is on `(user_id, organization_id, group_id)`. When the user already has a record for that org+group (e.g., as a Booster Leader), the check misses it and the INSERT fails with error 23505.

## Fix

**File: `supabase/functions/accept-parent-invitation/index.ts`**

Update the duplicate-detection query (lines 93-100) to match the actual unique constraint, and handle the case where the user already exists in the org+group by updating the existing record instead of inserting a new one.

```typescript
// Before (line 94-100): checks linked_organization_user_id — doesn't match unique constraint
const { data: existingOrgUser } = await supabase
  .from("organization_user")
  .select("id")
  .eq("user_id", user.id)
  .eq("organization_id", invitation.organization_id)
  .eq("linked_organization_user_id", invitation.inviter_organization_user_id)
  .single();

// After: check by the actual unique constraint columns
const { data: existingOrgUser } = await supabase
  .from("organization_user")
  .select("id, linked_organization_user_id")
  .eq("user_id", user.id)
  .eq("organization_id", invitation.organization_id)
  .eq("group_id", invitation.group_id || invitation.inviter.group_id)
  .single();
```

Then update the handling logic (lines 102-130):
- If record exists AND already has the correct `linked_organization_user_id` -- return "already connected"
- If record exists but has no/different link -- update it to add the parent link, then return success
- If no record exists -- insert as before

This covers two scenarios:
1. User is already a Family Member linked to this student (already connected)
2. User has another role in the same group (e.g., Booster Leader) and needs the link added to their existing record

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/accept-parent-invitation/index.ts` | Fix duplicate check to use unique constraint columns; handle existing records by updating instead of inserting |

