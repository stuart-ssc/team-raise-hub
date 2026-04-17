

The user wants the AI Campaign Builder to do more than just create a draft and hand off — it should continue the conversation after draft creation to collect:
1. Campaign image upload
2. Roster attribution toggle + roster selection
3. Participant directions for the team

Let me explore what's currently happening on draft creation and how images, roster attribution, and participant directions are stored.

Key findings from prior context:
- `AICampaignBuilder.tsx` currently navigates to `/dashboard/campaigns/{id}/edit` immediately after creating the draft
- `TeamSettingsSection.tsx` handles roster attribution (`enableRosterAttribution`, `rosterId`) and participant directions (`groupDirections`) — these map to campaign columns and call `generate-roster-member-links`
- `LogoUpload.tsx` shows the upload pattern using a Supabase storage bucket
- The edge function `ai-campaign-builder` defines the tool schema and updates `collectedFields`

## Plan

### Phase 1: Don't auto-navigate after draft creation
In `AICampaignBuilder.tsx`, after `handleCreateDraft` succeeds:
- Store the new `campaignId` in state instead of navigating away
- Add a system/assistant message: "Great — your draft is saved. Let's add a few more details. First, would you like to upload a campaign image?"
- Keep the preview pane visible (now showing saved state with edit/finish CTAs)

### Phase 2: Extend the conversation schema (edge function)
In `supabase/functions/ai-campaign-builder/index.ts`:
- Add new fields to the tool schema: `campaign_image_url` (string), `enable_roster_attribution` (boolean), `roster_id` (number), `group_directions` (string)
- Add a new conversation phase awareness: "post-draft setup" — when `campaignId` is provided in the request body, the AI knows the draft exists and asks about image → roster attribution → participant directions in sequence
- Add a new `phase` field to the response: `"collecting" | "ready_to_create" | "post_draft"  | "complete"`
- When in post-draft phase, the AI saves each field directly to the `campaigns` row via the edge function (it has service role access) instead of just collecting

### Phase 3: Image upload UI in chat
Create a new component `src/components/ai-campaign/ImageUploadPrompt.tsx`:
- Renders below an assistant message when the AI's suggestion type is `"image_upload"`
- Drag-and-drop zone + file picker (reuse pattern from `LogoUpload.tsx`)
- Uploads to existing `campaign-item-images` bucket at path `{campaignId}/cover-{timestamp}.{ext}`
- On success, sends a synthetic user message like "Image uploaded" + updates `campaign_image_url` field
- Skip button → sends "skip image"

Update `AIChatPanel.tsx` to render `ImageUploadPrompt` when `suggestions.type === "image_upload"`.

Update `SuggestionPrompt.tsx` (or extend types) so suggestions can carry a `type` discriminator: `"choice"` (existing numbered options), `"image_upload"`, `"yes_no"`.

### Phase 4: Persist post-draft fields
In the edge function, when `campaignId` is present and the AI tool call sets `campaign_image_url` / `enable_roster_attribution` / `roster_id` / `group_directions`:
- Use service-role Supabase client to UPDATE the `campaigns` row directly
- For roster attribution, also fetch rosters for the group and pass them in the system prompt so the AI can offer them as numbered choices
- After roster attribution is enabled + roster_id set, optionally invoke `generate-roster-member-links` (mirror the logic in `TeamSettingsSection.tsx`)

### Phase 5: Completion
When all post-draft fields are collected (or skipped), the AI sets `phase: "complete"` and the preview pane shows a "Open campaign editor" button → navigates to `/dashboard/campaigns/{id}/edit`. Also offer "Continue chatting to publish" as an alternative future step (out of scope here).

### Files
- `src/pages/AICampaignBuilder.tsx` — keep campaignId in state, don't navigate, pass campaignId to edge function, render image upload prompt
- `src/components/ai-campaign/AIChatPanel.tsx` — route suggestion type to correct prompt component
- `src/components/ai-campaign/SuggestionPrompt.tsx` — extend types to support discriminator
- `src/components/ai-campaign/ImageUploadPrompt.tsx` — NEW, drag-drop upload to `campaign-item-images` bucket
- `src/components/ai-campaign/AICampaignPreview.tsx` — show "Open Editor" CTA when phase is complete
- `supabase/functions/ai-campaign-builder/index.ts` — extend tool schema, add post-draft phase logic, fetch rosters when group known, persist fields directly when campaignId present, optionally invoke roster link generator

### Notes
- Storage bucket `campaign-item-images` already exists with appropriate RLS (per memory)
- Roster link generation logic already exists in `generate-roster-member-links` edge function — just invoke it when applicable
- The campaign image column is `campaigns.image_url` (need to verify column name in edge function before writing — will check during implementation)

