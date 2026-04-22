

## Goal
Force the three hero cards (Lifetime Raised / Unique Supporters / Best Rank) onto a single row at all desktop/tablet widths, matching the mockup the user uploaded.

## Root cause (most likely)
The current grid uses `md:grid-cols-10` with `md:col-span-4 / 3 / 3`. Tailwind v3 ships `grid-cols-1` through `grid-cols-12` by default, so `grid-cols-10` should work — but in this project's build the cards are still rendering stacked at 1336px, indicating either the custom 10-col grid is not applying as expected or one of the child wrappers (`[&>*]:h-full` on a div containing a `Card`) is collapsing the layout.

Switch to a more bulletproof, conventional approach using **flexbox with fractional widths** so behavior is unambiguous and not reliant on a 10-column track that may not be picked up.

## Fix

**File: `src/pages/MyFundraising.tsx`** — replace the hero `<section>` (lines ~609–624):

```tsx
<section className="flex flex-col md:flex-row gap-4">
  <div className="md:basis-2/5 md:flex-1 [&>*]:h-full">
    <LifetimeRaisedCard
      amount={totalRaisedAll}
      campaignCount={stats.length}
      potShare={teamPotShare}
      sparkline={sparkline}
    />
  </div>
  <div className="md:basis-3/10 md:flex-1 [&>*]:h-full">
    <SupportersCard count={totalSupportersAll} />
  </div>
  <div className="md:basis-3/10 md:flex-1 [&>*]:h-full">
    <BestRankCard rank={bestRank} campaignName={bestRankCampaign} />
  </div>
</section>
```

Since Tailwind doesn't ship `basis-3/10` by default, use arbitrary values to guarantee correct widths (40 / 30 / 30) regardless of build config:

```tsx
<section className="flex flex-col md:flex-row gap-4">
  <div className="md:w-2/5 [&>*]:h-full">       {/* 40% */}
    <LifetimeRaisedCard ... />
  </div>
  <div className="md:w-[30%] [&>*]:h-full">     {/* 30% */}
    <SupportersCard ... />
  </div>
  <div className="md:w-[30%] [&>*]:h-full">     {/* 30% */}
    <BestRankCard ... />
  </div>
</section>
```

`md:flex-row` activates the horizontal row at ≥768px, so at the user's 1336px viewport (with sidebar) all three sit side-by-side. Below 768px they stack — matches mockup mobile behavior.

Gap of `gap-4` (16px) between cards is absorbed by flexbox without breaking the percentages (rows total 100% but flex wrap is off, so widths simply shrink slightly to accommodate the gaps — visually identical to mockup).

## Files touched
1. `src/pages/MyFundraising.tsx` — replace the hero section's grid wrapper with the flex-row variant above (one section, three child divs). No changes to card internals or any other section.

## Out of scope
- LifetimeRaisedCard / SupportersCard / BestRankCard internal layout.
- Filter toolbar, campaign cards, parent banner, edge functions, tailwind config.

