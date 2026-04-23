

## Goal
When a business has `verification_status = 'verified'`, the verified business account becomes the source of truth for its own details and contact roster. From that point on, organization users (admins and participant owners) can no longer edit business details or remove employee/contact links. Instead of "Unlink", users get a **Disengage** action that stops outreach communication to that contact but preserves the link record.

This protects verified business data integrity while still letting orgs manage their own outreach behavior.

## Behavior summary

| Business state | Edit business details | Remove (unlink) contact | Disengage contact | Add new contact link | Set primary contact |
|---|---|---|---|---|---|
| Pending / Blocked / not verified | Yes (existing rules) | Yes | n/a | Yes | Yes |
| **Verified** | **No** (read-only for orgs) | **No** | **Yes** | No | No |

System admins keep full override capability for support cases.

A "Disengaged" contact:
- Stays in `business_donors` (record preserved).
- Is excluded from outreach emails, nurture campaigns, business outreach queue, and digest emails.
- Shows a "Disengaged" badge in the Linked Employees / Contacts list.
- Can be **Re-engaged** (clear the disengaged flag) by the same users who could disengage.

## Database changes

### `business_donors` table
Already has `blocked_at` / `blocked_by` columns. Repurpose these as the "Disengaged" flag (the existing schema field is semantically equivalent — currently unused in UI).

- No new columns required.
- Add an RLS UPDATE policy that allows org admins/program managers AND participant owners of the business to update `blocked_at` / `blocked_by` on rows for businesses they have access to. Restrict updates to those two columns logically (enforced in the edge function).

### `businesses` table
- Add an RLS UPDATE policy condition: when `verification_status = 'verified'`, only `system_admin = true` users may update business detail columns. Implement via a security-definer helper or `WITH CHECK` clause that compares OLD/NEW. Simplest approach: keep the existing UPDATE policy USING clause, but add a row-level CHECK trigger `enforce_verified_business_immutable()` that raises an exception when a non-system-admin tries to UPDATE a verified business's editable columns (name, email, phone, website, EIN, industry, address fields, logo). Tags, archived_at, and engagement metrics remain mutable.

### Edge functions
- **New**: `disengage-business-contact` — sets `blocked_at = now(), blocked_by = auth.uid()` on a `business_donors` row. Allowed for org admins/managers and participant owners of the business. Verified status of business is irrelevant — disengage works in all states.
- **New**: `reengage-business-contact` — clears `blocked_at` and `blocked_by`.
- **Modify** `unlink-donor-from-business`: reject the request if the business is `verification_status = 'verified'` and the caller is not a system admin. Return a clear error like "This business is verified — use Disengage instead."
- **Modify outreach functions** to filter out `blocked_at IS NOT NULL` rows when selecting contacts:
  - `send-business-outreach-email`
  - `generate-business-outreach-queue`
  - `send-business-update-digest`
  - Any other place that loads `business_donors` for outreach. (Some already filter by `blocked_at IS NULL` — verify and standardize.)

## Frontend changes

### `src/pages/BusinessProfile.tsx`
- Compute `const isVerified = business.verification_status === 'verified'`.
- Compute `const canEditDetails = (canManageBusinesses || (isParticipantView && ownsBusiness)) && !isVerified`. System admins (`profile.system_admin`) bypass the verified lock.
- Header buttons:
  - **Edit** — show only when `canEditDetails || isSystemAdmin`.
  - **Link Employee** — show only when `canEditDetails || isSystemAdmin` (linking is a structural change verified businesses control themselves).
  - **Verify / Verified / Blocked** button — admins only, unchanged.
  - **Archive / Restore** — keep available regardless of verification (orgs can always hide from their own list).
- When verified, show an info banner near the header: "This business is verified. Details are managed by the business owner. You can still archive it from your list and disengage individual contacts."
- Linked Employees table:
  - Replace the current "X" (unlink) icon button with a small actions menu per row:
    - If contact is **engaged** → show **Disengage** (icon: BellOff). Disabled for non-verified path? No — Disengage is always available to anyone with `canEdit || canManageBusinesses`.
    - If contact is **disengaged** (`blocked_at` not null) → show **Re-engage** (icon: Bell).
    - If `!isVerified` AND user has edit rights → also show **Remove** (the existing unlink flow).
  - Render a "Disengaged" muted badge next to the contact name when `blocked_at` is set.
  - Update the `LinkedDonor` interface and fetch to include `blocked_at`, `blocked_by`.
- Tag editing block: gate behind `canEditDetails || isSystemAdmin`.

### New component `src/components/DisengageContactDialog.tsx`
- Confirmation alert dialog.
- Title: "Disengage contact?"
- Body: "{Name} will stop receiving outreach emails and communications from your organization for {Business}. The contact remains linked and can be re-engaged at any time."
- Calls the new `disengage-business-contact` edge function.

### `src/components/UnlinkDonorBusinessDialog.tsx`
- Add an `isBusinessVerified` prop. When true, the dialog short-circuits with a message explaining unlinking isn't allowed for verified businesses, with a button that switches to the Disengage flow instead. (Belt and suspenders — the UI shouldn't expose this path for verified businesses, but server enforcement also rejects.)

### `src/pages/DonorProfile.tsx` — Business Affiliations section
- The existing per-affiliation "Unlink" trigger (line ~743) becomes context-aware:
  - If the affiliated business is verified → swap "Unlink" for "Disengage" / "Re-engage" toggle.
  - Pass `is_verified` and `blocked_at` through `BusinessAffiliation` fetch and into the action menu.

### `src/components/BusinessContactsList.tsx`
- When iterating contacts, hide outreach action buttons (mail/phone) when contact is disengaged, OR show them with a muted style and a "Disengaged" badge. Recommend: show contact, badge it as disengaged, and hide the quick-action mail/phone buttons in `showOutreachActions` mode.

### `src/components/EditBusinessDialog.tsx`
- Defensive: if opened on a verified business by a non-system-admin (shouldn't happen via UI), show a read-only banner and disable Save.

## Files touched
- New migration: enforce-verified-business-immutable trigger, RLS UPDATE policy on `business_donors` for disengage flag.
- New edge functions: `disengage-business-contact`, `reengage-business-contact`.
- Modified edge functions: `unlink-donor-from-business`, `send-business-outreach-email`, `generate-business-outreach-queue`, `send-business-update-digest`.
- New component: `src/components/DisengageContactDialog.tsx`.
- Modified: `src/pages/BusinessProfile.tsx`, `src/pages/DonorProfile.tsx`, `src/components/UnlinkDonorBusinessDialog.tsx`, `src/components/BusinessContactsList.tsx`, `src/components/EditBusinessDialog.tsx`.

## Verification
- On a **non-verified** business, an org admin or participant owner sees Edit, Link Employee, and per-row Remove + Disengage actions, all working as before.
- On a **verified** business:
  - Edit, Link Employee, and per-row Remove are hidden for non-system-admins.
  - An info banner explains the lock.
  - Per-row Disengage works; the contact gets a "Disengaged" badge and is excluded from subsequent outreach sends.
  - Re-engage restores the contact to the outreach pool.
  - System admin can still Edit and Remove via the system admin portal flow.
- Outreach edge functions skip disengaged contacts; existing `blocked_at IS NULL` filters confirmed in all relevant queries.
- Direct API attempts to UPDATE editable columns on a verified business as a non-system-admin are rejected by the trigger.
- DonorProfile's Business Affiliations section reflects the same Disengage/Re-engage vs. Unlink distinction based on per-business verification status.

