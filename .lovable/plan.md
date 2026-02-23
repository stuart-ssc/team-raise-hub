

# Fix: Accept-Invite Deadlock in DashboardRedirect

## Problem

The `acceptingInvite` guard on line 143 checks `if (!inviteToken || !user?.id || acceptingInvite) return;`. Since `acceptingInvite` is initialized to `true` when the token is present, the useEffect immediately exits and never calls the edge function. Deadlock.

## Fix

**File: `src/components/DashboardRedirect.tsx` (lines 140-178)**

Remove `acceptingInvite` from the guard condition and `searchParams` from the dependency array. Add a cleanup flag for React strict mode safety.

```
// Before
useEffect(() => {
  const inviteToken = searchParams.get("accept-invite");
  if (!inviteToken || !user?.id || acceptingInvite) return;  // <-- deadlock
  ...
}, [user?.id, searchParams]);

// After
useEffect(() => {
  const inviteToken = searchParams.get("accept-invite");
  if (!inviteToken || !user?.id) return;  // removed acceptingInvite check

  let cancelled = false;
  setAcceptingInvite(true);

  const acceptInvite = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("accept-parent-invitation", {
        body: { token: inviteToken },
      });
      if (cancelled) return;
      if (error) throw error;

      toast({ title: "Invitation Accepted!", description: "..." });
      await refreshRoles();
      searchParams.delete("accept-invite");
      setSearchParams(searchParams, { replace: true });
    } catch (err) {
      if (cancelled) return;
      // show error toast
    } finally {
      if (!cancelled) setAcceptingInvite(false);
    }
  };

  acceptInvite();
  return () => { cancelled = true; };
}, [user?.id]);  // removed searchParams dependency
```

Only one file changes. The initialization fix from the previous edit stays as-is.

