

## Goal
Make the Dashboard's "Add Campaign" button navigate to the AI Campaign Assistant instead of opening the manual form dialog.

## Change — `src/pages/Dashboard.tsx`
- Line 414: replace `onClick={() => setShowAddCampaignForm(true)}` with `onClick={() => navigate('/dashboard/campaigns/ai-builder')}`.
- Leave the `AddCampaignForm` dialog mounted (still triggered elsewhere if needed) — or remove it if unused. I'll check usages and remove the dialog + `showAddCampaignForm` state if nothing else opens it, to keep the file clean.

## Out of scope
- Changing the `/dashboard/campaigns` page's Add button (that one already has its own dropdown with AI option).

