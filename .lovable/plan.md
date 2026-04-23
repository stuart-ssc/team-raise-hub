

## Goal
Move the verified-business explanatory copy ("You can add missing details and disengage contacts...") out of the standalone green info banner and into a **hover tooltip on the existing "Verified" pill/badge** in the business header. This declutters the page while keeping the guidance discoverable.

## Changes

### `src/pages/BusinessProfile.tsx`
- **Remove** the green info banner block that currently renders below the header when `isVerified && !isSystemAdmin` (the one shown in the uploaded screenshot).
- **Wrap the existing "Verified" badge/pill** in a `Tooltip` (using `@/components/ui/tooltip` — `Tooltip`, `TooltipTrigger`, `TooltipContent`, with a `TooltipProvider` if not already present higher in the tree).
- Tooltip content (shown on hover/focus of the pill):
  > **This business is verified**
  > You can add missing details and disengage contacts, but existing values are managed by the business owner. Contact Sponsorly support to change a value that's already set.
- Tooltip styling: default shadcn tooltip (small, dark background, white text), `max-w-xs` so the copy wraps cleanly. Show for both org users and system admins so the context is always available on hover (system admins see the same copy — it's informational, not a permission gate).
- Keep the pill itself visually unchanged (current green "Verified" treatment).
- Ensure the badge has `tabIndex={0}` (or is wrapped in a button-like trigger) so the tooltip is keyboard-accessible.

## Files touched
- `src/pages/BusinessProfile.tsx`

## Verification
- The standalone green "This business is verified" banner no longer appears on `/dashboard/businesses/:id`.
- Hovering (or keyboard-focusing) the green "Verified" pill in the header shows a tooltip with the same explanatory copy.
- Tooltip is readable, wraps within ~20rem, and dismisses on mouseout/blur.
- All other behavior (Edit dialog field locks, Disengage actions, Link Employee gating) is unchanged.

