

## Goal
Fix the verified pill so hovering it (1) does not change the cursor to a "?" help cursor, (2) actually displays the tooltip content, and (3) shifts to a higher-contrast color on hover instead of staying green-on-green.

## Changes

### `src/pages/BusinessProfile.tsx` — `getVerificationBadge("verified")` block

- **Remove** the `cursor-help` class. Use the default cursor (or `cursor-default`).
- **Change hover styling** so the badge inverts to a solid green background with white text on hover/focus:
  - Base: `bg-green-500/10 text-green-700 dark:text-green-400`
  - Hover/focus: `hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white`
  - Add `transition-colors` for a smooth swap.
- **Fix the missing tooltip content**:
  - Wrap the `Badge` in a `<span>` inside `TooltipTrigger asChild` (Radix `asChild` requires a single forwardRef-capable child; `Badge` is a plain `div` that may swallow the trigger ref/events when nested inside header layout flex). Use `<button type="button">` as the trigger element so it's reliably focusable, keyboard-accessible, and Radix can attach handlers cleanly. Style the button as `inline-flex` with no default button chrome.
  - Ensure the `TooltipContent` has `side="bottom"` and `sideOffset={6}` so it isn't clipped by the header card.
  - Keep `TooltipProvider` with `delayDuration={150}`.

### Resulting markup (sketch)
```tsx
<TooltipProvider delayDuration={150}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center rounded-full border border-transparent
                   px-2.5 py-0.5 text-xs font-semibold transition-colors
                   bg-green-500/10 text-green-700 dark:text-green-400
                   hover:bg-green-600 hover:text-white
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ShieldCheck className="h-3 w-3 mr-1" />
        Verified
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={6} className="max-w-xs">
      <p className="font-semibold mb-1">This business is verified</p>
      <p className="text-xs">
        You can add missing details and disengage contacts, but existing values
        are managed by the business owner. Contact Sponsorly support to change
        a value that's already set.
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Files touched
- `src/pages/BusinessProfile.tsx`

## Verification
- Hovering the green "Verified" pill no longer shows a "?" cursor — it's the default arrow.
- On hover, the pill turns solid green with white text and white shield icon (clearly indicating interactivity).
- The tooltip with "This business is verified" + explanatory copy reliably appears below the pill within ~150ms of hover and on keyboard focus.
- Tooltip dismisses on mouseout / blur. No layout shift.
- Other verification states ("Pending", "Blocked", "Unverified") are unchanged.

