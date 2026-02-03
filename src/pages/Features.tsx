import { Link } from 'react-router-dom';
import { Zap, Heart, Users, BarChart3, DollarSign, Target, Repeat, Share2, Calendar, Handshake, Mail, FileText, Shield, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';

const Features = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/20">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Everything You Need to Succeed
            </h1>
            <p className="text-xl text-muted-foreground">
              Powerful features designed for maximum impact and effortless fundraising
            </p>
          </div>
        </section>

        {/* Campaign Types Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Flexible Campaign Options</h2>
              <p className="text-lg text-muted-foreground">
                Choose the campaign type that fits your fundraising goals
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/campaigns-overview" className="block group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Target className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="group-hover:text-primary transition-colors">Standard Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Perfect for one-time fundraising drives with clear goals and deadlines
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaigns/donations" className="block group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Repeat className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="group-hover:text-primary transition-colors">Recurring Donations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Build sustainable funding with monthly supporter programs
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaigns/roster" className="block group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Share2 className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="group-hover:text-primary transition-colors">Peer-to-Peer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Empower team members to create personal fundraising pages
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaigns/events" className="block group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Calendar className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="group-hover:text-primary transition-colors">Event Fundraising</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Sell tickets and raise funds for galas, tournaments, and events
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaigns/sponsorships" className="block group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Handshake className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="group-hover:text-primary transition-colors">Sponsorship Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Partner with local businesses for tiered sponsorship packages
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaigns-overview" className="block group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <Heart className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="group-hover:text-primary transition-colors">Custom Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Flexible options to fit your unique fundraising needs
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Instant Payout Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20">
          <div className="container mx-auto max-w-5xl">
            <Card className="border-2">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl">Get Paid Instantly</CardTitle>
                <CardDescription className="text-lg">
                  Access your funds immediately—no waiting periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Immediate Access</h4>
                        <p className="text-sm text-muted-foreground">
                          Funds are available in your account right after each donation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">No Waiting Periods</h4>
                        <p className="text-sm text-muted-foreground">
                          Unlike traditional platforms, there's no 7-14 day hold on your money
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Real-Time Balance Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Watch your account balance grow with every contribution
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Secure Transfers</h4>
                        <p className="text-sm text-muted-foreground">
                          Direct deposit to your bank account with enterprise-grade security
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Free Platform Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl">Free for Organizations</CardTitle>
                <CardDescription className="text-lg">
                  Zero fees for your organization—100% of donations to your cause
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Monthly Fees</h4>
                        <p className="text-sm text-muted-foreground">
                          Keep every dollar you raise—no subscription costs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Setup Costs</h4>
                        <p className="text-sm text-muted-foreground">
                          Get started immediately at no charge
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">No Hidden Charges</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete transparency—what you see is what you get
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">100% to Your Organization</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive the full donation amount every time
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      How It Works
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Donors cover a small 10% platform fee (which includes all payment processing). This means your organization receives 100% of every donation, and we can keep the platform completely free for you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Donor CRM Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20">
          <div className="container mx-auto max-w-5xl">
            <Card className="border-2">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl">Built-in Donor Management</CardTitle>
                <CardDescription className="text-lg">
                  Powerful CRM tools to build lasting relationships with your supporters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Track All Interactions
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Complete history of every donor's contributions and engagement
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Segment by Giving Patterns
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Group donors based on recency, frequency, and donation amounts
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Automated Thank You Messages
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Send personalized acknowledgments automatically after each gift
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Tax Receipt Generation
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Professional receipts created and sent automatically
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Donor Insights & Analytics
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Understand giving trends and identify major donor opportunities
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" />
                      Communication History
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Track all emails, calls, and touchpoints with each donor
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      RFM Scoring
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Advanced scoring based on Recency, Frequency, and Monetary value
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Export Capabilities
                    </h4>
                    <p className="text-sm text-muted-foreground pl-7">
                      Download donor data anytime for reports or external systems
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Additional Features Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">And So Much More</h2>
              <p className="text-lg text-muted-foreground">
                Every feature you need for fundraising success
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Heart className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Beautiful Campaign Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Stunning, branded pages that inspire donations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Real-Time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Live dashboards with actionable insights
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Multiple users with role-based permissions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Custom Branding</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Add your logo and colors to every page
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Mail className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Email Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Stay informed of every donation instantly
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Smartphone className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Mobile-Friendly</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Perfect experience on any device
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Bank-level security for all transactions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Auto Tax Receipts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Professional receipts sent automatically
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              See It In Action
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience all these powerful features for yourself—completely free
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Features;
