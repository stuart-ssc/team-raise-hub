

## Goal
Collapse the campaign editor header action buttons (Publish, Preview, Copy Link, Delete) into a dropdown menu on screens smaller than desktop. Keep "Save Campaign" always visible as the primary action.

## Investigation
- Header in `src/pages/CampaignEditor.tsx` shows 5 buttons in a row: `CampaignQuickActions` (Publish/Preview/Copy Link), Delete, Save Campaign.
- At <1024px (below `lg`) on tablets/mobile these wrap awkwardly.
- `Save Campaign` should remain a standalone visible button (primary CTA); the rest collapse into a "More actions" dropdown.

## Plan

### 1. Responsive split in `CampaignEditor.tsx`
- Wrap the existing `CampaignQuickActions` + Delete button group in a `hidden lg:flex` container (visible only on desktop ≥1024px).
- Add a new `lg:hidden` block containing a `DropdownMenu` triggered by a "More" button (MoreVertical icon).
  - Menu items: Publish/Unpublish, Preview (if slug), Copy Link (if slug), Delete (if eligible).
  - Each menu item runs the same handler as the desktop button.
- `Save Campaign` stays outside both branches, always visible.

### 2. Refactor handlers for reuse
- Lift the publish dialog state, copy-link, and preview handlers from inside `CampaignQuickActions` up to `CampaignEditor.tsx` OR — simpler — add an optional `renderAsMenuItems` prop to `CampaignQuickActions` and a `compact` mode.
- Chosen approach: **inline the mobile dropdown directly in `CampaignEditor.tsx`** to avoid restructuring `CampaignQuickActions`. Reuse the existing publish/preview/copy handlers (small duplication acceptable; keeps component contracts stable).

### 3. Files to change
- `src/pages/CampaignEditor.tsx` — add responsive wrappers, mobile DropdownMenu with the four actions, MoreVertical trigger.

### 4. Out of scope
- No visual redesign of buttons themselves on desktop.
- No changes to `CampaignQuickActions.tsx` internals.
- No changes to delete/publish behavior or eligibility rules.

