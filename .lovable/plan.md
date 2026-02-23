

# Unify Campaign Card Layout for All Campaign Types

## Problem
The Season Pass campaign card looks different because the code has two completely separate layout paths:
- **Roster campaigns**: Progress bar and stats are in the upper info section, action buttons are in the lower section
- **Non-roster campaigns**: The info section is empty (`null`), and progress + stats + buttons are all stacked together in the lower section

This creates a visually different layout even though the content is the same. There's also a "Team Campaign" badge that only appears on non-roster campaigns.

## Changes

### 1. `src/pages/FamilyDashboard.tsx`

**Remove the "Team Campaign" badge** (lines 697-699) -- since the user wants identical layout regardless of roster status.

**Show progress in the info section for ALL campaigns** (lines 702-728): Instead of only showing progress when `hasPersonalLink`, show it for all campaigns. The only difference is roster campaigns may also show rank. Change the condition so that non-roster campaigns also get progress, donations, and supporters displayed in the same location.

**Unify the action buttons section** (lines 731-822): Instead of two completely different branches (one for personal link, one without), use a single layout. The only variable is the URL used: personal URL for roster campaigns, main campaign URL for non-roster campaigns.

The result: every campaign card has the same structure:
- Campaign name + optional rank badge
- Progress bar with raised/goal amounts
- Donation and supporter counts
- Copy, Share, QR buttons (using either personal URL or campaign URL)

### 2. `src/pages/MyFundraising.tsx`

Apply the same unification so non-roster campaigns match the layout of roster-enabled campaigns, with only the URL differing.

## Technical Details

The key change is replacing the branching structure:

```text
Before:
  INFO SECTION:
    if hasPersonalLink -> show progress
    else if rosterEnabled -> show "not set up"
    else -> null
  ACTIONS SECTION:
    if hasPersonalLink -> show buttons
    else -> show progress + buttons (duplicated)

After:
  INFO SECTION:
    Always show progress (if data available)
    if rosterEnabled && !hasPersonalLink -> show "not set up" message
    if hasPersonalLink -> also show rank
  ACTIONS SECTION:
    url = hasPersonalLink ? personalUrl : campaignUrl
    Always show Copy/Share/QR buttons using url
```

| File | Change |
|------|--------|
| `src/pages/FamilyDashboard.tsx` | Remove "Team Campaign" badge, unify progress + button layout for all campaign types |
| `src/pages/MyFundraising.tsx` | Same unification of layout structure |

