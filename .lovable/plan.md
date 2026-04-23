
## Goal
Update the review step copy and add a paginated recipient table to `ContactFundraiserDialog`.

## Changes — `src/components/ContactFundraiserDialog.tsx`

**1. Update DialogDescription on review step**
Replace `"Confirm the cadence below. Emails stop automatically when each donor donates or the fundraiser ends."` with `"Confirm the fundraising invitation below."`.

**2. Add paginated recipients table on review step**
Below the existing Recipients summary card, render a table listing the donors that will be enrolled.

- **Data source**:
  - If `donorIds` prop is provided: query `donor_profiles` for `id, first_name, last_name, email` where `id in donorIds`.
  - Else if `listId` prop is provided: query `donor_list_members` joined to `donor_profiles` for the same fields.
  - Fetch once when entering the review step (new `useEffect` keyed on `step === "review"` and `selected.id`).
  - Store in `recipients` state with a `loadingRecipients` flag.

- **Table UI** (using existing `@/components/ui/table`):
  - Columns: **Name** (`{first_name} {last_name}` or "—"), **Email**.
  - Wrapped in a bordered container with header `Recipients ({recipients.length})`.
  - Show `Skeleton` rows while loading.
  - Empty state: small muted "No recipients found." row.

- **Pagination** (10 rows per page):
  - Local `page` state, `pageSize = 10`.
  - Slice `recipients` for the visible page.
  - Footer row: `Showing X–Y of Z` on the left, `Previous` / `Next` ghost buttons + `Page N of M` on the right.
  - Hide pagination footer entirely when `recipients.length <= 10`.

- **Recipient count**: keep using `recipients.length` for the existing "N selected donors" line so the count reflects what's actually fetched (after any null-email filtering — we display all rows but the existing skip messaging already covers suppressed/opted-out at send time).

## Verification
- Open dialog from Donors page with multiple donors selected → review step shows updated description, a table of selected donors with name + email, paginated 10/page.
- Open dialog from a donor list → table shows all members of the list, paginated.
- ≤10 recipients → pagination footer hidden.
- >10 recipients → Previous/Next navigates pages; counts update.
- Loading state shows skeleton rows; empty state shows muted message.
- Existing Back / Start outreach buttons and enrollment behavior unchanged.
