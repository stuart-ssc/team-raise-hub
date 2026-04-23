## Goal
Remove the three-dot action menu button from donor cards on `/dashboard/donors`. The checkbox for multi-select remains, and all actions (Send Email, Add Tags, Add to List, Edit, Delete, etc.) are now accessed through the bulk action toolbar at the bottom when donors are selected.

## Changes

### `src/pages/Donors.tsx` — remove per-card action menu

**1. Remove the DropdownMenu from donor cards**
- Remove the entire `<DropdownMenu>` block (lines ~780-864) that contains the three-dot menu button and all its menu items (Send Email, Add Tags, Add to List, Link to Business, Edit Details, Delete).
- Keep the engagement badge (`<Badge>`) that shows High/Medium/Low engagement score.
- The checkbox remains in the top-left for multi-select.

**2. Clean up unused imports**
- Remove imports that are only used by the deleted dropdown menu: `MoreHorizontal`, `Mail`, `Tag`, `List`, `Building2`, `Pencil`, `Trash2` from lucide-react (keep ones still used elsewhere).
- Remove `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` imports.

**3. Keep bulk action toolbar functionality**
- The floating bottom toolbar with Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV · Clear remains unchanged.
- All actions previously in the per-card menu are now available via bulk selection.

## Out of scope
- No changes to the bulk action toolbar itself.
- No changes to participant view (`isParticipantView`).
- No changes to the checkbox or selection behavior.

## Verification
- Visit `/dashboard/donors`. Each donor card shows only: checkbox (top-left), donor name/email, engagement badge (top-right), and donation stats.
- The three-dot menu button is completely gone from all cards.
- Selecting one or more donors via checkboxes still reveals the floating bottom toolbar with all bulk actions.
- All bulk actions (Add Tags, Add to List, Send Email, etc.) work correctly on selected donors.
- Participant view (`isParticipantView`) still shows no checkboxes as expected.
