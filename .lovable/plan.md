## Goal
Finish wiring Pledge Fundraisers into the campaign editor, the AI campaign builder, and the marketing surface. Items 1, 2, and 4 from the prior list.

---

## 1. Auto-suggest end date in `BasicDetailsSection.tsx`

When the campaign type is **Pledge** and the user sets `pledge_event_date`, default `end_date` to **`pledge_event_date - 1 day`** so the campaign closes the day before the event (no new pledges accepted after the event happens).

**Where:** `src/components/campaign-editor/BasicDetailsSection.tsx`

**Behavior:**
- Watch the campaign type name (lookup against `campaignTypes` state already loaded) and `data.pledge_event_date` (will be added to the parent `CampaignData` shape).
- When the type is "Pledge" AND `pledge_event_date` changes AND `end_date` is empty OR was previously auto-set, push `end_date = pledge_event_date - 1 day` via `onUpdate`.
- Do NOT overwrite an `end_date` the user has manually edited. Track this with a small `endDateAutoSetRef` flag inside the component.
- If the user later switches campaign type away from Pledge, leave the existing end_date alone.

**Editor wiring:** `CampaignEditor.tsx` already passes `pledge_event_date` into the `PledgeSettingsSection`. Lift that field (and a `pledge_event_date` value in `CampaignData`) into the `BasicDetailsSection` props so the auto-suggest can react. No DB change.

---

## 2. AI Campaign Builder support for Pledge

Two surfaces must change: the schema file (UI) and the edge function (LLM brain).

### 2a. `src/lib/ai/campaignSchema.ts`
Add a new `pledgeFields: CampaignFieldDef[]` array with:
- `pledge_unit_label` (string, required when type=Pledge) — e.g. "lap", "mile", "book"
- `pledge_scope` (select: `team` | `participant`, required) — whether pledges count team-wide or per roster member
- `pledge_event_date` (date, required) — when the activity happens / charging window opens
- `pledge_min_per_unit` (number, optional) — minimum $/unit
- `pledge_suggested_unit_amounts` (string, optional) — comma-separated list parsed to numeric array on save

Add helpers:
- `isPledgeType(typeName?: string | null): boolean`
- `getRequiredFieldsForType(typeName)` returning `requiredFieldKeys` plus pledge-required keys when applicable
- Update `getMissingRequiredFields(collected)` to consult the type-aware required list (look up the chosen `campaign_type_id` against a passed-in types map, or accept an optional `typeName` arg — simpler).
- Extend `formatFieldValue` to render the new fields nicely.

Skip the standard items-collection loop for Pledge campaigns (pledges don't use `campaign_items`).

### 2b. `supabase/functions/ai-campaign-builder/index.ts`
- **Field defs:** Mirror the new pledge fields in the edge function's local field list (the file already duplicates the schema around line 334).
- **Tool schema:** Extend the `update_campaign_fields` tool's JSON-schema `properties` block (~line 1281) with the five pledge fields.
- **Tool handler:** In the `update_campaign_fields` handler (~line 1438) and the persistence block (~line 1650), accept and write the new columns to `campaigns`.
- **System prompt / next-step planner:** Add a Pledge-specific branch in the post-draft step machine (around the `group_directions` block, line 465-510). After base setup, ask conversationally for the unit label → scope → event date → optional suggested amounts → optional min. Use existing "ask one short question + require tool call in same turn" pattern.
- **Skip items phase:** In the phase-resolution code (~lines 1929-1958), detect Pledge type and short-circuit `collecting_items` → `complete` instead. Update `AICampaignBuilder.tsx` mirror logic similarly.

### 2c. `src/pages/AICampaignBuilder.tsx`
- Use `isPledgeType` to decide whether to render the items-collection UI vs. jump straight to `post_draft`/`complete`.
- Add chat placeholders for the pledge fields (mirror the existing `ITEM_FIELD_ORDER` pattern with a small `PLEDGE_FIELD_ORDER` map).
- When `phase === "post_draft"` and the campaign is Pledge, show appropriate quick-pick chips (e.g., scope = Team / Per Participant).

---

## 4. Marketing surface link-up

Verification + small additions. Most of this is already done from the earlier marketing pass.

**Already wired (verified):**
- `/fundraisers/pledge` route → `PledgeCampaigns.tsx` ✅
- `/fundraisers` overview lists Pledge as card #04 → `/fundraisers/pledge` ✅
- `WhoItsFor.tsx` mentions "pledge-per-event fundraisers" ✅

**Still to do:**
- **Platform.tsx CTA section (line 285-306):** Add a second CTA button alongside "Roster-Enabled Campaigns" → "Pledge Fundraisers" linking to `/fundraisers/pledge`. Keeps both flagship campaign types visible from `/platform`.
- **Marketing `for schools` pages:** quick scan of `src/pages/schools/*.tsx` (BoosterClubs, MarchingBands, SportsTeams, PtoPta, AcademicClubs, ArtsClubs) — add a one-line mention + link to `/fundraisers/pledge` in their "campaign types" section if they list other types. (Read first; only edit pages that already enumerate other campaign types so we don't force structure where it doesn't exist.)
- **Sitemap:** Add `/fundraisers/pledge` to `public/sitemap-main.xml` so it gets indexed.
- **Campaign-type seed sanity check:** Confirm "Pledge" is in `campaign_type` (already done in earlier migration). No action unless missing.

---

## Out of scope (deferred)
- End-to-end smoke test (#3) — user will run manually with Stripe test cards.
- Polish items (#5: dashboard filter badge, leaderboard pledge totals, editor overview pledge stats) — deferred until smoke test reveals priorities.

---

## Files to edit
1. `src/components/campaign-editor/BasicDetailsSection.tsx`
2. `src/pages/CampaignEditor.tsx` (extend CampaignData + prop wiring)
3. `src/lib/ai/campaignSchema.ts`
4. `src/pages/AICampaignBuilder.tsx`
5. `supabase/functions/ai-campaign-builder/index.ts`
6. `src/pages/Platform.tsx`
7. `public/sitemap-main.xml`
8. (Conditionally) one or more `src/pages/schools/*.tsx`
