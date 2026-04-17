

## Issue
From the screenshots, two clear bugs:

**Bug 1 (screenshot 1):** After the user provides a description ("Let's cover the gym"), the AI says "Got it" and then asks the next question ("Will sponsors need to provide info..."), but the **suggestion chip below shows "Add a short description?" with a "Skip — no description" option** — the prompt is for the *previous* question, not the current one. Stale chip card.

**Bug 2 (screenshot 2):** When the user types "I already gave the description?", the AI just replies "Saved. Ready to save this as a draft?" repeatedly without acknowledging the user's confusion. Then when user clicks "Skip — no description" (the stale chip), it again replies the same thing. The chip card "Add a short description?" is **still showing** even after multiple turns. The AI is also not skipping past the description field properly when description was already collected.

## Root cause analysis

Let me investigate before finalizing.
<lov-tool-use id="toolu_vrtx_014X4EDvAMWvnieFHoXk5jvx" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/ai-campaign-builder/index.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01QKBARTRRJzHVUqxmxLku7p" name="code--view" integration-id="code" data="{\"file_path\": \"src/lib/ai/campaignSchema.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Hc3iVY9R5nN4yP3EcRbQ5o" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/ai-campaign-builder/index.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EYLUGRhULg4koqpk4RxKWH" name="code--view" integration-id="code" data="{\"file_path\": \"src/lib/ai/campaignSchema.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CZqwYtKay1vgmUUgCUXY84" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/ai-campaign-builder/index.ts\", \"lines\": \"373-1228\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01KGg7NNGR5HNxJzAdBza7Fu" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/ai-campaign-builder/index.ts\", \"lines\": \"713-1228\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NhNJDmoGLyGegGw5Ly6f58" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/ai-campaign-builder/index.ts\", \"lines\": \"1090-1228\"}">
</lov-tool-use>
Now I have a clear picture. Let me analyze the screenshots:

**Screenshot 1**: User typed "Let's cover the gym" in response to "Want to add a short description of the campaign? You can say skip." — the AI saved that as the description (good), then asked the next question (requires_business_info) — but the suggestion chip card below shows "Add a short description? — Skip - no description". The chip is from the **previous** turn's question (description), not the current turn's question (business info). It should show Yes/No buttons.

**Screenshot 2**: User responded "I already gave the description?" — AI replied "Saved. Ready to save this as a draft?" multiple times (same bubble, repeated). AI is treating description as still unanswered and looping. The chip card still shows "Add a short description?" with skip option. The system thinks `description` is still not answered AND `requires_business_info` is also unanswered.

Root causes:
1. **Suggestions stale by one turn**: The frontend builds suggestions from `data.suggestions` returned with the *current* response. But that response includes `updatedFields` AFTER the AI's tool call. Looking at the code, `nextField = stillToAskNow[0]` is computed from `updatedFields` post-tool-call, so it should be correct. BUT — the AI may not have called the tool in that turn (it just acknowledged "Got it" in text without `update_campaign_fields`). So `description` was never saved, `stillToAskNow[0]` is still `description` → chip = description skip.

2. **AI not calling `update_campaign_fields` for free-text description**. The system prompt rule #2 says "When the user provides information, call the tool" but the model often skips it for description. There's deterministic skip handling but no deterministic *capture* of free-text description.

3. **"Ready to save this as a draft?" appearing as bubble text**: The AI's text in screenshot 2 is just "Saved. Ready to save this as a draft?" repeated. This implies the model is jumping to the save confirmation despite `requires_business_info` not being answered AND `description` apparently captured (in model's mind). The duplicated bubbles come from the model sending the same answer multiple times across turns since user keeps replying.

4. **Chip card label misaligned**: When AI moves on to ask "Will sponsors need to provide info..." the chip card still shows the description skip option because — wait, let me re-read. In screenshot 1 the AI asked the business-info question in text, but the chip shows description-skip. That means `stillToAskNow[0]` is still `description`. So the AI asked the *next* question in text but didn't capture the description value. The chip is correct for "description still missing" but the AI's text question is for the wrong field.

<lov-plan>

## What's actually broken

Looking at the two screenshots carefully:

**Screenshot 1** — User typed "Let's cover the gym" as a description. The AI's NEXT bubble asks the business-info question ("Will sponsors need to provide information or assets..."), but the suggestion chip card below it shows **"Add a short description? — Skip — no description"**. The chip is for the *previous* question (description), not the question the AI just asked.

**Screenshot 2** — User says "I already gave the description?". AI keeps looping with "Saved. Ready to save this as a draft?" while the chip card still shows the description-skip option. The flow is stuck.

## Root causes

1. **The model is not calling `update_campaign_fields` when the user answers `description`**. Free-text answers like "Let's cover the gym" are acknowledged in chat ("Got it.") but the tool call is omitted. Result: `description` stays missing in `collectedFields`.

2. **Because `description` stays missing, server-side `stillToAskNow[0]` is still `"description"`** → suggestion chip shows the description-skip option even though the AI's text already moved on to the business-info question. So **chips lag the text by one field**.

3. **Two competing skip mechanisms cause confusion**:
   - The AI hears "skip" and may set `description_skipped=true`.
   - The user types real text → no skip → no tool call → field never saved.
   - User then re-asks why and the AI re-asks again, creating the loop in Screenshot 2.

4. **The model is jumping straight from a partial answer to "Ready to save this as a draft?"** even when `requires_business_info` is not answered, because once it *thinks* description is handled, it bypasses the business-info question instead of asking it as the next field.

## Fix

### A. Capture free-text answers deterministically (server-side safety net)
In the edge function pre-draft block, add the same kind of deterministic capture we already use for skip/type/group:
- Detect when the previous assistant message asked about **description** AND the user's last message is non-empty, non-skip text. Set `updatedFields.description = lastUserMsg` (raw, not lowercased) directly on the server.
- Use the existing `detectFieldFromAssistantText` helper — extend it with the field types (description = free text, requires_business_info = yes/no).
- For `requires_business_info`: if the last assistant message asked about business info AND the user's reply parses as yes/no/true/false, set `updatedFields.requires_business_info` server-side.

This guarantees the field is captured even if the model forgets the tool call, eliminating the chip lag and the loop.

### B. Sync suggestions to the AI's actual next question
Instead of basing the chip on `stillToAskNow[0]` computed from server state, make sure the server state matches what the AI just asked. After the deterministic capture in (A), `stillToAskNow` will correctly advance, and the chip will match the next question.

### C. Stop the "Ready to save this as a draft?" premature jump
Tighten the system prompt rule #10:
- "Do NOT ask 'Ready to save this as a draft?' until **every** field in `## Still To Ask About` is empty. The list above is the source of truth — if anything appears there, ask about it next instead."
- Add an explicit guard in the response: if the AI's text contains "save this as a draft" but `stillToAskNow.length > 0`, re-prompt the model (or override the assistant message) to ask the next missing field. (Optional — prompt tightening alone may be sufficient.)

### D. Remove the description "Skip" chip when the input box is the right tool
The description chip card in screenshots 1/2 is confusing — users have a text box AND a chip card both shown. Keep the chip but make its label clearer:
- Label: `"Description (optional)"` instead of `"Add a short description?"` so it doesn't look like the AI is re-asking.

### E. Tighten rule for `description` in the prompt
Add to rule #9 / #2: "When the user types free-text in answer to the description question, you MUST call `update_campaign_fields` with `description: '<their exact text>'` in the same turn. Never just acknowledge in text."

## Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — extend `detectFieldFromAssistantText` and add deterministic capture for description + requires_business_info; tighten system prompt rules #2, #9, #10; relabel description chip.

## Out of scope
- No frontend changes
- No schema or phase changes
- Items-collection logic unchanged

