import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  ArrowRight,
  Calendar,
  Ticket,
  Users,
  Clock,
  Star,
  Trophy,
  Music,
  Gavel,
  MapPin,
  CheckCircle,
  Handshake,
  Smartphone,
  BarChart3,
  Gift,
  Utensils,
} from 'lucide-react';

const EventCampaigns = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/campaigns/events' });

  useEffect(() => {
    document.title = "Event Campaigns - Ticketing & Event Fundraising | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Sell tickets for golf tournaments, galas, auctions, camps, and more. Combine ticketing with sponsorship packages for maximum event revenue.');
    }
  }, []);

  const eventTypes = [
    { icon: Trophy, title: 'Golf Tournaments', desc: 'Scrambles, best-ball, and charity rounds' },
    { icon: Star, title: 'Skills Camps', desc: 'Sports clinics and training sessions' },
    { icon: Utensils, title: 'Galas & Dinners', desc: 'Formal fundraising events with speakers' },
    { icon: Gavel, title: 'Auctions', desc: 'Silent and live auction events' },
    { icon: MapPin, title: 'Field Trips', desc: 'Educational and recreational experiences' },
    { icon: Music, title: 'Performances', desc: 'Concerts, plays, and recitals' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-amber-500/10 via-background to-primary/10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 mb-6">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Event Campaigns</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Host Unforgettable Events That Raise Serious Funds
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Sell tickets, registrations, and passes for any fundraising event. From golf scrambles to galas, Sponsorly handles the ticketing so you can focus on the experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Plan Your Event
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
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-primary/20 rounded-2xl transform rotate-3" />
              <div className="relative bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h3 className="font-semibold">Annual Golf Scramble</h3>
                      <p className="text-sm text-muted-foreground">May 15, 2025 • 8:00 AM</p>
                    </div>
                    <Trophy className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">Individual Player</p>
                        <p className="text-xs text-muted-foreground">Includes lunch & prizes</p>
                      </div>
                      <span className="text-primary font-semibold">$125</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors bg-primary/5">
                      <div>
                        <p className="font-medium">Foursome Package</p>
                        <p className="text-xs text-muted-foreground">Save $100 on team entry</p>
                      </div>
                      <span className="text-primary font-semibold">$400</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">Dinner Only</p>
                        <p className="text-xs text-muted-foreground">Join us for the awards dinner</p>
                      </div>
                      <span className="text-primary font-semibold">$50</span>
                    </div>
                  </div>
                  <div className="h-12 w-full bg-amber-500 rounded-lg flex items-center justify-center text-white font-medium">
                    <Ticket className="h-5 w-5 mr-2" /> Get Tickets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Types Grid */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Event Types We Support
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whatever your event, Sponsorly makes ticketing and registration simple.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((event, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <event.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
                  <p className="text-muted-foreground">{event.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ticketing Features */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 mb-4">
                <Ticket className="h-4 w-4" />
                <span className="text-sm font-medium">Powerful Ticketing</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Flexible Ticketing for Any Event
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create multiple ticket types, offer early bird pricing, and manage attendance all from one dashboard.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Ticket, text: 'Single tickets or group packages' },
                  { icon: Clock, text: 'Early bird and limited-time pricing' },
                  { icon: Star, text: 'VIP packages with exclusive perks' },
                  { icon: Users, text: 'Attendance tracking and check-in' },
                  { icon: Smartphone, text: 'Digital ticket delivery via email' },
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
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-primary/10 rounded-2xl transform -rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <Ticket className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold">Ticket Dashboard</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-amber-500/10">
                      <p className="text-2xl font-bold text-amber-600">127</p>
                      <p className="text-sm text-muted-foreground">Tickets Sold</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-2xl font-bold text-foreground">$12,700</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Early Bird (Sold Out)</span>
                      <span className="text-muted-foreground">50/50</span>
                    </div>
                    <div className="h-2 bg-amber-500 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>General Admission</span>
                      <span className="text-muted-foreground">77/150</span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '51%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsorship Integration */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Hole Sponsors', desc: '18 holes available', price: '$500/hole' },
                  { title: 'Beverage Cart', desc: 'Exclusive branding', price: '$1,500' },
                  { title: 'Awards Dinner', desc: 'Table sponsor', price: '$750' },
                  { title: 'Title Sponsor', desc: 'Event naming rights', price: '$5,000' },
                ].map((item, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                      <p className="text-primary font-semibold">{item.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 mb-4">
                <Handshake className="h-4 w-4" />
                <span className="text-sm font-medium">Paired Sponsorships</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Maximize Revenue with Event Sponsorships
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Combine ticket sales with sponsorship opportunities. Businesses can sponsor specific event elements for additional visibility.
              </p>
              <ul className="space-y-3">
                {[
                  'Hole sponsors for golf tournaments',
                  'Table sponsors for galas and dinners',
                  'Prize sponsors for auctions',
                  'Equipment sponsors for camps and clinics',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/campaigns/sponsorships">
                  <Button variant="outline">
                    Learn About Sponsorships <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Success Stats */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Event Fundraising That Delivers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Organizations using Sponsorly for events see real results.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: '2.5x', label: 'Average revenue increase', desc: 'vs. traditional ticketing' },
              { stat: '40%', label: 'Less admin time', desc: 'with automated check-in' },
              { stat: '95%', label: 'Attendee satisfaction', desc: 'with mobile tickets' },
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
      <section className="py-16 sm:py-20 bg-gradient-to-br from-amber-500/10 via-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Plan Your Next Fundraising Event?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            From small camps to large galas, Sponsorly makes event fundraising simple and successful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/campaigns-overview">
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

export default EventCampaigns;
