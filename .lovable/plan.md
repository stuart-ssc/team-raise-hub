

Refocus the chat textarea after a message is sent so the user can type their next reply immediately.

## Change
In `src/components/ai-campaign/AIChatPanel.tsx`:
- After `isLoading` transitions from `true` → `false` (AI response received), call `textareaRef.current?.focus()`.
- Implement via a `useEffect` watching `isLoading`, only focusing when it becomes false and the textarea isn't disabled.
- Also focus immediately after `handleSend` (optimistic), so the cursor stays in place during the "Thinking..." state.

## File
- `src/components/ai-campaign/AIChatPanel.tsx` — add a `useEffect` on `isLoading` and a `.focus()` call in `handleSend`.

No other files affected.

