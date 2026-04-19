

## Issue
The floating/sticky "Save Campaign" button at the bottom of the editor uses default primary blue, but the matching button in the header is now black (`bg-foreground text-background`). They should match.

## Change
Find the secondary Save Campaign button (likely a sticky/floating bottom bar in `src/pages/CampaignEditor.tsx`) and apply the same black styling: `className="gap-2 bg-foreground text-background hover:bg-foreground/90"`.

## File touched
- `src/pages/CampaignEditor.tsx` — update the bottom Save Campaign button's className to match the header button.

## Out of scope
- Header Save button (already black).
- Any other buttons or layout.

