

The user wants the final "publish or open editor" choice to be answerable in the chat prompt as well — not only via the two preview-pane buttons. So the AI's final turn should emit a `choice` suggestion with chips, AND a typed response like "publish" / "open editor" should be honored.

## Current state
- `phase === "complete"` shows two buttons in `AICampaignPreview` (Publish / Open in Editor)
- AI's final message is text-only with no `suggestions` payload
- Chat already supports `choice`-type chips (`SuggestionPrompt`) and the numeric-shortcut mapping in `AIChatPanel`

## Fix

### A. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
- When `phase === "complete"`, return a `suggestions` payload:
  ```
  {
    type: "choice",
    field: "final_action",
    label: "What's next?",
    options: [
      { label: "Publish now", value: "publish" },
      { label: "Open in editor", value: "open_editor" }
    ]
  }
  ```
- Add deterministic handling: when `phase === "complete"` and the latest user message matches `publish` / `publish now` / `open editor` / `editor`, return a `finalAction` field (`"publish"` or `"open_editor"`) in the response so the frontend can act.

### B. `AICampaignBuilder.tsx`
- Capture `data.finalAction` from the AI response.
- If `finalAction === "publish"` → call `handlePublishClick()`.
- If `finalAction === "open_editor"` → call `handleOpenEditor()`.
- Acknowledgment message from AI ("Opening the editor…" / "Let's publish this.") still renders normally before the action fires.

### C. No frontend changes to `AIChatPanel` / `SuggestionPrompt`
- Existing chip rendering handles the new suggestion automatically.
- The numeric-shortcut mapping ("1" / "2") already works.

### Out of scope
- Preview-pane buttons stay as-is (redundant but useful)
- No schema changes
- Two-paragraph response format already enforced

