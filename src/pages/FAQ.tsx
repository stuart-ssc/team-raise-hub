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
import { User, Megaphone, CreditCard, Users, Building2, HandCoins } from 'lucide-react';
import { AUDIENCE_SCOPED_CSS } from '@/components/audience/audienceStyles';

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
    id: 'fundraisers',
    label: 'Fundraisers',
    icon: <Megaphone className="h-4 w-4" />,
    questions: [
      {
        question: 'What types of fundraisers can I create?',
        answer:
          'Sponsorly supports six fundraiser types: Sponsorships (business-backed funding), Donations (direct giving), Pledges (per-event or per-milestone giving like jog-a-thons and read-a-thons), Events (ticketed activities), Merchandise (product sales), and Roster-Enabled fundraisers (individual fundraising pages for team or club members).',
      },
      {
        question: 'How does a Pledge fundraiser work?',
        answer:
          'Pledge fundraisers let supporters commit a dollar amount per unit — laps run, books read, free throws made, miles biked. Once the event wraps and totals are entered, Sponsorly automatically calculates each pledge, charges the supporter, and attributes the funds to the right participant. Perfect for jog-a-thons, read-a-thons, and bike-a-thons.',
      },
      {
        question: 'How do I create a fundraiser?',
        answer:
          'Go to Fundraisers in your Dashboard and click "New Fundraiser." Choose a fundraiser type, fill in the details — name, description, goal amount, dates — add items, tiers, or pledge units, and publish when you\'re ready to share.',
      },
      {
        question: 'What is roster attribution?',
        answer:
          'Roster attribution gives each team member their own personalized fundraising link. When supporters pledge, donate, or purchase through that link, the contribution is tracked to that individual — perfect for teams and clubs where members fundraise competitively.',
      },
      {
        question: 'Can I customize my fundraiser landing page?',
        answer:
          'Yes! Each fundraiser has a public landing page you can customize with images, a pitch video, descriptions, and item or pledge details. You can also record a video pitch directly from the fundraiser editor.',
      },
      {
        question: 'How do I share my fundraiser?',
        answer:
          'Every fundraiser gets a unique shareable link (sponsorly.io/c/your-slug). Share it via email, social media, or text. For roster fundraisers, each member also gets their own personalized URL to share.',
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
          'Supporters pay securely through Stripe on your fundraiser\'s landing page. They can use credit cards, debit cards, Apple Pay, and Google Pay. No account creation is required for supporters.',
      },
      {
        question: 'How do Pledge fundraisers get charged?',
        answer:
          'For Pledge fundraisers, supporters either authorize a card up front (charged automatically once final results are entered) or receive an emailed invoice after the event. Either way, the platform handles the math and the collection — you just enter the totals.',
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
          'Sponsorly charges a 10% platform fee on donations. By default, this fee is added on top of the donation so your organization receives 100% of the intended amount. Organizations may also choose, on a per-fundraiser basis, to absorb the 10% fee themselves — in which case donors pay only the headline price and the fee is deducted from the payout.',
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
          'Rosters are lists of team members (players, students, participants) who can each have their own personalized fundraising page within a fundraiser. This lets supporters contribute on behalf of a specific individual.',
      },
      {
        question: 'How do personalized fundraising URLs work?',
        answer:
          'When roster attribution is enabled, each member gets a unique URL (e.g., sponsorly.io/c/your-fundraiser/player-name). Pledges, donations, and purchases made through that link are attributed to the member, making it easy to track individual fundraising progress.',
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
        question: 'How can a business sponsor a fundraiser?',
        answer:
          'Businesses can sponsor fundraisers by purchasing sponsorship tiers on a fundraiser\'s landing page. After purchase, they may be asked to upload their logo and other brand assets that the organization will use for recognition.',
      },
      {
        question: 'What is the Donor Portal?',
        answer:
          'The Donor Portal is a dedicated dashboard for supporters and businesses. It lets them view purchase history, upload required brand assets, manage business profiles, communicate with organizations, and download tax receipts — all in one place.',
      },
      {
        question: 'Can businesses upload logos and brand assets?',
        answer:
          'Yes! After sponsoring a fundraiser, businesses can upload logos, brand guidelines, and other assets through the Donor Portal. Organizations define what assets they need, and businesses receive reminders to upload them before deadlines.',
      },
      {
        question: 'How does business matching work?',
        answer:
          'When a supporter makes a purchase using a business email domain, Sponsorly can automatically link them to an existing business profile. This helps organizations track total partnership value across multiple contacts from the same company.',
      },
    ],
  },
];

