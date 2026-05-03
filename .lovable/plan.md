In `src/pages/CampaignLanding.tsx`, replace the 4 occurrences of the string `'merchandise sales'` with `'merchandise sale'` (lines 612, 637, 963, 1005) so the new `MerchandiseLanding` template renders for campaigns whose type is "Merchandise Sale" (the actual DB value).

No other files need changes — the editor nav uses different gating. Marketing copy in `Index.tsx` is unrelated and stays as-is.