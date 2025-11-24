import { Link } from 'react-router-dom';
import { Heart, Shield, Check, DollarSign, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/20">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-2xl text-muted-foreground mb-4">
              Free for organizations. Always.
            </p>
            <p className="text-lg text-muted-foreground">
              No monthly fees, no setup costs, no hidden charges—just straightforward fundraising
            </p>
          </div>
        </section>

        {/* Free for Organizations Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <Card className="border-4 border-primary shadow-lg">
              <CardHeader className="text-center pb-8 bg-primary/5">
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                    <Heart className="h-10 w-10 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-4xl mb-4">$0 for Your Organization</CardTitle>
                <CardDescription className="text-xl">
                  Everything included. No strings attached.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Monthly Subscription</h4>
                        <p className="text-sm text-muted-foreground">
                          Zero recurring fees—ever
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Setup Costs</h4>
                        <p className="text-sm text-muted-foreground">
                          Start fundraising immediately at no charge
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Per-Campaign Fees</h4>
                        <p className="text-sm text-muted-foreground">
                          Launch unlimited campaigns
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Contracts</h4>
                        <p className="text-sm text-muted-foreground">
                          No commitments, cancel anytime (not that you'd want to!)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Unlimited Campaigns</h4>
                        <p className="text-sm text-muted-foreground">
                          Run as many fundraisers as you need
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Unlimited Users</h4>
                        <p className="text-sm text-muted-foreground">
                          Invite your entire team at no extra cost
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">All Features Included</h4>
                        <p className="text-sm text-muted-foreground">
                          Full access to every tool and feature
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Premium Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Expert help when you need it
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-6 border-t">
                  <Link to="/signup">
                    <Button size="lg" className="text-lg px-8 py-6">
                      Start Fundraising Free
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How Platform Fees Work */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How Platform Fees Work</h2>
              <p className="text-lg text-muted-foreground">
                Transparent pricing that maximizes donations to your cause
              </p>
            </div>
            
            <Card className="border-2 mb-8">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Platform Fees That Support Your Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-primary/5 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      Simple & Fair
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">10% platform fee</strong> is added to the donation amount
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Includes all card processing fees</strong>—no surprise charges
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          The fee is automatically added at checkout
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Your organization receives 100%</strong> of the intended donation
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Fee Example Visual */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg border-2 border-primary/20">
                    <h3 className="font-semibold text-xl mb-6 text-center">How It Works: Example</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="bg-background rounded-lg p-6 shadow-sm mb-3">
                          <DollarSign className="h-10 w-10 text-primary mx-auto mb-2" />
                          <div className="text-3xl font-bold">$100</div>
                          <p className="text-sm text-muted-foreground mt-2">Donor wants to give</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-background rounded-lg p-6 shadow-sm mb-3">
                          <Zap className="h-10 w-10 text-primary mx-auto mb-2" />
                          <div className="text-3xl font-bold">$110</div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Donor pays total
                            <br />
                            <span className="text-xs">(includes $10 fee)</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-primary text-primary-foreground rounded-lg p-6 shadow-sm mb-3">
                          <Heart className="h-10 w-10 mx-auto mb-2" />
                          <div className="text-3xl font-bold">$100</div>
                          <p className="text-sm mt-2 opacity-90">Organization receives ✓</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        The $10 fee (10%) covers payment processing, platform hosting, and support—ensuring a seamless experience for everyone.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-2">What the Fee Covers</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Credit card processing fees (typically 2.9% + $0.30)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Secure platform hosting and infrastructure
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Customer support and technical assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Ongoing platform development and improvements
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Security, compliance, and data protection
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything You Need, Included Free</h2>
              <p className="text-lg text-muted-foreground">
                Premium features at no cost to your organization
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Unlimited Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create and run as many fundraising campaigns as you need
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Donor CRM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Complete donor management with insights and segmentation
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Real-Time Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Live dashboards showing campaign performance and trends
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Instant Payouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access funds immediately—no waiting periods
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Tax Receipts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automated, professional receipts for all donations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Team Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Unlimited users with role-based permissions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Expert assistance whenever you need help
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Custom Branding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Add your logo and colors to all campaigns
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Mobile App Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage campaigns on the go from any device
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Compare & Save</h2>
              <p className="text-lg text-muted-foreground">
                See how Sponsorly compares to traditional fundraising platforms
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-4">Feature</th>
                        <th className="text-center py-4 px-4">Traditional Platforms</th>
                        <th className="text-center py-4 px-4 bg-primary/5">Sponsorly</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b">
                        <td className="py-4 px-4">Monthly Fees</td>
                        <td className="text-center py-4 px-4 text-destructive">$50-$200/month</td>
                        <td className="text-center py-4 px-4 bg-primary/5 font-semibold text-primary">$0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4">Platform Fees</td>
                        <td className="text-center py-4 px-4 text-destructive">5-8% taken from donation</td>
                        <td className="text-center py-4 px-4 bg-primary/5 font-semibold text-primary">10% added (donor covers)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4">Organization Receives</td>
                        <td className="text-center py-4 px-4">92-95% of donation</td>
                        <td className="text-center py-4 px-4 bg-primary/5 font-semibold text-primary">100% of donation ✓</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4">Setup Costs</td>
                        <td className="text-center py-4 px-4 text-destructive">$0-$500</td>
                        <td className="text-center py-4 px-4 bg-primary/5 font-semibold text-primary">$0</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold">$10,000 Raised</td>
                        <td className="text-center py-4 px-4">
                          <div className="text-lg">$9,200-$9,500</div>
                          <div className="text-xs text-muted-foreground">(after fees)</div>
                        </td>
                        <td className="text-center py-4 px-4 bg-primary/5">
                          <div className="text-lg font-bold text-primary">$10,000</div>
                          <div className="text-xs text-primary">Full amount ✓</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Is it really free for my organization?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, absolutely! There are no monthly fees, setup costs, or charges to your organization. You can create unlimited campaigns and add unlimited users at no cost. The only fee is a 10% platform fee that is automatically added to the donation amount, ensuring your organization receives 100% of every donation.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How does the 10% fee work exactly?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  When a donor wants to give $100 to your organization, the 10% platform fee is automatically added at checkout. The donor pays $110 total, and your organization receives the full $100 donation. The platform fee covers payment processing, secure hosting, support, and ongoing development.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How is the platform fee charged?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The 10% platform fee is automatically added to all donations at checkout. This ensures that 100% of the intended donation amount goes directly to your organization, while the platform fee covers payment processing and platform costs. This model allows us to keep Sponsorly completely free for organizations while maintaining a sustainable, high-quality service.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What does the platform fee cover?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The 10% platform fee covers all credit card processing fees (typically 2.9% + $0.30 per transaction), secure hosting infrastructure, customer support, ongoing platform development, security and compliance, and data protection. It's an all-inclusive fee with no hidden costs.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Are there any hidden costs or fees?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, never. We believe in complete transparency. There are no monthly fees, no setup costs, no per-campaign charges, no contract fees, and no surprise charges. The only fee is the 10% platform fee that donors cover, which includes all payment processing. What you see is what you get.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I export my donor data?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! You have full ownership of your data and can export it anytime. Download donor lists, donation history, and reports in standard formats (CSV, PDF) for your records or to use with other systems. There's no lock-in—your data belongs to you.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Start Fundraising for Free Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              No credit card required. No setup fees. Start raising funds in minutes.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Create Your Free Account
              </Button>
            </Link>
            <p className="text-sm mt-6 opacity-75">
              Join thousands of schools and non-profits raising funds on Sponsorly
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Pricing;
