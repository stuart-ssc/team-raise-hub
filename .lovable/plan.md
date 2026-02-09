

# Fix Stripe Status Visibility and Campaign Publish Dialog

## Issues Identified

### Issue 1: Stripe payment status not showing for other booster leaders

**Root cause:** The Groups page does NOT fetch or display the payment status inline. The `fetchGroups` query only selects basic group fields (`id, group_name, status, group_type_id, organizations, group_type`) -- it never queries `payment_processor_config` from the groups table. The `stripe_account_id` and `stripe_account_enabled` fields in the Group interface are defined but never populated.

The only way to see the Stripe status is by clicking "Payment Setup" which opens the `GroupPaymentSetupDialog`. That dialog calls `get-stripe-account-status`, which DOES work for all booster leaders (the RLS policy allows `program_manager` permission level). So the status should show correctly when they open the dialog -- but the group list itself never shows whether payment is already set up or not.

**Fix:** Update `fetchGroups` to include `payment_processor_config` in the query, then display a visual indicator (green checkmark vs warning icon) on the Payment Setup button/column so all users can see at a glance whether Stripe is configured.

---

### Issue 2: Campaign publish button does nothing (no dialog, no error)

**Root cause:** In `CampaignPublicationControl.tsx`, the dialog state is initialized with `triggerOpen`:

```typescript
const [showDialog, setShowDialog] = useState(triggerOpen);
```

But `useState` only uses the initial value. When `CampaignQuickActions` later sets `publishDialogOpen = true`, the `CampaignPublicationControl` component never reacts to the prop change because there is no `useEffect` synchronizing `triggerOpen` to `showDialog`.

Result: clicking "Publish" in the campaign editor does absolutely nothing -- no dialog opens, no requirements are shown, no error messages appear.

**Fix:** Add a `useEffect` in `CampaignPublicationControl` that syncs `triggerOpen` prop changes to the internal `showDialog` state.

---

## Implementation Plan

### File 1: `src/components/CampaignPublicationControl.tsx`

Add a `useEffect` after line 46 to sync the `triggerOpen` prop:

```typescript
useEffect(() => {
  if (triggerOpen) {
    setShowDialog(true);
  }
}, [triggerOpen]);
```

This ensures that when `CampaignQuickActions` sets `triggerOpen={true}`, the dialog actually opens.

---

### File 2: `src/pages/Groups.tsx`

**Step A:** Update the `fetchGroups` query to include `payment_processor_config`:

```sql
id,
group_name,
status,
group_type_id,
payment_processor_config,
organizations!organization_id(name, organization_type),
group_type(name)
```

**Step B:** Populate `stripe_account_enabled` from the fetched config:

```typescript
stripe_account_enabled: group.payment_processor_config?.account_enabled === true
```

**Step C:** Update the Payment Setup button in both mobile and desktop views to show the current status:

- If `stripe_account_enabled === true`: Show a green checkmark icon with "Connected" text
- If not configured: Show the current "Setup" button with a warning indicator

This gives all group members immediate visibility into whether Stripe is connected, without needing to open the dialog.

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `CampaignPublicationControl.tsx` | Add `useEffect` to sync `triggerOpen` prop | Fixes publish dialog not opening |
| `Groups.tsx` | Fetch and display `payment_processor_config` | Shows Stripe status to all group members |

