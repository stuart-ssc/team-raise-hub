import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, useLocation, Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { useLandingPageTracking } from "@/hooks/useLandingPageTracking";
import { 
  ArrowRight,
  Shield, 
  Zap, 
  TrendingUp,
  Heart,
  Users,
  CheckCircle,
  Building2,
  GraduationCap,
  Sparkles,
  BarChart3,
  DollarSign,
  Globe,
  Star,
  Briefcase
} from "lucide-react";
import heroImage from "@/assets/hero-celebration.jpg";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Track page view
  useLandingPageTracking({
    pageType: 'home',
    pagePath: location.pathname,
  });

  const features = [
    {
      icon: DollarSign,
      title: "100% of Donations",
      description: "Supporters cover platform fees, so your organization receives every dollar donated"
    },
    {
      icon: Zap,
      title: "Quick Setup",
      description: "Launch campaigns in minutes with our intuitive campaign builder"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-level security with automatic tax receipts for eligible donations"
    },
    {
      icon: Globe,
      title: "Beautiful Pages",
      description: "Professional campaign pages that showcase your mission and impact"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Easily manage volunteers, staff, and participants in one platform"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track progress, donor engagement, and campaign performance"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Martinez",
      role: "Athletic Director, Lincoln High School",
      content: "Sponsorly made our booster club fundraising so much easier. We raised 30% more this year and every dollar went directly to our programs!",
      initials: "SM"
    },
    {
      name: "David Chen",
      role: "Executive Director, Community Hope Foundation",
      content: "The platform is incredibly intuitive. Our donors love the transparency, and the automatic tax receipts save us hours of admin work.",
      initials: "DC"
    },
    {
      name: "Emily Rodriguez",
      role: "Band Director, Riverside Academy",
      content: "We launched our first campaign in under 10 minutes. The results have been amazing - our students reached their goal 2 weeks early!",
      initials: "ER"
    }
  ];

  const stats = [
    { value: "$2.5M+", label: "Funds Raised" },
    { value: "500+", label: "Organizations" },
    { value: "98%", label: "Satisfaction" },
    { value: "15K+", label: "Supporters" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="container mx-auto px-6 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="gap-1 w-fit" variant="secondary">
                <Sparkles className="h-3 w-3" />
                Fundraising Reimagined
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Fundraising That Puts
                <span className="text-primary"> Your Mission</span> First
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
                The only platform where 100% of donations go directly to your organization. 
                No hidden fees, no surprises—just simple, powerful fundraising.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/schools')}
                  className="gap-2 text-lg px-8 py-6"
                >
                  <GraduationCap className="h-5 w-5" />
                  For Schools
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/nonprofits')}
                  className="gap-2 text-lg px-8 py-6"
                >
                  <Building2 className="h-5 w-5" />
                  For Non-Profits
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl" />
              <img 
                src={heroImage}
                alt="Successful fundraising celebration"
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-background border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Campaign Success</div>
                    <div className="text-xs text-muted-foreground">150% of goal reached</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y bg-accent/30 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">TRUSTED BY ORGANIZATIONS NATIONWIDE</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background" />
                ))}
              </div>
              <p className="text-sm text-foreground font-medium">500+ schools and non-profits raising funds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="gap-1">
              <Heart className="h-3 w-3" />
              Why Choose Sponsorly
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to maximize your impact and simplify fundraising
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link to="/campaigns-overview">
              <Button variant="outline" size="lg" className="gap-2">
                See All Campaign Types
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-accent py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Simple Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Launch in Minutes, Not Days
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="relative">
              <div className="bg-background rounded-2xl p-8 shadow-lg space-y-4">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <h3 className="text-2xl font-semibold text-foreground">Create Your Campaign</h3>
                <p className="text-muted-foreground">
                  Set up your fundraising campaign with our easy-to-use builder. Add your story, goals, and campaign items.
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-border" />
            </div>

            <div className="relative">
              <div className="bg-background rounded-2xl p-8 shadow-lg space-y-4">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <h3 className="text-2xl font-semibold text-foreground">Share & Promote</h3>
                <p className="text-muted-foreground">
                  Get your unique campaign link and share it with supporters via email, social media, or direct outreach.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-border" />
            </div>

            <div className="bg-background rounded-2xl p-8 shadow-lg space-y-4">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Receive Full Donations</h3>
              <p className="text-muted-foreground">
                Watch donations come in real-time. Receive 100% of funds directly to your account with instant notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              Success Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Loved by Fundraisers Everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3 pt-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground">
              Ready to Transform Your Fundraising?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Join hundreds of organizations already using Sponsorly to reach their goals faster
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                variant="secondary"
                onClick={() => navigate('/schools')}
                className="gap-2 text-lg px-8 py-6"
              >
                <GraduationCap className="h-5 w-5" />
                Start as a School
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/nonprofits')}
                className="gap-2 text-lg px-8 py-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Building2 className="h-5 w-5" />
                Start as a Non-Profit
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/for-businesses')}
                className="gap-2 text-lg px-8 py-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Briefcase className="h-5 w-5" />
                For Businesses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4 pt-8">
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <CheckCircle className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <CheckCircle className="h-5 w-5" />
                <span>Set up in under 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default Index;
