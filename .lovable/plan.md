

## Goal
Allow users to delete (soft-delete) unpublished campaigns from `/dashboard/campaigns`. Deleted campaigns are hidden from default views but recoverable.

## Investigation
<lov-tool-use id="t1" name="code--view" data="{\"file_path\":\"src/pages/Campaigns.tsx\",\"lines\":\"1-100\"}"/>
<lov-tool-use id="t2" name="supabase--read_query" data="{\"query\":\"SELECT column_name FROM information_schema.columns WHERE table_name='campaigns' AND column_name IN ('deleted_at','publication_status','status')\"}"/>

Findings:
- `campaigns` table needs a `deleted_at timestamptz` column (soft-delete marker). Confirmed not present.
- Only campaigns with `publication_status IN ('draft','pending_verification')` should be deletable. Published/ended campaigns require unpublishing first (preserves donation history integrity).
- Existing publish/unpublish UI lives in `CampaignQuickActions.tsx` and the campaigns list cards in `Campaigns.tsx`.

## Plan

### 1. Database (migration)
- Add `deleted_at timestamptz NULL` to `campaigns`.
- Add partial index on `deleted_at IS NULL` for query performance.
- Update RLS: existing org-admin/manager UPDATE policies already cover soft-delete via UPDATE. No new policies needed.

### 2. Filter deleted campaigns from default views
- In `src/pages/Campaigns.tsx` campaign fetch query: add `.is('deleted_at', null)` to default fetches.
- Add a new filter option **"Deleted"** in the filter dropdown that fetches campaigns where `deleted_at IS NOT NULL`.
- Apply same `.is('deleted_at', null)` filter to other places that list campaigns for the dashboard (CampaignsOverview, Dashboard widgets) — quick scan during implementation.

### 3. Delete action UI
- In `src/pages/Campaigns.tsx`, on each campaign card, add a destructive **Delete** menu item (in existing card actions/dropdown), only enabled when `publication_status` is `draft` or `pending_verification`.
- Use `AlertDialog` to confirm: "Delete this draft campaign? You can restore it from the Deleted filter."
- On confirm: `update({ deleted_at: new Date().toISOString() })` then refetch + toast.

### 4. Restore action
- In the **Deleted** filter view, replace the Delete action with a **Restore** button that sets `deleted_at = null` and refetches.

### 5. Out of scope
- Hard-delete / purge job (can be added later).
- Cascading deletes for related data (orders, items) — soft delete preserves them intentionally.
- Deleting published campaigns (must unpublish first).

### Files to change
- New migration: add `deleted_at` to `campaigns`.
- `src/pages/Campaigns.tsx` — fetch filter, Deleted filter option, Delete + Restore actions, confirmation dialog.

