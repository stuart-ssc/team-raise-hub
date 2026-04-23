
## Goal
Remove the three-dot action menu button from each donor card on `/dashboard/donors`. The selection checkbox stays. All actions (Send Email, Add Tags, Add to List, Edit, Delete, etc.) remain accessible through the floating bulk action toolbar at the bottom once one or more donors are selected.

## Changes

### `src/pages/Donors.tsx`

**1. Remove the per-card DropdownMenu**
- Delete the entire `<DropdownMenu>…</DropdownMenu>` block in the donor card (the three-dot `MoreHorizontal` trigger and its menu items: Send Email, Add Tags, Add to List, Link to Business, Edit Details, Delete).
- Keep the engagement `<Badge>` (High/Medium/Low) in the top-right of each card.
- Keep the selection `<Checkbox>` in the top-left of each card.

**2. Clean up imports**
- Remove `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` from `@/components/ui/dropdown-menu`.
- Remove `MoreHorizontal`, `Mail`, `Tag`, `List`, `Building2`, `Pencil`, `Trash2` from `lucide-react` — only the ones no longer referenced anywhere else in the file.

**3. Untouched**
- Floating `BulkActionToolbar` (Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV · Clear) stays exactly as-is.
- Card body click behavior (navigate when nothing selected, toggle selection when in select mode) stays.
- Header "Select all on this page" checkbox stays.
- Participant view (`isParticipantView`) — already shows no menu, no change.

## Out of scope
- No changes to the bulk action toolbar.
- No changes to selection logic, navigation, or participant view.
- No changes to per-donor edit/delete flows — those become bulk-only or move to the donor detail page (already exists).

## Verification
- Each donor card on `/dashboard/donors` shows only: checkbox (top-left), name/email/avatar, engagement badge (top-right), and donation stats. No three-dot button anywhere.
- Selecting one or more donors via checkbox still reveals the floating bottom toolbar with all bulk actions.
- Clicking a card with no selection still navigates to the donor detail page; clicking with an active selection still toggles selection.
- Participant view is unchanged.
