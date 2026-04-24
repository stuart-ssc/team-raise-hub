

## Goal
Make "Connect payment for {group}" rows in the supervisor dashboard's "Needs your attention" card always render **first** in the list and as a **full red row** to signal critical action. Other items keep their current style.

## Changes — `src/pages/Dashboard.tsx`

### 1. Sort order (around line 696–753)
After building `attentionItems`, sort so all entries with `key` starting `pay-` come first (preserving their current relative order), followed by every other item in current insertion order.

```ts
const sorted = [
  ...items.filter(i => i.key.startsWith("pay-")),
  ...items.filter(i => !i.key.startsWith("pay-")),
];
return sorted;
```

### 2. Render style for payment rows (around line 938–960)
In the `attentionItems.map(...)` loop, branch on `item.key.startsWith("pay-")`:

- **Payment rows** — full red row:
  - Container button gets a destructive red background + border, white-on-red text, and a stronger hover state, e.g.
    `"flex w-full items-center justify-between gap-3 py-3 px-3 -mx-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors border border-destructive shadow-sm"`.
  - Icon chip swaps to `bg-white/15 text-destructive-foreground` instead of `toneClass(item.tone)`.
  - Label stays `font-semibold`.
  - Replace the secondary `Badge` (none rendered today since payment items have no `count`) with a small inline "Action required" pill: `bg-white/15 text-destructive-foreground text-[11px] px-2 py-0.5 rounded-full font-medium`.
  - Chevron color → `text-destructive-foreground/80`.
- **All other rows** — unchanged (current `toneClass`-based styling stays exactly as-is).

### 3. Divider between rows
Keep the existing `divide-y divide-border` on the `<ul>`, but the red row already provides its own background contrast so no further adjustment is needed.

### 4. No data, no logic, no other style changes
- `unconnectedGroups`, `tone: "rose"` value, dialog wiring, and dependency arrays stay the same — `tone` is just no longer consulted for payment rows.
- Empty-state ("All clear") message unchanged.
- Recent activity card unchanged.

## Verification
- When one or more groups need a payment processor connected, those rows appear at the top of "Needs your attention", each rendered as a full red row with white text and an "Action required" pill, and clicking still opens the existing `GroupPaymentSetupDialog`.
- Pending membership requests, pitch reminders, and donor thank-you items still render below with their current amber / blue / green icon-chip styling.
- When no payment connection is needed, the card looks identical to today.

