import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import {
  Heart,
  HandHeart,
  Users,
  Leaf,
  Building,
  Stethoscope,
  Palette,
  Globe,
  Receipt,
  FileCheck,
  BarChart3,
  Shield,
  Zap,
  Smartphone,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Star,
  TrendingUp,
  UserPlus,
  Mail,
  Target,
  Calendar,
  PieChart,
  Award,
} from "lucide-react";
import teamImage from "@/assets/team-collaboration.jpg";

const Nonprofits = () => {
  useEffect(() => {
    document.title = "Sponsorly for Nonprofits - Fundraising for 501(c)(3) Organizations";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Powerful fundraising platform for nonprofits and 501(c)(3) organizations. Automatic tax receipts, donor management, and 100% of donations go to your cause.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="h-4 w-4" />
                Built for 501(c)(3) Organizations
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Fundraising Made Simple for{" "}
                <span className="text-primary">Nonprofits</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                Empower your mission with a modern fundraising platform. Automatic tax receipts, 
                donor management, and peer-to-peer campaigns—all while keeping 100% of donations 
                for your cause.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Start Fundraising Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/features">See All Features</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl" />
              <img
                src={teamImage}
                alt="Nonprofit team collaboration"
                className="relative rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nonprofit Programs Grid */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Every Type of Program
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're running community outreach, youth programs, or environmental initiatives, 
              Sponsorly adapts to your organization's unique needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Community Outreach", desc: "Food banks, shelters, and community services" },
              { icon: Heart, title: "Youth Programs", desc: "Mentorship, after-school, and youth development" },
              { icon: Stethoscope, title: "Health & Wellness", desc: "Medical assistance, mental health, and wellness" },
              { icon: Palette, title: "Arts & Culture", desc: "Museums, theaters, and cultural preservation" },
              { icon: Leaf, title: "Environmental", desc: "Conservation, sustainability, and green initiatives" },
              { icon: Building, title: "Social Services", desc: "Housing, education, and family support" },
            ].map((program) => (
              <Card key={program.title} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <program.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{program.title}</h3>
                  <p className="text-muted-foreground">{program.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Director Features */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                For Executive Directors
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Complete Visibility Across Your Organization
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Lead with confidence. Get a unified view of all programs, campaigns, and donor 
                relationships from a single dashboard designed for nonprofit leadership.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: PieChart, text: "Organization-wide reporting and analytics" },
                  { icon: Users, text: "Staff, board, and volunteer management" },
                  { icon: Receipt, text: "Automatic 501(c)(3) tax receipt generation" },
                  { icon: FileCheck, text: "IRS compliance documentation" },
                  { icon: TrendingUp, text: "Donor lifecycle and retention insights" },
                ].map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feature.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Organization Dashboard</h3>
                <span className="text-xs text-muted-foreground">All Programs</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Total Raised", value: "$847,250", change: "+18%" },
                  { label: "Active Donors", value: "2,847", change: "+12%" },
                  { label: "Programs", value: "8", change: "" },
                  { label: "Campaigns", value: "24", change: "+3" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-accent/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    {stat.change && <p className="text-xs text-primary">{stat.change}</p>}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { name: "Food Bank Initiative", raised: "$124,500", goal: "$150,000", pct: 83 },
                  { name: "Youth Mentorship", raised: "$89,200", goal: "$100,000", pct: 89 },
                  { name: "Community Garden", raised: "$45,800", goal: "$50,000", pct: 92 },
                ].map((campaign) => (
                  <div key={campaign.name} className="bg-background rounded-lg p-3 border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">{campaign.raised} / {campaign.goal}</span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${campaign.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Director Features */}
      <section className="py-16 md:py-24 bg-accent/20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Annual Giving Campaign</h3>
                    <p className="text-sm text-muted-foreground">Youth Mentorship Program</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Campaign Progress</span>
                    <span className="text-foreground font-medium">$89,200 of $100,000</span>
                  </div>
                  <div className="h-3 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full" style={{ width: '89%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 bg-accent/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">156</p>
                    <p className="text-xs text-muted-foreground">Donors</p>
                  </div>
                  <div className="text-center p-3 bg-accent/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">$572</p>
                    <p className="text-xs text-muted-foreground">Avg Gift</p>
                  </div>
                  <div className="text-center p-3 bg-accent/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Days Left</p>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Top Peer Fundraisers</p>
                  <div className="space-y-2">
                    {[
                      { name: "Sarah M.", amount: "$4,250", rank: 1 },
                      { name: "James T.", amount: "$3,800", rank: 2 },
                      { name: "Emily R.", amount: "$2,950", rank: 3 },
                    ].map((fundraiser) => (
                      <div key={fundraiser.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
                            {fundraiser.rank}
                          </span>
                          <span className="text-foreground">{fundraiser.name}</span>
                        </div>
                        <span className="text-primary font-medium">{fundraiser.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                For Program Directors
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Run Campaigns That Inspire Action
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Launch peer-to-peer campaigns, track donor engagement, and celebrate milestones—all 
                with tools designed for program-level fundraising success.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: UserPlus, text: "Volunteer and member roster management" },
                  { icon: Globe, text: "Peer-to-peer fundraising with personal pages" },
                  { icon: Calendar, text: "Campaign templates for galas, giving days, and more" },
                  { icon: Mail, text: "Automated donor communications and thank-yous" },
                  { icon: BarChart3, text: "Real-time fundraising progress tracking" },
                ].map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feature.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Board & Volunteer Features */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              For Board Members & Volunteers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Engage Your Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Give board members visibility into organizational health and empower volunteers 
              to become passionate fundraisers for your cause.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: PieChart, title: "Financial Transparency", desc: "Real-time dashboards for board oversight and reporting" },
              { icon: Smartphone, title: "Mobile-Friendly", desc: "Easy donation and fundraising from any device" },
              { icon: Award, title: "Recognition Tools", desc: "Celebrate top fundraisers and milestone donors" },
              { icon: HandHeart, title: "Easy Giving", desc: "One-click donations and recurring gift options" },
            ].map((feature) => (
              <Card key={feature.title} className="text-center border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Nonprofits Choose Sponsorly
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Focus on your mission, not administrative overhead. Our platform handles the 
              complexity so you can focus on making an impact.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: "100% to Your Cause", desc: "Every dollar donated goes directly to your organization" },
              { icon: Zap, title: "Instant Payouts", desc: "Access your funds immediately, no waiting periods" },
              { icon: Receipt, title: "Automatic Tax Receipts", desc: "IRS-compliant receipts with your EIN, sent automatically" },
              { icon: BarChart3, title: "Donor Analytics", desc: "RFM segmentation and insights to maximize retention" },
              { icon: Shield, title: "Secure & Compliant", desc: "Bank-level security with full regulatory compliance" },
              { icon: Smartphone, title: "Mobile Optimized", desc: "Beautiful donor experience on every device" },
            ].map((benefit) => (
              <Card key={benefit.title} className="border-border/50">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Trusted by Mission-Driven Organizations
              </h2>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { value: "500+", label: "Organizations" },
                  { value: "$12M+", label: "Raised" },
                  { value: "50K+", label: "Donors" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                    <p className="text-primary-foreground/80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                ))}
              </div>
              <p className="text-lg mb-6 text-primary-foreground/90">
                "Sponsorly transformed how we run our annual giving campaign. The peer-to-peer 
                tools helped us increase donations by 40%, and the automatic tax receipts saved 
                our team countless hours."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <span className="text-lg font-bold">MK</span>
                </div>
                <div>
                  <p className="font-semibold">Maria Kim</p>
                  <p className="text-sm text-primary-foreground/70">Executive Director, Community Hope Foundation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-accent/20 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Nonprofit's Fundraising?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join hundreds of nonprofits using Sponsorly to engage donors, run campaigns, 
            and maximize their impact—all while keeping 100% of donations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Schedule a Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            <CheckCircle2 className="inline h-4 w-4 mr-1 text-primary" />
            No credit card required • Free for organizations • 100% of donations to your cause
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default Nonprofits;
