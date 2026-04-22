

## Goal
Eliminate the duplicate "AI-Powered Donor Insights" heading inside the panel so the section shows only the outer collapsible header. Update the outer header's description to the longer sentence and keep the blue gradient background on the inner card.

## Changes

### `src/pages/DonorProfile.tsx`
Update the outer collapsible header description:
- Replace `"AI-generated recommendations and analysis"` with `"Personalized recommendations based on giving patterns, engagement history, and behavior analysis"`.

### `src/components/DonorInsightsPanel.tsx`
Inside the panel's `CardHeader`:
- **Remove** the inner title row (`Sparkles` + `<CardTitle>AI-Powered Donor Insights</CardTitle>`).
- **Remove** the inner `<CardDescription>` (now duplicated by the outer header).
- **Keep** the `<Button>` (Generate Insights / Refresh).
- Keep the `Card` wrapper's blue gradient classes (`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20`) so the body retains its blue tint.
- Since the header now contains only a button, simplify the wrapper from `space-y-3` to no extra spacing, or wrap the button alone. The `CardHeader` padding still provides breathing room above the body content.

### Resulting structure
```text
[Outer Card header — Sparkles • "AI Insights" • description • chevron]
  └─ (collapsible body, blue gradient)
       [Generate Insights / Refresh button]
       [Insights body or empty-state alert]
```

## Files touched
- `src/pages/DonorProfile.tsx`
- `src/components/DonorInsightsPanel.tsx`

## Verification
- Only one "AI Insights" heading appears (the outer collapsible header).
- Outer description reads: "Personalized recommendations based on giving patterns, engagement history, and behavior analysis".
- The inner panel still has the blue gradient background.
- Generate Insights / Refresh button still works; insights body unchanged.
- No duplicate Sparkles icons stacked vertically.

