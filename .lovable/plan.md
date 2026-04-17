

## Goal
After the AI builder finishes (all fields collected + draft saved + post-draft details added), present the user with a clear choice: **Publish** the campaign now, or **Open the editor** to refine further.

## Current state
- `phase` transitions: `collecting` → `ready_to_create` → `post_draft` → `complete`
- `AICampaignPreview` already has an `onOpenEditor` button wired up
- `CampaignPublicationControl` exists and handles publish requirements/dialog
- The `complete` phase is reached but currently only offers "Open editor"

## Fix

### A. `AICampaignBuilder.tsx`
- Track a `showPublishDialog` state
- Add `handlePublishClick` that sets `showPublishDialog = true`
- Render `<CampaignPublicationControl>` with `hideButton`, `triggerOpen={showPublishDialog}`, and `onClose` to reset state
- Pass `onPublishClick` down to `AICampaignPreview`
- Need to fetch campaign's `groupId`, `name`, and `enableRosterAttribution` (already in `collectedFields` for name; group_id known; roster attribution likely false by default for AI builder — pass undefined)

### B. `AICampaignPreview.tsx`
- When `phase === "complete"` (or `post_draft` with all post-draft fields done), show TWO buttons side by side:
  - **Publish Campaign** (primary) → calls `onPublishClick`
  - **Open in Editor** (outline) → existing `onOpenEditor`
- Add the new optional `onPublishClick` prop

### C. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
- Update the post-draft completion message so the AI's final turn says something like:
  > "Your campaign is ready. 🎉
  >
  > Would you like to publish it now or open the full editor to fine-tune?"
- No suggestion chips needed (the buttons in the preview pane handle the choice), OR emit a `choice` suggestion with `["Publish now", "Open editor"]` that mirrors the buttons. Recommend buttons-only to avoid duplication.

### Out of scope
- No changes to `CampaignPublicationControl` itself — it already supports `triggerOpen` / `hideButton` / `onClose`
- No schema changes
- Acknowledgment + question two-paragraph format already enforced

