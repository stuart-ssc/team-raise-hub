# Pledge-Aware Readiness Checklist

For Pledge fundraisers, the "Campaign items defined" item in the At a Glance readiness checklist is misleading — pledge campaigns don't use the items collection. Replace it with "Pledge setup configured".

## Changes

### 1. `src/components/campaign-editor/CampaignAtAGlanceCard.tsx`
- Add new optional props:
  - `campaignTypeName?: string` (or `isPledge?: boolean`)
  - `pledgeUnitLabel?: string | null`
  - `pledgeScope?: string | null`
  - `pledgeEventDate?: string | null`
- In the draft checklist, when the campaign is a Pledge type, replace the `Campaign items defined` row with:
  - `{ label: "Pledge setup configured", done: !!(pledgeUnitLabel && pledgeScope && pledgeEventDate) }`
- Otherwise keep existing behavior.

### 2. `src/pages/CampaignEditor.tsx`
- Pass the new props to `<CampaignAtAGlanceCard />`:
  - `campaignTypeName={campaignData.campaignTypeName}` (or compute `isPledge`)
  - `pledgeUnitLabel={campaignData.pledgeUnitLabel}`
  - `pledgeScope={campaignData.pledgeScope}`
  - `pledgeEventDate={campaignData.pledgeEventDate}`
- Field names will be confirmed against the existing `campaignData` shape during implementation (already used by `PledgeSettingsSection`).

## Out of scope
- No changes to the published-state stats panel.
- No changes to other checklist items.
