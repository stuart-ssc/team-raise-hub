

# Role Switcher + Parent Invitation Fix for Existing Users

## Overview

This plan adds a role switcher so users with multiple roles (e.g., Booster Leader AND Family Member) can toggle between their leader dashboard and parent/family dashboard. It also fixes the parent invitation flow so existing users receive a proper link and can accept invitations without going through signup.

## What Changes

### 1. Update `useOrganizationUser` hook to support multiple roles

Currently the hook fetches a single `organization_user` record with `.limit(1).maybeSingle()` and no ordering. This will be updated to:

- Fetch ALL active `organization_user` records for the user
- Sort by permission level priority: `organization_admin` > `program_manager` > `participant` > `supporter` > `sponsor`
- Default to the highest-permission role on login
- Expose `allRoles` array and `switchRole(orgUserId)` function
- Track the currently selected role in state

This ensures that when you log in as Stuart (Booster Leader + future Family Member), you always land in the Booster Leader view first.

### 2. Create `RoleSwitcher` component

A compact dropdown in the sidebar (above navigation) that:
- Only appears when the user has 2+ roles
- Shows current role name and group (e.g., "Booster Leader - TC Softball")
- Dropdown lists all roles to switch between
- Switching to a Family Member role navigates to `/dashboard/family`
- Switching back to a leader/admin role navigates to `/dashboard`
- Uses existing Radix DropdownMenu for consistent styling

### 3. Add RoleSwitcher to both sidebars

- `DashboardSidebar.tsx` (desktop) -- add RoleSwitcher below the logo, above nav
- `DashboardSidebarSheet.tsx` (mobile) -- add RoleSwitcher in the same position

Both sidebars currently duplicate the "isParent" check logic. With the hook update, this becomes simpler -- the sidebar reads from the selected role's permission level directly.

### 4. Fix parent invitation for existing users

Update `send-parent-invitation` edge function to:
- Check if the invitee email belongs to an existing auth user (using `listUsers` + email filter, per the existing pattern)
- If they already have an account: send an email with a link to `/dashboard/family?accept-invite=TOKEN` instead of `/signup?invite=TOKEN`
- The email copy changes slightly: "Accept Invitation" instead of "Accept Invitation & Sign Up"

### 5. Handle `accept-invite` param in the dashboard

Update `DashboardRedirect.tsx` to:
- Check for `accept-invite` query parameter on load
- If present and user is authenticated, call the `accept-parent-invitation` edge function with the token
- Show a success toast ("Successfully linked to [student name]")
- Refresh the roles list so the new Family Member role appears in the switcher
- Clear the query param from the URL

---

## Technical Details

### Permission level priority order (for default role selection):

```text
1. organization_admin  (Principal, Athletic Director, Executive Director)
2. program_manager     (Coach, Club Sponsor, Booster Leader, Program Director)
3. participant         (Team Player, Club Participant, Volunteer)
4. supporter           (Family Member, Board Member)
5. sponsor             (Sponsor, Donor)
```

### Files to create:
| File | Purpose |
|------|---------|
| `src/components/RoleSwitcher.tsx` | Dropdown component for switching between roles |

### Files to modify:
| File | Change |
|------|--------|
| `src/hooks/useOrganizationUser.tsx` | Fetch all roles, add sorting, expose `allRoles` and `switchRole` |
| `src/components/DashboardSidebar.tsx` | Add RoleSwitcher, simplify isParent logic |
| `src/components/DashboardSidebarSheet.tsx` | Add RoleSwitcher, simplify isParent logic |
| `src/components/DashboardRedirect.tsx` | Handle `accept-invite` query param |
| `supabase/functions/send-parent-invitation/index.ts` | Detect existing users, send different link/email |

### Updated `useOrganizationUser` return type:
```text
{
  organizationUser: OrganizationUser | null    // currently active role (highest by default)
  allRoles: OrganizationUser[]                  // all active roles for the user
  switchRole: (orgUserId: string) => void       // switch active role
  refreshRoles: () => Promise<void>             // re-fetch roles (after accepting invite)
  loading: boolean
}
```

