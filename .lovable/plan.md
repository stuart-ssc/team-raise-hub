
## Goal
Promote "Platform Fee Model" to its own section in the Fundraiser editor sub-nav, removing it from the Experience card.

## Changes

### 1. `src/components/campaign-editor/CampaignSectionNav.tsx`
- Extend `SectionKey` to include `"fees"`.
- Add nav item `{ key: "fees", label: "Fees", icon: DollarSign }` to `setupItems`, placed between `experience` and `team` (or right after `experience`).

### 2. `src/pages/CampaignEditor.tsx`
- Add `fees` entry to `SECTION_META`:
  - title: "Platform Fees"
  - subtitle: "Choose who pays Sponsorly's 10% platform fee for this fundraiser."
- Add a render branch for `fees` that mounts a new `PlatformFeeSection` component, wired to the same `feeModel` field on the campaign form state (same `onUpdate` plumbing as Experience).
- No changes to save/validation flow — the field is already persisted.

### 3. New `src/components/campaign-editor/PlatformFeeSection.tsx`
- Extract the existing Platform Fee Model `RadioGroup` block from `DonorExperienceSection.tsx` verbatim.
- Props: `{ feeModel?: 'donor_covers' | 'org_absorbs'; onUpdate: (updates: { feeModel: ... }) => void }`.
- Render the two radio options ("Donor covers fees (recommended)", "Organization absorbs fees") inside the standard section content (no inner card — section panel already provides the frame, matching the Items section pattern).

### 4. `src/components/campaign-editor/DonorExperienceSection.tsx`
- Remove the Platform Fee Model block (the entire `<div className="rounded-lg border p-4 space-y-3">…RadioGroup…</div>`).
- Remove now-unused imports: `RadioGroup`, `RadioGroupItem`.
- Keep `feeModel` out of the local interface usage (the prop type can stay for backward compatibility, but it's no longer rendered here).

## Technical notes
- `feeModel` stays on the same campaign form state object in `CampaignEditor.tsx`; both the new `PlatformFeeSection` and the (now-trimmed) `DonorExperienceSection` receive props from the same source, so saving works without any new wiring.
- Sub-nav order in Setup: Details → Schedule → Items → Experience → Fees → Team → Fields → Pitch.
- Icon: `DollarSign` from lucide-react (already used elsewhere in the codebase pattern).

## Verification
- Fundraiser editor sub-nav shows a new "Fees" item under Setup with a dollar icon.
- Clicking "Fees" loads a panel titled "Platform Fees" with the two radio options and current selection preserved.
- The Experience panel no longer shows the Platform Fee Model block; Thank You Message and Sponsorship Campaign toggle remain.
- Selecting a fee option and saving the fundraiser persists the choice (verified by reloading the editor).
