
## Problem

The current AI Fundraiser Assistant (`supabase/functions/ai-campaign-builder/index.ts`, 2,827 lines) leans on the LLM (`google/gemini-2.5-flash`) to:
1. Decide which field to ask next,
2. Phrase the question,
3. Call the right tool with the user's answer.

When the model misbehaves it:
- Asks two fields in one message ("What's the goal and start date?")
- Skips an optional field on the user's behalf
- Forgets to call `update_campaign_fields` so the value never persists
- Re-asks the same question because the value never made it into `collectedFields`

Today this is patched with ~700 lines of regex-based "fallbacks" that try to detect *which* field the assistant just asked about (`detectFieldFromAssistantText`) and capture the user's reply server-side. The detection is brittle (any prompt rephrase breaks it) and many newer fields (fee_model, pledge_*, merch_*, event_*, agenda) have only partial fallback coverage. The result is the buggy behavior you're seeing.

## Approach: Deterministic State Machine

Stop asking the LLM to drive the flow. The server already knows the entire field graph and order — make it the source of truth, and use the LLM only as a (1) one-sentence rephraser and (2) free-text-to-value parser.

### New control flow per turn

```text
1. Server computes nextField = pickNextField(collectedFields, campaignType, phase)
2. If user just replied to a previous field:
     a. Server runs a single, focused LLM call with a tiny tool schema
        containing ONLY that one field's setter (e.g. set_goal_amount).
        tool_choice = "required" forces a tool call.
     b. Server validates + persists the value.
     c. Recompute nextField.
3. Server emits the next question deterministically:
     - 1 acknowledgment line + 1 question line, both pulled from a question
       template keyed by field name.
     - The chip suggestions (Skip / Yes / No / preset options) come from the
       same field registry, so they always match the question.
4. Return { assistantMessage, suggestions, phase, collectedFields }.
```

This guarantees:
- Exactly one field is asked per turn (server controls phrasing, not the LLM).
- Every user reply has a chance to be captured (focused tool-call with `tool_choice: "required"` plus a deterministic parser fallback for trivial cases like skip/yes/no/dates/numbers).
- Adding a new field = add one entry to the registry (registry already exists in `src/lib/ai/campaignSchema.ts`).

### Single source of truth for fields

Today field definitions are duplicated:
- `src/lib/ai/campaignSchema.ts` (client) — has the new fields.
- `supabase/functions/ai-campaign-builder/index.ts` `FIELD_DEFS` / `ITEM_FIELDS` / `ASK_ORDER` (server) — must be hand-mirrored.

Move the registry into `supabase/functions/_shared/campaignFieldRegistry.ts` and re-export it from `src/lib/ai/campaignSchema.ts`. Each entry adds:
- `parser`: deterministic parser (yes/no, currency, date, enum, free-text).
- `questionTemplate`: ack + question strings used when the server emits the prompt.
- `chipOptions`: function returning suggestion chips for that field (Skip / Yes / No / presets / dynamic options like rosters).
- `appliesWhen`: predicate (e.g. only for Pledge type) so the order list is computed, not hard-coded in three places.

### Tool calls become per-field setters, not a kitchen-sink updater

Replace `update_campaign_fields` (50+ properties) with a small focused tool generated for the currently-asked field, e.g.:

```text
set_field_goal_amount({ value: number })
set_field_fee_model({ value: "donor_covers" | "org_absorbs" })
set_field_skip()  // for optional fields the user wants to skip
```

Forces the model to answer the *current* question only — it cannot smuggle in two fields, and it cannot reply with prose-only and skip the save.

### Items & agenda sub-flows

Same pattern — a per-field setter for the current item draft field, plus `save_campaign_item` / `save_agenda_item` / `agenda_complete` actions. Drops the buggy follow-up second LLM call at lines 2200–2287.

### Coverage audit (will be added during implementation)

Walk every field in the registry against the actual save/insert payload to confirm:
- All shared fields (incl. `fee_model`, `requires_business_info`).
- All Pledge fields (`pledge_unit_label`, `pledge_scope`, `pledge_event_date`, `pledge_min_per_unit`, `pledge_suggested_unit_amounts`, `pledge_unit_label_plural`).
- All Merchandise fields (`merch_ships_by_date`, `merch_shipping_flat_rate`, `merch_pickup_available`, `merch_pickup_note`, items section heading/subheading).
- All Event fields (`event_start_at`, `event_location_name/address`, `event_format`, `event_includes`, `event_agenda`).
- Post-draft fields (`image_url`, `enable_roster_attribution`, `roster_id`, `group_directions`, `asset_upload_deadline`, `pending_required_assets`, `sponsor_assets_complete`).

Any field collected but never persisted to `campaigns` / `campaign_items` / `campaign_required_assets` gets a fix during the refactor.

## Implementation Steps

1. **Build the shared registry** (`supabase/functions/_shared/campaignFieldRegistry.ts`) with parsers, question templates, chip option generators, and `appliesWhen` predicates for every shared/type-specific/post-draft field. Mirror it from `src/lib/ai/campaignSchema.ts` and re-export so the client placeholder logic stays in sync.

2. **Add a deterministic `nextField` resolver** that returns `{ field, phase }` given `collectedFields`, campaign type name, item draft, and rosters. Replaces the scattered `getStillToAskAbout` / `getPledgeStillToAsk` / `getMerchStillToAsk` / `getEventStillToAsk` / sponsor-asset state machine.

3. **Rewrite the edge function turn handler** to:
   - Try deterministic parser on the user's reply for the previously-asked field; persist if it succeeds.
   - If the parser can't handle it (free-text description, vague date), call the LLM with a *single*-field tool schema and `tool_choice: "required"`.
   - Validate + persist via centralized `applyFieldUpdate(field, value)` helper that handles `goal_amount` sanitization, date normalization, asset preset matching, roster auto-pick, etc.
   - Compute next field, emit canned ack+question, attach chip suggestions.

4. **Strip the legacy fallback blocks** (lines ~900–1216 and the duplicated items-phase capture/follow-up logic at ~2200–2287) — the new flow makes them unnecessary.

5. **Items sub-flow**: same pattern, with `save_campaign_item` triggered automatically by the server (no LLM call needed) the moment all required item fields are present.

6. **Agenda sub-flow**: same pattern, server-driven add-another / done loop.

7. **Test matrix**: walk each campaign type end-to-end via the chat in preview — Sponsorship, Donation, Merchandise, Event, Pledge, Roster — confirming every field in the registry is asked, captured, and persisted, and no two questions appear in one message.

## Files Touched

- `supabase/functions/ai-campaign-builder/index.ts` — major rewrite (~2,827 → ~1,000 lines).
- `supabase/functions/_shared/campaignFieldRegistry.ts` — **new**, single source of truth.
- `src/lib/ai/campaignSchema.ts` — re-export from registry; trim duplication.
- `src/pages/AICampaignBuilder.tsx` — remove client-side `ITEM_FIELD_ORDER` duplication; consume registry for placeholder hints.
- `src/components/ai-campaign/AIChatPanel.tsx` — no functional change expected.

## Out of Scope

- Switching AI model (we keep `google/gemini-2.5-flash`; the refactor reduces what we ask of it, so accuracy goes up without a model change).
- Changing the visual UI of the chat panel or preview.
- Changing how campaigns / items are stored in the database.
