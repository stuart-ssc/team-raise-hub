import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  ArrowRight,
  Users,
  Trophy,
  Video,
  Link2,
  QrCode,
  Target,
  BarChart3,
  Share2,
  Heart,
  Sparkles,
  Medal,
  TrendingUp,
  User,
  CheckCircle,
  Smartphone,
} from 'lucide-react';

const RosterCampaigns = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/campaigns/roster' });

  useEffect(() => {
    document.title = "Roster-Enabled Campaigns - Peer-to-Peer Fundraising | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Gamify fundraising with personal pages, leaderboards, and video pitches for each team member. Track individual progress and celebrate top performers.');
    }
  }, []);

  const features = [
    { icon: User, title: 'Personal Fundraising Pages', desc: 'Each player gets their own branded page to share' },
    { icon: Trophy, title: 'Real-Time Leaderboards', desc: 'Rankings that update live to drive competition' },
    { icon: Video, title: 'Video Pitches', desc: 'Players record personalized messages for donors' },
    { icon: Link2, title: 'Personalized Links', desc: 'Unique URLs for easy sharing via text or email' },
    { icon: QrCode, title: 'Custom QR Codes', desc: 'Scannable codes for in-person sharing' },
    { icon: Target, title: 'Progress Tracking', desc: 'Individual and team goal visualization' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-purple-500/10 via-background to-primary/10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 mb-6">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Roster-Enabled Campaigns</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Gamify Fundraising and Watch Your Team Compete
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Give every team member their own fundraising page with personalized links, video pitches, and real-time leaderboards. Turn fundraising into a team sport.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Enable Roster Tracking
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
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/20 rounded-2xl transform rotate-3" />
              <div className="relative bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="font-semibold">Team Leaderboard</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Updated live</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { position: 1, name: 'Jake Martinez', raised: '$1,250', color: 'bg-amber-500' },
                      { position: 2, name: 'Emma Sullivan', raised: '$980', color: 'bg-gray-400' },
                      { position: 3, name: 'Tyler Roberts', raised: '$875', color: 'bg-amber-600' },
                      { position: 4, name: 'Sophia Chen', raised: '$720', color: 'bg-purple-500/50' },
                    ].map((player) => (
                      <div key={player.position} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${player.color} flex items-center justify-center text-white font-bold text-sm`}>
                            {player.position}
                          </div>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <span className="text-primary font-semibold">{player.raised}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">Team Total: <span className="text-primary font-semibold">$12,450</span></p>
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
              Everything for Peer-to-Peer Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools that make it easy for every team member to participate and succeed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Player Dashboard Preview */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 mb-4">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Player Dashboard</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Every Player Gets Their Own Command Center
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Players can track their progress, share their personal page, and see how they stack up against teammates — all from a mobile-friendly dashboard.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: BarChart3, text: 'Personal fundraising stats and progress' },
                  { icon: Trophy, text: 'Leaderboard position and competition updates' },
                  { icon: Share2, text: 'Easy sharing to social media and contacts' },
                  { icon: Heart, text: 'See who donated and thank supporters' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-primary/10 rounded-2xl transform -rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border max-w-sm mx-auto">
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-purple-600">JM</span>
                    </div>
                    <h3 className="font-semibold">Jake Martinez</h3>
                    <p className="text-sm text-muted-foreground">#24 • Varsity Football</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-primary">$1,250</p>
                      <p className="text-xs text-muted-foreground">Raised</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-amber-500">#1</p>
                      <p className="text-xs text-muted-foreground">Rank</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">18</p>
                      <p className="text-xs text-muted-foreground">Donors</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Goal Progress</span>
                      <span className="text-primary">83%</span>
                    </div>
                    <div className="h-3 bg-accent rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '83%' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="py-2 px-3 rounded-lg bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-1">
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                    <button className="py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1">
                      <QrCode className="h-4 w-4" /> QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Pitches Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-primary/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/90 flex items-center justify-center shadow-lg mb-3">
                        <Video className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">Player Video Pitch</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">"Help me reach my goal!"</p>
                    <p className="text-sm text-muted-foreground">— Jake Martinez, #24</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 mb-4">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Video Pitches</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Personal Appeals That Convert
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let players record personalized video messages for their fundraising pages. Video pitches see 3x higher conversion rates than text-only pages.
              </p>
              <ul className="space-y-3">
                {[
                  'Easy recording right from mobile phones',
                  'Auto-embedded on personal fundraising pages',
                  'Optional — text-only pages still work great',
                  'Builds personal connection with donors',
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

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Roster Campaigns Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Peer-to-peer fundraising leverages the power of personal networks.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: 'Creates Ownership', desc: 'Players feel invested in their personal goals' },
              { icon: Share2, title: 'Extends Reach', desc: 'Each player shares with their unique network' },
              { icon: Medal, title: 'Celebrates Success', desc: 'Public recognition for top performers' },
              { icon: TrendingUp, title: 'Teaches Responsibility', desc: 'Valuable life skills through fundraising' },
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                    <item.icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Numbers Speak for Themselves
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: '3x', label: 'More reach', desc: 'vs. organization-only sharing' },
              { stat: '47%', label: 'Higher participation', desc: 'when gamification is enabled' },
              { stat: '2.5x', label: 'Revenue increase', desc: 'with roster attribution' },
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
      <section className="py-16 sm:py-20 bg-gradient-to-br from-purple-500/10 via-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Gamify Your Fundraising?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn your next campaign into a team competition. Enable roster attribution and watch engagement soar.
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

export default RosterCampaigns;
