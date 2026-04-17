

## Issue Analysis

Looking at the screenshot, three distinct problems happened in sequence:

1. **Dead-end statement**: After extended details, AI said "Now that we've covered the basics, let's add some items!" with no question/CTA. User had to type "ok" to advance.
2. **Double response**: AI sent two messages back-to-back asking for the item name ("Alright, let's add the first sponsorship item..." AND "Great! What's the name of your first sponsorship item...").
3. **Wrong UI affordance**: The image upload prompt appeared *before* the item name was collected, and the input placeholder still says "Describe your campaign…" instead of something contextual like "Type the item name…".

## Root Causes (to confirm by reading edge function)

I need to read `supabase/functions/ai-campaign-builder/index.ts` to confirm, but based on prior context:

- **Cause 1 (dead-end)**: After the post-draft phase completes, the function emits a transition message announcing items collection but doesn't immediately ask for the first field (`name`). The very next turn re-enters and prompts properly — but only after the user sends something.
- **Cause 2 (double-ask)**: When my last change added `image` to `ITEM_FIELDS`, I likely also kept a separate hand-written intro message *and* let the model generate its own prompt → two assistant messages in `assistantMessages[]`.
- **Cause 3 (image first)**: I placed `image` too early in `ITEM_FIELDS` (before `name`), or the suggestion builder is emitting `image_upload` even though the next required field is `name`. The image step must come *after* the required `name` (and ideally `price`) are captured.
- **Cause 4 (placeholder)**: `AIChatPanel` uses a static placeholder. It should adapt to the current phase / current item field.

## Plan

### 1. Reorder `ITEM_FIELDS` in the edge function
Move `image` to come **after** the required fields (`name`, `price`, anything else required). Order should be roughly: `name` → `price` → `description` → `image` → other optional fields. Image is always optional/skippable.

### 2. Fix the double prompt at the start of items phase
When transitioning into `collecting_items`:
- Emit **one** assistant message that both announces the phase AND asks for the first field's value (e.g. "Now let's add your first sponsorship item — what's its name? e.g. Large Banner, Event Sponsor, Platinum Sponsor.").
- Do not let the model generate a follow-up prompt in the same turn. Either: (a) skip the model call on the transition turn and return only the canned message, or (b) include the field question inside the canned message and clear `assistantMessages` from the model call.

### 3. Fix the dead-end "ok" requirement
The transition into items collection must be triggered by the *previous* user turn (the one that completed extended details), not require a fresh user message. Concretely: when the post-draft phase finishes in a given turn, immediately roll into producing the first items prompt in that same response.

### 4. Suppress `image_upload` suggestion until item is named
In the suggestions builder, only emit `type: "image_upload"` with `field: "item_image_url"` when:
- `phase === "collecting_items"` AND
- `currentItemDraft.name` is set AND
- `currentItemDraft.price` is set (or whatever required fields precede image)

Otherwise emit a text prompt suggestion (or none).

### 5. Contextual chat input placeholder
In `AIChatPanel.tsx`:
- Accept a new `placeholder?: string` prop (or derive from `phase` / latest suggestion).
- In `AICampaignBuilder.tsx`, pass a placeholder based on `phase`:
  - `collecting` → "Describe your campaign…"
  - `post_draft` → "Answer the question above…"
  - `collecting_items` → "Type your answer…" (or use the current field's label, e.g. "Type the item name…")
  - `complete` → "Anything else?"

### 6. Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — reorder `ITEM_FIELDS`, fix transition turn (no double prompt), gate `image_upload` suggestion behind `name`/`price` presence.
- `src/components/ai-campaign/AIChatPanel.tsx` — accept dynamic `placeholder` prop.
- `src/pages/AICampaignBuilder.tsx` — compute and pass `placeholder` based on `phase` and `currentItemDraft`.

### 7. Out of scope
- Redesigning the items collection flow.
- Letting the user upload multiple images per item.
- Editing items already saved (handled in regular editor).

