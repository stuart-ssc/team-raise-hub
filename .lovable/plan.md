

## Goal
Single-row toolbar (Search + Filter + Add Campaign) on desktop. Drop the redundant Sort dropdown since column headers already sort.

## Changes — `src/pages/Campaigns.tsx`

### 1. Toolbar layout (replace current two-row block ~lines 360-423)
One flex row on `sm+`, stacked on mobile:
```
[ 🔍 Search (flex-1) ] [ Filter ▾ ] [ + Add Campaign ▾ ]
```
- `flex flex-col sm:flex-row gap-3 items-stretch sm:items-center`
- Search: `flex-1` (fills remaining width)
- Filter: fixed `sm:w-48`
- Add Campaign button: stays on right

### 2. Drop Sort dropdown
Remove the entire `<Select>` for `sortBy` (lines 374-386). Desktop column headers already handle sorting (verified lines 558-608).

### 3. Mobile sort fallback
On mobile (card view) there are no clickable headers, so without the dropdown users lose sort control. Add a small inline sort control **above the cards, mobile-only**: a compact `<Select>` showing "Sort: Name ▾" — same options as the removed dropdown, plus an asc/desc toggle button next to it. Wrapped in `md:hidden`.

### Final desktop view
```
Campaigns
Manage fundraising campaigns for your groups.

[ 🔍 Search campaigns...                    ] [ Drafts ▾ ] [ + Add Campaign ▾ ]
```

### Final mobile view
```
Campaigns
[ 🔍 Search... ]
[ Drafts ▾ ]  [ + Add ▾ ]
[ Sort: Name ▾ ] [ ↑ ]
<cards>
```

## Out of scope
- Changing filter options or sort logic
- Touching the desktop sortable headers (already working)

