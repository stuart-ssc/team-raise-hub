-- Create email templates table for pre-built nurture campaign templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('welcome', 'reengagement', 'milestone', 'custom', 'thank_you')),
  sequence_order INTEGER NOT NULL DEFAULT 1,
  subject_line TEXT NOT NULL,
  email_content TEXT NOT NULL,
  recommended_delay_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Templates are publicly readable for all users to select
CREATE POLICY "Email templates are publicly readable"
  ON public.email_templates
  FOR SELECT
  USING (true);

-- Create index for faster lookups by campaign type
CREATE INDEX idx_email_templates_campaign_type ON public.email_templates(campaign_type);

-- Insert Welcome Series Templates
INSERT INTO public.email_templates (name, description, campaign_type, sequence_order, subject_line, email_content, recommended_delay_hours) VALUES
(
  'Welcome Email #1',
  'First email in welcome series - immediate thank you',
  'welcome',
  1,
  'Welcome to {organizationName}! Thank you for your support',
  '<h1>Welcome, {firstName}!</h1>
<p>Thank you so much for your generous donation to {organizationName}. Your support means the world to us!</p>
<p>Your contribution of ${donationAmount} will directly help {campaignName} and make a real difference in our community.</p>
<h2>What Happens Next?</h2>
<p>Over the next few weeks, we''ll share updates about the impact of your donation and how you can stay connected with our mission.</p>
<p>If you have any questions, please don''t hesitate to reach out.</p>
<p>With gratitude,<br>{organizationName} Team</p>',
  0
),
(
  'Welcome Email #2',
  'Second email in welcome series - share impact stories',
  'welcome',
  2,
  'See how your donation is making a difference',
  '<h1>Hi {firstName},</h1>
<p>We wanted to share some exciting news about the impact your recent donation is having!</p>
<p>Thanks to donors like you who contributed to {campaignName}, we''ve been able to:</p>
<ul>
  <li>Reach 85% of our fundraising goal</li>
  <li>Support our programs serving the community</li>
  <li>Make a lasting difference in people''s lives</li>
</ul>
<p>Your lifetime support of ${lifetimeValue} has been instrumental in our success.</p>
<p>Stay tuned for more updates!</p>
<p>Best regards,<br>{organizationName}</p>',
  72
),
(
  'Welcome Email #3',
  'Third email in welcome series - engagement invitation',
  'welcome',
  3,
  'Ways to stay connected with {organizationName}',
  '<h1>Thanks for being part of our community, {firstName}!</h1>
<p>As a valued supporter who has donated {donationCount} times, we''d love to keep you engaged with our mission.</p>
<h2>Here are some ways to stay connected:</h2>
<ul>
  <li>Follow us on social media for daily updates</li>
  <li>Subscribe to our monthly newsletter</li>
  <li>Attend our upcoming community events</li>
  <li>Share our campaigns with friends and family</li>
</ul>
<p>Every action, big or small, helps amplify our impact.</p>
<p>Thank you for being an essential part of {organizationName}!</p>
<p>Warmly,<br>The {organizationName} Team</p>',
  168
);

-- Insert Re-engagement Series Templates
INSERT INTO public.email_templates (name, description, campaign_type, sequence_order, subject_line, email_content, recommended_delay_hours) VALUES
(
  'We Miss You!',
  'First re-engagement email - remind them of past impact',
  'reengagement',
  1,
  '{firstName}, we miss your support!',
  '<h1>Hi {firstName},</h1>
<p>It''s been a while since we''ve heard from you, and we wanted to reach out!</p>
<p>Your past support of ${lifetimeValue} has been incredibly meaningful to {organizationName}. We''ve thought of you often and wanted to share what''s been happening.</p>
<h2>Recent Highlights:</h2>
<ul>
  <li>We''ve launched new programs serving our community</li>
  <li>Recent campaigns have reached their goals</li>
  <li>We''ve expanded our impact thanks to supporters like you</li>
</ul>
<p>We''d love to have you back as part of our mission. Would you consider supporting our current campaign?</p>
<p>Hoping to hear from you soon,<br>{organizationName}</p>',
  0
),
(
  'Special Opportunity',
  'Second re-engagement email - exclusive opportunity',
  'reengagement',
  2,
  'A special invitation just for you, {firstName}',
  '<h1>Hey {firstName},</h1>
<p>As someone who has supported us {donationCount} times in the past, we have a special opportunity we wanted to share with you first.</p>
<p>We''re launching a new campaign that aligns perfectly with the causes you''ve supported before.</p>
<p>Your previous donations helped us achieve amazing things. Imagine what we could accomplish together again!</p>
<p><strong>Would you consider rejoining us with a donation today?</strong></p>
<p>Even a small contribution makes a huge difference.</p>
<p>Thank you for considering,<br>{organizationName} Team</p>',
  96
),
(
  'Final Check-in',
  'Third re-engagement email - last touchpoint',
  'reengagement',
  3,
  'One last message from {organizationName}',
  '<h1>Hi {firstName},</h1>
<p>This will be our last email for now - we don''t want to overwhelm your inbox!</p>
<p>But before we go, we wanted to say thank you one more time for your past support. Your ${lifetimeValue} in lifetime donations has truly mattered.</p>
<p>If you''re ever interested in supporting {organizationName} again, we''d be thrilled to welcome you back. Until then, we wish you all the best.</p>
<p>The door is always open,<br>{organizationName}</p>',
  120
);

