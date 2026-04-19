

## Goal
Match published-state mockup:

1. **Header (published)**: only `[🗑 icon] [Unpublish blue primary] [Save Campaign]` — remove Preview + Copy Link buttons (those actions live in the Share card already).
2. **At a Glance stats labels**: change "Orders / Pending / Days left" → "orders / pending uploads / days left" (lowercase, full words, matches mockup).
3. Delete icon should also be visible when published (mockup shows it).

## Changes

### `CampaignQuickActions.tsx`
- Remove Preview + Copy Link buttons entirely (both desktop and compact). They're redundant with the Share card.
- Keep only the Publish/Unpublish button.
- When `isPublished`: button uses `default` variant (solid blue) — matches mockup's blue Unpublish.
- When draft: also `default` variant (already correct).
- So: always `variant="default"`.

### `CampaignEditor.tsx`
- Show Delete icon button for published campaigns too (currently only shown for draft/pending). Remove the publication_status condition on the delete button.

### `CampaignAtAGlanceCard.tsx`
- Change stat labels to: "orders", "pending uploads", "days left" (lowercase).
- Slightly relax `text-xs` if needed for "pending uploads" wrapping.

## Out of scope
- Layout, Recent Orders card, Share card, draft checklist (already correct).

