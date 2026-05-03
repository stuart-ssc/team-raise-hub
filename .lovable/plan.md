## Goal
Replace the bulky "Already have an account? / Login to autofill" muted box at the top of the donor info form. In the new narrow sidebar checkout it wraps awkwardly and looks dated.

## Change
Edit `src/components/DonorInfoForm.tsx` (lines ~342-358):

- Remove the `bg-muted/50 rounded-lg p-4 border` container.
- Render a single-line, minimal trigger that matches the rest of the sponsorship sidebar (clean white card, small text, primary-color link).
- Use a simple right-aligned `Button variant="link"` reading "Have an account? Log in" (with a small `LogIn` icon), no User icon, no boxed background.
- Keep the `Collapsible` behavior; the expanded email/password form stays the same but rendered without the surrounding muted block (just `mt-3 space-y-3`).

## Result
A subtle one-line link above the donor fields instead of a heavy outlined panel — consistent with the minimalist white-card style of the updated sponsorship checkout.