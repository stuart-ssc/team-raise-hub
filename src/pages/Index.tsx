import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import SchoolLogo from "@/components/SchoolLogo";
import { SchoolSelector } from "@/components/SchoolSelector";
import { 
  FileText, 
  Shield, 
  Zap, 
  Mail, 
  Tag, 
  Users, 
  Key, 
  BarChart3,
  Facebook,
  Linkedin
} from "lucide-react";
import heroImage from "@/assets/hero-celebration.jpg";
import teamImage from "@/assets/team-collaboration.jpg";

const Index = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    schoolInfo: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.schoolInfo) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('launch_interest')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          school_info: formData.schoolInfo
        });

      if (error) throw error;

      toast({
        title: "Thank you for your interest!",
        description: "We'll notify you when we launch."
      });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        schoolInfo: ""
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 flex justify-center">
        <a href="/" className="flex items-center">
          <img 
            src="/lovable-uploads/106766f6-f0e0-4d2e-8783-0d12dee9cd20.png" 
            alt="School Sponsor Connect" 
            className="h-16 w-auto"
          />
        </a>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Raising Money Has Never Been So Easy
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              An all-in-one fundraising platform for school related teams, clubs, and organizations that ensures the FULL donation gets to your group!
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                  document.getElementById('first-name-input')?.focus();
                }, 500);
              }}
            >
              Get Started
            </Button>
          </div>
          <div className="relative">
            <img 
              src={heroImage} 
              alt="Students celebrating with high-fives" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-accent py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-muted-foreground mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Reach Fundraising Goals 20% Faster
            </h2>
            <p className="text-lg text-muted-foreground">
              We want every dollar a sponsor gives to go directly to your group.<br />
              So that's what we do!
            </p>
          </div>

          <div className="flex items-start gap-12">
            <div className="w-[35%] grid grid-cols-1 gap-8 py-4">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Create Campaigns For Your Needs</h3>
                  <p className="text-sm text-muted-foreground">
                    Whether you are selling banners at your field, sponsors for your STEM lab, or just fundraising, create the campaign with your goals and needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Collect Money Directly & Immediately</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your existing bank account to the platform and receive funds immediately when payment is taken. The FULL AMOUNT.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Sponsors Cover Your Costs</h3>
                  <p className="text-sm text-muted-foreground">
                    Our sponsors have chosen to absorb all the fees by adding it to the amount, rather than subtracting. If a sponsor supports you, they can help you too!
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">In-app messenger</h3>
                  <p className="text-sm text-muted-foreground">
                    Streamline your communications with your group and your sponsors with our in-app messenger.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <img 
                src={teamImage} 
                alt="Team collaborating on fundraising" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-muted-foreground mb-2">KEY FEATURES</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              The Only Fundraising Tool You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Every detail is worked out for your students to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Landing Pages</h3>
                <p className="text-sm text-muted-foreground">
                  Every campaign has a unique landing page with your details, goals, and opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Every payment is processed and recorded securely through a certified processor
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Campaign Flexibility</h3>
                <p className="text-sm text-muted-foreground">
                  Every campaign is unique to your needs and opportunities, set it up how it works for your group
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Email Templates</h3>
                <p className="text-sm text-muted-foreground">
                  We provide email adaptability to invite sponsors and students to participate
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <Tag className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Identity & Branding</h3>
                <p className="text-sm text-muted-foreground">
                  Your logo and colors are utilized on your campaign landing page and email messages
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Easily invite students, family members, and other staff to help manage or participate in your fundraising
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <Key className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  User and donor accounts require 2-factor authentication to create a secure environment
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Data & Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track campaign progress and keep clear records for bookkeeping and next year's opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="bg-accent py-16 lg:py-24">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Ready For A Better Way To Fundraise?
          </h2>
          <p className="text-muted-foreground mb-8">
            We're busy putting the final touches on a platform to enable your group to raise money quickly and keep it all for your program. We can notify you're the one when launch. Let us know if you give up your information below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                id="first-name-input" 
                placeholder="First Name" 
                className="bg-background" 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
              <Input 
                placeholder="Last Name" 
                className="bg-background" 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
            <Input 
              placeholder="Email Address" 
              type="email" 
              className="bg-background" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
            <SchoolSelector
              value={formData.schoolInfo}
              onChange={(value) => handleInputChange('schoolInfo', value)}
              placeholder="Search for your school..."
            />
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Notify Me When You Launch"}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">School Sponsor Connect™</p>
          <div className="flex items-center space-x-6">
            <a 
              href="#" 
              className="bg-muted-foreground/10 hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-all duration-200"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4 fill-current" />
            </a>
            <a 
              href="#" 
              className="bg-muted-foreground/10 hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-all duration-200"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4 fill-current" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;