

## Goal
Simplify the donor list card actions: remove the "Send Campaign" button and promote "Contact about Fundraiser" to the primary action style.

## Changes

### Find and update the donor list card component
Locate the card rendered on `/dashboard/donors/segmentation?tab=lists` (likely `src/components/DonorListCard.tsx` or similar within the donor segmentation/lists area).

- Remove the "Send Campaign" button entirely (along with any handler/state that becomes unused, e.g. a `sendCampaignOpen` dialog state and its dialog mount if no longer referenced).
- Change the "Contact about Fundraiser" button from its current secondary/outline variant to the default primary variant (solid blue), matching what "Send Campaign" looked like.
- Keep the existing icon (`Megaphone`/`Send`-style) and label "Contact about Fundraiser".
- Keep "View/Edit" and the trash/delete button unchanged.
- Layout: the Contact button now occupies the row where Send Campaign used to sit; trash button stays inline to its right.

## Verification
- Navigate to `/dashboard/donors/segmentation?tab=lists` → each list card shows: "View/Edit", "Contact about Fundraiser" (solid primary blue), and the red trash icon. No "Send Campaign" button.
- Clicking "Contact about Fundraiser" still opens the existing `ContactFundraiserDialog` flow.
- No console warnings from removed-but-still-imported symbols.

