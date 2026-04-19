

## Goal
Show a warning alert above the stats cards on the Dashboard (`/dashboard`) when the team's payment account is not connected to Stripe. Clicking the alert opens the same `GroupPaymentSetupDialog` used on the Manage Groups page so the admin can connect right away.

## Scope
- Only show for users who manage the org/group: `organization_admin` or `program_manager` (not players/parents — `PlayerDashboard` branch is unaffected).
- Show one alert per unconfigured group:
  - If a single group is active (via `activeGroup` from context), check just that group.
  - If "All" is selected (org admins), show one alert per group that isn't connected (or, if there are many, a single consolidated alert linking to `/dashboard/groups`). **Default: one row per unconfigured group**, since the action requires choosing which group to connect.
- Skip entirely for nonprofits where payment is org-level (`use_org_payment_account = true` and org has it configured) — same logic the publish trigger uses.

## Detection logic
Query `groups` filtered to the user's org (and to `activeGroup.id` if set) selecting `id, group_name, payment_processor_config, use_org_payment_account, organization_id, organizations(payment_processor_config)`. A group is considered **connected** when:
```
group.payment_processor_config.account_enabled === true
|| (group.use_org_payment_account === true
    && group.organizations.payment_processor_config.account_enabled === true)
```
Anything else → render an alert row for that group.

## UI
- Place new section directly above the Stats Cards grid (line ~370 in `Dashboard.tsx`), inside the existing `<div className="space-y-4 md:space-y-6">`, after the Pending Membership Requests alert.
- Reuse the same amber alert Card style used by the Pending Requests block for visual consistency.
- Each alert row contains:
  - `AlertCircle` icon (amber)
  - Title: "Connect payment account"
  - Body: `"{Group Name} isn't connected to Stripe yet. Connect your account to start accepting donations."`
  - Right-aligned button: **"Connect Account"** → opens `GroupPaymentSetupDialog` for that group (same component the Groups page uses).

## Files to change
- `src/pages/Dashboard.tsx`
  - Add `unconnectedGroups` state + `paymentDialogOpen` / `paymentDialogGroup` state.
  - Add fetch effect (runs when `organizationUser` / `activeGroup` change, and only for `canManageUsers`).
  - Render alert(s) above the Stats Cards grid.
  - Mount `<GroupPaymentSetupDialog>` at the bottom of the manager branch.
  - Refresh the list after the dialog closes (so a successful connect dismisses the alert).

## Out of scope
- Player/parent dashboard view.
- Changing the Groups page or `GroupPaymentSetupDialog` itself.
- Org-level (nonprofit) payment setup UI — only flagged via the same connected check; if org-level config is missing for a nonprofit, the same alert appears for the affected group(s).

