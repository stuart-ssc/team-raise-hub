
# Fix: Participant Filtering for Donors and Businesses

## Problems Found

### 1. Race Condition -- Dual useOrganizationUser Instances
The `useParticipantConnections` hook creates its own `useOrganizationUser()` instance internally. The Donors and Businesses pages ALSO call `useOrganizationUser()` separately. These are independent React state instances that load at different times, creating a window where:
- The page's `organizationUser` is loaded (triggering a data fetch)
- The hook's `organizationUser` is NOT yet loaded, so `isParticipantView = false`
- Result: the page fetches ALL donors/businesses without filtering

### 2. Test Data Order Status Mismatch
Taylor Player's 3 attributed orders have status `test_archived`. The hook only looks for `succeeded` or `completed` orders, so it finds zero connections -- meaning even when filtering works, the player sees an empty page.

## Fix

### 1. Refactor useParticipantConnections to accept organizationUser as a parameter
Instead of calling `useOrganizationUser()` internally, the hook should receive the organizationUser and allRoles from the page component. This eliminates the dual-instance race condition and ensures a single source of truth.

**File:** `src/hooks/useParticipantConnections.ts`
- Change the hook signature to accept `organizationUser` and `allRoles` as parameters
- Remove the internal `useOrganizationUser()` call
- Derive `isParticipantView` from the passed-in data

### 2. Update Donors page to pass organizationUser to the hook
**File:** `src/pages/Donors.tsx`
- Pass `organizationUser` and `allRoles` from the page's existing hook call to `useParticipantConnections`

### 3. Update Businesses page to pass organizationUser to the hook
**File:** `src/pages/Businesses.tsx`
- Same change as Donors page

### 4. Update DonorProfile and BusinessProfile pages
**Files:** `src/pages/DonorProfile.tsx`, `src/pages/BusinessProfile.tsx`
- Pass organizationUser/allRoles to the hook in these files as well

### 5. Include `test_archived` status or update test data
**File:** `src/hooks/useParticipantConnections.ts`
- Add `paid` to the status filter (since orders may go through `paid` status before `succeeded`)
- Alternatively, the test data orders should be updated to `succeeded` status for proper testing

## Technical Details

Updated hook signature:
```typescript
export const useParticipantConnections = (
  organizationUser: OrganizationUser | null,
  allRoles: OrganizationUser[]
): ParticipantConnections => {
  // Remove internal useOrganizationUser() call
  // Use passed-in organizationUser directly
  ...
};
```

Updated page usage:
```typescript
const { organizationUser, allRoles } = useOrganizationUser();
const { connectedDonorEmails, isParticipantView, loading: connectionsLoading } = 
  useParticipantConnections(organizationUser, allRoles);
```

## Files to Modify
1. `src/hooks/useParticipantConnections.ts` -- accept params instead of internal hook call; widen status filter
2. `src/pages/Donors.tsx` -- pass organizationUser/allRoles to hook
3. `src/pages/Businesses.tsx` -- pass organizationUser/allRoles to hook
4. `src/pages/DonorProfile.tsx` -- pass organizationUser/allRoles to hook
5. `src/pages/BusinessProfile.tsx` -- pass organizationUser/allRoles to hook
