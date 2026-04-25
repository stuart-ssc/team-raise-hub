import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { StateStats } from '@/components/StateLandingPage/StateStats';
import { DistrictsAccordion } from '@/components/StateLandingPage/DistrictsAccordion';
import { getStateFromSlug } from '@/lib/stateUtils';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  GraduationCap,
  Trophy,
  Users,
  Heart,
  BarChart3,
  Shield,
  Zap,
  Receipt,
  ArrowRight,
  CheckCircle,
  Building2,
  Share2,
  TrendingUp,
} from 'lucide-react';

const StateLandingPage = () => {
  const { state: stateSlug } = useParams<{ state: string }>();
  const location = useLocation();
  const stateInfo = stateSlug ? getStateFromSlug(stateSlug) : null;

  // Track page view
  useLandingPageTracking({
    pageType: 'state',
    pagePath: location.pathname,
    state: stateInfo?.abbr,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stateSlug]);

  if (!stateInfo) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">State Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the state you're looking for.
          </p>
          <Link to="/schools">
            <Button>Browse All States</Button>
          </Link>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  const { abbr: stateAbbr, name: stateName } = stateInfo;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `School Fundraising in ${stateName} | Sponsorly`,
    description: `Empowering ${stateName} schools and districts with modern fundraising tools. Support sports teams, clubs, band, theater, and PTOs.`,
    url: `https://sponsorly.io/schools/${stateSlug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://sponsorly.io',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Schools',
          item: 'https://sponsorly.io/schools',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: stateName,
          item: `https://sponsorly.io/schools/${stateSlug}`,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`School Fundraising in ${stateName} | Sponsorly`}</title>
        <meta
          name="description"
          content={`Empowering ${stateName} schools and districts with modern fundraising tools. Support sports teams, clubs, band, theater, and PTOs. 100% of donations go to your programs.`}
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={`School Fundraising in ${stateName} | Sponsorly`} />
        <meta
          property="og:description"
          content={`Modern fundraising platform for ${stateName} K-12 schools. Sports teams, clubs, band, theater, PTOs - all in one place.`}
        />
        <meta property="og:url" content={`https://sponsorly.io/schools/${stateSlug}`} />
        <meta property="og:type" content="website" />
        <meta 
          property="og:image" 
          content={`https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/generate-og-image?type=state&name=${encodeURIComponent(stateName)}&location=`} 
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`School Fundraising in ${stateName} | Sponsorly`} />
        <meta 
          name="twitter:description" 
          content={`Modern fundraising platform for ${stateName} K-12 schools. Sports teams, clubs, band, theater, PTOs - all in one place.`} 
        />
        <meta 
          name="twitter:image" 
          content={`https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/generate-og-image?type=state&name=${encodeURIComponent(stateName)}&location=`} 
        />
        <link rel="canonical" href={`https://sponsorly.io/schools/${stateSlug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        {/* State outline background */}
        <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none">
          <img 
            src={`/state-outlines/${stateAbbr.toLowerCase()}.svg`}
            alt=""
            className="h-[80%] max-h-[500px] w-auto object-contain opacity-[0.12] translate-x-[10%]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium">{stateName} Schools</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Modern Fundraising for{' '}
              <span className="text-primary">{stateName}</span> Schools
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sponsorly helps schools and districts across {stateName} raise more money for
              sports teams, clubs, band, theater, and PTOs — while keeping 100% of every donation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                  See All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <StateStats stateAbbr={stateAbbr} stateName={stateName} />
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why {stateName} Schools Choose Sponsorly
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join schools across {stateName} who've switched to smarter fundraising.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: '100% to Your School',
                description:
                  'Every dollar donated goes directly to your programs. We charge donors a small platform fee instead.',
              },
              {
                icon: Zap,
                title: 'Instant Payouts',
                description:
                  'Get your funds immediately — no waiting weeks for checks or wire transfers.',
              },
              {
                icon: Receipt,
                title: 'Automatic Tax Receipts',
                description:
                  'Donors receive tax-deductible receipts automatically. No manual paperwork.',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description:
                  'See exactly how your campaigns are performing with live dashboards.',
              },
              {
                icon: Share2,
                title: 'Peer-to-Peer Fundraising',
                description:
                  'Every player gets a unique link. Track individual progress and celebrate top fundraisers.',
              },
              {
                icon: Shield,
                title: 'Secure & Compliant',
                description:
                  `Bank-level security and full compliance with ${stateName} school district requirements.`,
              },
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow bg-background">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Program Types */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Perfect for Every School Program
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether it's athletics, arts, academics, or parent organizations — we've got you covered.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Trophy, label: 'Sports Teams', desc: 'Football, basketball, soccer & more' },
              { icon: Users, label: 'Band & Orchestra', desc: 'Instruments, travel, uniforms' },
              { icon: GraduationCap, label: 'Academic Clubs', desc: 'Robotics, debate, STEM' },
              { icon: Heart, label: 'PTOs & Boosters', desc: 'School-wide initiatives' },
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-background">
                <CardContent className="pt-6 pb-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features for Different Roles */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* For Administrators */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">For Administrators</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Complete Visibility Across Your School
              </h3>
              <ul className="space-y-3">
                {[
                  'Real-time dashboards showing all fundraising activity',
                  'Manage users, roles, and permissions',
                  'Comprehensive reporting and analytics',
                  'Centralized donor management',
                  `Ensure compliance with ${stateName} district policies`,
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Coaches & Sponsors */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">For Coaches & Sponsors</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Empower Your Team to Raise More
              </h3>
              <ul className="space-y-3">
                {[
                  'Easy roster management — import in seconds',
                  'Peer-to-peer fundraising with unique player links',
                  'Real-time leaderboards to motivate participation',
                  'Parent communication tools',
                  'Mobile-first design for easy donations',
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

      {/* Districts Accordion */}
      <section className="py-16 sm:py-20 bg-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Browse by District</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              School Districts in {stateName}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your school district and explore the schools using Sponsorly.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <DistrictsAccordion stateAbbr={stateAbbr} stateSlug={stateSlug!} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your School's Fundraising?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Join {stateName} schools already using Sponsorly to raise more money while keeping
            100% of every donation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-[#22C55E] hover:bg-[#16A34A] text-white">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 bg-white text-foreground hover:bg-gray-100 border-white">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default StateLandingPage;
