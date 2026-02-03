import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  ArrowRight,
  Building2,
  MapPin,
  Globe,
  Image,
  FolderOpen,
  Users,
  Receipt,
  FileText,
  Upload,
  BarChart3,
  CheckCircle,
  Heart,
  Shield,
  Zap,
  CreditCard,
  Clock,
} from 'lucide-react';

const ForBusinesses = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/for-businesses' });

  useEffect(() => {
    document.title = "For Businesses - Streamline Your Community Support | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'One platform to manage all your local sponsorships and donations. Centralized dashboard, asset library, and simplified billing for community support.');
    }
  }, []);

  const portalFeatures = [
    { icon: Upload, title: 'Asset Upload', desc: 'Upload logos and files for sponsorship campaigns' },
    { icon: BarChart3, title: 'Campaign Performance', desc: 'See the impact of your sponsorships' },
    { icon: Building2, title: 'Business Profile', desc: 'Manage your company information' },
    { icon: Receipt, title: 'Tax Receipts', desc: 'Access all donation receipts in one place' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-blue-500/10 via-background to-primary/10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 mb-6">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">For Businesses</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Streamline Your Community Support Strategy
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                One platform to manage all your local sponsorships and donations. Centralize your assets, track your impact, and simplify your giving — from local teams to national causes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Join as a Business
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
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-primary/20 rounded-2xl transform rotate-3" />
              <div className="relative bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Acme Hardware Co.</h3>
                      <p className="text-xs text-muted-foreground">Business Portal</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/10">
                      <p className="text-2xl font-bold text-blue-600">$12,500</p>
                      <p className="text-sm text-muted-foreground">Total Given</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-2xl font-bold text-foreground">8</p>
                      <p className="text-sm text-muted-foreground">Organizations</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Active Sponsorships</p>
                    {[
                      { name: 'Central High Football', amount: '$2,500' },
                      { name: 'Youth Soccer League', amount: '$1,500' },
                      { name: 'Community Theater', amount: '$750' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-medium text-primary">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Geographic Reach */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Support at Every Level
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a local shop or a national brand, reach the communities that matter to you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Local',
                desc: 'Support your immediate community — the teams and clubs right in your neighborhood.',
                examples: 'Local high school, youth leagues, community centers',
              },
              {
                icon: Globe,
                title: 'Regional',
                desc: 'Expand to surrounding areas and build presence across your market.',
                examples: 'Multiple schools, regional tournaments, area nonprofits',
              },
              {
                icon: Building2,
                title: 'National',
                desc: 'Build brand presence across markets with coordinated giving programs.',
                examples: 'National chains supporting local communities everywhere',
              },
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground mb-4">{item.desc}</p>
                  <p className="text-sm text-muted-foreground italic">{item.examples}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Asset Management */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
                <FolderOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Asset Management</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Upload Once, Use Everywhere
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Stop sending the same logo files over and over. Upload your brand assets once and reuse them across every campaign and organization you support.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Image, text: 'Store logos, images, and creative assets in one place' },
                  { icon: FolderOpen, text: 'Reuse assets across multiple campaigns' },
                  { icon: Shield, text: 'Ensure consistent brand representation' },
                  { icon: Zap, text: 'Instant access when sponsoring new campaigns' },
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <FolderOpen className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold">Brand Asset Library</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Logo - Full', type: 'PNG' },
                      { name: 'Logo - Icon', type: 'SVG' },
                      { name: 'Banner - Wide', type: 'JPG' },
                      { name: 'Logo - White', type: 'PNG' },
                      { name: 'Square Ad', type: 'PNG' },
                      { name: 'Sponsor Bio', type: 'TXT' },
                    ].map((asset, i) => (
                      <div key={i} className="p-3 rounded-lg border text-center hover:bg-accent/50 transition-colors">
                        <div className="w-10 h-10 mx-auto mb-2 rounded bg-accent/50 flex items-center justify-center">
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.type}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-2 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:bg-accent/50 transition-colors">
                    + Upload New Asset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Centralized Support */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Organizations You Support</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Central High School', type: 'Sports', given: '$5,000' },
                      { name: 'Youth Soccer League', type: 'Youth Sports', given: '$3,000' },
                      { name: 'Community Theater', type: 'Arts', given: '$2,000' },
                      { name: 'Food Bank Drive', type: 'Nonprofit', given: '$1,500' },
                    ].map((org, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div>
                          <p className="font-medium text-sm">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.type}</p>
                        </div>
                        <span className="text-primary font-semibold">{org.given}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 text-center">
                    <p className="text-sm text-muted-foreground">Total Impact: <span className="text-primary font-semibold">$11,500</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 mb-4">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Centralized Dashboard</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                All Your Community Support in One Place
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Manage every school, team, club, and nonprofit you support from a single dashboard. Track giving history, view impact, and stay connected.
              </p>
              <ul className="space-y-3">
                {[
                  'See all active sponsorships at a glance',
                  'Track giving history and total impact',
                  'Receive updates from organizations you support',
                  'Easy renewal when campaigns return',
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

      {/* Simplified Billing */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 mb-4">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Simplified Billing</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                One Invoice, Many Sponsorships
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                No more tracking down receipts from a dozen different organizations. Get consolidated records for accounting and tax purposes.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: CreditCard, text: 'Consolidated billing for multiple sponsorships' },
                  { icon: Receipt, text: 'Clear records for tax purposes' },
                  { icon: FileText, text: 'Easy expense tracking and reporting' },
                  { icon: Clock, text: 'Annual giving summaries' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-primary/10 rounded-2xl transform rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-semibold">2025 Giving Summary</h3>
                    <Receipt className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Q1 Total</span>
                      <span className="font-medium">$4,250</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Q2 Total</span>
                      <span className="font-medium">$3,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Q3 Total</span>
                      <span className="font-medium">$2,750</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Q4 Total</span>
                      <span className="font-medium">$2,000</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-semibold">Annual Total</span>
                    <span className="font-bold text-primary text-lg">$12,500</span>
                  </div>
                  <button className="w-full py-2 bg-amber-500 text-white rounded-lg font-medium">
                    Download Tax Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Portal Features */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your Business Portal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your community support program.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portalFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Businesses Love Sponsorly */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Businesses Choose Sponsorly
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: '80%', label: 'Less admin time', desc: 'managing sponsorships' },
              { stat: '100%', label: 'Tax-deductible', desc: 'with instant receipts' },
              { stat: '5min', label: 'Average setup', desc: 'to start sponsoring' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-5xl font-bold text-primary mb-2">{item.stat}</p>
                <p className="text-lg font-semibold text-foreground">{item.label}</p>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-500/10 via-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Simplify Your Community Support?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join businesses who've streamlined their local sponsorships and donations with Sponsorly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/campaigns/sponsorships">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                Learn About Sponsorships
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default ForBusinesses;
