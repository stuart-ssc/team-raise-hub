## Replace participant search step with inline required Select dropdown

Revert the multi-step participant flow back to the original single-form layout. Where the warning alert previously appeared (when `pledge_scope = 'participant'` and no roster member is in the URL), show a required participant **Select dropdown** instead. The amount fields, max-total toggle, and Continue button all remain visible on the same card as before.

### Behavior

- If URL has a roster slug → behaves exactly as today (locked participant, no dropdown).
- If no roster slug and scope is participant → show a required `<Select>` at the top of the form populated with active roster members. The Continue button stays disabled until a participant is chosen.
- Remove the separate `'participant'` step, the search input, the scrollable list, and the "Change participant" link.

### Files to change

**`src/components/campaign-landing/PledgePurchaseFlow.tsx`**
- Remove `'participant'` from the `step` union; initial step is always `'amount'`.
- Drop `participantSearch`, `filteredParticipants`, `Search`/`ChevronRight` imports, and the entire `step === 'participant'` block.
- Keep the `useEffect` that fetches participants (only runs when `needsParticipantPick`).
- In the `step === 'amount'` block, when `needsParticipantPick` is true, render a shadcn `Select` (from `@/components/ui/select`) at the top:
  - Label: "Pledging for" (with required asterisk)
  - Placeholder: "Select a participant"
  - Options: each participant as `{firstName} {lastName}`
  - Loading state: disabled trigger with "Loading participants…"
  - Empty state: disabled with "No participants available"
  - `onValueChange` sets `selectedRosterMember` by id lookup.
- Continue button `disabled` already includes `(isParticipantScope && !selectedRosterMember)` — keep that guard.
