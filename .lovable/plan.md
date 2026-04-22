

## Goal
Replace each "Share" icon/button on campaign cards with a popover offering quick links to Email, Facebook, Twitter/X, and Instagram, plus a fallback "More…" option for native share. Apply across Player Dashboard, My Fundraising, and Family Dashboard wherever a Share button currently exists.

## Mockup of new behavior
Clicking the Share icon opens a small popover:
```text
┌─────────────────────────┐
│ ✉  Email                │
│ ⓕ  Facebook             │
│ 𝕏  Twitter / X          │
│ ⌾  Instagram            │
│ ───────────────         │
│ ⤴  More…                │
└─────────────────────────┘
```

## Changes

### 1. New shared component: `src/components/ShareMenu.tsx`
A reusable popover wrapping any trigger.

```ts
interface ShareMenuProps {
  url: string;
  title: string;            // e.g. "Support Taylor in Spring Fundraiser"
  text?: string;            // optional message body for email/social
  children: React.ReactNode; // trigger element (renders inline)
}
```

Uses the existing `Popover` primitive (`@/components/ui/popover`) with these actions:

- **Email** → `mailto:?subject={encodedTitle}&body={encodedText}%0A%0A{encodedUrl}` (opens user's email client)
- **Facebook** → opens `https://www.facebook.com/sharer/sharer.php?u={encodedUrl}` in a new tab
- **Twitter/X** → opens `https://twitter.com/intent/tweet?text={encodedTitle}&url={encodedUrl}` in a new tab
- **Instagram** → no web share intent exists. Copy the URL to the clipboard, toast "Link copied — paste into your Instagram story or DM", and open `https://www.instagram.com/` in a new tab.
- **More…** (only shown if `navigator.share` exists) → calls native share sheet

Icons from `lucide-react`: `Mail`, `Facebook`, `Twitter`, `Instagram`, `Share2`. Buttons styled as full-width `ghost` rows with icon + label, matching existing menu patterns.

### 2. Wire `ShareMenu` into all share buttons

**`src/pages/MyFundraising.tsx`**
- Remove the `onShare` prop from `CampaignCard` (and `shareLink` in the parent).
- Replace the `IconBtn label="Share"` with:
  ```tsx
  <ShareMenu url={shareUrl} title={`Support ${stat.childName ?? "us"} in ${stat.campaignName}`}>
    <IconBtn label="Share"><Share2 className="h-4 w-4" /></IconBtn>
  </ShareMenu>
  ```

**`src/components/PlayerDashboard.tsx`**
- Wrap each of the 5 Share `<Button>` instances with `<ShareMenu url={...} title={...}>…</ShareMenu>`. Reuse the existing `shareTitle`/`shareText` strings already built in `shareLink` so messaging stays consistent.
- Remove the `shareLink` helper since it's no longer used.

**`src/pages/FamilyDashboard.tsx`**
- Wrap the per-campaign Share button in a `<ShareMenu>` with title `Support ${stat.childName}'s Fundraiser`.
- Leave the page-level "Share All Links" button untouched — it shares a multi-link block of text and remains a native-share action.
- Remove the per-link `shareLink` helper.

### 3. Notes
- `IconBtn` already renders a `<button>`. To use it as a Popover trigger, wrap with `<PopoverTrigger asChild>` so the popover library forwards refs to the button.
- Popovers anchor below-end of the trigger (`align="end"`), width `w-56`.
- No new dependencies required.
- Existing native-share behavior is preserved as the "More…" item so users on iOS/Android keep one-tap access to their full share sheet.

## Out of scope
- Pre-rendering an Open Graph image preview inside the popover.
- Tracking which channel each share was sent through.
- Anything outside the three campaign-share surfaces above (e.g. the campaign editor's `CampaignShareCard` already has its own dedicated layout and is unchanged).

## Files touched
1. `src/components/ShareMenu.tsx` — new shared popover.
2. `src/pages/MyFundraising.tsx` — wire `ShareMenu`, drop `shareLink`/`onShare`.
3. `src/components/PlayerDashboard.tsx` — wire `ShareMenu` on all 5 Share buttons, drop `shareLink`.
4. `src/pages/FamilyDashboard.tsx` — wire `ShareMenu` on per-link Share, drop per-link `shareLink`.

## Verification
- Clicking any campaign Share icon opens the popover with Email, Facebook, Twitter/X, Instagram (and "More…" on supported devices).
- Email opens the mail composer with subject/body/URL prefilled.
- Facebook and Twitter/X open their share intents in a new tab with the link prefilled.
- Instagram copies the URL, toasts the user, and opens instagram.com.
- "More…" still triggers the native share sheet on supported devices.

