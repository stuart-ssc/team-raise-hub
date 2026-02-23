
# Fix: Setup Modal Incorrectly Appearing on Login

## What's Happening

Your roles ARE stored separately (in `organization_user` table) and the RoleSwitcher IS in the sidebar -- the architecture is already correct. The problem is a timing bug that makes the app briefly think you have no roles, which triggers the "Are you a supporter, school, or nonprofit?" setup modal.

## Root Cause

When you log in, two things happen in parallel:
1. `useAuth` resolves your identity
2. `useOrganizationUser` fetches your roles

The bug: when `useAuth` initially returns no user, the roles hook sets `loading = false` (with empty roles). When `useAuth` then resolves with your real identity, the roles hook starts fetching -- but `loading` is still `false` from the previous run. The Dashboard sees "loading is done, user exists, but no roles found" and shows the setup modal.

## Fix

**File: `src/hooks/useOrganizationUser.tsx`** (lines 54-58)

Add `setLoading(true)` at the start of `fetchRoles` when there IS a user, so Dashboard knows to wait:

```typescript
const fetchRoles = useCallback(async () => {
  if (!user?.id) {
    setLoading(false);
    return;
  }

  setLoading(true);  // <-- ADD THIS LINE

  try {
    // ... rest of fetch logic unchanged
```

This single line ensures `loading` is `true` whenever the hook is actively fetching roles, preventing the Dashboard from prematurely showing the setup modal.

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useOrganizationUser.tsx` | Add `setLoading(true)` at line 60 (before the try block) so loading resets to true on each fetch |

No other files need changes. The RoleSwitcher and multi-role architecture are already working correctly.
