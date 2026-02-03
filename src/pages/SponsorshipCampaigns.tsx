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
  Building2,
  Award,
  Trophy,
  Eye,
  Heart,
  Receipt,
  Calendar,
  CheckCircle,
  Star,
  Megaphone,
  Image,
  FileText,
  Monitor,
  Upload,
  Mail,
  Users,
} from 'lucide-react';

const SponsorshipCampaigns = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/campaigns/sponsorships' });

  useEffect(() => {
    document.title = "Sponsorship Campaigns - Partner with Local Businesses | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Turn local businesses into lasting partners with tiered sponsorship packages. Create advertising opportunities, collect assets automatically, and build ongoing relationships.');
    }
  }, []);

  const sponsorshipTiers = [
    { name: 'Bronze', price: '$250', color: 'bg-amber-600', benefits: ['Logo on website', 'Social media mention'] },
    { name: 'Silver', price: '$500', color: 'bg-gray-400', benefits: ['Bronze benefits', 'Program book ad', 'Event signage'] },
    { name: 'Gold', price: '$1,000', color: 'bg-yellow-500', benefits: ['Silver benefits', 'Jersey patch', 'PA announcements'] },
    { name: 'Platinum', price: '$2,500', color: 'bg-purple-500', benefits: ['Gold benefits', 'Naming rights', 'VIP access'] },
  ];

  const useCases = [
    { icon: Trophy, label: 'Stadium Signage', desc: 'Banners and field signs' },
    { icon: Award, label: 'Jersey Sponsors', desc: 'Logo on team uniforms' },
    { icon: Star, label: 'Event Naming Rights', desc: '"Smith Family Golf Classic"' },
    { icon: FileText, label: 'Program Book Ads', desc: 'Full or half page ads' },
    { icon: Monitor, label: 'Digital Displays', desc: 'Scoreboard and lobby screens' },
    { icon: Megaphone, label: 'PA Announcements', desc: 'Game day recognition' },
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
                <Handshake className="h-5 w-5" />
                <span className="text-sm font-medium">Sponsorship Campaigns</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Turn Local Businesses Into Lasting Partners
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Invite businesses to advertise with your group in exchange for supporting your cause. Create tiered packages, collect assets automatically, and build relationships that last.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Start Your Sponsor Program
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-primary/20 rounded-2xl transform rotate-3" />
              <div className="relative bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Select Sponsorship Level</span>
                  </div>
                  {sponsorshipTiers.slice(0, 3).map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                        <span className="font-medium">{tier.name}</span>
                      </div>
                      <span className="text-primary font-semibold">{tier.price}</span>
                    </div>
                  ))}
                  <div className="h-12 w-full bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-medium">
                    Become a Sponsor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiered Packages */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Create Tiered Sponsorship Packages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Offer multiple levels so businesses of all sizes can participate. More investment means more visibility.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sponsorshipTiers.map((tier, index) => (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`absolute top-0 left-0 right-0 h-2 ${tier.color}`} />
                <CardContent className="pt-8">
                  <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                  <p className="text-3xl font-bold text-primary mb-4">{tier.price}</p>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Organizations */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">For Organizations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Build Lasting Business Relationships
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Sponsorly makes it easy to create professional sponsorship programs that attract and retain business partners year after year.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Award, text: 'Create unlimited tiered sponsorship packages' },
                  { icon: Image, text: 'Offer advertising placements (banners, jerseys, programs, digital ads)' },
                  { icon: Handshake, text: 'Build ongoing relationships with local businesses' },
                  { icon: Eye, text: 'Professional sponsor recognition displays' },
                  { icon: Upload, text: 'Automatic asset collection from sponsors' },
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
            <div className="grid grid-cols-2 gap-4">
              {useCases.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <item.icon className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Businesses */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Acme Hardware</h3>
                  <p className="text-sm text-muted-foreground">Proud Gold Sponsor of Central High Football</p>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">5K+</p>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">12</p>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">3</p>
                      <p className="text-xs text-muted-foreground">Years</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 mb-4">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">For Businesses</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Meaningful Community Engagement
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Businesses get authentic local visibility while supporting causes their customers care about.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Eye, text: 'Gain local brand exposure at community events' },
                  { icon: Heart, text: 'Support community causes authentically' },
                  { icon: Receipt, text: 'Tax-deductible contributions' },
                  { icon: Calendar, text: 'Year-round visibility opportunities' },
                  { icon: Mail, text: 'Automated reminders for asset uploads' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How Sponsorship Campaigns Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From setup to asset collection, we've streamlined the entire sponsorship process.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Create Packages', desc: 'Define sponsorship tiers with benefits and pricing', icon: Award },
              { step: '2', title: 'Share Campaign', desc: 'Send your professional campaign page to businesses', icon: Mail },
              { step: '3', title: 'Businesses Purchase', desc: 'Sponsors select their level and pay online', icon: Building2 },
              { step: '4', title: 'Collect Assets', desc: 'We automatically request and collect logos and files', icon: Upload },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
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
            Ready to Build Your Sponsor Program?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join schools and nonprofits who've raised thousands through local business partnerships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/for-businesses">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                I'm a Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default SponsorshipCampaigns;
