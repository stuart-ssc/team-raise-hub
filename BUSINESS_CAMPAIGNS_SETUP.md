# Business Nurture Campaigns - Setup Guide

## Overview
Automated email outreach system for business partnership cultivation based on AI-driven insights.

## Features Implemented

### 1. Database Tables
- `business_nurture_campaigns` - Campaign definitions with trigger conditions
- `business_nurture_sequences` - Email sequences for each campaign
- `business_nurture_enrollments` - Track which businesses are enrolled in campaigns

### 2. Email Templates (React Email)
- **Partnership Appreciation** - For excellent health partnerships
- **Partnership Check-In** - For good/needs attention partnerships  
- **Re-engagement** - For at-risk partnerships
- **Urgent Reactivation** - For critical/dormant partnerships
- **Expansion Opportunity** - For high expansion potential
- **Stakeholder Cultivation** - For multi-contact relationship building

### 3. Edge Functions
- `send-business-outreach-email` - Sends individual emails with personalized templates
- `process-business-nurture-campaigns` - Automated enrollment and email processing (scheduled)
- `trigger-business-campaign` - Manual enrollment from UI

### 4. UI Pages
- `/dashboard/businesses/nurture` - Manage campaigns, view stats
- Business Outreach Queue - Now includes enrollment buttons and status badges
- BusinessSubNav - Consistent navigation across all business pages

## Automated Processing Setup

### Enable pg_cron Extension (if not already enabled)

1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/tfrebmhionpuowpzedvz/sql/new

2. Run this SQL to enable the cron extension:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Schedule the Daily Campaign Processing

3. Run the SQL from `supabase/functions/_cron/schedule-business-campaigns.sql`:
```sql
SELECT cron.schedule(
  'process-business-campaigns-daily',
  '0 9 * * *', -- 9 AM every day
  $$
  SELECT
    net.http_post(
      url:='https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/process-business-nurture-campaigns',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcmVibWhpb25wdW93cHplZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDA0NTksImV4cCI6MjA2ODg3NjQ1OX0.Jw7c0qDfsdvxF3U6IQrjddVxbbRATTLz-RlPw5yYmxY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### Verify Cron Job

4. Check that the job was created:
```sql
SELECT * FROM cron.job WHERE jobname = 'process-business-campaigns-daily';
```

### Test the Cron Job Manually

5. You can test the function manually before the scheduled time:
```sql
SELECT
  net.http_post(
    url:='https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/process-business-nurture-campaigns',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcmVibWhpb25wdW93cHplZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDA0NTksImV4cCI6MjA2ODg3NjQ1OX0.Jw7c0qDfsdvxF3U6IQrjddVxbbRATTLz-RlPw5yYmxY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
```

## Usage Workflow

### 1. Create a Campaign

1. Navigate to `/dashboard/businesses/nurture`
2. Click "Create Campaign"
3. Fill in campaign details:
   - **Name**: e.g., "Q1 2025 Health Check"
   - **Type**: Choose from health check, expansion, at-risk, or re-engagement
   - **Trigger Conditions**: Select health statuses, expansion levels, min priority score, etc.
   - **Email Sequences**: Add one or more emails with templates, subject lines, and send delays

4. Click "Create Campaign" to save as draft

### 2. Activate Campaign

1. Click "Activate" on the campaign card
2. The system will now automatically check for matching businesses daily

### 3. Manual Enrollment (Optional)

From the Business Outreach Queue:
1. Click "Enroll in Campaign" on any business
2. Select the target campaign
3. First email will be scheduled based on the sequence delay

### 4. Monitor Performance

- View enrollment stats on the Nurture Campaigns page
- Check business activity logs for email sent confirmations
- Review email delivery logs for opens/clicks

## Email Personalization Variables

All templates support these variables (auto-populated):
- `{businessName}` - Business name
- `{contactFirstName}` - Contact's first name  
- `{contactLastName}` - Contact's last name
- `{partnershipValue}` - Total partnership value (formatted)
- `{donorCount}` - Number of linked donors
- `{lastActivityDate}` - Last donation activity date
- `{daysSinceActivity}` - Days since last activity
- `{healthStatus}` - Partnership health status
- `{organizationName}` - Your organization name
- `{contactRole}` - Contact's role at the business

## Campaign Types & Recommended Triggers

### Health Check Campaign
- **Trigger**: health_status IN ['excellent', 'good']
- **Purpose**: Regular check-ins with healthy partnerships
- **Recommended Sequences**: Appreciation → Check-in (30 days) → Feedback survey (60 days)

### Expansion Campaign  
- **Trigger**: expansion_potential = 'high' AND health_status IN ['excellent', 'good']
- **Purpose**: Grow partnerships with high potential
- **Recommended Sequences**: Expansion opportunity → Follow-up (14 days) → Meeting (21 days)

### At-Risk Campaign
- **Trigger**: health_status = 'at_risk'
- **Purpose**: Re-engage declining partnerships
- **Recommended Sequences**: Re-engagement → Personalized follow-up (7 days) → Call request (14 days)

### Re-engagement Campaign
- **Trigger**: health_status = 'critical' OR days_since_activity > 365
- **Purpose**: Urgent reactivation
- **Recommended Sequences**: Urgent reactivation → Personal outreach (3 days) → Final attempt (7 days)

## Success Metrics to Track

Monitor these in the email_delivery_log table:
- **Enrollment Rate**: businesses enrolled / eligible businesses
- **Open Rate**: emails opened / emails sent
- **Click Rate**: links clicked / emails sent
- **Response Rate**: Manual tracking via activity log
- **Completion Rate**: completed sequences / total enrollments

## Troubleshooting

### Emails Not Sending
1. Check that campaigns are set to "active" status
2. Verify businesses meet the trigger conditions
3. Check edge function logs: https://supabase.com/dashboard/project/tfrebmhionpuowpzedvz/functions/send-business-outreach-email/logs
4. Ensure RESEND_API_KEY is configured
5. Verify business has at least one linked contact with email

### Businesses Not Auto-Enrolling
1. Verify trigger conditions match businesses in queue
2. Check that businesses aren't already enrolled
3. Review process function logs: https://supabase.com/dashboard/project/tfrebmhionpuowpzedvz/functions/process-business-nurture-campaigns/logs
4. Ensure cron job is running (check pg_cron logs)

### Cron Job Not Running
1. Verify pg_cron extension is enabled
2. Check job schedule: `SELECT * FROM cron.job;`
3. Check job run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

## Next Steps

1. **Set up the cron job** using the SQL above
2. **Create your first campaign** via the UI
3. **Test manual enrollment** with one business
4. **Monitor email delivery logs** to verify emails are sending
5. **Activate campaigns** when ready for automation
6. **Review performance weekly** and adjust trigger conditions

## Benefits

✅ **Automation**: Hands-off cultivation at scale
✅ **Personalization**: AI-driven insights + dynamic templates
✅ **Consistency**: Every business gets appropriate outreach
✅ **Tracking**: Full visibility into performance
✅ **Flexibility**: Easy to create campaigns for specific scenarios
✅ **Integration**: Seamless with existing queue and insights
