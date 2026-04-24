

## Goal
On `/dashboard/reports`, replace user-facing "Campaign" terminology with "Fundraiser", and make the Campaign Performance table sortable by column header with active fundraisers shown first by default.

## Changes — `src/pages/Reports.tsx`

### 1. Terminology: Campaign → Fundraiser (UI strings only)
Replace user-visible labels (do NOT rename TypeScript interfaces, variables, table names, or query fields):

- KPI card title `"Total Campaigns"` → `"Total Fundraisers"`
- Helper text `"X currently active"` stays
- `"avg per campaign"` → `"avg per fundraiser"`
- Top performing card title `"Top Performing Campaigns"` → `"Top Performing Fundraisers"`
- Top performing description `"Campaigns with the highest donations"` → `"Fundraisers with the highest donations"`
- Empty state `"No campaign data available yet"` → `"No fundraiser data available yet"`
- Table card title `"Campaign Performance"` → `"Fundraiser Performance"`
- Table empty state `"No campaigns have been created yet."` → `"No fundraisers have been created yet."`
- Table empty state `"Create your first campaign to start seeing reports!"` → `"Create your first fundraiser to start seeing reports!"`
- Desktop table header `Campaign` → `Fundraiser`
- Realtime toast wording stays as-is (not user-impacting), but `"Reports updated with new donation data"` is fine.
- CSV export: header rows `'CAMPAIGN REPORTS SUMMARY'` → `'FUNDRAISER REPORTS SUMMARY'`, `'Total Campaigns'` → `'Total Fundraisers'`, `'Active Campaigns'` → `'Active Fundraisers'`, `'CAMPAIGN DETAILS'` → `'FUNDRAISER DETAILS'`, header cell `'Campaign Name'` → `'Fundraiser Name'`, filename `campaign-reports-…csv` → `fundraiser-reports-…csv`.
- Mobile Card empty/fallback unchanged structurally.

Variable/type names (`CampaignReport`, `topCampaigns`, `campaign_id`, etc.) are **not** changed — they're internal.

### 2. Sortable Campaign Performance table

Add client-side sorting state in `Reports`:
```ts
type SortKey = "name" | "group_name" | "goal_amount" | "amount_raised" | "progress" | "donation_count" | "status" | "start_date";
const [sortKey, setSortKey] = useState<SortKey>("status");
const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
```

- Default: `sortKey="status"`, `sortDir="desc"` so active (status=true) fundraisers appear first. Within equal-status rows, fall back to `amount_raised` desc as a stable secondary sort.
- Compute `sortedCampaigns` via `useMemo` from `campaigns`, applying:
  - String compare for `name`, `group_name`
  - Numeric compare for `goal_amount`, `amount_raised`, `donation_count`
  - `progress` = `calculateProgress(amount_raised, goal_amount)` numeric
  - `status` boolean compare (true before false when desc)
  - `start_date` parsed date compare; nulls last
- Render `sortedCampaigns` instead of `campaigns` in both desktop table body and mobile card list.

Make each desktop `TableHead` a clickable button:
- Wrap header label in a `<button>` with `onClick={() => toggleSort(key)}` where `toggleSort` flips dir if same key, else sets the new key with a sensible default dir (`desc` for numeric/status/date, `asc` for text).
- Show a small chevron indicator (`ChevronUp` / `ChevronDown` from lucide-react) next to the active column header; show a faint `ChevronsUpDown` for inactive sortable columns.
- Apply alignment: numeric columns keep `text-right` and the button uses `justify-end`; text columns left-align.
- Add `cursor-pointer select-none` styling and a hover muted background.

Sortable columns: Fundraiser, Group, Goal, Raised, Progress, Donations, Status, Dates.

Mobile card view (`isMobile` branch): unchanged layout, but iterates over `sortedCampaigns` so default ordering still surfaces active fundraisers first. No sort UI added on mobile.

### 3. No data-fetch or query changes
Sorting is purely client-side over the already-fetched `campaigns` array. Realtime subscriptions, RLS, and group/date filters remain identical.

## Verification
- Reports page shows "Fundraiser" everywhere users read it (KPIs, card titles, table title, table header, empty states, CSV export).
- Default load of the Fundraiser Performance table lists Active rows first, then Inactive, with each group internally ordered by Raised descending.
- Clicking each column header toggles asc/desc and shows a chevron indicator on the active column; clicking another column switches sort key.
- Mobile card view also reflects the same default ordering.
- CSV export filename and headings reflect the new terminology.
- No regressions to charts, top performers card, recent donations card, realtime updates, or group/date filters.

