

## Goal

Match the mockup for **draft** campaigns:
1. Header buttons: only **Delete** (icon-only), **Publish** (blue, primary), **Save Campaign** (dark/black). Hide Preview + Copy Link while draft.
2. Right rail "At a Glance" card: replace fundraising progress with a **"Ready to publish" checklist** (% complete bar + checklist of setup steps).
3. Hide the **Recent Orders** card entirely until the campaign is published.
4. Share card: keep, but show "Link will activate when published." helper text while draft (already partially shown in mockup).

When campaign is **published**: revert to current behavior (show all 5 buttons, show fundraising At a Glance, show Recent Orders).

## Changes

### 1. `CampaignQuickActions.tsx`
- Accept current behavior when published.
- When `publicationStatus !== 'published'`: render only Publish (default primary blue) + hide Preview + hide Copy Link. Delete and Save remain in the parent header.
- Publish button: remove `variant="outline"` when draft so it renders as solid primary blue (matches mockup).

### 2. `CampaignEditor.tsx` header
- When draft: Delete button becomes **icon-only** (trash icon, no "Delete" text), ghost/outline style.
- Order: `[🗑 icon] [Publish] [Save Campaign]` — matches mockup exactly.
- When published: keep current 5-button row.

### 3. `CampaignAtAGlanceCard.tsx`
- Add `publicationStatus` prop.
- If `published`: keep current "raised / orders / pending / days left" view.
- If `draft` (or any non-published): render new **"Ready to publish"** checklist:
  - Header row: "Ready to publish" + percentage on right (blue text).
  - Progress bar (blue).
  - Checklist items with circle/check icons + strikethrough when complete:
    - Basic details added (name + description present)
    - Campaign items defined (≥1 item)
    - Campaign image uploaded (cover_image_url present)
    - Schedule set (start_date + end_date present)
    - Pitch written (pitch content present)
  - Percentage = completed / 5.

### 4. `CampaignEditor.tsx` right rail
- Conditionally render `<CampaignRecentOrdersCard>` only when `publicationStatus === 'published'`.
- Pass `publicationStatus` + needed campaign fields (cover image, start/end dates, pitch, items count) into `CampaignAtAGlanceCard`.

### 5. `CampaignShareCard.tsx`
- Already shows URL; add small muted helper text below buttons: **"Link will activate when published."** — only when draft.

## Files touched
- `src/pages/CampaignEditor.tsx`
- `src/components/campaign-editor/CampaignQuickActions.tsx`
- `src/components/campaign-editor/CampaignAtAGlanceCard.tsx`
- `src/components/campaign-editor/CampaignShareCard.tsx`

## Out of scope
- Layout grid, nav, section content, mobile dropdown.
- Changing what counts as "complete" for each checklist item beyond the simple presence checks listed above (can refine later).

