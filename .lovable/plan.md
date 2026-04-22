
## Goal
Make the campaign cards on `/dashboard/my-fundraising` match the mockup more closely by preventing horizontal overflow and tightening the bottom action row so it always fits inside the card. The URL should truncate earlier instead of forcing the card wider.

## Root cause
In `src/pages/MyFundraising.tsx`, the campaign card’s bottom link/action bar currently gives too much space to the URL row and not enough layout control to the action group:

- The wrapper is `sm:flex-row sm:items-center`, so on desktop it becomes one horizontal row.
- The URL area is `flex min-w-0 flex-1`, but the action area is just `flex items-center gap-1` with several fixed-width icon buttons plus a full text CTA (`Re-record pitch`).
- Because the action group does not explicitly reserve/shrink/wrap cleanly, the row can exceed the available card width and visually overflow instead of compressing the URL first.

## Changes

### 1. Refactor the campaign card bottom action row
**File:** `src/pages/MyFundraising.tsx`  
**Component:** `CampaignCard`

Update the “Link bar” block (around lines 1143–1188) so it behaves like the mockup:

- Keep the whole bar on one row at desktop widths.
- Make the URL field the flexible/shrinkable part.
- Make the action buttons a non-growing, right-aligned group.
- Let the URL truncate aggressively rather than expanding the card.

Recommended structure:

```tsx
<div className="mt-5 flex flex-col gap-2 rounded-lg border bg-muted/40 px-3 py-2 lg:flex-row lg:items-center">
  <div className="min-w-0 flex-1">
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
      <Link2 className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate font-mono">{displayUrl}</span>
    </div>
  </div>

  <div className="flex shrink-0 items-center justify-end gap-1">
    ...icon buttons...
    ...pitch button...
  </div>
</div>
```

### 2. Prevent the action group from forcing overflow
Inside that same action group:

- Add `shrink-0` so the controls keep their intended size.
- Add `whitespace-nowrap` to the green pitch button so it stays compact and consistent.
- If needed, reduce the pitch button horizontal padding slightly so it matches the mockup better.

Recommended button adjustment:

```tsx
<Button
  size="sm"
  onClick={() => onTogglePitch(stat.campaignId)}
  className="ml-1 whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700"
>
```

If the button is still too long visually, shorten the label from `Re-record pitch` to `Re-record` only for this card row.

### 3. Make the URL container visually match the mockup
The mockup shows the URL inside its own softer inner field, not as a raw flex row competing with the buttons.

Adjust the URL block styling to:
- feel like a contained field
- use `truncate`
- avoid trying to display the full link

This is only a styling/layout change; no URL logic changes are needed.

### 4. Keep the rest of the card structure intact
Do not change:
- top header/title/date/rank row
- stat strip values
- roster/team badge logic
- QR/share/open/copy behavior
- pitch editor behavior

Only tighten the lower share/action section so the card fits the viewport correctly.

## Technical details
Current problematic section:
```tsx
<div className="mt-5 flex flex-col gap-2 rounded-lg border bg-muted/40 px-3 py-2 sm:flex-row sm:items-center">
  <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
    <Link2 className="h-4 w-4 shrink-0" />
    <span className="truncate font-mono">{displayUrl}</span>
  </div>
  <div className="flex items-center gap-1">
```

Proposed behavior:
- URL block: `min-w-0 flex-1`
- controls block: `shrink-0`
- inner URL text: `min-w-0 truncate`
- desktop row alignment at `lg:` or `md:` depending on best fit after implementation
- no horizontal overflow at the current 1427px dashboard viewport

## Files touched
1. `src/pages/MyFundraising.tsx` — update only the `CampaignCard` bottom link/action bar layout and spacing.

## Verification
After implementation, verify against the mockup:
- The card fits fully within the content column.
- No horizontal overflow on the current `/dashboard/my-fundraising` viewport.
- The URL truncates instead of pushing the row wider.
- The icon buttons and green pitch button remain aligned on the right.
- Banner Sales and Donation Station rows both visually fit like the mockup.
