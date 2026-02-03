import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  ArrowRight,
  Handshake,
  Heart,
  Calendar,
  ShoppingBag,
  Users,
  Layout,
  ShoppingCart,
  UserCircle,
  Smartphone,
  CreditCard,
  History,
  CheckCircle,
  Zap,
} from 'lucide-react';

const CampaignsOverview = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/campaigns-overview' });

  useEffect(() => {
    document.title = "Campaign Types - Sponsorly Fundraising Platform";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Explore powerful fundraising campaign types: sponsorships, donations, events, merchandise, and peer-to-peer fundraising. Find the perfect approach for your organization.');
    }
  }, []);

  const campaignTypes = [
    {
      icon: Handshake,
      title: 'Sponsorship Campaigns',
      description: 'Partner with local businesses who advertise with your group in exchange for supporting your cause.',
      href: '/campaigns/sponsorships',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Heart,
      title: 'Donation Campaigns',
      description: 'Accept one-time or recurring donations with automatic tax receipts and donor recognition.',
      href: '/campaigns/donations',
      color: 'bg-rose-500/10 text-rose-600',
    },
    {
      icon: Calendar,
      title: 'Event Campaigns',
      description: 'Sell tickets for golf tournaments, galas, camps, auctions, and other fundraising events.',
      href: '/campaigns/events',
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: ShoppingBag,
      title: 'Merchandise Campaigns',
      description: 'Create an online store for team gear, spirit wear, and fundraising products.',
      href: '/campaigns/merchandise',
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      icon: Users,
      title: 'Roster-Enabled Campaigns',
      description: 'Gamify fundraising with personal pages, leaderboards, and individual tracking for each team member.',
      href: '/campaigns/roster',
      color: 'bg-purple-500/10 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Layout className="h-5 w-5" />
            <span className="text-sm font-medium">Campaign Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto">
            Powerful Campaigns for Every Fundraising Need
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From sponsorships to merchandise, one-time donations to recurring giving — Sponsorly gives you the tools to run any type of fundraising campaign.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Campaign Landing Experience */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Beautiful Campaign Landing Pages
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every campaign gets a professional, mobile-optimized landing page that makes it easy for supporters to understand your cause and contribute.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Layout, text: 'Custom branding with your logo and colors' },
                  { icon: Smartphone, text: 'Mobile-optimized for donations on any device' },
                  { icon: Zap, text: 'Fast loading for maximum conversions' },
                  { icon: CheckCircle, text: 'Clear calls-to-action that drive results' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl transform -rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="h-8 w-32 bg-primary/20 rounded" />
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/20 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Campaign Hero Image</span>
                  </div>
                  <div className="h-6 w-3/4 bg-foreground/10 rounded" />
                  <div className="h-4 w-full bg-foreground/5 rounded" />
                  <div className="h-4 w-5/6 bg-foreground/5 rounded" />
                  <div className="h-12 w-full bg-primary rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E-commerce Checkout */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Checkout</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Gold Sponsor Package</span>
                    <span className="font-medium">$500</span>
                  </div>
                  <div className="h-10 w-full bg-foreground/5 rounded border" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-foreground/5 rounded border" />
                    <div className="h-10 bg-foreground/5 rounded border" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 w-12 bg-blue-500/20 rounded flex items-center justify-center text-xs">Visa</div>
                    <div className="h-8 w-12 bg-red-500/20 rounded flex items-center justify-center text-xs">MC</div>
                    <div className="h-8 w-12 bg-purple-500/20 rounded flex items-center justify-center text-xs">Amex</div>
                    <div className="h-8 w-12 bg-yellow-500/20 rounded flex items-center justify-center text-xs">Apple</div>
                  </div>
                  <div className="h-12 w-full bg-primary rounded-lg" />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Familiar E-commerce Checkout
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Supporters enjoy a shopping experience they already know and trust. No friction, no confusion — just a simple path to supporting your cause.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: CreditCard, text: 'All major credit cards and digital wallets accepted' },
                  { icon: ShoppingCart, text: 'Intuitive cart experience for multiple items' },
                  { icon: CheckCircle, text: 'Instant confirmation and tax receipts' },
                  { icon: Smartphone, text: 'One-tap payments on mobile devices' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Account Management */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Supporters Return Year After Year
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Repeat supporters can easily give again with saved payment methods and a complete giving history. Build lasting relationships with your donor community.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: UserCircle, text: 'Personal supporter accounts with giving history' },
                  { icon: CreditCard, text: 'Saved payment methods for easy repeat giving' },
                  { icon: History, text: 'Complete transaction history and tax receipts' },
                  { icon: Heart, text: 'See impact across all campaigns they\'ve supported' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl transform rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Supporter since 2022</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5">
                      <p className="text-2xl font-bold text-primary">$1,250</p>
                      <p className="text-sm text-muted-foreground">Total Given</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-2xl font-bold text-foreground">8</p>
                      <p className="text-sm text-muted-foreground">Campaigns</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-foreground">Recent Activity</p>
                    <div className="text-sm text-muted-foreground">Fall Sports Sponsorship — $500</div>
                    <div className="text-sm text-muted-foreground">Band Fundraiser — $100</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Types Grid */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Choose Your Campaign Type
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every organization is different. That's why we offer multiple campaign types to match your specific fundraising needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaignTypes.map((campaign, index) => (
              <Link key={index} to={campaign.href}>
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-full ${campaign.color} flex items-center justify-center mb-4`}>
                      <campaign.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{campaign.title}</h3>
                    <p className="text-muted-foreground mb-4">{campaign.description}</p>
                    <div className="flex items-center text-primary font-medium">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Start Your First Campaign?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of schools and nonprofits who've raised millions using Sponsorly's powerful campaign platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default CampaignsOverview;
