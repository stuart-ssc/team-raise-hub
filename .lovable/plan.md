

## Confirmed — payment setup access is untouched

This change only touches navigation structure and the Settings page layout. All Stripe/payment setup behavior stays exactly as-is:

- **Program managers** (Coach, Club Sponsor, Booster Leader) keep full access to **group-level Stripe setup** via the Groups page → "Payment Setup" button per group (visible in your current screenshot). The `GroupPaymentSetupDialog` flow is unchanged.
- **Org admins** keep access to **organization-level payment setup** via `/dashboard/settings` → Payments tab (nonprofits only, per existing `payment-setup-ui-visibility-by-org-type` rule).
- The `payment_processor_config` lookup logic in `paymentProcessor.ts` (group vs. org account resolution) is not touched.

## What changes vs. what stays

| Area | Change? |
|---|---|
| Sidebar nav structure (6 items + pinned Help) | ✅ Changes |
| Settings page gains Users + Groups jump cards on top | ✅ Changes |
| Org-level Payments tab (admin only, nonprofits) | ❌ Untouched |
| Group-level Stripe setup button on Groups page | ❌ Untouched |
| `GroupPaymentSetupDialog` and Stripe Connect flows | ❌ Untouched |
| Permission/visibility rules for payment setup | ❌ Untouched |

## Plan (unchanged from prior approval)

### 1. `OrganizationSettings.tsx` — hub
- Add top "Manage" section with **Users** and **Groups** cards (both visible to `organization_admin` and `program_manager`).
- Users card shows pending-requests badge when count > 0.
- Existing Info / Branding / Payments tabs render below, gated to `organization_admin` only (current behavior preserved — this is where org-level Stripe setup lives for nonprofits).

### 2. `DashboardSidebar.tsx` + `DashboardSidebarSheet.tsx`
- Final order: Home, Campaigns, Donors, Businesses, Reports, Settings.
- Remove standalone Users + Groups items.
- Settings visible to `organization_admin` AND `program_manager`.
- Move pending-requests badge from Users → Settings.
- Wrap nav in `flex flex-col h-full`; main items on top, Help & Support (and Donor Portal divider when applicable) in bottom group with `mt-auto` to pin.

### 3. No route, RLS, or payment-flow changes
`/dashboard/users`, `/dashboard/groups`, `/dashboard/settings` already exist with correct scoping. Group-level Stripe setup remains on the Groups page where program managers use it today.

## Files to change
- `src/components/DashboardSidebar.tsx`
- `src/components/DashboardSidebarSheet.tsx`
- `src/pages/OrganizationSettings.tsx`

## Out of scope
- Any payment provider, Stripe Connect, or `payment_processor_config` logic
- Moving payment setup UI between org and group levels
- Changing scoping on Users/Groups pages

