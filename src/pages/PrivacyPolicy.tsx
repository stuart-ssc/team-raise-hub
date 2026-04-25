import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SeoHead } from '@/components/seo/SeoHead';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead
        title="Privacy Policy | Sponsorly"
        description="Learn how Sponsorly collects, uses, and protects personal data for organizations, supporters, and donors across our fundraising platform."
        path="/privacy"
      />
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground text-lg">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl space-y-8">
            
            {/* Introduction */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Sponsorly. This Privacy Policy explains how Sponsorly, Inc. ("Sponsorly," "we," "us," or "our") collects, uses, discloses, and protects your personal information when you use our platform and services.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Sponsorly, Inc.</strong><br />
                1042 Rockbridge Rd.<br />
                Lexington, KY 40515<br />
                Email: support@sponsorly.io
              </p>
              <p className="text-muted-foreground">
                By using Sponsorly, you agree to the collection and use of information in accordance with this policy. This policy applies to all users of our platform, including organization administrators, program managers, participants, donors, and business partners.
              </p>
            </Card>

            {/* Information We Collect */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect different types of information depending on how you interact with Sponsorly:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Organization Administrators & Program Managers</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Name, email address, phone number</li>
                    <li>Organization details (name, type, address, EIN for non-profits)</li>
                    <li>Role and permission levels within your organization</li>
                    <li>Profile information and avatar</li>
                    <li>Group/team assignments and roster management data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Participants (Students, Players, Volunteers)</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Name, email address, phone number</li>
                    <li>Team/roster assignment and fundraising attribution</li>
                    <li>Fundraising performance data (amounts raised, donor counts)</li>
                    <li>Profile information and avatar</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Donors & Supporters</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Name, email address, phone number, mailing address</li>
                    <li>Donation history and amounts</li>
                    <li>Payment information (processed securely through our payment processor)</li>
                    <li>Tax receipt information and preferences</li>
                    <li>Communication preferences and engagement history</li>
                    <li>RFM (Recency, Frequency, Monetary) segmentation data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Business Partners</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Business name, contact information, and address</li>
                    <li>Employer Identification Number (EIN)</li>
                    <li>Industry and business classification</li>
                    <li>Linked donor contacts and employee relationships</li>
                    <li>Donation/sponsorship history and engagement metrics</li>
                    <li>Advertising network membership and campaign access levels</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Automatically Collected Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Usage data and analytics (page views, session duration)</li>
                    <li>Campaign view tracking and referral sources</li>
                    <li>Email engagement data (opens, clicks)</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* How We Use Your Information */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use your information for the following purposes:</p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our fundraising platform and features</li>
                <li><strong>Account Management:</strong> To create and manage your user account and organization profile</li>
                <li><strong>Payment Processing:</strong> To process donations and sponsorships securely</li>
                <li><strong>Tax Compliance:</strong> To generate and distribute tax receipts for tax-deductible donations (non-profit organizations only)</li>
                <li><strong>Communications:</strong> To send transactional emails (donation confirmations, receipts, notifications), marketing communications (newsletters, campaign updates, fundraising reminders), and administrative updates</li>
                <li><strong>Analytics & Insights:</strong> To provide donor analytics, RFM segmentation, engagement tracking, and fundraising performance metrics</li>
                <li><strong>Advertising Network Operations:</strong> To facilitate business sponsorship opportunities, manage campaign visibility based on membership levels, and enable targeted outreach for sponsorship upsells</li>
                <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical assistance</li>
                <li><strong>Security & Fraud Prevention:</strong> To detect and prevent fraud, unauthorized access, and other security threats</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              </ul>
            </Card>

            {/* Information Sharing */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Within Your Organization</h3>
                  <p className="text-muted-foreground mb-2">
                    Organization administrators and authorized users within your organization can access donor contact information, donation history, and engagement data. Organizations can export this contact information for their own use, excluding any bank account or payment card details.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Service Providers</h3>
                  <p className="text-muted-foreground mb-2">
                    We share information with trusted third-party service providers who help us operate our platform:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>Supabase:</strong> Cloud database and authentication services</li>
                    <li><strong>Resend:</strong> Transactional email delivery</li>
                    <li><strong>HubSpot:</strong> Marketing analytics and tracking (on public marketing pages only)</li>
                    <li><strong>RB2B (Reveal):</strong> B2B visitor identification and analytics (on public marketing pages only)</li>
                    <li><strong>CookieYes:</strong> Cookie consent management and compliance</li>
                    <li><strong>Payment Processor:</strong> Secure payment processing (provider to be determined)</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    These service providers are contractually obligated to protect your information and use it only for the purposes we specify.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Business Transfers</h3>
                  <p className="text-muted-foreground">
                    If Sponsorly is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will provide notice before your information is transferred and becomes subject to a different privacy policy.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Legal Requirements</h3>
                  <p className="text-muted-foreground">
                    We may disclose your information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">We Do Not Sell Your Personal Information</h3>
                  <p className="text-muted-foreground">
                    Sponsorly does not sell, rent, or trade your personal information to third parties for their marketing purposes. Our advertising network operates on a membership and access model (see below), not data sales.
                  </p>
                </div>
              </div>
            </Card>

            {/* Business Advertising Network */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Business Advertising Network</h2>
              <p className="text-muted-foreground mb-4">
                Sponsorly operates a business advertising network that connects businesses with fundraising opportunities across multiple organizations. Here's how it works:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Membership & Access Model</h3>
                  <p className="text-muted-foreground">
                    Businesses can purchase membership access at different levels (local, regional, or national). Membership grants them visibility into fundraising campaigns tied to organizations within their chosen geographic area. Businesses can then choose which campaigns to participate in or respond to sponsorship requests.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Campaign Visibility</h3>
                  <p className="text-muted-foreground">
                    When a business purchases membership, they gain the ability to see campaigns from organizations in their coverage area. This is not a sale of donor data—it's an access subscription that allows businesses to discover and participate in relevant fundraising opportunities.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Upselling Opportunities</h3>
                  <p className="text-muted-foreground">
                    When businesses engage with campaigns through an organization, we may present them with opportunities to expand their reach by upgrading their membership level or participating in additional campaigns across the Sponsorly network.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Business Information</h3>
                  <p className="text-muted-foreground">
                    Business information (company name, industry, location, engagement history) is used to facilitate these sponsorship connections and is visible to Sponsorly administrators who manage the advertising network. Individual donor personal information is never shared with businesses unless the donor makes a direct contribution through that business's employee relationship.
                  </p>
                </div>
              </div>
            </Card>

            {/* Tax Information & EIN Handling */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Tax Information & EIN Handling</h2>
              <p className="text-muted-foreground mb-4">
                For non-profit organizations registered as 501(c)(3) entities, we handle sensitive tax information with special care:
              </p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Employer Identification Numbers (EINs):</strong> We securely store non-profit organization EINs solely for the purpose of generating IRS-compliant tax receipts for donors</li>
                <li><strong>Tax Receipt Generation:</strong> Donation receipts include the organization's EIN, donor information, donation amounts, and tax-deductible calculations as required by IRS regulations</li>
                <li><strong>Annual Tax Summaries:</strong> Donors who make tax-deductible contributions receive consolidated annual summaries in January for tax filing purposes</li>
                <li><strong>Donor Receipt Portal:</strong> Donors can access, search, and download their historical tax receipts through a secure self-service portal</li>
                <li><strong>Business EINs:</strong> Business partner EINs are stored to verify business legitimacy and facilitate sponsorship relationships, with access restricted to authorized Sponsorly administrators only</li>
              </ul>
              
              <p className="text-muted-foreground mt-4">
                EIN information is treated as highly sensitive and is subject to the strictest access controls and security measures within our platform.
              </p>
            </Card>

            {/* Data Retention */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tax-Related Records (7 Years)</h3>
                  <p className="text-muted-foreground">
                    To comply with IRS requirements and maintain proper tax documentation, we retain the following information for <strong>seven (7) years</strong> from the date of the donation:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Donation transaction records and amounts</li>
                    <li>Tax receipts and annual summaries</li>
                    <li>Non-profit organization EIN information</li>
                    <li>Donor names and addresses associated with tax-deductible donations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Other Personal Data (60 Days Post-Deactivation)</h3>
                  <p className="text-muted-foreground mb-2">
                    When you deactivate your account, we will delete all other personal information <strong>60 days after deactivation</strong>, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Contact information (email, phone, mailing address)</li>
                    <li>Profile data and preferences</li>
                    <li>Engagement history and analytics data</li>
                    <li>Communication logs (except as required for tax records)</li>
                    <li>Non-tax-related transaction information</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    The 60-day grace period allows for account recovery if deactivation was accidental.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Active Account Data</h3>
                  <p className="text-muted-foreground">
                    For active accounts, we retain your information for as long as your account remains active and as necessary to provide you with our services.
                  </p>
                </div>
              </div>
            </Card>

            {/* Your Privacy Rights (CCPA) */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Your Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground mb-4">
                Sponsorly operates exclusively in the United States and complies with the California Consumer Privacy Act (CCPA). If you are a California resident, you have the following rights:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Right to Know</h3>
                  <p className="text-muted-foreground">
                    You have the right to request disclosure of the categories and specific pieces of personal information we have collected about you, the sources from which we collected it, the purposes for which we use it, and the categories of third parties with whom we share it.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Right to Delete</h3>
                  <p className="text-muted-foreground">
                    You have the right to request deletion of your personal information, subject to certain exceptions (such as tax record retention requirements).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Right to Opt-Out of Marketing</h3>
                  <p className="text-muted-foreground">
                    While participation in Sponsorly constitutes consent to receive marketing communications, you may opt out of marketing emails at any time by clicking the "unsubscribe" link in any marketing email or by contacting us at support@sponsorly.io.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Right to Non-Discrimination</h3>
                  <p className="text-muted-foreground">
                    You have the right not to receive discriminatory treatment for exercising your CCPA privacy rights.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">How to Exercise Your Rights</h3>
                  <p className="text-muted-foreground">
                    To exercise any of these rights, please contact us at support@sponsorly.io. We will verify your identity before processing your request and respond within 45 days.
                  </p>
                </div>
              </div>
            </Card>

            {/* Children's Privacy */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Sponsorly is designed for use by individuals aged <strong>13 years and older</strong>. We do not knowingly collect personal information from children under 13 without parental consent.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Student Participants</h3>
                  <p className="text-muted-foreground">
                    When student participants under the age of 18 are added to rosters by their school or organization, we require that organization administrators obtain appropriate parental consent before creating accounts for minors. Parents/guardians should review this Privacy Policy with their children.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Parental Rights</h3>
                  <p className="text-muted-foreground">
                    Parents or legal guardians may review, modify, or request deletion of their child's information by contacting their organization administrator or by emailing us at support@sponsorly.io.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">If We Learn We Have Collected Information from Children Under 13</h3>
                  <p className="text-muted-foreground">
                    If we discover that we have inadvertently collected personal information from a child under 13 without proper parental consent, we will delete that information as quickly as possible.
                  </p>
                </div>
              </div>
            </Card>

            {/* Cookies & Tracking */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Cookies & Tracking Technologies</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">HubSpot Analytics</h3>
                  <p className="text-muted-foreground">
                    We use HubSpot tracking on our public marketing pages (homepage, features, pricing, contact) to analyze visitor behavior and improve our marketing efforts. HubSpot may place cookies on your browser to track page views, referral sources, and user journeys. This tracking is <strong>disabled on dashboard and system administration pages</strong> where users manage sensitive information.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">RB2B (Reveal) Analytics</h3>
                  <p className="text-muted-foreground">
                    We use RB2B (also known as Reveal) on our public marketing pages to identify business visitors and understand which companies are interested in our services. RB2B helps us identify the organizations behind website visits for B2B marketing purposes. Like HubSpot, this tracking is <strong>disabled on dashboard and system administration pages</strong> where users manage sensitive information.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Cookie Consent Management</h3>
                  <p className="text-muted-foreground">
                    We use CookieYes to manage cookie consent on our website. This service displays a cookie consent banner that allows you to accept, reject, or customize which cookies you allow. CookieYes itself places a necessary cookie to remember your consent preferences. This banner appears on all pages, including dashboard areas, so you can always manage your preferences.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Progressive Web App (PWA) Functionality</h3>
                  <p className="text-muted-foreground">
                    Sponsorly functions as a Progressive Web App (PWA), which uses browser localStorage and service workers to enable offline functionality, improve performance, and provide an app-like experience. This includes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Caching static assets for offline access</li>
                    <li>Storing user preferences and session data locally</li>
                    <li>Saving draft content (such as email compositions) to prevent data loss</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    You can clear this locally stored data at any time through your browser settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground">
                    We use essential cookies to maintain your login session, remember your preferences, and ensure proper platform functionality. These cookies are necessary for the platform to work and cannot be disabled.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Managing Cookies</h3>
                  <p className="text-muted-foreground">
                    You can control and delete cookies through your browser settings. However, disabling certain cookies may affect your ability to use some features of Sponsorly.
                  </p>
                </div>
              </div>
            </Card>

            {/* Data Security */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. These measures include:
              </p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Restricted access to personal information based on role-based permissions</li>
                <li>Secure hosting infrastructure with industry-standard protections</li>
                <li>Employee training on data security best practices</li>
              </ul>
              
              <p className="text-muted-foreground mt-4">
                While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to maintaining industry-standard protections.
              </p>
            </Card>

            {/* Data Breach Notification */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Data Breach Notification</h2>
              <p className="text-muted-foreground mb-4">
                In the unlikely event of a data breach that affects your personal information, we are committed to transparency and prompt notification.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">72-Hour Notification Commitment</h3>
                  <p className="text-muted-foreground">
                    If we discover a data breach involving your personal information, we will notify you within <strong>72 hours</strong> of becoming aware of the breach. Our notification will include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>The nature of the breach and types of information affected</li>
                    <li>Steps we are taking to investigate and remediate the breach</li>
                    <li>Recommended actions you can take to protect yourself</li>
                    <li>Contact information for further assistance</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Regulatory Notification</h3>
                  <p className="text-muted-foreground">
                    We will also notify appropriate regulatory authorities as required by applicable law.
                  </p>
                </div>
              </div>
            </Card>

            {/* Marketing Communications */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Marketing Communications</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Opt-In by Participation</h3>
                  <p className="text-muted-foreground">
                    By creating an account and participating in Sponsorly, you consent to receive marketing communications from us, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Newsletters and platform updates</li>
                    <li>Campaign launch announcements and reminders</li>
                    <li>Fundraising tips and best practices</li>
                    <li>New feature announcements</li>
                    <li>Donor engagement strategies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Transactional Emails (Cannot Be Disabled)</h3>
                  <p className="text-muted-foreground">
                    Certain emails are necessary for the operation of your account and cannot be disabled, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Account verification and security notifications</li>
                    <li>Donation confirmations and tax receipts</li>
                    <li>Order updates and transaction summaries</li>
                    <li>Critical platform updates and maintenance notices</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">How to Opt Out of Marketing Emails</h3>
                  <p className="text-muted-foreground">
                    You can opt out of marketing communications at any time by:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Clicking the "unsubscribe" link at the bottom of any marketing email</li>
                    <li>Updating your notification preferences in your account settings</li>
                    <li>Emailing us at support@sponsorly.io with your opt-out request</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Changes to This Policy */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make changes, we will:
              </p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Update the "Last Updated" date at the top of this policy</li>
                <li>Notify you via email if the changes are material</li>
                <li>Post a notice on our platform about the updated policy</li>
              </ul>
              
              <p className="text-muted-foreground mt-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. Your continued use of Sponsorly after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </Card>

            {/* Contact Us */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> support@sponsorly.io</p>
                <p>
                  <strong>Mailing Address:</strong><br />
                  Sponsorly, Inc.<br />
                  1042 Rockbridge Rd.<br />
                  Lexington, KY 40515
                </p>
              </div>
              
              <Separator className="my-6" />
              
              <p className="text-sm text-muted-foreground">
                We will respond to all privacy-related inquiries within a reasonable timeframe, typically within 10 business days.
              </p>
            </Card>

            {/* Additional Legal Resources */}
            <Card className="p-6 md:p-8 bg-muted/50">
              <h3 className="text-lg font-semibold mb-3">Additional Legal Resources</h3>
              <p className="text-muted-foreground mb-3">
                For more information about how we handle data in business relationships, please review our:
              </p>
              <a 
                href="/dpa" 
                className="text-primary hover:underline font-medium"
              >
                Data Processing Agreement (DPA) →
              </a>
            </Card>

          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
};

export default PrivacyPolicy;
