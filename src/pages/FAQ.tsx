import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { User, Megaphone, CreditCard, Users, Building2 } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  questions: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'account',
    label: 'Account',
    icon: <User className="h-4 w-4" />,
    questions: [
      {
        question: 'How do I create an account?',
        answer:
          'Visit our signup page and enter your name, email, and password. Once registered, you\'ll be guided through setting up your organization — whether it\'s a school, non-profit, or supporter account.',
      },
      {
        question: 'How do I invite team members?',
        answer:
          'From your Dashboard, navigate to Users and click "Invite User." Enter their email address and assign a role. They\'ll receive an email invitation to join your organization automatically.',
      },
      {
        question: 'Can I manage multiple organizations?',
        answer:
          'Each Sponsorly account is tied to a single organization. If you need to manage multiple organizations, you can create separate accounts for each one using different email addresses.',
      },
      {
        question: 'How do I reset my password?',
        answer:
          'On the login page, click "Forgot password?" and enter your email address. You\'ll receive a password reset link within a few minutes. Check your spam folder if you don\'t see it.',
      },
    ],
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: <Megaphone className="h-4 w-4" />,
    questions: [
      {
        question: 'What types of campaigns can I create?',
        answer:
          'Sponsorly supports five campaign types: Sponsorships (business-backed funding), Donations (direct giving), Events (ticketed activities), Merchandise (product sales), and Roster-Enabled campaigns (individual fundraising pages for team members).',
      },
      {
        question: 'How do I create a campaign?',
        answer:
          'Go to Campaigns in your Dashboard and click "New Campaign." Choose a campaign type, fill in the details — name, description, goal amount, dates — add items or tiers, and publish when you\'re ready to share.',
      },
      {
        question: 'What is roster attribution?',
        answer:
          'Roster attribution gives each team member their own personalized fundraising link. When supporters purchase through that link, the contribution is tracked to that individual — perfect for teams where members fundraise competitively.',
      },
      {
        question: 'Can I customize my campaign landing page?',
        answer:
          'Yes! Each campaign has a public landing page you can customize with images, a pitch video, descriptions, and item details. You can also record a video pitch directly from the campaign editor.',
      },
      {
        question: 'How do I share my campaign?',
        answer:
          'Every campaign gets a unique shareable link (sponsorly.com/c/your-slug). Share it via email, social media, or text. For roster campaigns, each member also gets their own personalized URL to share.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: <CreditCard className="h-4 w-4" />,
    questions: [
      {
        question: 'How do supporters make payments?',
        answer:
          'Supporters pay securely through Stripe on your campaign\'s landing page. They can use credit cards, debit cards, Apple Pay, and Google Pay. No account creation is required for supporters.',
      },
      {
        question: 'When do I receive funds?',
        answer:
          'Funds are deposited directly into your connected Stripe account. Stripe typically processes payouts within 2–7 business days after each transaction, depending on your account settings.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) as well as Apple Pay and Google Pay through our Stripe integration.',
      },
      {
        question: 'Are donations tax-deductible?',
        answer:
          'Tax deductibility depends on your organization\'s tax-exempt status. If your organization is a registered 501(c)(3), donations may be tax-deductible. Sponsorly provides tax receipt functionality so donors can download receipts for their records.',
      },
      {
        question: 'Does Sponsorly take a cut of donations?',
        answer:
          'Sponsorly passes 100% of donations to your organization. Standard payment processing fees from Stripe apply, but Sponsorly does not add any additional platform fees on top.',
      },
    ],
  },
  {
    id: 'teams-rosters',
    label: 'Teams & Rosters',
    icon: <Users className="h-4 w-4" />,
    questions: [
      {
        question: 'What are rosters?',
        answer:
          'Rosters are lists of team members (players, students, participants) who can each have their own personalized fundraising page within a campaign. This lets supporters contribute on behalf of a specific individual.',
      },
      {
        question: 'How do personalized fundraising URLs work?',
        answer:
          'When roster attribution is enabled, each member gets a unique URL (e.g., sponsorly.com/c/your-campaign/player-name). Purchases made through that link are attributed to the member, making it easy to track individual fundraising progress.',
      },
      {
        question: 'Can parents track their child\'s fundraising progress?',
        answer:
          'Yes! Parents can be linked to their child\'s roster profile through the Family Dashboard. They\'ll see real-time progress, order details, and can share their child\'s personalized fundraising link.',
      },
      {
        question: 'How do I manage guardians and family connections?',
        answer:
          'Organization admins can invite parents and guardians through the roster management interface. Parents receive an email invitation and, once accepted, can view their connected students\' fundraising activity from their Family Dashboard.',
      },
    ],
  },
  {
    id: 'for-businesses',
    label: 'For Businesses',
    icon: <Building2 className="h-4 w-4" />,
    questions: [
      {
        question: 'How can a business sponsor a campaign?',
        answer:
          'Businesses can sponsor campaigns by purchasing sponsorship tiers on a campaign\'s landing page. After purchase, they may be asked to upload their logo and other brand assets that the organization will use for recognition.',
      },
      {
        question: 'What is the Donor Portal?',
        answer:
          'The Donor Portal is a dedicated dashboard for supporters and businesses. It lets them view purchase history, upload required brand assets, manage business profiles, communicate with organizations, and download tax receipts — all in one place.',
      },
      {
        question: 'Can businesses upload logos and brand assets?',
        answer:
          'Yes! After sponsoring a campaign, businesses can upload logos, brand guidelines, and other assets through the Donor Portal. Organizations define what assets they need, and businesses receive reminders to upload them before deadlines.',
      },
      {
        question: 'How does business matching work?',
        answer:
          'When a supporter makes a purchase using a business email domain, Sponsorly can automatically link them to an existing business profile. This helps organizations track total partnership value across multiple contacts from the same company.',
      },
    ],
  },
];

const FAQ = () => {
  return (
    <>
      <Helmet>
        <title>FAQ – Sponsorly | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find answers to common questions about Sponsorly — accounts, campaigns, payments, rosters, and business sponsorships."
        />
      </Helmet>

      <MarketingHeader />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using Sponsorly for your fundraising campaigns.
            </p>
          </div>
        </section>

        {/* Category Nav */}
        <nav className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 py-3">
              {faqCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {cat.icon}
                  {cat.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* FAQ Sections */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl space-y-16">
          {faqCategories.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {cat.icon}
                </span>
                <h2 className="text-2xl font-semibold text-foreground">{cat.label}</h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {cat.questions.map((q, idx) => (
                  <AccordionItem key={idx} value={`${cat.id}-${idx}`}>
                    <AccordionTrigger className="text-left text-base">
                      {q.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {q.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground">Still have questions?</h2>
            <p className="mt-2 text-muted-foreground">
              Our team is here to help. Reach out and we'll get back to you as soon as possible.
            </p>
            <Link to="/contact" className="mt-6 inline-block">
              <Button size="lg">Contact Us</Button>
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
};

export default FAQ;
