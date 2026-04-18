

## Investigation needed

User got "Failed to save campaign" when updating end date on `/dashboard/campaigns/.../edit`. Need to look at:
1. CampaignEditor save logic
2. Console/network logs for the actual error
3. Whether `end_date` column exists in `campaigns` table

Let me check.
