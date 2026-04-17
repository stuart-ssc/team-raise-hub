
The user wants the suggestion chips redesigned to look more like Claude's prompt UI — a distinct, prominent card-like prompt with numbered, tappable rows below the assistant message, instead of small outline buttons inline.

Looking at the screenshot:
- A bordered card sits below the message
- A question/header at top with a dismiss (X) button
- Each option is a full-width row with a number badge (1, 2, 3...), label, and an enter/return icon on the right
- Hover state shows highlight
- A "Something else" free-text option at the bottom with a "Skip" button
- Keyboard hints at the bottom: "↑↓ to navigate · Enter to select · Esc to skip"

## Plan

Redesign suggestion rendering in `src/components/ai-campaign/AIChatPanel.tsx`:

### New SuggestionPrompt component (inline or separate file)
A bordered card rendered below the latest assistant message containing:
- **Header row**: the suggestion `label` (e.g. "Campaign type") + small X dismiss button (dismisses just the prompt for this turn — local state)
- **Option rows**: full-width clickable rows, each with:
  - Numbered badge (1, 2, 3, 4…) on the left
  - Option label
  - Return/Enter arrow icon on the right (visible on hover/selected)
  - Hover background highlight using `hover:bg-accent`
- **Free-text row** at bottom: pencil icon + "Type your answer..." placeholder + "Skip" button (clicking "Skip" sends a "skip" message; typing falls back to normal textarea)
- **Keyboard hints footer**: small muted text "↑↓ to navigate · Enter to select · Esc to skip"

### Keyboard navigation
- Track `selectedIndex` with arrow keys when prompt is visible
- Enter selects highlighted option → calls `onSend(option.label)`
- Esc dismisses the prompt
- Number keys (1–9) directly select corresponding option
- Auto-attach key listener on `window` only when prompt is visible

### Styling
- Card: `border rounded-lg bg-background` matching app theme
- Number badge: small circular/square muted background (`bg-muted text-muted-foreground text-xs`)
- Use existing design tokens (no hardcoded colors)
- Full width within the messages area (not constrained to 85%)

### Behavior
- Only the latest assistant message's suggestions render as a prompt card (existing logic preserved)
- Once user clicks/selects/dismisses, prompt collapses naturally on next message
- Existing chip-button rendering removed

### File
- `src/components/ai-campaign/AIChatPanel.tsx` — replace the chip rendering block with the new SuggestionPrompt card, add keyboard nav, dismiss state

No backend or other component changes needed — the data shape (`suggestions.options`) stays the same.
