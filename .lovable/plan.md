

## Issue 1 — Upload button missing for participants
The "Upload donors" button exists only inside the `!isParticipantView` admin-actions block (lines 374–437 of `src/pages/Donors.tsx`). Taylor (Team Player → `participant`) sees the page header but no action buttons at all. The page also doesn't read `?upload=1` from the URL, so the link from My Fundraising lands on the page without auto-opening the wizard.

## Issue 2 — Are the 2 donors really Taylor's?
Yes. Database confirms both donors on the page are owned by Taylor's `organization_user.id`:

| Donor | Email | added_by_organization_user_id |
|---|---|---|
| Donor Five | donor@sparky.co | 47ddbeb5… (Taylor) |
| Donor Six | six@donor.com | 47ddbeb5… (Taylor) |

These were uploaded via the import wizard (likely from another session/role) and correctly attributed. No bug here — the visibility filter is doing its job. The "Added by you" badge logic in the donor list will already mark both rows.

## Fix — `src/pages/Donors.tsx`

1. **Add a primary "Upload donors" button to the header** (visible to everyone, including participants), styled like the My Fundraising button (`bg-foreground text-background hover:bg-foreground/90`). Place it on the right side of the header row that currently holds the title.
2. **Restructure header layout** so title and the new button sit side-by-side (`flex items-start justify-between`), with the button stacking on mobile.
3. **Remove the now-duplicate admin "Import CSV"** entries from the desktop button row and mobile dropdown (Segments / Nurture / Templates remain).
4. **Auto-open wizard via `?upload=1`**: add `useSearchParams` from `react-router-dom`. On mount, if `upload === "1"`, call `setImportWizardOpen(true)` and `setSearchParams({})` to clean the URL so refresh doesn't retrigger.

## Verification
- As Taylor (participant) on `/dashboard/donors`: a black "Upload donors" button appears top-right. Clicking it opens the import wizard.
- Visiting `/dashboard/donors?upload=1` (the link from My Fundraising) auto-opens the wizard and the URL cleans to `/dashboard/donors`.
- As an admin: the same "Upload donors" button is the primary CTA; the duplicate "Import CSV" is gone from quick actions; Segments / Nurture / Templates buttons unchanged.
- The 2 existing donors (Donor Five, Donor Six) continue to display with the "Added by you" badge — they're correctly tied to Taylor in the database.

## Files touched
1. `src/pages/Donors.tsx` — add header "Upload donors" button visible to all org members; remove duplicate admin "Import CSV" entries; auto-open via `?upload=1`.

