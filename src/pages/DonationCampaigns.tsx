import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  ArrowRight,
  Heart,
  DollarSign,
  RefreshCw,
  Receipt,
  Users,
  Target,
  EyeOff,
  CheckCircle,
  TrendingUp,
  Bell,
  Calendar,
  Zap,
  Award,
  BarChart3,
} from 'lucide-react';

const DonationCampaigns = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/campaigns/donations' });

  useEffect(() => {
    document.title = "Donation Campaigns - One-Time & Recurring Giving | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Accept one-time and recurring donations with automatic tax receipts, donor recognition, and goal tracking. Build sustainable funding for your organization.');
    }
  }, []);

  const donationAmounts = [25, 50, 100, 250, 500];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-rose-500/10 via-background to-primary/10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 mb-6">
                <Heart className="h-5 w-5" />
                <span className="text-sm font-medium">Donation Campaigns</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Make Giving Easy with Direct Donation Campaigns
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Accept one-time or recurring donations from individuals and businesses. Automatic tax receipts, donor recognition, and goal tracking make it simple to build sustainable funding.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Launch Your Campaign
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                    See a Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-primary/20 rounded-2xl transform rotate-3" />
              <div className="relative bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <h3 className="font-semibold text-lg">Support Our Annual Fund</h3>
                    <p className="text-sm text-muted-foreground">Help us reach our $50,000 goal</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">$32,450 raised</span>
                      <span className="text-primary font-medium">65%</span>
                    </div>
                    <div className="h-3 bg-accent rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {donationAmounts.slice(0, 3).map((amount) => (
                      <button key={amount} className="py-2 px-3 rounded-lg border hover:bg-accent transition-colors text-center">
                        <span className="font-semibold">${amount}</span>
                      </button>
                    ))}
                  </div>
                  <div className="h-12 w-full bg-rose-500 rounded-lg flex items-center justify-center text-white font-medium">
                    <Heart className="h-5 w-5 mr-2" /> Donate Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Successful Donations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that make giving easy and keep donors coming back.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: 'Suggested Amounts',
                description: 'Pre-set donation amounts with custom option. Increase average gift size with smart defaults.',
              },
              {
                icon: RefreshCw,
                title: 'Recurring Giving',
                description: 'Monthly, quarterly, or annual recurring donations. Build predictable, sustainable revenue.',
              },
              {
                icon: Receipt,
                title: 'Automatic Tax Receipts',
                description: 'Donors receive tax-deductible receipts instantly. No manual paperwork required.',
              },
              {
                icon: Users,
                title: 'Donor Recognition',
                description: 'Public donor walls and recognition displays. Celebrate your supporters publicly.',
              },
              {
                icon: Target,
                title: 'Goal Tracking',
                description: 'Visual progress bars and milestone celebrations. Motivate donors with tangible goals.',
              },
              {
                icon: EyeOff,
                title: 'Anonymous Giving',
                description: 'Option for donors to remain anonymous. Respect donor privacy preferences.',
              },
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recurring Giving Spotlight */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">Recurring Giving</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Build Sustainable, Predictable Funding
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Recurring donors give 42% more annually than one-time donors. Convert your supporters into monthly champions.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: TrendingUp, text: 'Predictable monthly revenue for better planning' },
                  { icon: Zap, text: 'Automatic payment processing — set it and forget it' },
                  { icon: Bell, text: 'Smart reminders before cards expire' },
                  { icon: BarChart3, text: 'Track recurring vs one-time giving analytics' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-primary/10 rounded-2xl transform -rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-semibold">Monthly Giving Dashboard</h3>
                    <span className="text-sm text-emerald-600 font-medium">+12% this month</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-500/10">
                      <p className="text-2xl font-bold text-emerald-600">$3,250</p>
                      <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-2xl font-bold text-foreground">47</p>
                      <p className="text-sm text-muted-foreground">Active Subscribers</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded bg-accent/30">
                      <span className="text-sm">$25/month × 18 donors</span>
                      <span className="text-sm font-medium text-emerald-600">$450</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-accent/30">
                      <span className="text-sm">$50/month × 12 donors</span>
                      <span className="text-sm font-medium text-emerald-600">$600</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-accent/30">
                      <span className="text-sm">$100/month × 8 donors</span>
                      <span className="text-sm font-medium text-emerald-600">$800</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best For Section */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Perfect For These Campaign Types
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Donation campaigns are versatile and work for many fundraising needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calendar, title: 'Annual Funds', desc: 'Yearly giving campaigns for general operating support' },
              { icon: Target, title: 'Capital Campaigns', desc: 'Large fundraising goals for buildings and equipment' },
              { icon: Zap, title: 'Emergency Appeals', desc: 'Quick response campaigns for urgent needs' },
              { icon: RefreshCw, title: 'Monthly Giving', desc: 'Sustainable recurring donation programs' },
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                    <item.icon className="h-7 w-7 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Donor Wall Preview */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Our Amazing Donors</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Sarah J.', 'The Smiths', 'Anonymous', 'Mike T.', 'Johnson Family', 'Lisa M.'].map((name, i) => (
                      <div key={i} className="text-center p-3 rounded-lg bg-accent/50">
                        <div className="w-10 h-10 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
                          <Heart className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-xs font-medium truncate">{name}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-sm text-muted-foreground">+ 156 more supporters</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Celebrate Your Donors Publicly
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Recognize your supporters with beautiful donor walls displayed on your campaign page. Show appreciation and inspire others to give.
              </p>
              <ul className="space-y-3">
                {[
                  'Automatic donor recognition display',
                  'Tiered recognition levels',
                  'Anonymous option respected',
                  'Real-time updates as donations come in',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-rose-500/10 via-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Launch Your Donation Campaign?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start accepting donations in minutes. No setup fees, no monthly costs — just the tools you need to succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/fundraisers">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                Explore All Campaign Types
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default DonationCampaigns;
