

## Problem
After splitting the AI's response into two bubbles (acknowledgment + question), the suggestion chip card is intermittently not appearing on questions where it should — e.g., "Business Info Required" — even though it correctly appeared for the campaign-type and save-as-draft questions.

## Root cause
In `AIChatPanel.tsx`, suggestions are anchored to the assistant message at `latestAssistantIdx`. The frontend attaches `data.suggestions` only to the LAST split part. This works **when the model emits exactly two paragraphs in the order [acknowledgment, question]**. But the model is non-deterministic and sometimes:

1. Emits **one paragraph only** (no blank-line split) — works fine.
2. Emits **acknowledgment + question** — works fine.
3. Emits **3+ paragraphs** (e.g., adds a clarifying note as paragraph 3) — chip lands under the trailing note, looking disconnected OR the question isn't the "latest" bubble visually.
4. Emits **question first, acknowledgment second** — chip lands under the wrong bubble.
5. Emits trailing whitespace / a stray "🎉" line — chip lands under that.

The screenshot shows symptom #3/#5: the chip is technically anchored to the most recent bubble, but that bubble may not be the question — and on the Business Info turn, the model probably split differently and the chip rendered far from the relevant question (or appeared on a non-question bubble that was hidden behind scroll).

There's a second contributing bug: in the screenshot, "Ready to save this as a draft?" appears as a bubble TWICE because the model sometimes echoes the question text inside both paragraphs. The chip card showing the same label "Save as draft?" makes the duplication obvious.

## Fix

### A. Render the suggestion **once, after the entire latest assistant turn** — not anchored to a single bubble
- Track the latest assistant *turn* (a contiguous run of assistant messages ending the array) instead of the latest assistant *message*.
- Render the chip card / image-upload widget **after the last bubble of that turn**, regardless of how many paragraphs the turn contains.
- This makes the chip robust to the model emitting 1, 2, or 3 paragraphs in any order.

### B. Stop splitting on `\n\n` in the edge function; let the frontend split
- Move the split to the **frontend** so we control it consistently.
- In `AICampaignBuilder.tsx`, when the response comes back, split `data.assistantMessage` on `\n{2,}` ourselves and push each as a separate message. This removes the redundant `assistantMessages` payload and centralizes the logic.
- Either way works; keeping split on backend is fine — the key fix is **(A)** the rendering logic.

### C. Stabilize `dismissedAt`
- Currently `dismissedAt` is a numeric message index. Switch to a stable identifier (e.g., the index of the latest assistant turn, or a counter that increments per assistant turn) so dismissals don't accidentally match a future index.

### D. Tighten the system prompt
- Reinforce: "Acknowledgment paragraph FIRST, question paragraph SECOND. Never more than two paragraphs. Never repeat the question."
- This reduces the 3+ paragraph and reordered-paragraph cases.

### Out of scope
- No changes to `SuggestionPrompt.tsx` or `ImageUploadPrompt.tsx`
- No phase / item-collection logic changes

