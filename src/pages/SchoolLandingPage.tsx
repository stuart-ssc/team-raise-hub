import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { supabase } from '@/integrations/supabase/client';
import { getVariantForEntity, type LandingPageVariant } from '@/lib/abTestUtils';
import { getStateFromSlug, getStateName } from '@/lib/stateUtils';
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
  Share2,
  MapPin,
  School,
  Building2,
  Eye,
  Handshake,
  Store,
} from 'lucide-react';

interface SchoolData {
  id: string;
  school_name: string;
  city: string | null;
  state: string | null;
  street_address: string | null;
  school_district_id: string | null;
  district_name: string | null;
}

const SchoolLandingPage = () => {
  const { state: stateSlug, slug } = useParams<{ state: string; slug: string }>();
  const location = useLocation();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<LandingPageVariant>('A');

  // Track page view
  useLandingPageTracking({
    pageType: 'school',
    pagePath: location.pathname,
    schoolId: school?.id,
    state: school?.state || undefined,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stateSlug, slug]);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!slug || !stateSlug) {
        setLoading(false);
        return;
      }

      const stateInfo = getStateFromSlug(stateSlug);
      if (!stateInfo) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('schools')
        .select(`
          id,
          school_name,
          city,
          state,
          street_address,
          school_district_id,
          school_districts (
            name
          )
        `)
        .eq('slug', slug)
        .eq('state', stateInfo.abbr)
        .single();

      if (!error && data) {
        const districtData = data.school_districts as { name: string } | null;
        setSchool({
          id: data.id,
          school_name: data.school_name,
          city: data.city,
          state: data.state,
          street_address: data.street_address,
          school_district_id: data.school_district_id,
          district_name: districtData?.name || null,
        });
        setVariant(getVariantForEntity(data.id));
      }
      setLoading(false);
    };

    fetchSchool();
  }, [slug, stateSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">School Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the school you're looking for.
          </p>
          <Link to="/schools">
            <Button>Browse All Schools</Button>
          </Link>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  const stateName = school.state ? getStateName(school.state) : '';
  const locationText = [school.city, stateName].filter(Boolean).join(', ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: school.school_name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: school.city,
      addressRegion: school.state,
    },
    url: `https://sponsorly.io/schools/${stateSlug}/${slug}`,
  };

  // Render different variants
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${school.school_name} Fundraising | Sponsorly`}</title>
        <meta
          name="description"
          content={`Support ${school.school_name} in ${locationText}. Modern fundraising for sports teams, clubs, band, theater, and PTOs. 100% of donations go to your programs.`}
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={`${school.school_name} Fundraising | Sponsorly`} />
        <meta
          property="og:description"
          content={`Modern fundraising platform for ${school.school_name}. Sports teams, clubs, band, theater, PTOs - all in one place.`}
        />
        <meta property="og:url" content={`https://sponsorly.io/schools/${stateSlug}/${slug}`} />
        <meta property="og:type" content="website" />
        <meta 
          property="og:image" 
          content={`https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/generate-og-image?type=school&name=${encodeURIComponent(school.school_name)}&location=${encodeURIComponent(locationText)}`} 
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${school.school_name} Fundraising | Sponsorly`} />
        <meta 
          name="twitter:description" 
          content={`Modern fundraising platform for ${school.school_name}. Sports teams, clubs, band, theater, PTOs - all in one place.`} 
        />
        <meta 
          name="twitter:image" 
          content={`https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/generate-og-image?type=school&name=${encodeURIComponent(school.school_name)}&location=${encodeURIComponent(locationText)}`} 
        />
        <link rel="canonical" href={`https://sponsorly.io/schools/${stateSlug}/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <MarketingHeader />

      {variant === 'A' && <VariantAContent school={school} locationText={locationText} stateSlug={stateSlug!} stateName={stateName} />}
      {variant === 'B' && <VariantBContent school={school} locationText={locationText} stateSlug={stateSlug!} stateName={stateName} />}
      {variant === 'C' && <VariantCContent school={school} locationText={locationText} stateSlug={stateSlug!} stateName={stateName} />}

      <MarketingFooter />
    </div>
  );
};

interface VariantContentProps {
  school: SchoolData;
  locationText: string;
  stateSlug: string;
  stateName: string;
}

// Variant A: Hero-Focused (emphasis on school name and immediate CTA)
const VariantAContent = ({ school, locationText, stateSlug, stateName }: VariantContentProps) => (
  <>
    {/* Hero Section - Large and Bold */}
    <section className="relative py-20 sm:py-28 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <School className="h-5 w-5" />
            <span className="text-sm font-medium">{locationText}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Fundraising for{' '}
            <span className="text-primary">{school.school_name}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empower your sports teams, clubs, band, theater, and PTOs with modern fundraising that keeps 100% of every donation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Start Fundraising
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    <SharedValueProposition schoolName={school.school_name} stateName={stateName} />
    <SharedAdminLeadership />
    <SharedProgramTypes />
    <SharedFeaturesList schoolName={school.school_name} stateName={stateName} />
    <SharedCTA schoolName={school.school_name} />
  </>
);

