

## Goal
Add a Delete (trash) button next to the "Save Campaign" button on the Campaign Editor page (`/dashboard/campaigns/:id/edit`), with the same confirmation + soft-delete behavior already present on the Campaigns list page.

## Investigation
- The header action row in `src/pages/CampaignEditor.tsx` (around lines 305-325) currently shows: `CampaignQuickActions` (Publish/Preview/Copy Link) + `Save Campaign`. This is what's visible in the screenshot.
- Soft-delete logic + AlertDialog pattern already exists in `src/pages/Campaigns.tsx` (handleDeleteCampaign, deleted_at update).
- Eligibility rule already established: only `publication_status` of `draft` or `pending_verification` can be deleted (published campaigns must be unpublished first).

## Plan

### 1. Add Delete button to CampaignEditor header
- In `src/pages/CampaignEditor.tsx`, add a destructive `Button` with a `Trash2` icon between `CampaignQuickActions` and `Save Campaign`.
- Show the button only when `isEditing` AND `campaignData.publicationStatus` is `draft` or `pending_verification`.
- Use `variant="outline"` with destructive text color (matches the outline style of Publish/Preview/Copy Link buttons in the screenshot).

### 2. Confirmation dialog
- Add an `AlertDialog` with title "Delete this campaign?" and a clear message: "This will move the campaign to the Deleted filter. You can restore it from the Campaigns page."
- Confirm action runs: `update({ deleted_at: new Date().toISOString() })` on the campaigns row, shows a success toast, and navigates back to `/dashboard/campaigns`.

### 3. Verify Campaigns list page already has it
- Already implemented in prior turn — no changes needed there.

## Files to change
- `src/pages/CampaignEditor.tsx` — add Trash2 import, AlertDialog import, delete button + dialog, handler with navigation.

## Out of scope
- Hard delete / purge.
- Deleting published campaigns (user must unpublish first — keep current rule).
- Bulk delete.

