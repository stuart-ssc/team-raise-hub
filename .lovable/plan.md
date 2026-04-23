

## Goal
Eliminate duplicate headings on Activity Timeline and Communication History, and make all collapsible cards feel visually continuous from header to body — no separator line, no nested card wrapper, and AI Insights fully blue from top to bottom.

## Changes

### `src/pages/DonorProfile.tsx`

For all four collapsible cards (Giving History, AI Insights, Activity Timeline, Communication History):
- Remove `border-t` from the inner `<CardContent>` so there's no separator line between the header and the body.

**AI Insights card (make fully blue):**
- Move the blue gradient classes (`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20`) onto the **outer** `<Card>` wrapper so the entire card — header included — is blue.
- Inside `<CollapsibleContent>`, render `<DonorInsightsPanel donorId={donor.id} />` directly (no extra `CardContent` padding wrapper that creates visual nesting), or use `<CardContent className="p-0">` so padding comes from the inner panel only.

**Activity Timeline card:**
- `<DonorActivityTimeline />` renders its own `<Card>` + `<CardHeader>` with title "Activity Timeline" and description "Recent interactions and engagement history" — this is the duplicate.
- Render the timeline body directly without its outer Card/Header. Pass a prop like `bare` (or `hideHeader`) to `DonorActivityTimeline`, OR refactor the component to skip its own `<Card><CardHeader>…</CardHeader>` wrapper when used inside a parent Collapsible.

**Communication History card:**
- The body currently lives inline in `DonorProfile.tsx`. Verify there is no nested `<CardHeader>` rendering "Communication History" inside `<CollapsibleContent>`. If a duplicate title block exists in the body, remove it. Keep only the outer collapsible header.

### `src/components/DonorActivityTimeline.tsx`
- Add an optional `hideHeader?: boolean` prop. When true, render only the inner timeline list (no outer `<Card>`, no `<CardHeader>` with title/description, no loading-state Card wrapper — just the skeleton/empty/list content).
- Used by `DonorProfile.tsx` as `<DonorActivityTimeline donorId={donor.id} hideHeader />`.

### `src/components/DonorInsightsPanel.tsx`
- Remove the inner `<Card>` wrapper entirely (since the outer card is now blue). Render the `<CardHeader>` (with the Generate/Refresh button) and the body content as plain fragments.
- Alternatively, keep a minimal wrapper with no background/border classes so spacing is preserved without creating a visible nested card.

### Resulting structure (each card)
```text
[Card outer — header click target, chevron, hover bg, NO border between header & body]
  └─ Body content flows directly under header (same background, no separator)
```

AI Insights specifically:
```text
[Blue Card — blue header + blue body, fully continuous]
```

## Files touched
- `src/pages/DonorProfile.tsx`
- `src/components/DonorActivityTimeline.tsx`
- `src/components/DonorInsightsPanel.tsx`

## Verification
- No duplicate "Activity Timeline" or "Communication History" headings.
- No horizontal separator line between any collapsible header and its body.
- AI Insights card is fully blue from header through body — no white inner card visible.
- Giving History, Activity Timeline, and Communication History bodies sit directly under their headers with the same white background.
- All collapse/expand toggles still work; chevrons rotate; default open/collapsed states unchanged.

