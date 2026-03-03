
# Fix: Donors and Businesses Not Showing for Participants

## Root Cause
The sidebar and page code changes are correct, but the **orders table RLS (Row-Level Security)** blocks participants from querying orders attributed to them. The `useParticipantConnections` hook queries orders by `attributed_roster_member_id`, but the existing RLS policies only let users see orders they placed themselves (`user_id = auth.uid()`). Since donors placed the orders, participants get zero results, so the Donors/Businesses pages show empty states.

## Fix

### 1. Add RLS Policy on `orders` Table
Add a new SELECT policy allowing participants to view orders where `attributed_roster_member_id` matches their `organization_user.id`:

```sql
CREATE POLICY "Participants can view their attributed orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_user ou
    WHERE ou.user_id = auth.uid()
      AND ou.id = orders.attributed_roster_member_id
      AND ou.active_user = true
  )
);
```

This also covers parents viewing their child's attributed orders if the hook includes the child's `organization_user.id` -- although for that to work through RLS, we may need to extend the policy to include linked users:

```sql
CREATE POLICY "Participants can view their attributed orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_user ou
    WHERE ou.user_id = auth.uid()
      AND ou.active_user = true
      AND (
        ou.id = orders.attributed_roster_member_id
        OR ou.linked_organization_user_id = orders.attributed_roster_member_id
      )
  )
);
```

This single policy handles both:
- A player viewing orders attributed to themselves
- A parent viewing orders attributed to their linked child

### 2. No Other Changes Needed
- The sidebar already shows Donors and Businesses for all roles (verified in current code)
- The `useParticipantConnections` hook logic is correct
- The `donor_profiles` RLS already allows organization members to view donors
- The Donors and Businesses pages already have participant filtering logic

## Files to Modify
1. **Database migration** -- Add the new RLS policy on the `orders` table

## What This Enables
Once the RLS policy is in place, "Taylor Player" will:
- See Donors and Businesses in the sidebar
- See only donors who contributed to their fundraising on the Donors page
- See only businesses linked to their attributed orders on the Businesses page
- View individual donor/business profiles for connected records only