// Variant B: Stats-First (lead with the value proposition numbers)
const VariantBContent = ({ school, locationText, stateSlug, stateName }: VariantContentProps) => (
  <>
    {/* Hero with Stats */}
    <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-medium">{locationText}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            <span className="text-primary">{school.school_name}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Modern fundraising for your school's programs
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <Card className="text-center bg-background/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">100%</div>
              <p className="text-sm text-muted-foreground">Goes to Your School</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-background/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">$0</div>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-background/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">Instant</div>
              <p className="text-sm text-muted-foreground">Payouts</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-background/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">Free</div>
              <p className="text-sm text-muted-foreground">To Start</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link to="/signup">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </section>

    <SharedValueProposition schoolName={school.school_name} stateName={stateName} />
    <SharedAdminLeadership />
    <SharedProgramTypes />
    <SharedFeaturesList schoolName={school.school_name} stateName={stateName} />
    <SharedCTA schoolName={school.school_name} />
  </>
);

// Variant C: Social Proof Focus (testimonial-forward)
const VariantCContent = ({ school, locationText, stateSlug, stateName }: VariantContentProps) => (
  <>
    {/* Hero with Testimonial */}
    <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">{locationText}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Join Schools Raising More with{' '}
            <span className="text-primary">Sponsorly</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Modern fundraising for {school.school_name} sports teams, clubs, and organizations.
          </p>
        </div>

        {/* Testimonial Card */}
        <Card className="max-w-2xl mx-auto bg-background/80 backdrop-blur mt-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-foreground italic mb-3">
                  "Sponsorly transformed how we fundraise. Our teams raised 40% more this year, and every dollar went directly to our programs."
                </p>
                <p className="text-sm text-muted-foreground">— Athletic Director, {stateName} School</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link to="/signup">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8">
              Start Fundraising
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
    </section>

    <SharedValueProposition schoolName={school.school_name} stateName={stateName} />
    <SharedAdminLeadership />
    <SharedProgramTypes />
    <SharedFeaturesList schoolName={school.school_name} stateName={stateName} />
    <SharedCTA schoolName={school.school_name} />
  </>
);

// Shared Components used across all variants
const SharedValueProposition = ({ schoolName, stateName }: { schoolName: string; stateName: string }) => (
  <section className="py-16 sm:py-20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Why Choose Sponsorly
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Modern fundraising designed for schools like {schoolName}.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: Heart,
            title: '100% to Your School Team or Group',
            description: 'Every dollar donated goes directly to your needs. Donors support you by paying a platform fee to make it free.',
          },
          {
            icon: Zap,
            title: 'Instant Payouts',
            description: 'Get your funds immediately — no waiting weeks for checks or wire transfers.',
          },
          {
            icon: Receipt,
            title: 'Automatic Tax Receipts',
            description: 'Donors receive tax-deductible receipts automatically. No manual paperwork.',
          },
          {
            icon: BarChart3,
            title: 'Real-Time Analytics',
            description: 'See exactly how your campaigns are performing with live dashboards.',
          },
          {
            icon: Share2,
            title: 'Peer-to-Peer Fundraising',
            description: 'Every player gets a unique link. Track individual progress and celebrate top fundraisers.',
          },
          {
            icon: Shield,
            title: 'Secure & Compliant',
            description: `Bank-level security and full compliance with ${stateName} school district requirements.`,
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
);

const SharedAdminLeadership = () => (
  <section className="py-16 sm:py-20 bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-primary text-white border-0 shadow-xl">
          <CardContent className="p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white mb-6">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">School Administrators & Athletic Directors</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Supervise All Fundraising with Complete Accountability
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Get the oversight and insights you need to support your teams while ensuring compliance and transparency.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Eye,
                  title: 'Unified Oversight',
                  description: 'Oversee every team and club\'s fundraising from a single dashboard',
                },
                {
                  icon: Shield,
                  title: 'Approval Workflows',
                  description: 'Set approval workflows to ensure campaigns meet district guidelines',
                },
                {
                  icon: BarChart3,
                  title: 'Detailed Reporting',
                  description: 'Track accountability with detailed audit trails and reporting',
                },
                {
                  icon: Store,
                  title: 'Business Discovery',
                  description: 'Discover local and regional businesses actively supporting your students',
                },
                {
                  icon: Handshake,
                  title: 'Partnership Opportunities',
                  description: 'Identify partnership opportunities with sponsors investing in your school community',
                },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-white/80">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

const SharedProgramTypes = () => (
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
);

const SharedFeaturesList = ({ schoolName, stateName }: { schoolName: string; stateName: string }) => (
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
            <span className="text-sm font-medium">Coaches & Club Sponsors</span>
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
);

const SharedCTA = ({ schoolName }: { schoolName: string }) => (
  <section className="py-16 sm:py-20 bg-primary">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        Ready to Transform Your School's Fundraising?
      </h2>
      <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
        Join schools across America already using Sponsorly to raise more money while keeping 100% of every donation.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/signup">
          <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-[#22C55E] hover:bg-[#16A34A] text-white border-0">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Link to="/contact">
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 bg-white text-primary hover:bg-white/90 border-white">
            Contact Us
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default SchoolLandingPage;
