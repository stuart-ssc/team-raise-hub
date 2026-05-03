## Goal
Add the same "10% platform fee" explanation Alert that appears on the cart page to the Review & pay step in the sponsorship checkout sidebar, so donors see consistent context before paying.

## Change
In `src/components/campaign-landing/sponsorship/SponsorshipLanding.tsx`, inside the `step === 'payment'` block of `CheckoutStepsPanel` (around lines 800-854):

- After the totals block (line 825) and before the donor-info summary box, render an `Alert` styled the same as the cart page (`bg-primary/5 border-primary/20`) with the text:

  > The **10% platform fee** covers card processing and keeps Sponsorly running. By covering it, 100% of your sponsorship reaches the team.

- Only show this alert when `feeModel !== 'org_absorbs'` (matches cart-page behavior — no fee shown when org absorbs it).
- Use the existing `Alert` / `AlertDescription` imports already present in the file.

## Result
The Review & pay card displays the same subtle primary-tinted explanation of the platform fee that appears on the cart page, providing consistent reassurance right before the donor clicks "Pay".