-- Insert Thank You Follow-up Templates
INSERT INTO public.email_templates (name, description, campaign_type, sequence_order, subject_line, email_content, recommended_delay_hours) VALUES
(
  'Immediate Thank You',
  'Instant gratitude after donation',
  'thank_you',
  1,
  'Thank you for your generous donation, {firstName}!',
  '<h1>Thank You, {firstName}!</h1>
<p>We just received your donation of ${donationAmount} to {campaignName}, and we couldn''t be more grateful!</p>
<p>Your generosity is making a real difference, and we wanted you to know immediately how much it means to us.</p>
<h2>Your Donation Receipt</h2>
<p>A tax receipt has been sent to your email for your records.</p>
<p>We''ll be in touch soon with updates about how your donation is creating impact.</p>
<p>With heartfelt thanks,<br>{organizationName}</p>',
  0
),
(
  'Impact Update',
  'Follow-up showing impact of their donation',
  'thank_you',
  2,
  'Your donation is already making an impact!',
  '<h1>Amazing news, {firstName}!</h1>
<p>Your recent donation to {campaignName} is already creating positive change!</p>
<p>Since your contribution, we''ve been able to:</p>
<ul>
  <li>Move closer to our campaign goal</li>
  <li>Support more community members</li>
  <li>Expand our programs and services</li>
</ul>
<p>Your total support of ${lifetimeValue} continues to be the foundation of our success.</p>
<p>Thank you for believing in our mission!</p>
<p>Gratefully,<br>{organizationName} Team</p>',
  48
),
(
  'Recognition & Next Steps',
  'Acknowledge donor and suggest continued engagement',
  'thank_you',
  3,
  '{firstName}, you''re a valued member of our community',
  '<h1>Dear {firstName},</h1>
<p>As someone who has now donated {donationCount} times, you''re truly part of the {organizationName} family!</p>
<p>Your consistent support inspires us every day to work harder and reach higher.</p>
<h2>Stay Connected:</h2>
<ul>
  <li>Join us at our next community event</li>
  <li>Follow our social media for daily updates</li>
  <li>Share our mission with your network</li>
  <li>Consider setting up a recurring donation</li>
</ul>
<p>Thank you for being an incredible supporter!</p>
<p>With appreciation,<br>{organizationName}</p>',
  168
);

-- Insert Milestone Campaign Templates
INSERT INTO public.email_templates (name, description, campaign_type, sequence_order, subject_line, email_content, recommended_delay_hours) VALUES
(
  'Milestone Achieved',
  'Celebrate hitting a major milestone',
  'milestone',
  1,
  'We did it! Campaign milestone reached thanks to you!',
  '<h1>🎉 Amazing News, {firstName}!</h1>
<p>We''re thrilled to announce that {campaignName} has reached a major milestone!</p>
<p>Thanks to supporters like you who have donated {donationCount} times, we''ve achieved something incredible together.</p>
<h2>By the Numbers:</h2>
<ul>
  <li>Funds raised: Progress toward our goal</li>
  <li>Supporters engaged: Growing community</li>
  <li>Impact created: Real change happening</li>
</ul>
<p>Your ${lifetimeValue} in lifetime support has been crucial to this success.</p>
<p>Thank you for being part of this achievement!</p>
<p>Celebrating together,<br>{organizationName}</p>',
  0
),
(
  'Anniversary Recognition',
  'Celebrate donor anniversary',
  'milestone',
  1,
  'Happy {donorAnniversary} anniversary, {firstName}!',
  '<h1>Happy Anniversary, {firstName}!</h1>
<p>Did you know? You first supported {organizationName} on {firstDonationDate}!</p>
<p>Over the past year(s), you''ve:</p>
<ul>
  <li>Made {donationCount} generous donations</li>
  <li>Contributed ${lifetimeValue} to our mission</li>
  <li>Helped countless community members</li>
</ul>
<p>We wanted to take a moment to celebrate you and say thank you for your loyalty and commitment.</p>
<p>Here''s to many more years of partnership and impact!</p>
<p>With gratitude,<br>{organizationName} Team</p>',
  0
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();