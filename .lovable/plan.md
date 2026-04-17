

## Goal
When the AI Campaign Builder user answers **yes** to "Will sponsors need to provide required information/assets at checkout?" (i.e., this is a Sponsorship-style campaign), the assistant must immediately collect and persist:

1. **Asset Upload Deadline** (a date)
2. **Required Sponsor Assets** (a list — name + type, e.g. Company Logo, Banner Ad, Full Page Ad)

These map to the same fields the manual editor sets (screenshot reference): the campaign's `asset_upload_deadline` (or equivalent) and the `required_assets` JSON array on the campaign.

## Investigation needed
Before coding I'll confirm:

1. **Field names on `campaigns`** — read `src/integrations/supabase/types.ts` and `src/components/campaign-editor/RequiredAssetsEditor.tsx` to confirm:
   - The exact column name for the deadline (likely `asset_upload_deadline` or `sponsorship_deadline_days`)
   - The exact shape of `required_assets` (likely `{ id, name, type, required }[]`)
   - Whether the toggle itself is `requires_sponsorship_assets`, `is_sponsorship_campaign`, or stored as a flag in `custom_fields`
2. **Current AI flow** — read `supabase/functions/ai-campaign-builder/index.ts` to find:
   - Where the "sponsor required info" yes/no question is asked today (likely a post-draft step similar to `participant_directions`)
   - How `nextStep` and the `update_campaign_fields` tool schema are defined so we can extend them
3. **Tool schema** — confirm `update_campaign_fields` accepts (or can be extended to accept) `required_assets` array and a deadline field. If not, add them.

## Plan

### 1. Extend the AI flow with a new sub-phase: `sponsor_assets`
When the user answers **yes** to the sponsor-info question, instead of marking that step complete and moving on, the server transitions into a short collection sub-flow:

- **Step A — deadline**: Ask "When do sponsors need to upload their assets by?" with quick-pick `suggestions` (e.g., *2 weeks before campaign end*, *1 week before*, *Pick a date*). Free-text date also accepted; server parses ISO/`MM/DD/YYYY`.
- **Step B — assets**: Ask "What assets do sponsors need to provide?" with quick-pick `suggestions` matching the manual editor's defaults: **Company Logo**, **Banner Ad**, **Full Page Ad**, plus *Add custom* and *Done*. Multi-turn loop — after each pick, acknowledge and ask "Anything else?" until user says Done/None.

State tracked on the server-side `collectedFields` snapshot:
- `sponsor_assets_phase`: `null | "deadline" | "items" | "complete"`
- `pending_required_assets`: in-progress array

### 2. Persist immediately (server-side fallback included)
On each turn in this sub-flow:
- Update the campaign row directly via admin client (don't rely solely on the model calling `update_campaign_fields`):
  - `asset_upload_deadline` ← parsed date
  - `required_assets` ← accumulating array `[{ id, name, type: "image" | "document", required: true }, …]`
  - `requires_sponsorship_assets` (or equivalent flag) ← `true`
- Apply the same **post-draft fallback pattern** already used for `group_directions`: if the model forgets to call the tool, the server captures the user's last reply and persists it, sets a `postDraftFallbackApplied` flag, and suppresses the no-repeat clarifier.

### 3. Extend the `update_campaign_fields` tool schema
Add to the JSON schema:
- `asset_upload_deadline` (string, ISO date)
- `required_assets` (array of `{ name: string, type: "image"|"document"|"other", required: boolean }`)
- `requires_sponsorship_assets` (boolean)

And update the system prompt:
> "When the user confirms sponsors must upload required information, you MUST collect (a) an upload deadline and (b) at least one required asset before continuing. Call `update_campaign_fields` in the same turn as each answer."

### 4. Reflect in the live preview
The existing `AICampaignPreview` should already pick up `required_assets` if it reads from the live campaign row; if not, surface a small "Sponsor assets" summary section in the preview so the user sees the items as they're added. (Confirmed during investigation.)

### 5. Skip path
If the user later says "skip" or "no assets required", set `requires_sponsorship_assets=false`, clear `pending_required_assets`, mark the sub-phase complete, and move to the next post-draft question.

## Files likely to change
- `supabase/functions/ai-campaign-builder/index.ts` — new sub-phase, tool schema additions, server-side persistence + fallback, prompt rule
- `src/components/ai-campaign/AICampaignPreview.tsx` — small "Required Sponsor Assets" preview block (only if not already rendered)

## Out of scope
- Redesigning the manual `RequiredAssetsEditor`
- Allowing arbitrary file-type taxonomies beyond image/document/other
- Editing existing assets via the AI flow (add-only for now; user can refine in the editor)

