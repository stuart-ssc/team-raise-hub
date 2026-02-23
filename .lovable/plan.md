

# Fix: Accept-Invite Race Condition in DashboardRedirect

## Problem

The `acceptingInvite` state starts as `false` and only gets set to `true` inside a `useEffect` (which runs *after* render). Meanwhile, the other check useEffects complete faster, the loading guard passes, and the component proceeds to render `<Dashboard />` -- skipping the invitation acceptance entirely. The edge function is never called.

## Fix

**File: `src/components/DashboardRedirect.tsx`**

Change the initial state of `acceptingInvite` to be `true` when a token is present in the URL. This ensures the loading guard blocks all redirects until the invitation is processed.

```typescript
// Before (line 22)
const [acceptingInvite, setAcceptingInvite] = useState(false);

// After
const [acceptingInvite, setAcceptingInvite] = useState(
  () => !!new URLSearchParams(window.location.search).get("accept-invite")
);
```

This way, on the very first render, if `accept-invite=TOKEN` is in the URL, the loading spinner shows and no redirect fires until the edge function completes and roles are refreshed.

No other files need to change.

## Technical Detail

| File | Change |
|------|--------|
| `src/components/DashboardRedirect.tsx` | Initialize `acceptingInvite` to `true` when `accept-invite` query param exists |

