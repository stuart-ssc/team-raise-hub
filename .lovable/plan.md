

## Goal
Remove the redundant inner Card wrapper on the Fundraiser Items section so only the outer section panel header ("Fundraiser Items / Manage what supporters can purchase") shows, with the items table and "Add Item" button rendered directly inside it.

## Changes — `src/components/campaign-editor/CampaignItemsSection.tsx`

- Replace the outer `<Card><CardHeader>…</CardHeader><CardContent>…</CardContent></Card>` wrapper with a simple `<div className="space-y-4">`.
- Drop the inner `CardTitle` "Fundraiser Items" / `CardDescription` "Products or sponsorship levels for your fundraiser" / `Package` icon block — the parent section already shows this.
- Keep the "Add Item" button, but move it to a top-right aligned row above the items table (only shown when `!isFormVisible && items.length > 0`).
- Keep all form/table/empty-state markup and behavior unchanged.
- Remove now-unused imports: `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`, and `Package` (only if no longer referenced elsewhere in the file — verify the form-header `<Package />` usage stays, so keep `Package`).

## Verification
- On the Fundraiser editor → Items step, only one header reads "Fundraiser Items / Manage what supporters can purchase" (the outer section panel). No nested duplicate title/description.
- "Add Item" button still appears top-right when items exist; the items table and the add/edit form render exactly as before.
- Empty state, edit, delete, and variants flows are unchanged.

