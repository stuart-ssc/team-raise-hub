

## Issues
1. **Two prompts collapsed into one turn** — screenshot shows "Will donors purchase as a business..." and "Save as draft?" buttons appear simultaneously. The suggestions block jumps to `ready_to_create` because all required fields are filled, even though the business-info question hasn't been answered yet.
2. **Wrong concept for `requires_business_info`** — current copy says "Will donors purchase as a business (for sponsor recognition / tax records)?" but actually this flag means: *sponsors must provide info/assets (logo for banner/shirt, website link for social media, etc.) to participate*.
3. **Roster attribution chip still says "peer-to-peer"** (line 604) — leftover from previous fix.

## Fix (one file: `supabase/functions/ai-campaign-builder/index.ts`)

### A. Rewrite the `requires_business_info` framing
- System prompt (line 257) and field aiDescription (line 125): describe it as **"Will sponsors need to provide information or assets to participate? (e.g. logo for a banner/shirt, website link for social media recognition)"**
- Treat it as a required collection step that must be answered (Yes/No) **before** the "Save as draft?" confirmation appears.

### B. Separate the two questions into distinct turns
- Add `requires_business_info` to the `REQUIRED_KEYS` list (or a parallel "must-answer" list) so `readyToCreate` stays `false` until the user has explicitly answered it.
- Track answered state with `updatedFields.requires_business_info !== undefined` (since the value is boolean, presence = answered).
- In the suggestions block (lines 636-653), add a new branch: if all other required fields are filled but `requires_business_info` is undefined → emit Yes/No chips labelled **"Yes, sponsors must provide info"** / **"No, not required"** with field `requires_business_info`. Do NOT emit the "Save as draft?" chips yet.
- Only after `requires_business_info` is set → phase transitions to `ready_to_create` and the "Save as draft?" chips appear in the next turn.

### C. Fix lingering "peer-to-peer" text
- Line 604: change `"Yes, enable peer-to-peer fundraising"` → `"Yes, enable individual goals & URLs"`.

### D. System prompt update
- Make the order explicit: collect required factual fields → ask about `requires_business_info` (with the new sponsor-asset framing) → wait for answer → then ask "Ready to save as a draft?" → on yes, call `create_campaign_draft`.
- Forbid combining the business-info question with the save-draft confirmation in a single message.

## Out of scope
- No frontend changes — the existing suggestion-rendering pipeline in `AIChatPanel` already handles boolean Yes/No chips.
- Post-draft flow (image, roster, directions) unchanged.

