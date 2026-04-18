

## Problem

Fields are being skipped in the AI Campaign Builder chat without an explicit user answer or skip. Most recent example: the campaign cover image upload — either never asked, or asked but the response wasn't recorded, and the assistant moved on anyway.

Root cause: the edge function decides "next field" based on what's *missing* in collected data, but several code paths can advance the conversation **without confirming the previous question got an answer or explicit skip**:
- LLM tool-call path may decide to call `save_campaign_*` and move on even if a field wasn't actually answered.
- Image-upload prompts (`type: "image_upload"`) have no server-tracked "asked but not yet resolved" state — if the user types a different message instead of clicking Upload/Skip, the prompt is dropped.
- `post_draft` questions (image, roster directions) don't have a per-question `asked → answered/skipped` tracker.
- Item field prompts: same issue when user replies tangentially.

## Plan

### 1. Add a server-tracked "pending question" lock

**File:** `supabase/functions/ai-campaign-builder/index.ts`

Add a field to the conversation state: `pendingQuestion: { field, kind, allowSkip, askedAt } | null`.

- When the assistant emits any prompt that expects an answer (choice chip, image upload, free-text field, item field, post_draft question), set `pendingQuestion` to that field.
- On the next user turn, the function **must** resolve `pendingQuestion` before doing anything else:
  - **Answered** (value extracted that matches the field's expected type/options) → store value, clear `pendingQuestion`.
  - **Skipped** (user said "skip" / clicked Skip chip AND `allowSkip === true`) → mark `{field}_skipped = true` in the relevant draft, clear `pendingQuestion`.
  - **Unresolved** (user said something unrelated, ambiguous, or tried to skip a required field) → re-ask the same question with a brief clarification ("I still need an answer for X — please pick one or say skip"). Do NOT advance.

This single lock applies uniformly to: shared campaign fields, fee_model, post_draft (image/roster), and item fields.

### 2. Treat image upload as a first-class pending question

**Files:** `supabase/functions/ai-campaign-builder/index.ts`, `src/pages/AICampaignBuilder.tsx`

- When the assistant prompts for image upload (campaign cover or item image), set `pendingQuestion = { field: "image_url" | "item_image_url", kind: "image_upload", allowSkip: true }`.
- Frontend: when the user uploads an image via `ImageUploadPrompt`, send a synthetic user message back to the edge function with the uploaded URL (e.g. `__image_uploaded__:<url>`) so the server can record the value and clear `pendingQuestion`. Same for skip → send `__image_skipped__`.
- Server: handle these synthetic messages by storing `image_url` / item image url on the appropriate draft and clearing the lock. Confirm with a short ack message ("Got it, image saved.") before moving to the next prompt.
- Until that synthetic message arrives, the server treats the image question as unresolved. If the user sends a normal text message instead (e.g. "next"), reply: *"Want to upload a cover image, or skip?"* and keep the prompt visible.

### 3. Strict "no advance without resolution" guard for item fields

**File:** `supabase/functions/ai-campaign-builder/index.ts`

- Before computing the next item field to ask, verify that the **previous** asked field is either present in `currentItemDraft` or marked `{field}_skipped = true`.
- If neither, re-ask the previous field instead of moving on.
- Required item fields (`name`, `cost`, `quantity_offered`) cannot be skipped — re-ask with: *"This one's required — please give me a value."*
- Optional fields can be skipped via "skip" / "no" / "none" / clicking a Skip chip.

### 4. Per-prompt Skip chip on optional questions

**File:** `supabase/functions/ai-campaign-builder/index.ts`

For every optional prompt (description, max_items_purchased, size, recurring, post_draft image/roster directions), include a `Skip` option in the `suggestions.options` array so users get a one-click skip path. Clicking it sends `skip` which the server treats as the explicit-skip signal.

### 5. Frontend: don't drop the prompt UI when user types

**File:** `src/components/ai-campaign/AIChatPanel.tsx`

- Currently `dismissedTurnStart` hides the prompt once the user types. Change behavior: only auto-dismiss when the **server** confirms the question was resolved (i.e. the new assistant turn has a different `pendingQuestion` field, or none). This keeps the upload widget visible if the user typed an unrelated message and the server re-asked.

### 6. Confirmation echo on every captured value

**File:** `supabase/functions/ai-campaign-builder/index.ts`

After capturing any field, the next assistant message must briefly echo what was saved (*"Saved: $500 for Large Banner."*) before asking the next question. Gives the user immediate visual confirmation no field was silently skipped.

### 7. Cleanup of stale rows

The current campaign (`/dashboard/campaigns/2673e99e-…/edit`) likely has the missing image and possibly bad item rows from earlier turns. Once the fix ships, the user can re-upload the image directly in the editor — we won't auto-mutate existing rows.

## Out of scope

- Changing the field order or which fields are required.
- Redesigning the chat UI beyond keeping the prompt visible.
- Fee model copy (already shipped).
- Cents/dollars math (already fixed).

