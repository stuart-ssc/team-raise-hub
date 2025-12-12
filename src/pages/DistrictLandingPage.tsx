import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { supabase } from '@/integrations/supabase/client';
import { getVariantForEntity, type LandingPageVariant } from '@/lib/abTestUtils';
import { getStateFromSlug, getStateName } from '@/lib/stateUtils';
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
  Building2,
  School,
} from 'lucide-react';

interface DistrictData {
  id: string;
  name: string;
  state: string | null;
  school_count: number;
}

const DistrictLandingPage = () => {
  const { state: stateSlug, slug } = useParams<{ state: string; slug: string }>();
  const [district, setDistrict] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<LandingPageVariant>('A');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stateSlug, slug]);

  useEffect(() => {
    const fetchDistrict = async () => {
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
        .from('school_districts')
        .select(`
          id,
          name,
          state,
          schools (id)
        `)
        .eq('slug', slug)
        .eq('state', stateInfo.abbr)
        .single();

      if (!error && data) {
        setDistrict({
          ...data,
          school_count: Array.isArray(data.schools) ? data.schools.length : 0,
        });
        setVariant(getVariantForEntity(data.id));
      }
      setLoading(false);
    };

    fetchDistrict();
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

  if (!district) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">District Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the school district you're looking for.
          </p>
          <Link to="/schools">
            <Button>Browse All Schools</Button>
          </Link>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  const stateName = district.state ? getStateName(district.state) : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: district.name,
    address: {
      '@type': 'PostalAddress',
      addressRegion: district.state,
    },
    url: `https://sponsorly.io/districts/${stateSlug}/${slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${district.name} Fundraising | Sponsorly`}</title>
        <meta
          name="description"
          content={`Support ${district.name} schools in ${stateName}. Modern fundraising for sports teams, clubs, band, theater, and PTOs. 100% of donations go to your programs.`}
        />
        <meta property="og:title" content={`${district.name} Fundraising | Sponsorly`} />
        <meta
          property="og:description"
          content={`Modern fundraising platform for ${district.name} schools. Sports teams, clubs, band, theater, PTOs - all in one place.`}
        />
        <meta property="og:url" content={`https://sponsorly.io/districts/${stateSlug}/${slug}`} />
        <link rel="canonical" href={`https://sponsorly.io/districts/${stateSlug}/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <MarketingHeader />

      {variant === 'A' && <VariantAContent district={district} stateSlug={stateSlug!} stateName={stateName} />}
      {variant === 'B' && <VariantBContent district={district} stateSlug={stateSlug!} stateName={stateName} />}
      {variant === 'C' && <VariantCContent district={district} stateSlug={stateSlug!} stateName={stateName} />}

      <MarketingFooter />
    </div>
  );
};

interface VariantContentProps {
  district: DistrictData;
  stateSlug: string;
  stateName: string;
}

// Variant A: Hero-Focused
const VariantAContent = ({ district, stateSlug, stateName }: VariantContentProps) => (
  <>
    <section className="relative py-20 sm:py-28 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium">{stateName} School District</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Fundraising for{' '}
            <span className="text-primary">{district.name}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empower all {district.school_count > 0 ? `${district.school_count} schools in` : 'schools in'} your district with modern fundraising that keeps 100% of every donation.
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

    <SharedDistrictValueProposition districtName={district.name} stateName={stateName} />
    <SharedProgramTypes />
    <SharedDistrictFeatures districtName={district.name} stateName={stateName} />
    <SharedDistrictCTA districtName={district.name} />
  </>
);

// Variant B: Stats-First
const VariantBContent = ({ district, stateSlug, stateName }: VariantContentProps) => (
  <>
    <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium">{stateName}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            <span className="text-primary">{district.name}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            District-wide modern fundraising for every school program
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <Card className="text-center bg-background/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">100%</div>
              <p className="text-sm text-muted-foreground">Goes to Schools</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-background/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{district.school_count || '—'}</div>
              <p className="text-sm text-muted-foreground">Schools</p>
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

    <SharedDistrictValueProposition districtName={district.name} stateName={stateName} />
    <SharedProgramTypes />
    <SharedDistrictFeatures districtName={district.name} stateName={stateName} />
    <SharedDistrictCTA districtName={district.name} />
  </>
);

// Variant C: Social Proof
const VariantCContent = ({ district, stateSlug, stateName }: VariantContentProps) => (
  <>
    <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <School className="h-5 w-5" />
            <span className="text-sm font-medium">{stateName}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Join Districts Raising More with{' '}
            <span className="text-primary">Sponsorly</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Modern fundraising for all schools in {district.name}.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto bg-background/80 backdrop-blur mt-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-foreground italic mb-3">
                  "Sponsorly allows us to manage fundraising across our entire district. The centralized reporting and 100% donation model makes it the obvious choice."
                </p>
                <p className="text-sm text-muted-foreground">— District Administrator, {stateName}</p>
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

    <SharedDistrictValueProposition districtName={district.name} stateName={stateName} />
    <SharedProgramTypes />
    <SharedDistrictFeatures districtName={district.name} stateName={stateName} />
    <SharedDistrictCTA districtName={district.name} />
  </>
);

// Shared Components
const SharedDistrictValueProposition = ({ districtName, stateName }: { districtName: string; stateName: string }) => (
  <section className="py-16 sm:py-20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Why Choose Sponsorly
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          District-wide fundraising designed for schools like those in {districtName}.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: Heart,
            title: '100% to Your Schools',
            description: 'Every dollar donated goes directly to your programs. We charge donors a small platform fee instead.',
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
            title: 'District-Wide Analytics',
            description: 'See how all schools are performing from a centralized dashboard.',
          },
          {
            icon: Share2,
            title: 'Peer-to-Peer Fundraising',
            description: 'Every player gets a unique link. Track individual progress and celebrate top fundraisers.',
          },
          {
            icon: Shield,
            title: 'Secure & Compliant',
            description: `Bank-level security and full compliance with ${stateName} district requirements.`,
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

const SharedDistrictFeatures = ({ districtName, stateName }: { districtName: string; stateName: string }) => (
  <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-primary/5">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">For District Administrators</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Complete Visibility Across Your District
          </h3>
          <ul className="space-y-3">
            {[
              'Unified dashboard for all schools',
              'Manage users, roles, and permissions district-wide',
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

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">For School Staff</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Empower Every School to Raise More
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

const SharedDistrictCTA = ({ districtName }: { districtName: string }) => (
  <section className="py-16 sm:py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
        Ready to Transform District Fundraising?
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        Join districts across America already using Sponsorly to raise more money while keeping 100% of every donation.
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
            Contact Us
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default DistrictLandingPage;
