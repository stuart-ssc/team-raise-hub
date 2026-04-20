

## Goal
Apply a light green gradient background to the "My Family Members" card on the player dashboard to match the mockup style.

## Change
In `src/components/PlayerDashboard.tsx`, locate the `<ManageGuardiansCard />` render in the player (non-parent) branch and wrap it (or pass styling) so the card surface uses a soft green gradient.

Since `ManageGuardiansCard` renders its own `<Card>`, the cleanest path is to update `src/components/ManageGuardiansCard.tsx` directly: add a gradient class to the root `<Card>`:

```tsx
<Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-white border-emerald-100">
```

- Uses Tailwind's emerald/green-50 tones for a soft, on-brand accent (no harsh color, stays minimal).
- Keeps the existing border but tints it lighter green so the edge blends.
- Header icon (`Users`) gets `text-emerald-600` to tie the accent together.
- All other content (text, buttons) remains unchanged so contrast stays accessible.

## Files touched
1. `src/components/ManageGuardiansCard.tsx` — add gradient classes to root `<Card>` and tint header icon.

## Out of scope
- Any other card backgrounds, parent-view restyle, hero section, or layout changes.

