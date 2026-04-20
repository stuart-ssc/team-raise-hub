

## Goal
Move the Campaign Leaderboard inside the dashboard shell as a sub-page of **My Fundraising**, and update the back link to return there instead of the public campaign page.

## Changes

### 1. Wrap `CampaignLeaderboard` in `DashboardPageLayout`
File: `src/pages/CampaignLeaderboard.tsx`

- Wrap the page content with `<DashboardPageLayout>` (same pattern used elsewhere in the dashboard).
- Pass breadcrumb segments:
  ```
  [
    { label: "My Fundraising", path: "/dashboard/my-fundraising" },
    { label: campaign?.name ?? "Campaign", path: `/dashboard/my-fundraising` },
    { label: "Leaderboard" }
  ]
  ```
- Pass `loading` prop so the breadcrumb skeleton renders during initial fetch.
- Drop the standalone `min-h-screen bg-background py-10` wrapper — the layout handles chrome. Keep the inner `max-w-4xl mx-auto space-y-6` container.

### 2. Update the back link
File: `src/pages/CampaignLeaderboard.tsx`

- Change the `← Back to {campaign.name}` link from `/c/${campaign.slug}` to `/dashboard/my-fundraising`.
- Update label to `← Back to My Fundraising` for clarity (campaign name is already in the breadcrumb).

### 3. Move the route under the protected dashboard tree
File: `src/App.tsx`

- Remove the public route `<Route path="/c/:slug/leaderboard" element={<CampaignLeaderboard />} />`.
- Add a new protected route mirroring the other `/dashboard/*` routes (wrapped in whatever `ProtectedRoute` / auth guard `/dashboard/my-fundraising` uses):
  ```
  <Route path="/dashboard/my-fundraising/leaderboard/:slug" element={<CampaignLeaderboard />} />
  ```
- Keeps the slug in the URL so deep links and the dashboard "View full leaderboard →" link still work; just under a different prefix.

### 4. Update the dashboard link
File: `src/components/PlayerDashboard.tsx`

- Change the `View full leaderboard →` `Link to` from `/c/${headline.slug}/leaderboard` to `/dashboard/my-fundraising/leaderboard/${headline.slug}`.

### 5. Footer CTA
File: `src/pages/CampaignLeaderboard.tsx`

- The "Share campaign" footer still shares the public `/c/${slug}` URL (correct — that's the donor-facing link). No change to share logic, only the page chrome and back nav move into the dashboard.

## Files touched
1. `src/pages/CampaignLeaderboard.tsx` — wrap in `DashboardPageLayout`, update back link.
2. `src/App.tsx` — swap public route for protected `/dashboard/my-fundraising/leaderboard/:slug`.
3. `src/components/PlayerDashboard.tsx` — update the in-card link target.

## Out of scope
- Auth gating logic changes, leaderboard data fetching, sorting, or row styling.
- Parent dashboard, hero, or other cards.

