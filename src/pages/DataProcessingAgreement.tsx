import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const DataProcessingAgreement = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Data Processing Agreement</h1>
              <p className="text-muted-foreground text-lg">Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                This Data Processing Agreement ("DPA") forms part of the Terms of Service between Sponsorly, Inc. ("Sponsorly," "Data Processor," "we," "us," or "our") and the organization using the Sponsorly platform ("Customer," "Data Controller," "you," or "your").
              </p>
              <p className="text-muted-foreground mb-4">
                This DPA governs the processing of personal data by Sponsorly on behalf of the Customer in connection with the Sponsorly fundraising platform services.
              </p>
              <p className="text-muted-foreground">
                <strong>Sponsorly, Inc.</strong><br />
                1042 Rockbridge Rd.<br />
                Lexington, KY 40515<br />
                Email: support@sponsorly.io
              </p>
            </Card>

            {/* Definitions */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">1. Definitions</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="font-semibold text-foreground">"Personal Data"</dt>
                  <dd className="text-muted-foreground ml-4">
                    means any information relating to an identified or identifiable individual that is processed by Sponsorly on behalf of Customer, including donor names, contact information, donation history, and engagement data.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">"Data Controller"</dt>
                  <dd className="text-muted-foreground ml-4">
                    means the Customer organization that determines the purposes and means of processing Personal Data.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">"Data Processor"</dt>
                  <dd className="text-muted-foreground ml-4">
                    means Sponsorly, which processes Personal Data on behalf of the Data Controller.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">"Sub-processor"</dt>
                  <dd className="text-muted-foreground ml-4">
                    means any third party engaged by Sponsorly to process Personal Data on behalf of the Data Controller.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">"Data Subject"</dt>
                  <dd className="text-muted-foreground ml-4">
                    means an identified or identifiable individual whose Personal Data is processed, including donors, supporters, organization members, and business contacts.
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Scope and Purpose */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">2. Scope and Purpose of Processing</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">2.1 Subject Matter</h3>
                  <p className="text-muted-foreground">
                    Sponsorly provides a cloud-based fundraising platform that enables organizations to manage campaigns, process donations, engage with donors, and generate tax receipts.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">2.2 Duration</h3>
                  <p className="text-muted-foreground">
                    Processing will continue for the duration of the Customer's use of the Sponsorly platform and for the data retention periods specified in our Privacy Policy (7 years for tax-related records, 60 days post-account deactivation for other data).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">2.3 Nature and Purpose of Processing</h3>
                  <p className="text-muted-foreground mb-2">Sponsorly processes Personal Data for the following purposes:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Facilitating online fundraising campaigns and donation processing</li>
                    <li>Generating and distributing tax receipts for tax-deductible donations</li>
                    <li>Providing donor relationship management and analytics tools</li>
                    <li>Enabling peer-to-peer fundraising with roster attribution</li>
                    <li>Facilitating email communications between organizations and supporters</li>
                    <li>Managing organization accounts, users, groups, and permissions</li>
                    <li>Connecting businesses with sponsorship opportunities through our advertising network</li>
                    <li>Providing platform analytics and performance reporting</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">2.4 Types of Personal Data</h3>
                  <p className="text-muted-foreground mb-2">Personal Data processed includes:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Contact information (names, email addresses, phone numbers, mailing addresses)</li>
                    <li>Donation transaction data (amounts, dates, payment methods)</li>
                    <li>Tax information (organization and business EINs for receipt generation)</li>
                    <li>Engagement data (email opens/clicks, campaign views, fundraising performance)</li>
                    <li>Account credentials and authentication data</li>
                    <li>Organization and business profile information</li>
                    <li>User role and permission assignments</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">2.5 Categories of Data Subjects</h3>
                  <p className="text-muted-foreground mb-2">Data Subjects include:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Donors and supporters who contribute to campaigns</li>
                    <li>Organization administrators and staff members</li>
                    <li>Program managers and coaches</li>
                    <li>Student participants, players, and volunteers</li>
                    <li>Business contacts and partners in the advertising network</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Data Processor Obligations */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">3. Data Processor Obligations</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">3.1 Processing Instructions</h3>
                  <p className="text-muted-foreground">
                    Sponsorly will process Personal Data only in accordance with the Customer's documented instructions as set forth in this DPA and the Terms of Service, except where required by applicable law.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.2 Confidentiality</h3>
                  <p className="text-muted-foreground">
                    Sponsorly ensures that all personnel authorized to process Personal Data are subject to confidentiality obligations and receive appropriate training on data protection requirements.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.3 Compliance with Laws</h3>
                  <p className="text-muted-foreground">
                    Sponsorly will comply with all applicable data protection laws and regulations, including the California Consumer Privacy Act (CCPA), when processing Personal Data on behalf of the Customer.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.4 No Unauthorized Processing</h3>
                  <p className="text-muted-foreground">
                    Sponsorly will not process, disclose, or use Personal Data for any purpose other than as specified in this DPA and the Privacy Policy, or as otherwise instructed by the Customer.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.5 Prohibited Data Sales</h3>
                  <p className="text-muted-foreground">
                    Sponsorly does not sell Personal Data to third parties. Our business advertising network operates on a membership and access model, not data sales. Businesses purchase visibility into campaigns within their geographic area—they do not purchase donor contact lists or personal information.
                  </p>
                </div>
              </div>
            </Card>

            {/* Security Measures */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">4. Security Measures</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">4.1 Technical and Organizational Measures</h3>
                  <p className="text-muted-foreground mb-2">
                    Sponsorly implements appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Encryption of Personal Data in transit and at rest</li>
                    <li>Role-based access controls and authentication mechanisms</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Secure hosting infrastructure with industry-standard protections</li>
                    <li>Employee training on data security and privacy best practices</li>
                    <li>Incident response procedures and breach notification protocols</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">4.2 Sensitive Information Protection</h3>
                  <p className="text-muted-foreground">
                    Special security measures apply to highly sensitive information including Employer Identification Numbers (EINs), payment card data, and tax receipt information. Access to this data is restricted to authorized personnel only and subject to enhanced monitoring.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">4.3 Security Updates</h3>
                  <p className="text-muted-foreground">
                    Sponsorly continuously monitors emerging security threats and updates security measures as needed to maintain appropriate protection of Personal Data.
                  </p>
                </div>
              </div>
            </Card>

            {/* Sub-processors */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">5. Sub-processors</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">5.1 Authorized Sub-processors</h3>
                  <p className="text-muted-foreground mb-2">
                    Customer acknowledges and agrees that Sponsorly may engage the following Sub-processors to assist in providing the Services:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Supabase, Inc.</strong> - Cloud database, authentication, and storage services</li>
                    <li><strong>Resend, Inc.</strong> - Transactional and marketing email delivery</li>
                    <li><strong>HubSpot, Inc.</strong> - Marketing analytics and visitor tracking (on public pages only)</li>
                    <li><strong>RB2B, Inc. (Reveal)</strong> - B2B visitor identification and analytics (on public marketing pages only)</li>
                    <li><strong>Payment Processor</strong> - Secure payment processing (specific provider to be determined and disclosed)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">5.2 Sub-processor Obligations</h3>
                  <p className="text-muted-foreground">
                    Sponsorly ensures that all Sub-processors are bound by written agreements requiring them to provide at least the same level of data protection as set forth in this DPA. Sponsorly remains liable for the acts and omissions of its Sub-processors.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">5.3 Changes to Sub-processors</h3>
                  <p className="text-muted-foreground">
                    Sponsorly will notify Customer of any intended changes to Sub-processors with at least 30 days' prior notice. Customer may object to the use of a new Sub-processor on reasonable data protection grounds by notifying Sponsorly within 15 days of receiving notice.
                  </p>
                </div>
              </div>
            </Card>

            {/* Data Subject Rights */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">6. Data Subject Rights</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">6.1 Assistance with Data Subject Requests</h3>
                  <p className="text-muted-foreground">
                    Sponsorly will, to the extent legally permitted, promptly notify Customer if Sponsorly receives a request from a Data Subject to exercise their rights under data protection laws (including rights of access, correction, deletion, or portability).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">6.2 Customer Responsibility</h3>
                  <p className="text-muted-foreground">
                    Customer is responsible for responding to Data Subject requests. Sponsorly will provide reasonable assistance to enable Customer to respond to such requests, taking into account the nature of the processing.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">6.3 Data Portability and Export</h3>
                  <p className="text-muted-foreground">
                    Customer may export donor contact information, donation history, and campaign data at any time through the platform's export functionality. Sensitive payment information (bank accounts, card numbers) is excluded from exports for security reasons.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">6.4 Tax Receipt Access</h3>
                  <p className="text-muted-foreground">
                    Donors have self-service access to view, search, and download their historical tax receipts through the Donor Receipt Portal, ensuring they can exercise their rights to access their tax documentation.
                  </p>
                </div>
              </div>
            </Card>

            {/* Data Breach Notification */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">7. Data Breach Notification</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">7.1 Breach Notification to Customer</h3>
                  <p className="text-muted-foreground">
                    In the event of a Personal Data breach, Sponsorly will notify Customer within 72 hours of becoming aware of the breach. The notification will include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Description of the nature of the breach and categories of data affected</li>
                    <li>Estimated number of Data Subjects and Personal Data records concerned</li>
                    <li>Name and contact details of Sponsorly's data protection point of contact</li>
                    <li>Description of likely consequences of the breach</li>
                    <li>Measures taken or proposed to address the breach and mitigate harm</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">7.2 Customer Notification Obligations</h3>
                  <p className="text-muted-foreground">
                    Customer acknowledges that it is responsible for notifying affected Data Subjects and regulatory authorities as required by applicable law. Sponsorly will provide reasonable cooperation and assistance to Customer in meeting these obligations.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">7.3 Remediation</h3>
                  <p className="text-muted-foreground">
                    Sponsorly will take prompt action to investigate and remediate any security incident, including implementing measures to prevent future occurrences.
                  </p>
                </div>
              </div>
            </Card>

            {/* Audits and Inspections */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">8. Audits and Inspections</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">8.1 Audit Rights</h3>
                  <p className="text-muted-foreground">
                    Customer has the right to audit Sponsorly's compliance with this DPA once per calendar year, upon reasonable notice (at least 30 days) and during regular business hours. Audits must not unreasonably interfere with Sponsorly's business operations.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">8.2 Audit Scope</h3>
                  <p className="text-muted-foreground">
                    Audits may include review of Sponsorly's security measures, data processing practices, Sub-processor agreements, and compliance with this DPA. Customer may use a qualified independent auditor bound by confidentiality obligations.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">8.3 Audit Costs</h3>
                  <p className="text-muted-foreground">
                    Customer is responsible for all costs associated with conducting audits, including fees for independent auditors. Sponsorly may charge reasonable fees for time spent facilitating the audit if it exceeds one business day.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">8.4 Compliance Reports</h3>
                  <p className="text-muted-foreground">
                    As an alternative to individual audits, Sponsorly may provide Customer with copies of relevant third-party audit reports or certifications demonstrating compliance with industry standards (when available).
                  </p>
                </div>
              </div>
            </Card>

            {/* Data Deletion and Return */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">9. Data Deletion and Return</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">9.1 Deletion Upon Account Deactivation</h3>
                  <p className="text-muted-foreground">
                    Upon Customer's written request or account deactivation, Sponsorly will delete or return all Personal Data processed on behalf of Customer within 60 days, subject to the exceptions below.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">9.2 Tax Record Retention Exception</h3>
                  <p className="text-muted-foreground">
                    Notwithstanding the above, Sponsorly will retain the following information for seven (7) years from the date of donation to comply with IRS tax documentation requirements:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Donation transaction records and amounts</li>
                    <li>Tax receipts and annual summaries</li>
                    <li>Organization EIN information (for non-profits)</li>
                    <li>Donor names and addresses associated with tax-deductible donations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">9.3 Legal Retention Requirements</h3>
                  <p className="text-muted-foreground">
                    Sponsorly may retain Personal Data to the extent required by applicable law, regulation, or court order, and will inform Customer of any such requirements if legally permitted to do so.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">9.4 Certification of Deletion</h3>
                  <p className="text-muted-foreground">
                    Upon request, Sponsorly will provide Customer with written certification confirming the deletion of Personal Data in accordance with this section.
                  </p>
                </div>
              </div>
            </Card>

            {/* Term and Termination */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">10. Term and Termination</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">10.1 Effective Date and Duration</h3>
                  <p className="text-muted-foreground">
                    This DPA takes effect on the date Customer first uses the Sponsorly platform and remains in effect until termination of the Terms of Service or all Personal Data has been deleted or returned in accordance with Section 9.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">10.2 Survival</h3>
                  <p className="text-muted-foreground">
                    Sections of this DPA that by their nature should survive termination (including confidentiality, data deletion, and limitation of liability provisions) will continue in effect after termination.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">10.3 Effect of Termination</h3>
                  <p className="text-muted-foreground">
                    Upon termination, Sponsorly's authorization to process Personal Data will cease, except as necessary to comply with legal obligations or as instructed by Customer regarding data deletion or return.
                  </p>
                </div>
              </div>
            </Card>

            {/* Limitation of Liability */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">11. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                The total aggregate liability of Sponsorly arising out of or related to this DPA will be subject to the limitations of liability set forth in the Terms of Service.
              </p>
              <p className="text-muted-foreground">
                Nothing in this DPA limits or excludes either party's liability for fraud, gross negligence, or matters that cannot be limited or excluded under applicable law.
              </p>
            </Card>

            {/* Governing Law */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                This DPA is governed by the laws of the State of Kentucky, United States, without regard to its conflict of law provisions.
              </p>
              <p className="text-muted-foreground">
                Any disputes arising from or relating to this DPA will be resolved in accordance with the dispute resolution procedures set forth in the Terms of Service.
              </p>
            </Card>

            {/* Amendments */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">13. Amendments</h2>
              <p className="text-muted-foreground mb-4">
                Sponsorly may update this DPA from time to time to reflect changes in data protection laws, business practices, or regulatory requirements. Material changes will be communicated to Customer with at least 30 days' notice.
              </p>
              <p className="text-muted-foreground">
                Customer's continued use of the Sponsorly platform after receiving notice of changes constitutes acceptance of the updated DPA.
              </p>
            </Card>

            {/* Contact Information */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions, concerns, or requests regarding this Data Processing Agreement, please contact:
              </p>
              
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Data Protection Contact:</strong></p>
                <p>Sponsorly, Inc.<br />
                1042 Rockbridge Rd.<br />
                Lexington, KY 40515</p>
                <p><strong>Email:</strong> support@sponsorly.io</p>
              </div>
              
              <Separator className="my-6" />
              
              <p className="text-sm text-muted-foreground">
                We will respond to all data processing inquiries within a reasonable timeframe, typically within 10 business days.
              </p>
            </Card>

            {/* Additional Legal Resources */}
            <Card className="p-6 md:p-8 bg-muted/50">
              <h3 className="text-lg font-semibold mb-3">Additional Legal Resources</h3>
              <p className="text-muted-foreground mb-3">
                For more information about how we handle personal information, please review our:
              </p>
              <a 
                href="/privacy" 
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy →
              </a>
            </Card>

          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
};

export default DataProcessingAgreement;
