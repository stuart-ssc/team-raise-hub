

# Donor Lists + Campaign Sending

## Overview

Add a **Lists** concept alongside the existing filter-based Segments. A List is a manually curated collection of donors -- you pick exactly who goes on it. Then you can send email campaigns (and eventually texts) to any List, just like you can with Segments today.

## How It Works for You

1. Go to Donor Segmentation page, click the new **"Lists"** tab
2. Click **"Create List"** -- give it a name and description
3. Add donors to the list in two ways:
   - From the **List detail view**: search and add donors one by one
   - From the **Donors page**: select donors with checkboxes, then click "Add to List" in the bulk action toolbar
4. View/manage list members (remove individuals, see count)
5. Click **"Send Campaign"** on any list -- same campaign dialog as segments (subject, content, personalization variables)
6. The existing `send-segmented-campaign` edge function is extended to also accept a `listId` instead of `segmentId`, querying list members directly

## New Database Tables

### `donor_lists`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| organization_id | uuid (FK) | |
| name | text | List name |
| description | text | Optional description |
| created_by | uuid (FK) | User who created it |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `donor_list_members`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| list_id | uuid (FK -> donor_lists) | |
| donor_id | uuid (FK -> donor_profiles) | |
| added_at | timestamptz | |
| added_by | uuid (FK -> profiles) | |
| **unique constraint** on (list_id, donor_id) | | Prevent duplicates |

## File Changes

| File | Change |
|------|--------|
| **Migration** | Create `donor_lists` and `donor_list_members` tables with RLS policies |
| `src/pages/DonorSegmentation.tsx` | Add a third tab "Lists" showing all lists with member counts, create/delete list, and send campaign button |
| `src/components/DonorListDetail.tsx` | **New** -- Dialog to view list members, search/add donors, remove members |
| `src/components/BulkActionToolbar.tsx` | Add "Add to List" option in bulk actions (alongside existing Tag and Email) |
| `src/components/AddToListDialog.tsx` | **New** -- Dialog to pick which list to add selected donors to |
| `supabase/functions/send-segmented-campaign/index.ts` | Accept optional `listId` param; if provided, query `donor_list_members` joined to `donor_profiles` instead of filtering by segment criteria |

## Technical Details

### RLS Policies
- `donor_lists`: Users can CRUD lists for organizations they belong to (via `user_belongs_to_organization`)
- `donor_list_members`: Same org-level access through the parent list's `organization_id`

### Lists Tab UI (on DonorSegmentation page)
- Grid of list cards showing name, description, member count, created date
- Each card has "View/Edit", "Send Campaign", and "Delete" actions
- "Create List" button opens a simple name + description dialog
- Clicking "View/Edit" opens `DonorListDetail` dialog

### DonorListDetail Dialog
- Shows a table of current list members (name, email, segment)
- Search bar to find and add donors from the organization's donor_profiles
- Remove button on each member row
- Member count badge in the header

### Bulk "Add to List" from Donors Page
- When donors are selected on the Donors page, the bulk toolbar shows an "Add to List" button
- Opens `AddToListDialog` which shows available lists and lets the user pick one
- Inserts selected donor IDs into `donor_list_members`

### Edge Function Update
- `send-segmented-campaign` gains an optional `listId` field
- If `listId` is provided, it queries donors via:
  ```sql
  donor_list_members JOIN donor_profiles ON donor_id
  WHERE list_id = listId
  ```
- If `segmentId` is provided, existing filter logic runs as before
- Campaign record is still created in `donor_segment_campaigns` (with a nullable `list_id` column added)

### Campaign Record Enhancement
- Add `list_id` (nullable FK to `donor_lists`) to `donor_segment_campaigns` so campaigns sent to lists are tracked alongside segment campaigns

