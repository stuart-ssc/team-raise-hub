# Fix: Selected role doesn't persist across the app

## The bug

`useOrganizationUser` keeps `selectedRoleId` as **local `useState`** inside the hook. Every component that calls `useOrganizationUser()` (sidebar, dashboard, every page) gets its **own independent copy** of that state.

So when you click "Executive Director — Kentucky Baseball Club" in `RoleSwitcher`:
- Only `RoleSwitcher`'s local copy updates.
- Every other component still falls back to `allRoles[0]`, which is the highest-priority role — Champions Sports Executive Director.
- Result: the rest of the app keeps showing Champions Sports.

On top of that, the selection isn't saved anywhere, so a page reload or navigation also drops it.

## Fix

Promote the selection to a single shared source of truth, and persist it.

### 1. Convert `useOrganizationUser` into a context provider

In `src/hooks/useOrganizationUser.tsx`:
- Create `OrganizationUserContext` and `OrganizationUserProvider`.
- Move `allRoles`, `selectedRoleId`, `loading`, `fetchRoles`, and `switchRole` into the provider.
- Export `useOrganizationUser()` as a thin `useContext` consumer with the same return shape (`organizationUser`, `allRoles`, `switchRole`, `refreshRoles`, `loading`) — so no call sites need to change.

### 2. Persist the selection

- On `switchRole(id)`: write `id` to `localStorage` under a key like `sponsorly.activeOrgUserId`.
- On initial load (after `fetchRoles` resolves):
  1. Read the stored id.
  2. If it exists in `allRoles`, use it.
  3. Otherwise fall back to highest-priority role (current behavior).
- Validate again whenever `allRoles` changes (role removed/deactivated → fall back).

### 3. Mount the provider

In `src/App.tsx`, wrap the authenticated app tree with `<OrganizationUserProvider>` (inside `AuthProvider`, outside `ActiveGroupContext` so `ActiveGroupContext` reads the shared value).

### 4. Verify dependent contexts

`ActiveGroupContext` already calls `useOrganizationUser()`. Once the hook reads from context, switching roles will correctly cascade into active group selection. No changes needed there beyond confirming it re-derives when `organizationUser.id` changes.

## Out of scope

- No DB changes. The KBC `organization_user` row is already correct.
- No UI changes to `RoleSwitcher` — its `switchRole(role.id)` + navigate flow stays identical.

## Acceptance

- Pick "Executive Director — Kentucky Baseball Club" in the switcher → sidebar header, dashboard, campaigns, etc. all show KBC.
- Reload the page → still on KBC.
- Switch back to Champions Sports → everything updates again.
