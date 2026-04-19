

## Issue
The middle column's Card sits ~16px lower than the left/right cards on desktop.

**Cause**: `<main className="lg:col-span-6 space-y-4">` contains the mobile nav trigger (`<div className="lg:hidden">…</div>`) as its first child. Tailwind's `space-y-4` uses `> * + *` adjacent sibling selectors, which still apply margin even when the first sibling is `display:none`. So the Card gets a `margin-top` on desktop even though the trigger is hidden.

## Fix
In `src/pages/CampaignEditor.tsx`, move the mobile nav trigger OUTSIDE the `space-y-4` container, OR conditionally render it instead of using `lg:hidden`. Cleanest option: wrap the trigger so it doesn't participate as a `space-y-*` sibling on desktop.

**Change** (line ~618):

Replace:
```tsx
<main className="lg:col-span-6 space-y-4">
  <div className="lg:hidden">
    <Button ...>...</Button>
  </div>
  <Card>...</Card>
  ...
</main>
```

With:
```tsx
<main className="lg:col-span-6">
  <div className="lg:hidden mb-4">
    <Button ...>...</Button>
  </div>
  <div className="space-y-4">
    <Card>...</Card>
    {SECTION_META[activeSection].showSave && (
      <div className="flex justify-end">...</div>
    )}
  </div>
</main>
```

This keeps the mobile trigger as a standalone element with its own bottom margin (only when visible), and the inner wrapper handles vertical spacing for the Card + Save button without being affected by the hidden trigger.

## File touched
- `src/pages/CampaignEditor.tsx`

## Out of scope
- Any other layout, styles, or content changes.

