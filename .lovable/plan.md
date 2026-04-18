

## What the user wants

Looking at the screenshot, two issues with the current fee_model prompt:
1. The fee explanation is rendered as **one mashed-together bubble** (options run together) — should be **separate chat responses**.
2. The disclosure should mention the 10% covers **both platform AND credit card processing fees**.
3. Currently the input is a free-text box ("Describe your campaign...") — should be a **chip/button prompt** so users click instead of type.

## Investigation findings

- Edge function `supabase/functions/ai-campaign-builder/index.ts` already returns `assistantMessages: string[]` (array support exists in `AICampaignBuilder.tsx` lines ~166-180), so multi-bubble works today — we just need to emit an array for fee_model.
- `suggestions` block with `type: "choice"` already renders as clickable chips via `SuggestionPrompt.tsx` — confirmed working for campaign type and other fields.
- The screenshot shows the chip prompt is missing — likely because the suggestions block isn't being attached when fee_model is the next field, OR it's being attached but the UI is showing the input fallback.

## Plan

### 1. Edge function: emit fee explanation as 3 separate bubbles + add processing fee note
**File:** `supabase/functions/ai-campaign-builder/index.ts`

When `nextField === "fee_model"`, return `assistantMessages` as an array of 3 strings:

**Bubble 1 (intro + fee composition):**
> One last thing — who covers Sponsorly's 10% fee?
>
> Heads up: that 10% covers **both** our platform fee **and** the credit card processing fees from Stripe. There are no other charges on top.

**Bubble 2 (donor covers option):**
> **Donor covers the fee (recommended)** — On a $100 donation, the donor pays **$110** at checkout. Your organization receives the full **$100**. The fee appears as a separate line item so supporters see exactly where it goes.

**Bubble 3 (org absorbs option + question):**
> **Your organization absorbs the fee** — On a $100 donation, the donor pays **$100** and your organization receives roughly **$90** after the 10% fee. Lower friction for donors, but reduces your net.
>
> Most teams pick "Donor covers." Which would you prefer?

### 2. Ensure chip prompt always renders (not text input)
**File:** `supabase/functions/ai-campaign-builder/index.ts`

- Verify the `choice` suggestions block for `fee_model` is **always** attached to the last bubble whenever `nextField === "fee_model"`, regardless of which code path produced the messages (deterministic helper vs LLM tool path).
- Options stay: `Donor covers the fee (recommended)` → `donor_covers`, `Our organization absorbs the fee` → `org_absorbs`.

**File:** `src/pages/AICampaignBuilder.tsx`

- Update `getChatPlaceholder` so when the last assistant message has a `choice` suggestion, the placeholder reads "Pick an option above..." (visual cue that typing isn't needed). No behavior change — chips already render via `SuggestionPrompt`.

### 3. Verify enum mapping
- Confirm clicked label → enum value mapping in `FIELD_DEFS` parsing still works (unchanged from prior turn).

### Out of scope
- Changing fee math.
- Other fields' explanation copy.
- Marketing/legal copy.

