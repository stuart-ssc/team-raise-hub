## Problem

Donation fundraisers have four campaign-level columns that already drive the donor landing page:
- `donation_min_amount` — minimum gift (defaults to $5 if not set)
- `donation_suggested_amounts` — preset chip amounts (e.g. `[25, 50, 100, 250, 500, 1000]`)
- `donation_allow_recurring` — toggle for recurring donations
- `donation_allow_dedication` — toggle for "in honor/memory of"

Today there's no way to set them — neither the AI assistant nor the manual editor exposes them. Plus the editor still routes Donation campaigns through the generic **Items** section, which doesn't fit a donation flow.

## Goal

Make donation-specific settings editable in **both** places:
1. The AI Fundraiser Assistant (chat flow).
2. The manual fundraiser editor (post-creation editing).

And stop showing the irrelevant **Items** section for Donation fundraisers.

## Changes

### A. Manual editor (primary fix the user is asking for)

**1. New section component** `src/components/campaign-editor/DonationSettingsSection.tsx`
- Min donation amount input (number, default placeholder $5).
- Preset suggested amounts: chip-style editor — each amount is a removable pill, with an "Add amount" input. Optional "Reset to defaults" button (`25, 50, 100, 250, 500, 1000`).
- "Allow recurring donations" switch.
- "Allow donor dedications (in honor/memory of)" switch.
- Same visual style as `PledgeSettingsSection` / `MerchandiseFulfillmentSection`.

**2. Wire into `CampaignSectionNav`** (`src/components/campaign-editor/CampaignSectionNav.tsx`)
- Add `"donationSettings"` to `SectionKey` union.
- Add `isDonation` prop. When true, insert a "Donation Setup" nav item (icon: `HandCoins` or `Heart`) and **omit** the "Items" entry.

**3. Wire into `CampaignEditor.tsx`**
- Detect donation type via campaign_type lookup (mirrors `pledgeTypeId`/`eventTypeId` pattern). Add `donationTypeId` query + `isDonationCampaign` flag.
- Add four fields to `CampaignData` interface and `setCampaignData` initialization (with sensible defaults: min `5`, suggested `[25,50,100,250,500,1000]`, recurring `true`, dedication `true`).
- Persist them in the `handleSave` UPDATE payload to `campaigns`.
- Pass `isDonation={isDonationCampaign}` into `CampaignSectionNav` and gate `showItems` with `&& !isDonationCampaign`.
- Render `<DonationSettingsSection>` when `activeSection === "donationSettings"`.
- Add `donationSettings` entry to `SECTION_META` with `showSave: true`.

### B. AI Assistant (so it can collect these during the chat too)

In `supabase/functions/ai-campaign-builder/index.ts`:

1. **Add type detector** `isDonationTypeName(typeName)` (matches `"donation"`).

2. **Add walker** `getDonationStillToAsk(collected)` returning the four fields in order: `donation_min_amount`, `donation_suggested_amounts`, `donation_allow_recurring`, `donation_allow_dedication` (skip-aware; booleans treated like `is_recurring`).

3. **Wire into the resolved-type block** (~lines 639–646) and **phase-decision block** (~lines 2522–2538): for Donation, after donation fields are answered, set `phase = "complete"` and **skip `collecting_items` entirely** (extend the existing `isPledge ? "complete" : "collecting_items"` pattern).

4. **Add chip suggestions** in the suggestions block (~lines 2683–2750):
   - `donation_min_amount` → free-text + Skip chip (default $5).
   - `donation_suggested_amounts` → presets: `Standard ($25/$50/$100/$250/$500/$1000)`, `Smaller ($10/$25/$50/$100)`, `Larger ($100/$250/$500/$1000/$2500)`, `Custom…`, `Skip`.
   - `donation_allow_recurring` → Yes / No.
   - `donation_allow_dedication` → Yes / No.

5. **Tool schema** (~line 1701): extend `update_campaign_fields` parameters with the four donation fields (number, array of numbers, boolean, boolean).

6. **Persistence pass** (~line 2174): add parallel handling for `donation_suggested_amounts` (parse comma string OR array → JSON array of numbers).

7. **System prompt** (~line 850): add: "If the campaign type is **Donation**, do NOT ask about items/quantity/cost. Instead, after the core fields, ask about minimum donation, suggested preset amounts, recurring donations allowed, and dedications allowed. Then complete setup."

8. **`AICampaignBuilder.tsx`** — add the four fields to the `CANNED_QUESTIONS` registry so the assistant text always matches the chips.

### C. No DB migration needed
All four columns already exist on `campaigns` (`donation_min_amount`, `donation_suggested_amounts`, `donation_allow_recurring`, `donation_allow_dedication`).

## Out of scope
- `donation_allocations` (multi-designation split) — keep advanced; not added to chat or simple editor here.

## QA checklist
1. Open an existing Donation fundraiser in the editor — see "Donation Setup" in nav and **no** "Items" entry.
2. Edit min, presets (add/remove), toggles → Save → reload → values persist.
3. Open the donor landing page → preset chips and minimum reflect saved values.
4. Start a new Donation fundraiser via the assistant → it asks min, presets, recurring, dedication (no item questions) → completes setup → values match the editor.
5. Pledge / Merch / Event / Sponsorship flows still behave identically (regression).
