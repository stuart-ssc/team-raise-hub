## Problem

The "Add User" dialog (`src/components/AddUserForm.tsx`) used from `/dashboard/users`:

1. Shows **all user types** regardless of the selected organization's type. A nonprofit admin sees school roles ("Coach", "Team Player", etc.) and vice versa.
2. Requires a **Group** for nonprofit admin roles like "Executive Director" — it should only exempt "Principal" today.
3. Requires a **Roster** for any role outside a small school-specific allow-list. Nonprofit roles never have rosters, so they should never require one.
4. Group dropdown is correctly scoped to `organizationId` already, but role list is not — so a user belonging to multiple orgs effectively sees roles from other org types.

## Changes

### `src/components/AddUserForm.tsx`
- Add `organizationType: "school" | "nonprofit"` to `AddUserFormProps`.
- In `fetchUserTypes`, filter the returned `user_type` rows by org type using the same allow-lists used in `EditUserRoleDialog`:
  - school → Principal, Athletic Director, Coach, Club Sponsor, Booster Leader, Team Player, Club Participant
  - nonprofit → Executive Director, Program Director, Volunteer Coordinator, Volunteer, Board Member
- Replace the hard-coded `requiresGroup` / `needsRoster` checks with org-type-aware logic:
  - **No group required** for: `Principal`, `Executive Director` (top-level org admins).
  - **No roster required** for: any nonprofit role, plus school roles `Principal`, `Athletic Director`, `Club Sponsor`, `Booster Leader` (rosters only apply to participant-style school roles: Coach, Team Player, Club Participant).
- Skip rendering the Group and Roster `<Select>` blocks when not required, and skip their validation in `handleSubmit`. Also clear `selectedGroup` / `selectedRoster` when switching to a role that does not need them so stale values are not submitted.

### `src/pages/Users.tsx`
- Pass `organizationType={organizationUser?.organization.organization_type}` into `<AddUserForm />` so the dialog only manages the currently selected organization context (the org id is already scoped via `organizationUser.organization_id`).

## Result

- Adding an **Executive Director** to a nonprofit no longer asks for a Group or Roster.
- The role dropdown only shows roles valid for the **currently selected organization**, regardless of how many orgs the signed-in user belongs to.
- Group/Roster scoping continues to use the selected `organization_id`, so multi-org users cannot accidentally invite someone into a different org.
