

## Goal
Make the three left-column cards on the donor profile (`Giving History`, `Activity Timeline`, `Communication History`) collapsible. Default state: **Giving History open**, **Activity Timeline collapsed**, **Communication History collapsed**.

## Changes

### `src/pages/DonorProfile.tsx`

Wrap each of the three left-column cards in a `Collapsible` from `@/components/ui/collapsible`. Convert the existing `CardHeader` into a `CollapsibleTrigger` (full-width, clickable, with a `ChevronDown` that rotates on open). Move the `CardContent` into `CollapsibleContent` so the body hides when closed.

Add three independent open-state values:
```tsx
const [givingOpen, setGivingOpen] = useState(true);
const [timelineOpen, setTimelineOpen] = useState(false);
const [commsOpen, setCommsOpen] = useState(false);
```

Pattern applied to each card (example for Giving History):
```tsx
<Card>
  <Collapsible open={givingOpen} onOpenChange={setGivingOpen}>
    <CollapsibleTrigger asChild>
      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors flex flex-row items-center justify-between">
        <div>
          <CardTitle>Giving History</CardTitle>
          <CardDescription>…</CardDescription>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${givingOpen ? "rotate-180" : ""}`}
        />
      </CardHeader>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <CardContent>{/* existing body */}</CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>
```

Activity Timeline and Communication History get the same treatment with their own state hooks, both defaulting to `false` (collapsed on load).

Notes:
- `Activity Timeline` is rendered via `<DonorActivityTimeline />`, which already includes its own `Card` wrapper. To keep collapse behavior consistent, replace its inline use with a wrapping `Collapsible` + a small custom header (title "Activity Timeline" + chevron) that toggles a `CollapsibleContent` containing `<DonorActivityTimeline donorId={donor.id} />`. The component's internal card still renders fine inside; or alternatively render only its inner content. Simplest: wrap as-is inside `<CollapsibleContent>` and render a sibling header card-style trigger above it. Final implementation will use the same outer `Card` + `Collapsible` pattern as the other two for visual consistency, hiding the nested component when collapsed.
- `Communication History` body already lives inline in `DonorProfile.tsx`, so it converts cleanly using the pattern above.
- No changes to data fetching — collapsing is purely visual.

## Files touched
- `src/pages/DonorProfile.tsx`

## Verification
- On load: Giving History expanded; Activity Timeline and Communication History collapsed showing only their headers + chevrons.
- Clicking any header toggles that card open/closed; chevron rotates 180°.
- Each card's open state is independent.
- No layout shift in the right sidebar; no regressions to existing data.

