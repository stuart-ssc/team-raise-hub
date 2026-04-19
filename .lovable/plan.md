

## Goal

Replace the horizontal-tab layout on the Campaign Editor with the 3-column layout from the mockup. Keep all section components and functionality intact.

## New layout (main content area)

```text
┌───────────────────────────────────────────────────────────┐
│ Banner Fly 2026 Campaign    [🗑] [Unpublish] [Save]       │
│ • LIVE  Manage your campaign settings, orders, and assets │
├──────────────┬────────────────────────┬───────────────────┤
│ SETUP        │                        │ AT A GLANCE       │
│  Details     │  <Active section       │  $142,500         │
│  Schedule    │   content rendered     │  raised of $1M    │
│  Items   [4] │   here>                │  47 / 8 / 23      │
│  Experience  │                        │                   │
│  Team        │                        │ RECENT ORDERS     │
│  Fields  [0] │                        │  [list of 3]      │
│  Pitch       │                        │                   │
│              │                        │ SHARE             │
│ MANAGE       │                        │  url + copy       │
│  Orders [47] │                        │  [Preview][Share] │
│  Assets  [8] │                        │                   │
└──────────────┴────────────────────────┴───────────────────┘
```

`lg+`: `grid-cols-12` → left `col-span-3`, middle `col-span-6`, right `col-span-3`. `<lg`: stacks vertically (nav becomes horizontal pills, sidebar drops below content).

## Implementation

### 1. `src/pages/CampaignEditor.tsx`

- Replace `<Tabs>` with controlled section state (`useState<SectionKey>("details")`).
- Keep header (title, status badge, action buttons) unchanged.
- Remove the wide `CampaignStatsCard` from the main flow — moves to right rail.
- New 3-column grid renders: left `<CampaignSectionNav>`, middle = active section component (existing `BasicDetailsSection`, `ScheduleSection`, `TeamSettingsSection`, `DonorExperienceSection`, `CustomFieldsSection`, `CampaignPitchSection`, `CampaignItemsSection`, `CampaignOrdersSection`), right = sidebar stack.
- Bottom Save button shown only on editable campaign-level sections (Details, Schedule, Team, Experience, Fields). Hidden on Items / Orders / Assets / Pitch (they have their own save flows).

### 2. New components in `src/components/campaign-editor/`

- **`CampaignSectionNav.tsx`** — vertical nav, two groups (SETUP, MANAGE), icon + label + count badge. Active = light blue bg / blue text per mockup.
- **`CampaignAtAGlanceCard.tsx`** — big raised amount, goal subtitle, 3-stat row (orders / pending uploads / days left). Reuses the data hook from existing `CampaignStatsCard`.
- **`CampaignRecentOrdersCard.tsx`** — top 3 recent orders with avatar initials, business + item, amount, status dot. "View all" switches active section to "Orders".
- **`CampaignShareCard.tsx`** — truncated URL + copy button, Preview + Share buttons (uses existing slug → `/c/{slug}`).

### 3. Counts wiring

Fetch counts (items, customFields.length, orders, pending uploads) at editor level; pass to nav.

### 4. Responsive

- `lg+` (≥1024px): 3-column.
- `md` (768–1023px): left nav (col-span-4) + content (col-span-8), sidebar drops below.
- `<md`: single column, nav becomes horizontal scrollable pill row.

### 5. Out of scope

Section component internals, header/breadcrumb, dashboard sidebar, AI Builder.

## Two clarifications before building

**Q1 — Assets section:** The mockup shows a separate "Assets" nav item under MANAGE (count 8). Today asset uploads are tracked inside `CampaignOrdersSection`. Options:
- (a) Filtered view of Orders showing only orders with pending asset uploads — fastest, reuses existing UI.
- (b) Build a separate dedicated Assets view (uploaded vs pending per required-asset slot) — more work but clearer.
- (c) Skip for now, hide the Assets nav item.

**Q2 — Orders behavior:** When clicking "Orders" in the nav (or "View all" in Recent Orders), should the editor:
- (a) Switch the active section in-page (stay on the editor route).
- (b) Navigate to a dedicated `/orders` route for this campaign.

Default plan if you don't specify: **Q1 = (a)** filtered Orders view, **Q2 = (a)** in-page section switch.

