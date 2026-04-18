

## Goal
Fix Dashboard stats and campaign list to match real lifecycle states.

## Changes — `src/pages/Dashboard.tsx`

### 1. Campaign query — fetch published + recently expired
Replace the `.eq("status", true)` filter with `.eq("publication_status", "published")`. Then in JS, keep campaigns where:
- `end_date` is null/future (Active), OR
- `end_date` is within the last **30 days** (Recently Expired)

Sort: Active first (by `end_date` ascending), then Recently Expired (by `end_date` descending — most recently ended first).

### 2. "Active Campaigns" stat (line 211)
Count only the **Active** subset (published + in date range), not the combined list. Recently expired don't count as active.

### 3. "Left to Raise" stat (lines 213-214)
Sum `goal_amount` and `amount_raised` only from **published** campaigns (the new query already returns only published, so this is automatic once the query change is in). Recently-expired published campaigns still count toward Left to Raise — they're real goals. (If you'd rather exclude expired from Left to Raise too, say so.)

### 4. Visual indicator for Active vs Expired
Add a small status badge per row/card:
- **Active** → green badge (`bg-green-500/10 text-green-700 border-green-500/20`)
- **Expired** → muted/secondary badge

Desktop: new "Status" column between Campaign and Group.
Mobile: badge inline next to campaign name.

Helper:
```ts
const getCampaignState = (c) => {
  if (!c.end_date) return 'active';
  const today = new Date(new Date().toDateString());
  return new Date(c.end_date) < today ? 'expired' : 'active';
};
```

### 5. Empty state copy (line 394)
Update to: "No active or recently expired campaigns" — keeps it honest given the wider filter.

## Out of scope
- Changing what the Campaigns page (`/dashboard/campaigns`) shows
- Donor stats, pending requests, player dashboard
- Removing the legacy `status` boolean

