

# Show Campaign Progress for All Campaign Types

## Problem
Non-roster-enabled campaigns already have `totalRaised`, `personalGoal`, and `percentToGoal` data loaded, but the UI only shows the progress bar when the campaign has a personal link (roster-enabled). Non-roster campaigns skip straight to the action buttons with no progress info.

## Changes

### 1. `src/pages/FamilyDashboard.tsx` (around lines 770-810)

Add a progress section above the action buttons in the non-roster branch:

```
) : (
  <>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Campaign Progress</span>
        <span className="font-medium">
          ${stat.totalRaised.toFixed(2)} / ${stat.personalGoal.toFixed(2)}
        </span>
      </div>
      <Progress value={stat.percentToGoal} className="h-2" />
    </div>

    <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
      <span>{stat.donationCount} donations</span>
      <span>{stat.uniqueSupporters} supporters</span>
    </div>

    <div className="flex flex-wrap gap-2">
      <!-- existing View/Copy/Share/QR buttons stay as-is -->
    </div>
    ...QR code section...
  </>
)
```

### 2. `src/pages/MyFundraising.tsx` (around lines 683-707)

Same treatment -- add progress bar, stats row, then the action buttons:

```
) : (
  <>
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Campaign Progress</span>
        <span className="text-sm text-muted-foreground">
          ${totalRaised} / ${personalGoal}
        </span>
      </div>
      <Progress value={stat.percentToGoal} className="h-2" />
      <p className="text-xs text-muted-foreground mt-1">
        {stat.percentToGoal.toFixed(1)}% of goal reached
      </p>
    </div>

    <div className="grid grid-cols-3 gap-4 py-3 border-y">
      <div>Raised: ${stat.totalRaised}</div>
      <div>Supporters: {stat.uniqueSupporters}</div>
      <div>Avg. Gift: ${avg}</div>
    </div>

    <div className="flex flex-wrap gap-2 justify-center">
      <!-- existing View/Copy/Share/QR buttons stay as-is -->
    </div>
    ...QR code section...
  </>
)
```

## Summary

| File | Change |
|------|--------|
| `src/pages/FamilyDashboard.tsx` | Add progress bar + donation/supporter counts above action buttons for non-roster campaigns |
| `src/pages/MyFundraising.tsx` | Add progress bar + stats row above action buttons for non-roster campaigns |

No data fetching changes needed -- `totalRaised`, `personalGoal`, and `percentToGoal` are already populated for all campaign types.
