
# Fix: Preserve `accept-invite` Token Through Login Redirect

## Problem

When Stuart clicks the invitation link (`/dashboard?accept-invite=TOKEN`), the `ProtectedRoute` sees he's not logged in and redirects to `/login` -- but drops the query parameters. After login, he's sent to `/dashboard` without the token, so the invitation is never accepted.

## Fix

Two changes are needed:

### 1. ProtectedRoute: preserve the full URL when redirecting to login

In `src/App.tsx`, update `ProtectedRoute` to pass the current location (including query params) as state to the login page:

```
// Before
return <Navigate to="/login" replace />;

// After  
return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
```

This stores the original URL (`/dashboard?accept-invite=TOKEN`) in the navigation state so the login page can redirect back to it after authentication.

### 2. Login page: redirect to the saved URL after login

In `src/pages/Login.tsx`, update both the `useEffect` (already-logged-in redirect) and the `handleLogin` success path to use the saved `from` location instead of hardcoded `/dashboard`:

```
// Use the saved redirect target
const location = useLocation();
const redirectTo = location.state?.from || '/dashboard';

// Then in useEffect and handleLogin:
navigate(redirectTo);
```

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Pass `location.pathname + location.search` as state when redirecting to login |
| `src/pages/Login.tsx` | Read `location.state?.from` and redirect there after login instead of hardcoded `/dashboard` |

## Result

After this fix:
1. Stuart clicks `/dashboard?accept-invite=TOKEN`
2. `ProtectedRoute` redirects to `/login` with state `{ from: "/dashboard?accept-invite=TOKEN" }`
3. Stuart logs in
4. Login page redirects to `/dashboard?accept-invite=TOKEN`
5. `DashboardRedirect` detects the token, calls `accept-parent-invitation`, links the account
6. Role switcher appears with the new Family Member role
