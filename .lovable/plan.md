

# Show Connected Donors and Businesses to Players/Students

## Overview
Open up the Donors and Businesses admin areas to participants (Team Players, Club Participants) and supporters (Family Members), but filter the data to only show donors/businesses connected to them through roster-attributed donations.

## Current State
- Orders track `attributed_roster_member_id` (FK to `organization_user`), linking donations to specific roster members
- Donor profiles are created/updated via the `update_donor_profile_from_order` trigger when orders succeed
- The Donors and Businesses sidebar items are hidden from participants/supporters (line 120 of `DashboardSidebar.tsx`)
- Players can already see supporter names on their fundraising dashboard (`PlayerDashboard.tsx` queries orders by `attributed_roster_member_id`)

## Plan

### 1. Update Sidebar Visibility
**Files:** `DashboardSidebar.tsx`, `DashboardSidebarSheet.tsx`

- Remove Donors and Businesses from the `canSeeUsers` gate (line 120)
- Keep Users, Reports, and Settings gated to admins/managers
- Donors and Businesses will now show for all roles

### 2. Update Donors Page with Participant Filtering
**File:** `src/pages/Donors.tsx`

- Detect the current user's permission level
- If the user is a participant or supporter:
  - Query `orders` where `attributed_roster_member_id` matches any of the user's `organization_user` IDs (or their linked child's IDs for parents)
  - Collect the `customer_email` values from those orders
  - Filter `donor_profiles` to only show donors whose email matches those attributed orders
  - Hide admin-only features (bulk actions, import, delete, edit, tag management)
  - Show a simplified read-only view with donor name, email, total donated (to them specifically), and last donation date
- If the user is an admin/manager: no change, full view as today

### 3. Update Businesses Page with Participant Filtering
**File:** `src/pages/Businesses.tsx` (or equivalent)

- Same permission detection
- For participants/supporters:
  - Query orders attributed to them that have a `business_id`
  - Show only businesses linked to those orders
  - Read-only view (no edit, link/unlink, or management features)
- For admins/managers: no change

### 4. Restrict Navigation on Detail Pages
**Files:** `src/pages/DonorProfile.tsx`, `src/pages/BusinessProfile.tsx`

- Add access checks so participants can only view profiles of donors/businesses connected to them
- If a participant tries to access an unconnected donor/business profile, redirect back to the list

### 5. Hide Admin Actions for Participants
On both the list and detail pages, conditionally hide:
- Bulk action toolbar
- Import/export buttons
- Edit, delete, tag management actions
- Link/unlink donor-business controls
- Show a simpler, read-only interface

## Technical Details

### Fetching Connected Donors (Participant View)
```typescript
// Get current user's organization_user IDs (and linked children for parents)
const orgUserIds = [...myOrgUserIds, ...linkedChildOrgUserIds];

// Get emails of donors who supported this player
const { data: attributedOrders } = await supabase
  .from('orders')
  .select('customer_email')
  .in('attributed_roster_member_id', orgUserIds)
  .in('status', ['succeeded', 'completed']);

const donorEmails = [...new Set(attributedOrders?.map(o => o.customer_email).filter(Boolean))];

// Fetch donor profiles filtered to these emails
const { data: donors } = await supabase
  .from('donor_profiles')
  .select('*')
  .eq('organization_id', organizationId)
  .in('email', donorEmails);
```

### Fetching Connected Businesses (Participant View)
```typescript
const { data: attributedOrders } = await supabase
  .from('orders')
  .select('business_id')
  .in('attributed_roster_member_id', orgUserIds)
  .in('status', ['succeeded', 'completed'])
  .not('business_id', 'is', null);

const businessIds = [...new Set(attributedOrders?.map(o => o.business_id).filter(Boolean))];
```

## Files to Modify
1. `src/components/DashboardSidebar.tsx` -- unhide Donors/Businesses for participants
2. `src/components/DashboardSidebarSheet.tsx` -- same for mobile sidebar
3. `src/pages/Donors.tsx` -- add participant-filtered view
4. `src/pages/Businesses.tsx` -- add participant-filtered view
5. `src/pages/DonorProfile.tsx` -- add access check for participants
6. `src/pages/BusinessProfile.tsx` -- add access check for participants

No database changes required -- all the data relationships already exist via `attributed_roster_member_id` and `business_id` on the orders table.
