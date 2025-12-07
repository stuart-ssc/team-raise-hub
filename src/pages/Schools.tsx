import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import {
  GraduationCap,
  Users,
  Trophy,
  Music,
  Theater,
  Shield,
  BarChart3,
  Eye,
  UserCog,
  DollarSign,
  Zap,
  Heart,
  CheckCircle,
  Share2,
  Receipt,
  Smartphone,
  Lock,
  TrendingUp,
  Award,
  ClipboardList,
  Calendar,
  PiggyBank,
} from 'lucide-react';

const Schools = () => {
  useEffect(() => {
    document.title = "Sponsorly for Schools - Fundraising for Teams, Clubs & PTOs";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Powerful fundraising platform for K-12 schools. Manage sports teams, clubs, band, theater, and PTOs all in one place. 100% of donations go to your programs.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium">Built for K-12 Schools</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Everything Your School Needs to Fundraise Smarter
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              From sports teams to drama clubs, band to PTOs — Sponsorly gives every group the tools to raise more while keeping 100% of every donation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Get Started Free
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

      {/* School Programs Grid */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              One Platform for Every School Program
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether it's athletics, arts, academics, or parent organizations — we've got you covered.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Trophy, label: 'Sports Teams' },
              { icon: Music, label: 'Band & Orchestra' },
              { icon: Theater, label: 'Drama & Theater' },
              { icon: GraduationCap, label: 'Academic Clubs' },
              { icon: Users, label: 'PTOs & Boosters' },
              { icon: Award, label: 'Honor Societies' },
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 pb-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* School-Level Management */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">For Principals & Athletic Directors</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Complete Visibility and Control at the School Level
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Finally, a unified dashboard that shows you everything happening across all your school's fundraising activities — no more spreadsheets or chasing down coaches for updates.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Eye, text: 'Real-time visibility into every team and club campaign' },
                  { icon: UserCog, text: 'Manage users, roles, and permissions across the school' },
                  { icon: BarChart3, text: 'Comprehensive reporting and analytics dashboard' },
                  { icon: Users, text: 'Centralized donor management and communication' },
                  { icon: Shield, text: 'Ensure compliance with district policies' },
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
            <div className="bg-background rounded-2xl p-8 shadow-xl border">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="font-semibold text-foreground">School Dashboard</h3>
                  <span className="text-sm text-muted-foreground">All Programs</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="text-2xl font-bold text-foreground">$47,250</p>
                    <p className="text-sm text-muted-foreground">Total Raised</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="text-2xl font-bold text-foreground">234</p>
                    <p className="text-sm text-muted-foreground">Supporters</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Teams & Clubs</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Varsity Football</span>
                    <span className="text-sm font-medium text-primary">$12,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Band Boosters</span>
                    <span className="text-sm font-medium text-primary">$8,750</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Drama Club</span>
                    <span className="text-sm font-medium text-primary">$6,200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Club Features */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">For Coaches & Club Sponsors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Empower Your Team to Raise More
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Give coaches and sponsors the tools they need to run successful fundraisers without the administrative headaches.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ClipboardList,
                title: 'Easy Roster Management',
                description: 'Import your roster in seconds. Manage players, parents, and staff all in one place.',
              },
              {
                icon: Share2,
                title: 'Peer-to-Peer Fundraising',
                description: 'Every player gets a unique shareable link. Track individual progress and celebrate top fundraisers.',
              },
              {
                icon: TrendingUp,
                title: 'Real-Time Leaderboards',
                description: 'Motivate your team with live leaderboards showing who\'s raising the most.',
              },
              {
                icon: Users,
                title: 'Parent Engagement',
                description: 'Easily communicate with parents and keep them updated on campaign progress.',
              },
              {
                icon: Calendar,
                title: 'Campaign Templates',
                description: 'Pre-built templates for sports seasons, equipment drives, travel tournaments, and more.',
              },
              {
                icon: Smartphone,
                title: 'Mobile-First Design',
                description: 'Parents and supporters can donate in seconds from any device.',
              },
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PTO/Booster Features */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, title: 'Multi-Group Support', desc: 'Manage fundraising for multiple teams from one account' },
                  { icon: PiggyBank, title: 'Financial Transparency', desc: 'Clear reporting for board meetings and audits' },
                  { icon: Calendar, title: 'Event Fundraising', desc: 'Perfect for auctions, galas, and special events' },
                  { icon: BarChart3, title: 'Detailed Reports', desc: 'Export-ready reports for your records' },
                ].map((item, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <item.icon className="h-8 w-8 text-primary mb-3" />
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">For PTOs & Booster Clubs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Support Multiple Programs from One Account
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Booster clubs and PTOs often support many teams and programs. Sponsorly makes it easy to manage everything in one place while keeping funds properly allocated.
              </p>
              <ul className="space-y-3">
                {[
                  'Support unlimited teams and clubs',
                  'Separate tracking for each program\'s funds',
                  'Consolidated reporting for your board',
                  'Volunteer-friendly — anyone can help manage campaigns',
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

      {/* Key Benefits */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Schools Choose Sponsorly
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of schools who've switched to smarter fundraising.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: '100% to Your School',
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
                title: 'Real-Time Analytics',
                description: 'See exactly how your campaigns are performing with live dashboards.',
              },
              {
                icon: Smartphone,
                title: 'Mobile Friendly',
                description: 'Parents can donate in seconds from their phones. No app download required.',
              },
              {
                icon: Lock,
                title: 'Secure & Compliant',
                description: 'Bank-level security and full compliance with school district requirements.',
              },
            ].map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center mb-12">
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">500+</p>
                <p className="text-muted-foreground">Schools & Programs</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">$2M+</p>
                <p className="text-muted-foreground">Raised for Schools</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">50,000+</p>
                <p className="text-muted-foreground">Supporters</p>
              </div>
            </div>
            <Card className="bg-background">
              <CardContent className="p-8">
                <blockquote className="text-lg sm:text-xl text-foreground italic mb-6">
                  "Sponsorly transformed how we manage fundraising across all 15 of our athletic programs. The visibility it gives me as Athletic Director is incredible — I can see exactly what every team is doing without chasing down coaches."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Mike Johnson</p>
                    <p className="text-sm text-muted-foreground">Athletic Director, Lincoln High School</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Ready to Transform Your School's Fundraising?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of schools already using Sponsorly. Get started in minutes — it's completely free for your school.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required. Set up in under 5 minutes.
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default Schools;
