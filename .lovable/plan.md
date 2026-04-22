

## Goal
Ensure the **Lifetime Raised**, **Unique Supporters**, and **Best Rank** hero cards always sit on one row at typical dashboard widths (matching the mockup), rather than wrapping to three rows.

## Root cause
The hero grid currently uses the `lg:` breakpoint (1024px viewport):

```tsx
<section className="grid gap-4 lg:grid-cols-10">
  <div className="lg:col-span-4 ...">  {/* Lifetime Raised  */}
  <div className="lg:col-span-3 ...">  {/* Supporters */}
  <div className="lg:col-span-3 ...">  {/* Best Rank */}
```

Below `lg`, the section falls back to a single-column grid → all three cards stack vertically (3 rows). At the user's 1336px viewport the sidebar (`lg:w-64` = 256px) and dashboard padding eat into available width, and any time the sidebar is expanded on a smaller monitor the cards stack. The mockup shows them on one row at desktop widths well under 1024px.

## Fix

**File: `src/pages/MyFundraising.tsx`** (only the hero section, lines ~609–624):

1. Lower the breakpoint from `lg:` to `md:` so the row activates at 768px viewport — comfortably fitting on a typical sidebar-included dashboard layout:
   ```tsx
   <section className="grid gap-4 md:grid-cols-10">
     <div className="md:col-span-4 [&>*]:h-full"> ... LifetimeRaisedCard ... </div>
     <div className="md:col-span-3 [&>*]:h-full"> ... SupportersCard ... </div>
     <div className="md:col-span-3 [&>*]:h-full"> ... BestRankCard ... </div>
   </section>
   ```
2. Keep proportions exactly as approved before: **40 / 30 / 30** (col-span 4 / 3 / 3 of 10).
3. Mobile (`<md`, i.e. <768px) still stacks one card per row — matches the mockup's mobile behavior.

## Verification
- At 1336px viewport (current user) → sidebar 256px + content padding ≈ 1040px content width → 10-col grid kicks in well below the threshold and renders 3 cards in one row.
- At narrow tablet (e.g. 800px) → still one row (cards become tighter but readable).
- At phone (<768px) → stacks vertically.

## Files touched
1. `src/pages/MyFundraising.tsx` — swap `lg:` → `md:` on the hero `<section>` and its three child `<div>` wrappers (3 class swaps total). No other changes.

## Out of scope
- Card internals (LifetimeRaisedCard, sparkline layout, fonts).
- Filter toolbar, campaign cards, parent view, edge functions.

