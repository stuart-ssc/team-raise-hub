

## Goal
Move the "Required Sponsor Assets" card above the "Campaign Items" card in the AI Campaign Builder preview, matching the order in which the questions are asked.

## Current state
In `src/components/ai-campaign/AICampaignPreview.tsx`:
- Lines 365–404: Campaign Items card
- Lines 406–end: Required Sponsor Assets card (only shown when `requires_business_info === true`)

Question flow in the edge function already asks for sponsor assets (deadline + asset list) **before** items collection begins, so swapping the cards aligns the visual with the conversational order.

## Change
**File:** `src/components/ai-campaign/AICampaignPreview.tsx`

Swap the two card blocks so Required Sponsor Assets renders first:

```
[Details]
[Extended Details]               (image / roster / directions)
[Required Sponsor Assets]        ← moved up
[Campaign Items]                 ← moved down
```

No logic, condition, or styling changes — just block reordering.

## Out of scope
- Changing the question order in the edge function (already correct: sponsor assets are asked before items)
- Changing the Extended Details card position (image/roster/directions remain above both)
- Any wording or content changes to the cards themselves