const FAQ_PAGE_CSS = `
.sp-aud .sp-faq-hero { padding: 88px 0 48px; text-align: center; }
.sp-aud .sp-faq-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.4vw, 68px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px auto 18px; color: var(--sp-ink); max-width: 900px; }
.sp-aud .sp-faq-hero h1 em { font-style: italic; color: var(--sp-theme); }
.sp-aud .sp-faq-hero .sp-sub { font-size: 17px; line-height: 1.55; color: var(--sp-ink-2); max-width: 640px; margin: 0 auto; }

.sp-aud .sp-faq-nav { position: sticky; top: 64px; z-index: 30; background: rgba(250,250,247,0.92); backdrop-filter: blur(10px); border-top: 1px solid var(--sp-line); border-bottom: 1px solid var(--sp-line); }
.sp-aud .sp-faq-nav .sp-faq-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; padding: 14px 0; }
.sp-aud .sp-faq-nav a { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; background: white; border: 1px solid var(--sp-line); color: var(--sp-ink-2); font-size: 13px; font-weight: 600; text-decoration: none; transition: border-color .2s, color .2s, transform .2s, background .2s; }
.sp-aud .sp-faq-nav a:hover { border-color: var(--sp-theme); color: var(--sp-theme); background: var(--sp-theme-soft); transform: translateY(-1px); }

.sp-aud .sp-faq-body { padding: 72px 0 96px; }
.sp-aud .sp-faq-section { max-width: 820px; margin: 0 auto 56px; scroll-margin-top: 140px; }
.sp-aud .sp-faq-section:last-child { margin-bottom: 0; }
.sp-aud .sp-faq-sec-head { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px solid var(--sp-line); }
.sp-aud .sp-faq-sec-head .sp-ico { width: 40px; height: 40px; border-radius: 12px; background: var(--sp-theme-soft); color: var(--sp-theme); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-aud .sp-faq-sec-head h2 { font-family: var(--sp-display); font-size: clamp(26px, 3vw, 34px); font-weight: 400; letter-spacing: -0.01em; margin: 0; color: var(--sp-ink); }

.sp-aud .sp-faq-list { background: white; border: 1px solid var(--sp-line); border-radius: 16px; overflow: hidden; }
.sp-aud .sp-faq-list [data-faq-item] { border-bottom: 1px solid var(--sp-line); }
.sp-aud .sp-faq-list [data-faq-item]:last-child { border-bottom: none; }
.sp-aud .sp-faq-list [data-faq-trigger] { padding: 18px 22px; font-family: var(--sp-ui); font-weight: 600; font-size: 15.5px; color: var(--sp-ink); text-align: left; line-height: 1.4; }
.sp-aud .sp-faq-list [data-faq-trigger]:hover { color: var(--sp-theme); text-decoration: none; }
.sp-aud .sp-faq-list [data-faq-content] { padding: 0 22px 20px; color: var(--sp-ink-2); font-size: 14.5px; line-height: 1.65; }

.sp-aud .sp-final-cta { padding: 96px 0; background: linear-gradient(135deg, #0A0F1E 0%, #1a2547 100%); color: white; text-align: center; }
.sp-aud .sp-final-cta h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(34px, 4.4vw, 52px); line-height: 1.06; letter-spacing: -0.01em; margin: 18px 0 14px; color: white; }
.sp-aud .sp-final-cta h2 em { font-style: italic; color: #8ab4ff; }
.sp-aud .sp-final-cta .sp-sub { color: rgba(255,255,255,0.78); font-size: 16px; max-width: 620px; margin: 0 auto 28px; }
.sp-aud .sp-final-cta .sp-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

@media (max-width: 720px) {
  .sp-aud .sp-faq-nav { position: static; }
}
`;

const FAQ = () => {
  return (
    <div className="sp-aud theme-blue">
      <Helmet>
        <title>FAQ – Sponsorly | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find answers to common questions about Sponsorly — accounts, fundraisers, pledges, payments, rosters, and business sponsorships."
        />
      </Helmet>

      <style dangerouslySetInnerHTML={{ __html: AUDIENCE_SCOPED_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: FAQ_PAGE_CSS }} />

      <MarketingHeader />

      {/* HERO */}
      <section className="sp-faq-hero">
        <div className="sp-wrap">
          <span className="sp-chip green">
            <span className="sp-chip-dot" /> Real answers from a real team
          </span>
          <h1>
            Frequently asked <em>questions.</em>
          </h1>
          <p className="sp-sub">
            Everything you need to know about running fundraisers on Sponsorly — accounts, pledges, payments, rosters, and business sponsorships.
          </p>
        </div>
      </section>

      {/* CATEGORY NAV */}
      <nav className="sp-faq-nav">
        <div className="sp-wrap">
          <div className="sp-faq-pills">
            {faqCategories.map((cat) => (
              <a key={cat.id} href={`#${cat.id}`}>
                {cat.icon}
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* FAQ SECTIONS */}
      <div className="sp-faq-body">
        <div className="sp-wrap">
          {faqCategories.map((cat) => (
            <section key={cat.id} id={cat.id} className="sp-faq-section">
              <div className="sp-faq-sec-head">
                <span className="sp-ico">{cat.icon}</span>
                <h2>{cat.label}</h2>
              </div>

              <Accordion type="single" collapsible className="sp-faq-list">
                {cat.questions.map((q, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`${cat.id}-${idx}`}
                    data-faq-item=""
                    className="border-0"
                  >
                    <AccordionTrigger
                      data-faq-trigger=""
                      className="hover:no-underline"
                    >
                      {q.question}
                    </AccordionTrigger>
                    <AccordionContent data-faq-content="">
                      {q.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <section className="sp-final-cta">
        <div className="sp-wrap">
          <span className="sp-chip green">
            <span className="sp-chip-dot" /> We typically reply in 24 hours
          </span>
          <h2>
            Still have questions?<br />
            <em>We'd love to help.</em>
          </h2>
          <p className="sp-sub">Tell us about your organization and what you're trying to raise — our team will get back to you fast.</p>
          <div className="sp-ctas">
            <Link to="/contact" className="sp-btn sp-btn-primary sp-btn-lg">Contact us</Link>
            <Link to="/signup" className="sp-btn sp-btn-on-dark sp-btn-lg">Start free →</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default FAQ;
