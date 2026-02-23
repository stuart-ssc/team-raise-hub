

# Fix: Invite Email Link Lands on Homepage Instead of Password Setup

## Problem

When an invited user clicks the link in their invitation email, they land on the **homepage** (the public marketing site) instead of being prompted to set up their password. Here's what's happening:

1. The `invite-user` edge function generates a recovery link with `redirectTo` pointing to `/login`
2. Supabase's recovery flow processes the token and redirects the user -- but the redirect lands them on the homepage (likely due to how Supabase resolves the redirect URL or the site URL configuration)
3. Kate then clicked "For Schools" which took her to `/login`, but since the recovery token already authenticated her, `PublicRoute` detected she was logged in and sent her straight to `/dashboard` -- skipping password setup entirely
4. There is **no `/set-password` page** in the app at all

## Solution

### 1. Create a new `/set-password` page
A dedicated page (`src/pages/SetPassword.tsx`) with:
- "New Password" and "Confirm Password" fields
- Minimum 8 character validation
- Calls `supabase.auth.updateUser({ password })` on submit
- Redirects to `/dashboard` on success
- Branded consistently with login/signup pages (SponsorlyLogo, similar layout)

### 2. Register the route in `src/App.tsx`
- Add `/set-password` as a **standalone route** (not wrapped in `PublicRoute` or `ProtectedRoute`)
- The user arrives already authenticated via the recovery token, so it must not be behind `PublicRoute` (which would redirect them to dashboard)

### 3. Update the invite link redirect URL
In `supabase/functions/invite-user/index.ts` (line 138), change:
```
redirectTo: .../login
```
to:
```
redirectTo: .../set-password
```

### 4. Update the password reset redirect URL
In `src/hooks/useAuth.tsx`, change the `resetPassword` function's `redirectTo` from `/login` to `/set-password` so "forgot password" also works correctly.

### 5. Handle the `PASSWORD_RECOVERY` auth event
In `src/hooks/useAuth.tsx`, add detection for the `PASSWORD_RECOVERY` event inside `onAuthStateChange`. When this event fires, navigate the user to `/set-password` -- this acts as a safety net in case the redirect URL doesn't work as expected.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/SetPassword.tsx` | **Create** -- password setup form |
| `src/App.tsx` | **Edit** -- add `/set-password` route |
| `supabase/functions/invite-user/index.ts` | **Edit** -- change redirectTo from `/login` to `/set-password` |
| `src/hooks/useAuth.tsx` | **Edit** -- update resetPassword redirectTo and add PASSWORD_RECOVERY event handler |

## For Kate Borders

After this fix is deployed, you can re-send her invitation from the Users page. The new link will take her directly to the password setup page.
