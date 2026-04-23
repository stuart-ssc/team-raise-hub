

## Goal
Rename the dashboard "Campaigns" surface to "Fundraisers" everywhere a user sees it — visible labels, page headings, breadcrumbs — and migrate the URL path from `/dashboard/campaigns/*` to `/dashboard/fundraisers/*`. Scope is limited to the fundraising dashboard area; "outreach campaigns" in the donor/business CRM are untouched.

## Scope

In scope (rename):
- All `/dashboard/campaigns*` route paths and every `navigate(...)` / `<Link>` pointing at them.
- Sidebar item label "Campaigns" → "Fundraisers" (desktop sidebar + mobile sheet).
- Page titles, breadcrumb labels, headings, button labels, empty-state copy, and dropdown labels on the Campaigns / CampaignEditor / AICampaignBuilder / CampaignOrderDetail pages and the dashboard "Campaigns" card.
- Edge function user-facing links/routes that point users back into the dashboard (`send-verification-email`, `send-donation-notification`).
- The `MyOrders` "Browse Campaigns" CTA → "Browse Fundraisers" pointing to the new path.

Out of scope (do NOT change):
- Database table names (`campaigns`, `campaign_*`), column names, RLS policies, edge function names.
- TypeScript types, variables, component names, file names (`Campaigns.tsx`, `CampaignEditor.tsx`, etc.) — internal-only.
- Donor/Business "outreach campaigns" UI (segmented email campaigns), `/c/{slug}` public campaign URLs (already a different word users encounter), marketing site footer ("Campaigns" link group on `MarketingFooter`), and stat tiles on public landing pages that just say "Campaigns" as a metric label (`Nonprofits.tsx`, `PublicLandingPage.tsx`, `FamilyDashboard.tsx`, `OrganizationSettings.tsx`).
  - These last items can be revisited later; flagging here so the user knows they were intentionally skipped.

## Changes

### 1. Routes (`src/App.tsx`)
Replace the five campaign routes with `/dashboard/fundraisers/...` equivalents:
- `/dashboard/fundraisers`
- `/dashboard/fundraisers/ai-builder`
- `/dashboard/fundraisers/new`
- `/dashboard/fundraisers/:id/edit`
- `/dashboard/fundraisers/:campaignId/orders/:orderId`

Add five **redirect routes** for the old paths (using `<Navigate to="..." replace />`) so existing bookmarks, emails, and external links continue to work:
- `/dashboard/campaigns` → `/dashboard/fundraisers`
- `/dashboard/campaigns/ai-builder` → `/dashboard/fundraisers/ai-builder`
- `/dashboard/campaigns/new` → `/dashboard/fundraisers/new`
- `/dashboard/campaigns/:id/edit` → `/dashboard/fundraisers/:id/edit`
- `/dashboard/campaigns/:campaignId/orders/:orderId` → `/dashboard/fundraisers/:campaignId/orders/:orderId`

### 2. Navigation (`DashboardSidebar.tsx`, `DashboardSidebarSheet.tsx`)
- Sidebar item: `title: "Campaigns"` → `"Fundraisers"`, `url: "/dashboard/campaigns"` → `"/dashboard/fundraisers"`.
- Update the `isActive` matcher in `DashboardSidebar.tsx` to recognize `/dashboard/fundraisers`.

### 3. In-app navigation calls (visible URL change only)
Update every `navigate(...)`, `<Link to=...>`, and breadcrumb `path` from `/dashboard/campaigns...` to `/dashboard/fundraisers...` in:
- `src/pages/Dashboard.tsx`
- `src/pages/Campaigns.tsx`
- `src/pages/CampaignEditor.tsx`
- `src/pages/AICampaignBuilder.tsx`
- `src/pages/CampaignOrderDetail.tsx`
- `src/pages/MyOrders.tsx`
- `src/components/campaign-editor/CampaignAssetsSection.tsx`
- `src/components/campaign-editor/CampaignOrdersSection.tsx`

### 4. User-visible copy in the fundraiser surface
- `Campaigns.tsx`: page heading "Campaigns" → "Fundraisers"; subtitle "Manage fundraising campaigns for your groups." → "Manage fundraisers for your groups."; empty-state "No campaigns found." → "No fundraisers found."; dropdown labels "Create manually" / "Create with AI" stay; breadcrumb segment "Campaigns" → "Fundraisers".
- `CampaignEditor.tsx`, `AICampaignBuilder.tsx`, `CampaignOrderDetail.tsx`: breadcrumb segment "Campaigns" → "Fundraisers"; "New Campaign" / "Edit Campaign" → "New Fundraiser" / "Edit Fundraiser".
- `Dashboard.tsx`: card title `<CardTitle>Campaigns</CardTitle>` → "Fundraisers"; "Manage All Campaigns" → "Manage All Fundraisers"; "Add Campaign" → "Add Fundraiser"; "Let's get started - Create a Campaign Now" → "Let's get started - Create a Fundraiser Now"; "Start fundraising by creating your first campaign" → "Start fundraising by creating your first fundraiser"; "Create Campaign" button → "Create Fundraiser".
- `MyOrders.tsx`: "Browse Campaigns" CTA → "Browse Fundraisers".

### 5. Edge functions (visible link only — no DB or function-name changes)
- `supabase/functions/send-verification-email/index.ts`: link `https://sponsorly.io/dashboard/campaigns` → `https://sponsorly.io/dashboard/fundraisers`.
- `supabase/functions/send-donation-notification/index.ts`: `route: '/dashboard/campaigns'` → `'/dashboard/fundraisers'`.

## Technical notes
- Internal symbols (`Campaigns` page component, `CampaignEditor`, `Campaign` interface, `campaigns` state, `campaign_id`, etc.) intentionally stay. The `campaigns` Supabase table and all related backend names are unchanged. This keeps the diff focused on user-facing surface area and avoids cascading changes into RLS, edge functions, types, and migrations.
- The sidebar `isActive` matcher and `DashboardSidebar.tsx`'s special-cased prefix checks (currently for `/dashboard/donors`, `/dashboard/businesses`, `/dashboard/settings`) need a sibling entry for `/dashboard/fundraisers` so the nav highlight works on edit/order detail subpaths.
- Redirect routes use React Router `<Navigate>` and preserve dynamic params via the route pattern (params re-resolve in the target route).

## Verification
- Sidebar shows "Fundraisers" (desktop + mobile); clicking it lands on `/dashboard/fundraisers` with the highlight active. Subpages (`/edit`, `/ai-builder`, order detail) keep the nav item highlighted.
- Visiting any old `/dashboard/campaigns/...` URL silently redirects to the matching `/dashboard/fundraisers/...` URL.
- Page heading, breadcrumbs, and buttons on the list, editor, AI builder, and order-detail pages all read "Fundraiser(s)".
- Dashboard home card reads "Fundraisers" with "Manage All Fundraisers" / "Add Fundraiser" actions.
- Verification email and donation notification deep links open `/dashboard/fundraisers`.
- Donor and Business outreach-campaign UI is unchanged. `/c/{slug}` public URLs still work. Marketing footer/landing-page stat labels still say "Campaigns" (intentional, out of scope).

