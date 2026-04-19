

## Goal
Make Campaign Editor responsive on tablet/phone:
1. Left sub-nav (Setup/Manage section list) collapses into a dropdown/menu trigger below desktop.
2. Right rail (At a Glance / Share / Recent Orders) hidden below desktop (`lg`).

## Current layout (CampaignEditor.tsx)
3-column grid: `lg:grid-cols-[220px_minmax(0,1fr)_320px]`. All three columns currently render at every breakpoint, just stacking vertically below `lg`.

## Changes — `src/pages/CampaignEditor.tsx`

### 1. Right rail
Wrap the right column (`<aside>` containing AtAGlance / Share / RecentOrders) in `hidden lg:block` so it only appears at desktop (≥1024px).

### 2. Left sub-nav
- Desktop (`lg`+): keep current sticky `<CampaignSectionNav />` in left column (`hidden lg:block`).
- Below `lg`: render a compact collapsible trigger above the main content:
  - A `Button` (outline, full width) showing current section icon + label + chevron.
  - Clicking opens a `Sheet` (side="left") containing the same `<CampaignSectionNav />`.
  - Selecting a section closes the sheet and updates `activeSection`.

This mirrors the existing `DashboardSidebarSheet` pattern used elsewhere in the app.

### 3. Grid
Change grid so middle column takes full width below `lg`:
- `grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_320px]`

## Implementation outline
```tsx
// state
const [navSheetOpen, setNavSheetOpen] = useState(false);

// Left column
<aside className="hidden lg:block">
  <CampaignSectionNav active={activeSection} onChange={setActiveSection} ... />
</aside>

// Mobile/tablet trigger (above main content, inside middle column)
<div className="lg:hidden mb-4">
  <Button variant="outline" className="w-full justify-between" onClick={() => setNavSheetOpen(true)}>
    <span className="flex items-center gap-2">
      <ActiveIcon className="h-4 w-4" />
      {activeLabel}
    </span>
    <ChevronDown className="h-4 w-4" />
  </Button>
</div>

<Sheet open={navSheetOpen} onOpenChange={setNavSheetOpen}>
  <SheetContent side="left" className="w-72 p-4">
    <CampaignSectionNav
      active={activeSection}
      onChange={(s) => { setActiveSection(s); setNavSheetOpen(false); }}
      ...
    />
  </SheetContent>
</Sheet>

// Right rail
<aside className="hidden lg:block space-y-4">
  <CampaignAtAGlanceCard ... />
  <CampaignShareCard ... />
  {isPublished && <CampaignRecentOrdersCard ... />}
</aside>
```

A small helper derives `activeLabel` + `ActiveIcon` from `activeSection` (reuse the same mapping logic that's in `CampaignSectionNav`, or export a lookup from that file).

## Files touched
- `src/pages/CampaignEditor.tsx` (grid classes, add Sheet + trigger, hide right rail below lg)
- `src/components/campaign-editor/CampaignSectionNav.tsx` (export a small `SECTION_META` map so the trigger can show current label/icon without duplicating it)

## Out of scope
- Header buttons, At a Glance content, Share card, Recent Orders card — unchanged.
- Desktop layout — unchanged at `lg`+.

