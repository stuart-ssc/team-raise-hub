

## Changes

### 1. Rename "Setup Steps" → "Extended Details"
**File:** `src/components/ai-campaign/AICampaignPreview.tsx` (line ~241)
Change `<CardTitle>Setup Steps</CardTitle>` to `Extended Details`.

### 2. Fix toast overlap with chat
The toasts are rendered by `sonner` (`<Toaster />` in root). They appear top-right by default and overlap the chat panel on this page. Two issues:
- **Position**: They land over the chat content area.
- **Persistence**: They don't auto-dismiss (likely no `duration` set, or `duration: Infinity` somewhere).

Need to investigate during impl:
- Check `src/main.tsx` / `src/App.tsx` for `<Toaster />` configuration.
- Check `src/pages/AICampaignBuilder.tsx` toast calls — confirm they don't pass `duration: Infinity` or have `id` collisions preventing dismissal.

**Fix approach:**
- Ensure each `toast.success(...)` call uses a default duration (3–4s) — explicitly set `duration: 4000` on the draft-saved and item-added toasts.
- Reposition the global `<Toaster />` to `bottom-right` (or `bottom-center`) so it never covers the chat input/messages on the AI builder page.

## Files to change
- `src/components/ai-campaign/AICampaignPreview.tsx` — rename card title.
- `src/pages/AICampaignBuilder.tsx` — add explicit `duration: 4000` to draft-saved and item-added toast calls.
- `src/App.tsx` (or wherever `<Toaster />` lives) — set `position="bottom-right"` to avoid chat overlap.

## Out of scope
- No edge function or phase-logic changes.
- No restructuring of the preview card order.

