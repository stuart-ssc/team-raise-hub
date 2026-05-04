## Problem

`https://sponsorly.io/c/kbc-huge-bourbon-raffle-26?preview=...` returns 404.

The slug and `preview_token` both match a real campaign in the database. The 404 comes from the `get-campaign-preview` edge function returning "Preview link is invalid".

Root cause: the campaign belongs to a **nonprofit organization** group (`group_name: "General Club"`, `organization_id` set, `school_id: null`). The edge function's query uses:

```ts
groups!inner(
  ...
  schools!inner(id, school_name, city, state, "Primary Color")
)
```

Because `schools!inner` is an inner join on a nullable FK, any group without a school is filtered out, and `.maybeSingle()` returns `null` → 404.

The same pattern exists in `src/pages/CampaignLanding.tsx` (`fetchCampaignData`, line ~252) for the published path, so nonprofit campaigns likely have or will have the same issue when loading normally too — worth confirming.

## Fix

### 1. `supabase/functions/get-campaign-preview/index.ts`

Change the schools join from inner to optional so nonprofit groups (no school) are not filtered out:

```ts
groups!inner(
  id,
  organization_id,
  group_name,
  group_type(id, name),
  schools(id, school_name, city, state, "Primary Color")  // remove !inner
)
```

### 2. `src/pages/CampaignLanding.tsx`

Apply the same change in the non-preview `fetchCampaignData` query (around line 252) so nonprofit campaigns load on the public `/c/{slug}` route as well. Verify downstream code that reads `campaign.groups.schools` already handles a null school (nonprofit campaigns have no school header info to display).

### 3. Verify

- Re-test the preview URL — should now load with the amber preview banner.
- Re-test the published URL `/c/kbc-huge-bourbon-raffle-26` (no `?preview`) to confirm nonprofit campaigns also render correctly.
- Spot check a school-based campaign to confirm school metadata still renders.

No DB migration, no RLS changes.
