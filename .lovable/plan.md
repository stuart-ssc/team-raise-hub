
## Goal
Make the "Add Fundraiser" button on `/dashboard/fundraisers` open the AI Assistant directly (single click → AI builder), while keeping the manual form path accessible as a secondary option.

## Changes — `src/pages/Campaigns.tsx`

### Toolbar button (replace dropdown with split button)
Replace the current `DropdownMenu` "Add Fundraiser" trigger with a **split button**:

- **Primary button** (left, ~90% of the visual weight): `+ Add Fundraiser` → `navigate("/dashboard/fundraisers/ai-builder")`. Goes straight to the AI Assistant on click.
- **Caret button** (right, attached, narrow): `ChevronDown` icon → opens a small `DropdownMenu` containing only **"Create manually"** → `navigate("/dashboard/fundraisers/new")`.

Layout: wrap both in a `flex` group so they look like a single connected control:
```
[ + Add Fundraiser ][ ▾ ]
```
- Primary `Button` uses `rounded-r-none`, caret `Button` uses `rounded-l-none border-l border-primary-foreground/20 px-2`.
- On mobile the group remains `w-full sm:w-auto`; the primary button flexes, the caret stays fixed-width.

### Empty-state CTA
Update the empty-state "Let's Create a Fundraiser" button to also route to `/dashboard/fundraisers/ai-builder` (consistent with the new default), instead of `/dashboard/fundraisers/new`.

### Imports
- Remove `Sparkles` and `PenLine` only if no longer referenced. (`PenLine` still used in the dropdown item; `Sparkles` becomes unused — drop it.)
- Keep `DropdownMenu*`, `ChevronDown`, `Plus`.

## Verification
- Clicking "Add Fundraiser" navigates immediately to `/dashboard/fundraisers/ai-builder` — no menu opens.
- Clicking the caret next to it opens a one-item menu with "Create manually" → `/dashboard/fundraisers/new`.
- Empty-state CTA also opens the AI Assistant.
- No other dashboard pages or "Outreach Campaigns" surfaces are affected.
