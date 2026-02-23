

# Fix: Parent Link Should Create Separate Family Member Role

## Problem

When a user already has a role in the same org+group (e.g., Booster Leader for Softball), the edge function updates that existing record with `linked_organization_user_id` instead of creating a new Family Member record. This means:

- The user has only 1 `organization_user` record (Booster Leader with a parent link bolted on)
- The RoleSwitcher requires 2+ roles to render, so it never appears
- The user cannot switch to the Family Member / parent view

The correct behavior: accepting a parent invitation should always create a **new** organization_user record with the Family Member user type, even if the user already has a different role in the same group.

## Root Cause

The database has a unique constraint on `(user_id, organization_id, group_id)`. The previous fix changed the duplicate check to match this constraint, which correctly prevents the 23505 error -- but the "update existing record" path is wrong for this use case. A Booster Leader and a Family Member are distinct roles that should coexist.

## Solution

Two changes are needed:

### 1. Database: Relax the unique constraint

The unique constraint on `(user_id, organization_id, group_id)` must allow multiple records for the same user+org+group when they have different user types. Update the constraint to include `user_type_id`:

```sql
-- Drop the existing constraint
ALTER TABLE organization_user DROP CONSTRAINT IF EXISTS organization_user_user_id_organization_id_group_id_key;

-- Add a new constraint that includes user_type_id
ALTER TABLE organization_user ADD CONSTRAINT organization_user_user_org_group_type_key 
  UNIQUE (user_id, organization_id, group_id, user_type_id);
```

### 2. Edge Function: Always create a new Family Member record

Revert the duplicate-check logic in `accept-parent-invitation/index.ts` to check for an existing Family Member link specifically (not just any record in the same org+group):

- Look up the Family Member user type ID
- Check if a record already exists with `user_id + organization_id + group_id + family_member_type_id`
- If yes, return "already connected"
- If no, INSERT a new record with the Family Member user type and `linked_organization_user_id`

This way, the user ends up with two records:
1. Booster Leader (their admin role) -- no parent link
2. Family Member (their parent role) -- with `linked_organization_user_id` pointing to the child

The RoleSwitcher will then show both roles and allow toggling between them.

### 3. Data Fix: Clean up the current record

Stuart's existing Booster Leader record was incorrectly updated with a `linked_organization_user_id`. This needs to be:
- Cleared from the Booster Leader record
- A new Family Member record created with the parent link

```sql
-- Remove the parent link from the Booster Leader record
UPDATE organization_user 
SET linked_organization_user_id = NULL 
WHERE id = 'c9920a46-9e45-407f-a4e1-cdeb7e036c69';

-- Create a proper Family Member record
INSERT INTO organization_user (user_id, organization_id, group_id, user_type_id, active_user, linked_organization_user_id)
VALUES (
  'aa5ac4e9-3e2e-43e3-aac9-e962b0b7bd1c',
  '91b5cf9e-0d60-40f8-ac9a-e23778e0b82d',
  'd9e8183f-35cf-4b90-b8c0-3f7b5c088442',
  (SELECT id FROM user_type WHERE name = 'Family Member'),
  true,
  '21aacf21-09e2-4265-a9fa-f85baa3d9f64'
);
```

## Technical Details

| Item | Change |
|------|--------|
| Database migration | Replace unique constraint on `(user_id, org_id, group_id)` with `(user_id, org_id, group_id, user_type_id)` |
| `supabase/functions/accept-parent-invitation/index.ts` | Look up Family Member type, check for existing FM record specifically, always INSERT a new FM record |
| Data fix (one-time SQL) | Clear `linked_organization_user_id` from Stuart's Booster Leader record, insert new Family Member record |

