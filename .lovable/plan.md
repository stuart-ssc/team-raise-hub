

## Goal
Make donor lists a first-class tool for participants and admins on the Donors area:
1. Add a **"Lists"** button next to **Upload donors** that jumps straight to the Lists tab.
2. Add **"Add to List"** to the per-card dropdown menu (single donor, same dialog as bulk).
3. Add a **List filter** to the Donors page filter bar.
4. On the **donor detail page**, add an **"Add to List" action** and a **"List Memberships"** card in the right sidebar, directly under Business Affiliations.

CSV import → list assignment is already implemented end-to-end (no work needed there).

## Changes

### 1. `src/pages/Donors.tsx` — Lists button + per-card action + list filter

**Header buttons (next to Upload donors)**
Add a secondary outline button:
```tsx
<Button variant="outline" onClick={() => navigate("/dashboard/donors/segmentation?tab=lists")}>
  <List className="mr-2 h-4 w-4" />
  Lists
</Button>
```
Visible to everyone who can see the page (participants included), so a player/parent can manage outreach lists.

**Per-card "Add to List" menu item**
Add to the existing card dropdown (between "Add Tags" and "Link to Business"):
```tsx
<DropdownMenuItem onClick={() => { setMenuDonor(donor); setShowSingleAddToListDialog(true); }}>
  <List className="mr-2 h-4 w-4" /> Add to List
</DropdownMenuItem>
```
Render `<AddToListDialog open={showSingleAddToListDialog} selectedDonorIds={[menuDonor.id]} ... />` (reuses the existing component).

Show the menu (today gated by `canManageDonors()`) for participants too — restricted to *their* connected donors, which is already enforced by the page's email filter. Permission-sensitive items (Delete, Link to Business) stay gated; only Email, Add Tags, Add to List, Edit Details become available to participants. Bulk toolbar's "Add to List" already exists — leave as is.

**New "List" filter in the filter bar**
Add a fourth Select next to engagement / sort:
```tsx
<Select value={filterList} onValueChange={setFilterList}>
  <SelectTrigger><Filter className="mr-2 h-4 w-4"/> <SelectValue placeholder="All lists"/></SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All lists</SelectItem>
    <SelectItem value="none">Not on any list</SelectItem>
    {lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
  </SelectContent>
</Select>
```
Make the grid `md:grid-cols-5` (search col-span-2). Fetch `donor_lists` for the org once on mount, plus a `donor_list_members(list_id, donor_id)` lookup map; apply the filter inside `filterAndSortDonors`. Refresh both on any list mutation (use the existing realtime channel pattern, scoped to `donor_list_members`).

### 2. `src/pages/DonorSegmentation.tsx` — Honor `?tab=lists`
Read `useSearchParams()`; if `tab=lists`, set the active Tabs value to `lists` on mount. (Tabs already exist; just preselect.)

### 3. `src/pages/DonorProfile.tsx` — List Memberships card + add action

**New right-sidebar card placed directly under Business Affiliations and above AI Insights:**
```text
Right sidebar order:
  Contact Information
  Business Affiliations
  List Memberships          ← new
  AI Insights
  Notes
```

Card behavior:
- Fetch `donor_list_members` joined to `donor_lists (id, name)` for this `donor_id` (filter to org via the joined list's `organization_id`).
- Render each list as a chip/row with the list name, member-since date, and an "X" to remove (calls `delete from donor_list_members where id = ...`). Removal allowed for: the user who added it, list creator, or org admin/program manager.
- Header action button (`+` icon, same style as Business Affiliations' Plus button) opens the existing `<AddToListDialog selectedDonorIds={[donor.id]} />` and refetches on complete.
- Empty state: "Not on any lists yet" with the same `+` to add.
- Visible to participants too (so a parent/player can curate their own outreach lists for their supporters).

### 4. `src/components/AddToListDialog.tsx` — small UX add
Add a "+ Create new list" row at the top of the list, which inline-expands a name/description input and a Create button (insert into `donor_lists` then immediately add the donors). This makes the card-level and profile-level "Add to List" self-sufficient without sending the user to Segmentation. Reuse the existing fetch/add code paths.

## Database / RLS
No schema changes. Existing tables: `donor_lists`, `donor_list_members` (already used by the import wizard, AddToListDialog, and DonorListDetail). Existing RLS policies already allow org users (including participants whose `organization_user` row covers the org) to create lists, add members, and read them. If a participant hits a policy denial when creating a list from the new inline form, we'll add an explicit `FOR INSERT … WITH CHECK (created_by = auth.uid() AND organization_id = <user's org>)` policy in a follow-up — flagged but not expected based on current policies.

## Verification
- As a player: open Donors → see "Lists" button next to Upload donors → click → land on Segmentation Lists tab.
- Open the dropdown on a supporter card → "Add to List" appears → dialog lets them pick or create a list → toast confirms; reopening shows the new membership.
- Filter bar has "All lists / Not on any list / <each list>"; switching filters narrows the grid; combines with engagement filter and search.
- Upload donors flow already prompts for list assignment in step 3 (existing).
- Open a donor profile → right sidebar shows: Contact, Business Affiliations, **List Memberships** (with `+`, lists, removable), AI Insights, Notes.
- Removing from a list updates immediately on profile *and* on the Donors list filter.
- As an org admin: same UI, plus they retain Delete in the card dropdown.

## Files touched
- `src/pages/Donors.tsx` (header button, card dropdown, list filter, list fetch)
- `src/pages/DonorSegmentation.tsx` (read `?tab=lists`)
- `src/pages/DonorProfile.tsx` (List Memberships card + position under Business Affiliations)
- `src/components/AddToListDialog.tsx` (inline "+ Create new list" UX)

