
## Goal
Stop the false “Access Denied” redirect when Taylor clicks a donor she owns. This is still a client-side access timing bug, not an RLS issue. The donor row is being loaded successfully, then the page rejects it before participant connections are fully resolved.

## What to change

### 1. Make `useParticipantConnections` truly “pending” until it has resolved for the current role
File: `src/hooks/useParticipantConnections.ts`

The current fix is incomplete because there is still a render where:
- `organizationUser` has loaded
- `connectionsLoading` is still `false` from the earlier `organizationUser = null` branch
- `connectedDonorEmails` is still empty
- `DonorProfile` runs its access check too early and redirects

Update the hook so loading is derived from the **current role context**, not just a boolean that can be stale for one render.

Implementation approach:
- Keep an internal fetch state, but also track a `resolvedKey` for the current participant context.
- Build a stable key from the active org user + linked role context, e.g. current org user id plus a signature of relevant `allRoles`.
- Return `loading: true` whenever:
  - the user is in participant/supporter/sponsor view, and
  - the hook has not yet resolved for the current key.
- Replace the `allRoles.length` dependency with a stable role signature so role changes do not get missed when length stays the same.

This removes the last race window.

### 2. Let donor owners through directly on the profile page
File: `src/pages/DonorProfile.tsx`

Right now the profile only allows participants if the donor email is inside `connectedDonorEmails`. That is weaker than the actual product rule the user asked for: if you **own** the contact, you should be able to open it.

Change the participant access guard to allow either:
- donor is explicitly owned by the current org user (`added_by_organization_user_id === organizationUser.id`), or
- donor email is in the resolved participant connection list.

Implementation details:
- Extend the local `DonorProfile` interface to include `added_by_organization_user_id`.
- Normalize emails with `trim().toLowerCase()` on both sides.
- Do not run the participant denial branch until both:
  - `organizationUserLoading === false`
  - participant connections are resolved for the current role.

Recommended guard:
- `ownsDonor`
- `connectedByEmail`
- allow if `ownsDonor || connectedByEmail`

This makes the profile rule match the Donors list rule and the user expectation.

### 3. Apply the same ownership fallback to business profiles
File: `src/pages/BusinessProfile.tsx`

The same pattern exists for businesses: it currently denies based only on `connectedBusinessIds.includes(businessId)`.

Update it to allow either:
- business is owned by the current org user (`added_by_organization_user_id === organizationUser.id`), or
- business id is in the resolved participant connections list.

Also gate the check on the corrected hook loading state so the business page cannot redirect during the same transient render.

### 4. Keep RLS unchanged unless a real DB denial appears
No migration is needed for this issue based on the current code path:
- `DonorProfile` already reaches `.from("donor_profiles").select("*").eq("id", donorId).single()`
- the page then manually redirects with the toast

That means the current failure is happening in frontend authorization logic after the row is fetched, not from Supabase blocking the row.

## Files to update
- `src/hooks/useParticipantConnections.ts`
- `src/pages/DonorProfile.tsx`
- `src/pages/BusinessProfile.tsx`

## Verification
- As Taylor, click Donor Five from `/dashboard/donors` → profile opens, no destructive toast, no redirect.
- Same for Donor Six.
- Taylor can still open donors she uploaded even if they have zero completed donations.
- Taylor is still blocked from opening a donor she neither owns nor is connected to through fundraising.
- Business profile behavior matches the donor profile fix.
- Role switching still updates the allowed donor/business set even if role count does not change.

## Technical note
The earlier hook change fixed the first-mount race, but not the later transition from “no organization user yet” to “participant organization user loaded.” The new plan fixes that remaining one-render stale state and also makes ownership an explicit allow-path instead of depending only on email-based connections.
