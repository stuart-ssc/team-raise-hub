
# Add List Selection to Donor Import Wizard

## What Changes

When importing donors via CSV, you'll be able to optionally select an existing list -- or create a new one on the spot -- so all imported donors are automatically added to that list in one step.

## How It Works

1. Upload CSV (Step 1 -- unchanged)
2. Map fields (Step 2 -- unchanged)
3. Preview & Confirm (Step 3 -- **new**: a "Add to List" section appears here)
   - A dropdown showing existing lists + a "Create New List" option
   - If you pick "Create New List", a name/description input appears inline
   - Selecting a list is optional -- you can still import without one
4. After import completes, the edge function returns the imported donor IDs, and the client inserts them into `donor_list_members`

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/DonorImportWizard.tsx` | Add list selector UI in Step 3 (preview step). After import succeeds, insert imported donor IDs into `donor_list_members`. Fetch existing lists on mount. |
| `supabase/functions/import-donors/index.ts` | Return the IDs of newly imported and updated donors in the response so the client can add them to a list |

### DonorImportWizard.tsx Changes

- Add state for `selectedListId`, `newListName`, `newListDescription`
- Fetch existing `donor_lists` for the organization when the dialog opens
- In Step 3, render a Select dropdown:
  - "None" (default)
  - Existing lists
  - "Create New List..." option
- When "Create New List" is selected, show inline name + description inputs
- After `handleImport` succeeds:
  1. If creating a new list, insert into `donor_lists` first to get the list ID
  2. Use the returned donor IDs from the edge function to batch-insert into `donor_list_members`

### Edge Function Changes

- Track imported/updated donor IDs during processing (already has access to `existingDonor.id` for updates and can capture the inserted ID via `.insert().select('id')`)
- Return `importedDonorIds` array alongside the existing `imported`, `updated`, `skipped`, `errors` fields
- This is backward-compatible -- existing callers just ignore the new field

### No Database Changes Needed

The `donor_lists` and `donor_list_members` tables already exist from the previous implementation. No migration required.
