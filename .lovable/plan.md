

## Goal
Move `AI Insights` (DonorInsightsPanel) back into the left column on the donor profile, positioned as the **second** card (between Giving History and Activity Timeline). Make it collapsible and **collapsed by default**, matching the pattern used for Timeline and Communications.

## Changes

### `src/pages/DonorProfile.tsx`

1. **Remove** `<DonorInsightsPanel donorId={donor.id} />` from the right sidebar (currently between Business Affiliations / List Memberships and Notes).
2. **Insert** it in the left column directly after the Giving History `Collapsible` block and before the Activity Timeline block.
3. **Wrap** it in a `Card` + `Collapsible` using the same pattern as Timeline/Communications, with its own state:
   ```tsx
   const [insightsOpen, setInsightsOpen] = useState(false);
   ```
   Header shows title + `Sparkles` icon + rotating `ChevronDown`. Body renders `<DonorInsightsPanel donorId={donor.id} />` inside `<CardContent className="p-0 border-t">` so the nested card aligns cleanly.

### Resulting left column order
```text
Stats Cards (3 tiles)
Giving History          (open by default)
AI Insights             (collapsed by default)  ← moved here
Activity Timeline       (collapsed by default)
Communication History   (collapsed by default)
```

### Right sidebar after change
```text
Contact Information
Business Affiliations
List Memberships
Notes
```

## Files touched
- `src/pages/DonorProfile.tsx`

## Verification
- AI Insights no longer renders in the right sidebar.
- AI Insights appears in the left column as the second card, between Giving History and Activity Timeline.
- On page load: Giving History expanded; AI Insights, Activity Timeline, and Communication History all collapsed.
- Clicking the AI Insights header toggles it; chevron rotates 180°.
- No regressions to data fetching or participant-view permission gating.

