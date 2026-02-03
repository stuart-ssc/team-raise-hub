import { Link } from 'react-router-dom';
import { GraduationCap, Building2, Zap, Users, BarChart3, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';

const Platform = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/20">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Fundraising Made Simple for Schools & Non-Profits
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Sponsorly empowers organizations to raise funds effortlessly with powerful tools designed for your success. No monthly fees, no hidden costs—just results.
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>

        {/* For Schools Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-2">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl">Built for Schools & Athletic Programs</CardTitle>
                <CardDescription className="text-lg">
                  Everything coaches, teachers, and administrators need to manage fundraising
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Team & Club Management
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Organize multiple teams, clubs, and programs within your school
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Student Roster Tracking
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Keep track of participants and their fundraising progress
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Parent Engagement Tools
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Keep parents informed and involved in fundraising efforts
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Sports, Band, Theater & More
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Perfect for any school program that needs funding
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Campaign Templates
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Pre-built templates specific to school fundraising needs
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Real-Time Progress Tracking
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Monitor fundraising goals and celebrate milestones
                    </p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <Link to="/schools">
                    <Button size="lg">
                      Learn More About Sponsorly for Schools
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Non-Profits Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-2">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl">Designed for Non-Profit Success</CardTitle>
                <CardDescription className="text-lg">
                  Powerful tools to help your mission thrive and grow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Program Management
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Organize and track multiple programs and initiatives
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Volunteer Coordination
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Engage and manage your volunteer base effectively
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Board Member Engagement
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Keep your board informed with real-time insights
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Mission-Driven Campaign Tools
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Create campaigns that tell your story and inspire giving
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Donor Relationship Management
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Build lasting relationships with your supporters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Impact Reporting
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4">
                      Show donors the difference their contributions make
                    </p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <Link to="/nonprofits">
                    <Button size="lg">
                      Learn More About Sponsorly for Non-Profits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Features Preview */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to succeed, built right in
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Quick Campaign Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Launch professional fundraising campaigns in minutes, not days
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Heart className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>100% to Your Cause</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Donors cover platform fees, so you receive every dollar raised
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Real-Time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track progress, engagement, and performance with live dashboards
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Donor CRM</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Manage relationships and communications with built-in tools
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Automated Tax Receipts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Professional tax receipts sent automatically to donors
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Heart className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Beautiful Campaign Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Stunning, mobile-optimized pages that inspire donations
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Explore Campaign Types */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Explore Campaign Types</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Discover the different ways you can raise funds with Sponsorly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/campaigns-overview">
                <Button size="lg" className="gap-2">
                  View All Campaign Types
                </Button>
              </Link>
              <Link to="/campaigns/roster">
                <Button size="lg" variant="outline" className="gap-2">
                  <Users className="h-5 w-5" />
                  Roster-Enabled Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Fundraising?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of organizations raising funds more effectively with Sponsorly
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Free Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Platform;
