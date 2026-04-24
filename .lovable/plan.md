

## Goal
Remove all uses of the `.font-serif` CSS class from the three identified files to ensure consistent sans-serif typography across the application.

## Changes

### 1. `src/pages/MyFundraising.tsx`
Remove `font-serif` class from:
- Line 824: `<div className="text-4xl font-semibold leading-none">` (Lifetime raised amount)
- Line 867: `<div className="text-4xl font-semibold leading-none text-foreground">` (Supporters count)
- Line 897: `<div className="text-4xl font-semibold leading-none text-foreground">` (Best rank display)
- Line 1067: `<h3 className="text-2xl font-semibold leading-tight text-foreground">` (Campaign name in card)
- Line 1132: `<span className="text-lg font-semibold text-foreground">` (Raised amount in stat strip)
- Line 1239: `<p className="mt-1.5 text-lg font-semibold text-foreground">` (StatColumn component value)
- Line 1293: `<p className="truncate text-base font-semibold text-foreground">` (Compact campaign row name)
- Line 1332: `<h3 className="text-2xl font-semibold mb-2">` (Empty state heading)

### 2. `src/pages/Campaigns.tsx`
Remove `font-serif` class from:
- Line 543: `<p className="mt-1.5 text-lg font-semibold text-foreground">` (StatColumn component value)
- Line 628: `<h3 className="text-2xl font-semibold leading-tight text-foreground">` (Campaign name in CampaignManagerCard)
- Line 666: `<span className="text-lg font-semibold text-foreground">` (Raised amount in goal column)

### 3. `src/components/player/PitchWizard.tsx`
Remove `font-serif` class from:
- Line 140: `<h2 className="text-2xl font-semibold tracking-tight">` (Header title)
- Line 285: `<h3 className="text-xl font-semibold tracking-tight">` (MessageStep heading)
- Line 343: `<h3 className="text-xl font-semibold tracking-tight">` (HeadshotStep heading)
- Line 422: `<h3 className="text-xl font-semibold tracking-tight">` (RecordStep heading)

## Verification
- All headings and large numbers in MyFundraising, Campaigns, and PitchWizard use sans-serif font (Inter/system default) instead of Fraunces serif.
- No visual regressions in typography hierarchy — font-semibold and text size classes remain intact.
- No other files are affected.

