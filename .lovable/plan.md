

# Fix: Remove "Team campaign without individual tracking" Message

## Problem
The Season Pass campaign (which is not roster-enabled) still shows "This is a team campaign without individual tracking." in the info section above the action buttons. The progress bar was added below in the actions area, but this old message was never removed.

## Changes

### 1. `src/pages/FamilyDashboard.tsx` (lines 728-732)
Remove the else branch that shows the "team campaign" message. Replace with nothing (or close the conditional without that fallback), since progress is now shown in the actions section below for all campaigns.

The conditional chain currently is:
```
if (stat.hasPersonalLink) { ...show personal link stats... }
else if (stat.enableRosterAttribution) { ...show "not set up yet"... }
else { "This is a team campaign without individual tracking." }  <-- REMOVE
```

### 2. `src/pages/MyFundraising.tsx` (lines 547-550)
Same fix -- remove the "Team campaign without individual tracking" fallback text, since progress is now displayed for all campaign types.

## Summary

| File | Change |
|------|--------|
| `src/pages/FamilyDashboard.tsx` | Remove "team campaign without individual tracking" else branch (lines 728-732) |
| `src/pages/MyFundraising.tsx` | Remove "Team campaign without individual tracking" else branch (lines 547-550) |

Two small deletions, no new code needed.

