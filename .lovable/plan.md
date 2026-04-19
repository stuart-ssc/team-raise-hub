

## Issue

The action buttons in the header don't visually match the mockup. Comparing the mockup screenshot to current code:

- **Mockup**: Publish, Preview, Copy Link, Delete, Save Campaign — all rendered at the **same medium height**, evenly spaced.
- **Current**: Publish / Preview / Copy Link use `size="sm"` (smaller, ~36px), while Delete and Save Campaign use the default size (~40px) — so the row is mismatched in height.

Order, icons, colors, and labels already match. Only the **size inconsistency** needs fixing.

## Fix

### `src/components/campaign-editor/CampaignQuickActions.tsx`
Remove `size="sm"` from the three desktop buttons (Publish, Preview, Copy Link) so they render at default height matching Delete + Save Campaign.

### `src/pages/CampaignEditor.tsx`
No changes to button sizes (Delete and Save are already default size — keep as-is). Optional small cleanup: confirm the Delete button's `gap-2` and red color styling exactly match the mockup's red text + trash icon (already correct).

That's it — just the 3 `size="sm"` removals to align all 5 buttons on the same baseline as the mockup.

## Out of scope
- Header text, badge, subtitle, mobile dropdown — all already match expected behavior.
- Layout / 3-column grid — already matches.

