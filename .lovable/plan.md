

# Capitalize Activity Type Badges

## Problem
The activity type pills/badges in the Donor Activity Timeline show lowercase text like "donation", "campaign view" instead of "Donation", "Campaign View".

## Changes

### 1. `src/components/DonorActivityTimeline.tsx` (line 133)
- **Current:** `{activity.activity_type.replace(/_/g, " ")}`
- **New:** Capitalize each word: `{activity.activity_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`

### 2. `src/components/BusinessActivityTimeline.tsx` (line 148)
- **Current:** `{activity.activity_type.replace(/_/g, ' ')}`
- **New:** Same capitalization: `{activity.activity_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`

This will turn "donation" into "Donation", "campaign_view" into "Campaign View", "email_sent" into "Email Sent", etc.

