import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { Card } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground text-lg">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl space-y-8">
            
            {/* Section 1 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using Sponsorly (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you may not use the Platform. You must be at least 13 years of age to use 
                Sponsorly. By using the Platform, you represent and warrant that you have the legal capacity to enter into 
                these Terms and to comply with all applicable laws and regulations.
              </p>
            </Card>

            {/* Section 2 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">2. Description of Services</h2>
              <p className="text-muted-foreground">
                Sponsorly is a fundraising platform that connects schools, non-profit organizations, businesses, and supporters 
                to facilitate charitable donations and sponsorships. The Platform enables organizations to create campaigns, 
                manage rosters for peer-to-peer fundraising, process donations with a 10% platform fee (which by default is added 
                on top of the donation, or, at the organization's option per campaign, absorbed by the organization), and engage 
                with their donor community. Businesses can join our advertising network to discover and participate in campaigns 
                aligned with their corporate social responsibility goals.
              </p>
            </Card>

            {/* Section 3 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">3. Account Registration and Security</h2>
              <p className="text-muted-foreground">
                To use certain features of the Platform, you must create an account. You agree to provide accurate, current, 
                and complete information during registration and to update such information to keep it accurate and current. 
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that 
                occur under your account. You agree to immediately notify us of any unauthorized use of your account. Each user 
                may maintain only one account.
              </p>
            </Card>

            {/* Section 4 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">4. Organization Accounts</h2>
              <p className="text-muted-foreground">
                Organizations creating accounts represent and warrant that they are duly authorized to act on behalf of the 
                organization and to bind the organization to these Terms. Organizations requiring 501(c)(3) verification or 
                similar tax-exempt status verification must complete the verification process before publishing campaigns. 
                Organizations agree to comply with all applicable laws and regulations governing charitable fundraising and 
                tax-exempt entities in their jurisdiction.
              </p>
            </Card>

            {/* Section 5 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">5. Campaign Guidelines and Prohibited Activities</h2>
              <p className="text-muted-foreground mb-4">
                Organizations creating campaigns must ensure all campaign information is truthful, accurate, and not misleading. 
                Organizations are solely responsible for the proper use of funds raised through their campaigns. The following 
                campaign types and activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Campaigns promoting illegal activities or products</li>
                <li>Fraudulent or deceptive fundraising schemes</li>
                <li>Adult content, sexually explicit material, or gambling</li>
                <li>Content promoting discrimination, hate speech, or violence based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</li>
                <li>Campaigns misrepresenting the use of funds or the organization's tax-exempt status</li>
                <li>Pyramid schemes, multi-level marketing, or similar business structures</li>
              </ul>
            </Card>

            {/* Section 6 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">6. Donations, Payments, and Fees</h2>
              <p className="text-muted-foreground mb-4">
                <strong>Platform Fee:</strong> All donations processed through Sponsorly are subject to a 10% platform fee. 
                By default, this fee is added on top of the donation amount — for example, a $100 donation results in a total 
                charge of $110 to the donor, and the organization receives the full intended donation amount ($100). 
                Organizations may, on a per-campaign basis, elect to absorb the platform fee instead. In absorbed-fee campaigns, 
                the donor is charged only the headline donation amount and the 10% fee is deducted from the organization's payout. 
                In either case, Sponsorly retains the 10% fee to cover payment processing costs and platform infrastructure.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>No Refunds Policy:</strong> Donations are final and non-refundable except in cases of proven fraud or 
                unauthorized transactions. Donors acknowledge that organizations are solely responsible for the use of donated 
                funds and that Sponsorly does not control or direct how funds are utilized.
              </p>
              <p className="text-muted-foreground">
                <strong>Tax Receipts:</strong> Tax receipts generated by the Platform are provided for informational purposes 
                only. Donors are responsible for determining the tax-deductibility of their contributions and should consult 
                with a qualified tax professional regarding their specific circumstances.
              </p>
            </Card>

            {/* Section 7 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">7. Business and Sponsor Accounts</h2>
              <p className="text-muted-foreground">
                Businesses may join Sponsorly's advertising network to gain membership-based access to campaigns in specific 
                geographic regions. Membership levels (local, regional, national) determine which campaigns are visible to the 
                business. Access to campaign information does not constitute a sale or sharing of personal data; rather, it 
                provides the business with the opportunity to voluntarily participate in campaigns aligned with their interests. 
                Businesses choose which campaigns to engage with and are not obligated to donate or sponsor.
              </p>
            </Card>

            {/* Section 8 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">8. User Content and License Grant</h2>
              <p className="text-muted-foreground mb-4">
                You retain all ownership rights to content you submit, post, or display on the Platform ("User Content"). 
                However, by submitting User Content, you grant Sponsorly a non-exclusive, worldwide, royalty-free, sublicensable, 
                and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your 
                User Content in connection with operating and providing the Platform.
              </p>
              <p className="text-muted-foreground mb-4">
                You represent and warrant that you own or have the necessary rights to submit User Content and that your User 
                Content does not violate any third-party rights. Sponsorly reserves the right to remove or refuse to display 
                any User Content that violates these Terms or is otherwise objectionable.
              </p>
              <p className="text-muted-foreground">
                Prohibited User Content includes, but is not limited to: illegal content, fraudulent information, adult or 
                sexually explicit material, hate speech, harassment, impersonation of others, content infringing intellectual 
                property rights, and malicious code or viruses.
              </p>
            </Card>

            {/* Section 9 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">9. Intellectual Property Rights</h2>
              <p className="text-muted-foreground">
                The Platform, including all software, text, graphics, logos, images, and other content, is the property of 
                Sponsorly, Inc. or its licensors and is protected by United States and international copyright, trademark, and 
                other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Platform 
                without our express written permission.
              </p>
            </Card>

            {/* Section 10 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">10. Privacy and Data Collection</h2>
              <p className="text-muted-foreground">
                Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by 
                reference. Please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> to understand our data collection, use, 
                and disclosure practices. By using the Platform, you consent to our collection and use of your information as 
                described in the Privacy Policy.
              </p>
            </Card>

            {/* Section 11 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">11. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">
                In addition to the prohibitions outlined elsewhere in these Terms, you agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the Platform for any illegal purpose or in violation of any applicable laws</li>
                <li>Engage in fraudulent activities or misrepresent your identity or affiliation</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Impersonate any person or entity or falsely claim an affiliation</li>
                <li>Interfere with or disrupt the Platform or servers or networks connected to the Platform</li>
                <li>Use automated means (bots, scrapers, crawlers) to access the Platform without permission</li>
                <li>Attempt to gain unauthorized access to any portion of the Platform or any other systems or networks</li>
                <li>Transmit viruses, malware, or other malicious code</li>
                <li>Collect or harvest personal information about other users without their consent</li>
              </ul>
            </Card>

            {/* Section 12 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">12. Disclaimers and Warranties</h2>
              <p className="text-muted-foreground mb-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
                NON-INFRINGEMENT. SPONSORLY DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF 
                VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Tax Disclaimer:</strong> Sponsorly does not provide tax, legal, or financial advice. The Platform 
                generates tax receipts for informational purposes only. Users are solely responsible for determining the 
                tax-deductibility of their donations and for complying with all applicable tax laws and reporting requirements. 
                Users should consult with qualified tax professionals regarding their specific circumstances.
              </p>
              <p className="text-muted-foreground">
                <strong>No Endorsement:</strong> Sponsorly does not endorse, verify, or guarantee the accuracy of information 
                provided by organizations or the legitimacy of campaigns. Users engage with organizations and campaigns at their 
                own risk.
              </p>
            </Card>

            {/* Section 13 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">13. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPONSORLY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE 
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
                REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE 
                LOSSES, RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE PLATFORM; (B) ANY UNAUTHORIZED ACCESS TO OR USE OF 
                OUR SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN; (C) ANY INTERRUPTION OR CESSATION OF TRANSMISSION 
                TO OR FROM THE PLATFORM; (D) ANY BUGS, VIRUSES, OR OTHER HARMFUL CODE TRANSMITTED THROUGH THE PLATFORM; OR (E) 
                ANY ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF ANY CONTENT 
                POSTED, EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE THROUGH THE PLATFORM.
              </p>
              <p className="text-muted-foreground">
                IN NO EVENT SHALL SPONSORLY'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION EXCEED THE 
                AMOUNT PAID BY YOU TO SPONSORLY IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </Card>

            {/* Section 14 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">14. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless Sponsorly, its officers, directors, employees, agents, and 
                affiliates from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees 
                (including reasonable attorneys' fees) arising from: (a) your use of the Platform; (b) your violation of these 
                Terms; (c) your violation of any rights of another party; or (d) your User Content.
              </p>
            </Card>

            {/* Section 15 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">15. Dispute Resolution and Arbitration</h2>
              <p className="text-muted-foreground mb-4">
                <strong>Binding Arbitration:</strong> Any dispute, controversy, or claim arising out of or relating to these 
                Terms or the Platform shall be resolved by binding arbitration administered by the American Arbitration 
                Association (AAA) in accordance with its Commercial Arbitration Rules. The arbitration shall take place in 
                Lexington, Kentucky, unless otherwise agreed by the parties.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Class Action Waiver:</strong> You agree that any arbitration or proceeding shall be conducted on an 
                individual basis and not as a class action, consolidated action, or representative action. You waive your 
                right to participate in a class action lawsuit or class-wide arbitration.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Small Claims Exception:</strong> Either party may pursue a claim in small claims court if the claim is 
                within the court's jurisdiction and proceeds on an individual basis.
              </p>
              <p className="text-muted-foreground">
                <strong>Venue for Permitted Court Actions:</strong> Any permitted court actions shall be brought exclusively in 
                the state or federal courts located in Fayette County, Kentucky.
              </p>
            </Card>

            {/* Section 16 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">16. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of Kentucky, 
                without regard to its conflict of law provisions.
              </p>
            </Card>

            {/* Section 17 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">17. Account Termination</h2>
              <p className="text-muted-foreground mb-4">
                You may terminate your account at any time by contacting us at support@sponsorly.io. Sponsorly reserves the 
                right to suspend or terminate your account at any time, with or without notice, for any reason, including but 
                not limited to violation of these Terms, fraudulent activity, or prolonged inactivity.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Platform will immediately cease. Data retention following termination 
                is governed by our Privacy Policy. Tax-related records (donations, receipts, EINs) will be retained for seven 
                (7) years as required by law. All other personal data will be deleted sixty (60) days after account deactivation.
              </p>
            </Card>

            {/* Section 18 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">18. Modifications to Terms</h2>
              <p className="text-muted-foreground">
                Sponsorly reserves the right to modify these Terms at any time. We will notify users of material changes by 
                posting the updated Terms on the Platform and updating the "Last updated" date at the top of this page. For 
                significant changes, we may also send email notifications to registered users. Your continued use of the 
                Platform after changes become effective constitutes your acceptance of the revised Terms.
              </p>
            </Card>

            {/* Section 19 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">19. General Provisions</h2>
              <p className="text-muted-foreground mb-4">
                <strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the 
                remaining provisions shall remain in full force and effect.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy and any other legal notices 
                published on the Platform, constitute the entire agreement between you and Sponsorly regarding your use of the 
                Platform.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not be deemed a 
                waiver of such right or provision.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. 
                Sponsorly may assign or transfer these Terms at any time without restriction.
              </p>
              <p className="text-muted-foreground">
                <strong>Marketing Communications:</strong> By creating an account, you consent to receive marketing 
                communications from Sponsorly, including newsletters, reminders, and promotional emails. You may opt out of 
                marketing communications at any time by following the unsubscribe instructions in our emails or by contacting 
                us at support@sponsorly.io.
              </p>
            </Card>

            {/* Section 20 */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">20. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <p className="text-muted-foreground">
                <strong>Sponsorly, Inc.</strong><br />
                1042 Rockbridge Rd<br />
                Lexington, KY 40515<br />
                United States<br />
                Email: <a href="mailto:support@sponsorly.io" className="text-primary hover:underline">support@sponsorly.io</a>
              </p>
            </Card>

          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
};

export default Terms;
