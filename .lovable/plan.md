

## Answer to your question

**No, the AI Campaign Assistant does not currently ask about the Fee Model.** The previous turn started adding it but was interrupted before completion. Here's what I found:

- `src/lib/ai/campaignSchema.ts` — `fee_model` is **not** in `sharedFields`, so it's never collected.
- `supabase/functions/ai-campaign-builder/index.ts` — partial edits were made last turn (added to `ASK_ORDER`, `FIELD_DEFS`, tool schemas, suggestions branch) but the explanatory copy with sample math was never added, and the schema file was never updated.

The result: the edge function references `fee_model` but the frontend schema doesn't know about it, so the flow is inconsistent.

## Plan to finish this properly

### 1. Add `fee_model` to the frontend schema
**File:** `src/lib/ai/campaignSchema.ts`
- Add `fee_model` to `sharedFields` as a `select` field, required, with options `donor_covers` / `org_absorbs`.
- Default value handled in the edge function (defaults to `donor_covers` if user picks recommended).
- Add `formatFieldValue` handling so the summary shows "Donor covers fee" vs "Organization absorbs fee" instead of the raw enum.

### 2. Make the AI explain fees with sample math BEFORE asking
**File:** `supabase/functions/ai-campaign-builder/index.ts`

Update the system prompt so when it's time to ask about `fee_model`, the assistant first sends an explanatory message, then the choice prompt. Required copy (markdown — chat already renders markdown):

> **One last thing — who covers the 10% Sponsorly platform fee?**
>
> Here's how it works on a **$100 donation**:
>
> - **Donor covers the fee (recommended)** — Donor pays **$110** at checkout. Your organization receives the full **$100**. The $10 platform fee is shown as a separate line item, so supporters see exactly where it goes.
> - **Your organization absorbs the fee** — Donor pays **$100** at checkout. Your organization receives roughly **$90** after Sponsorly's 10% fee. Lower friction for donors, but reduces your net.
>
> Most teams pick "Donor covers" because supporters expect a small platform fee and it maximizes what reaches your cause. Which would you like?

Then surface the existing `choice` suggestion block with the two options.

### 3. Verify the suggestions/choice plumbing
- Confirm the `suggestions` block for `fee_model` matches the `ChatSuggestions` shape consumed by `AIChatPanel.tsx` / `SuggestionPrompt.tsx` (it does — `type: "choice"`, `field`, `label`, `options[]`).
- Confirm the user's selected label maps back to the enum value in `FIELD_DEFS` parsing.

### 4. Make sure the field is included in the final `create_campaign_draft` payload
- Already added to the tool schema last turn — just verify it flows through to the Supabase insert and is saved on the new campaign row.

### 5. Position in the flow
Ask `fee_model` **after** all required basics (name, type, group, goal, dates, description, business info) and **before** moving on to item collection. This matches `ASK_ORDER` from the partial edit.

### Out of scope
- Per-item fee overrides (fee model is campaign-level only, per existing schema).
- Changing fee model on the Campaign Editor — already shipped in a prior turn.
- Marketing copy — already updated.

