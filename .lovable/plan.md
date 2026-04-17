

## Problem
Once all required fields are collected, the AI says "ready to create" but has no tool to actually create the draft. The only way to create it is the "Create Draft Campaign" button in the right preview pane. When the user replies "Ok" in chat, the AI re-acknowledges but nothing triggers — leaving the user stuck.

## Fix: Let the AI create the draft from chat

### 1. Add a `create_campaign_draft` tool (edge function)
In `supabase/functions/ai-campaign-builder/index.ts`:
- Add a new tool the AI can call once all required fields are collected and the user confirms
- Server-side handler validates required fields are present, then INSERTs into `campaigns` table using the admin client (status=false, publication_status='draft')
- Returns the new `campaignId` in the response payload
- Handles slug-conflict (duplicate name) gracefully — return an error message the AI can relay

### 2. Update system prompt
- When `phase === "ready_to_create"`: instruct the AI to confirm with the user (one short sentence: "Ready to save this as a draft?") and offer Yes/No suggestion buttons
- When the user says yes/ok/create/save → call `create_campaign_draft` tool
- After tool succeeds, transition naturally into post-draft conversation (image upload prompt)

### 3. Wire response → frontend
In `src/pages/AICampaignBuilder.tsx`:
- When the edge function response includes a newly-created `campaignId` (from the tool result), set it in state and switch phase to `post_draft`
- Skip the manual `handleCreateDraft` path when the AI already created it
- Keep the existing "Create Draft Campaign" button as a fallback for users who prefer to click

### 4. Add a confirm suggestion at ready_to_create phase
Add a Yes/No suggestion in the suggestions block when `phase === "ready_to_create"` so the user sees clear "Yes, create draft" / "Not yet, let me change something" buttons in the chat.

### Files
- `supabase/functions/ai-campaign-builder/index.ts` — new tool, server-side INSERT, return campaignId, suggestion for ready_to_create phase
- `src/pages/AICampaignBuilder.tsx` — handle `campaignId` returned from edge function response, transition phase, kick off post-draft conversation

### Out of scope
- The "Create Draft" button stays as a fallback — no UI removal
- Roster link generation logic unchanged (already wired in the post-draft step)

