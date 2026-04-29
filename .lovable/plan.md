## Fix the clipped "0" in the dashboard headline

### What's happening
On `/dashboard`, the headline reads `{org} raised $0 toward $50,000.` The dollar amount spans use:
- `italic`
- `bg-gradient-to-r ... bg-clip-text text-transparent` (gradient fill clipped to glyph shape)

…inside an `<h1>` with `leading-tight`. Browsers compute the glyph bounding box for `bg-clip-text` slightly tighter than the actual glyph extent. With italic (which leans right and dips below the baseline) plus tight line-height, the bottom curve of round glyphs like `0` gets visually clipped.

### Fix
In `src/pages/Dashboard.tsx` (lines 865–875), adjust the gradient `<span>` elements so the glyph descenders aren't clipped:

1. Add `inline-block pb-1` (or `leading-[1.15] pb-[2px]`) to each gradient `<span>` so the clipping box has breathing room below the baseline.
2. Add `pr-[2px]` to compensate for the italic slant on the right edge of the last digit.
3. Optionally relax the `<h1>`'s `leading-tight` to `leading-[1.2]` so the line itself has enough vertical room.

Resulting span pattern:
```tsx
<span className="inline-block italic pb-1 pr-[2px] bg-gradient-to-r from-primary-foreground to-primary-foreground/70 bg-clip-text text-transparent">
  ${totalAmountRaised.toLocaleString()}
</span>
```

### Files to edit
- `src/pages/Dashboard.tsx` — both gradient `<span>`s on lines 867–869 and 871–873, and the `<h1>` className on line 865.

### Verification
After the change, reload `/dashboard` and confirm the bottoms of the `0`s in `$0` and `$50,000` render cleanly with no clipping at the typical 1450px viewport.
