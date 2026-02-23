

# Fix Status Priority Logic for Deactivated Users

## Problem

The current logic on line 174 of `src/pages/Users.tsx` is:

```text
!signupCompleted -> "invited"
signupCompleted && active -> "active"
signupCompleted && !active -> "deactivated"
```

This means a user who was deactivated (`active_user = false`) but whose `signup_completed` is `false` or `null` will incorrectly show as "Invited" instead of "Deactivated".

## Fix

Update the priority order to check deactivation first:

```text
!active_user -> "deactivated"
active_user && !signupCompleted -> "invited"
active_user && signupCompleted -> "active"
```

## Technical Change

**`src/pages/Users.tsx`** (line 174)

Replace:
```typescript
const accountStatus: AccountStatus = !signupCompleted ? "invited" : (isActive ? "active" : "deactivated");
```

With:
```typescript
const accountStatus: AccountStatus = !isActive ? "deactivated" : (!signupCompleted ? "invited" : "active");
```

This ensures that if an admin has explicitly deactivated a user, they always show as "Deactivated" regardless of their signup state.

