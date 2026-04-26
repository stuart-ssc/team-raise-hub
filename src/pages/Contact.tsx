import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { Mail, LogIn, HelpCircle, Send } from "lucide-react";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { SeoHead } from "@/components/seo/SeoHead";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AUDIENCE_SCOPED_CSS } from "@/components/audience/audienceStyles";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().max(200, "Subject must be less than 200 characters").optional(),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const CONTACT_PAGE_CSS = `
.sp-aud .sp-contact-hero { padding: 88px 0 56px; text-align: center; }
.sp-aud .sp-contact-hero h1 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.4vw, 68px); line-height: 1.02; letter-spacing: -0.02em; margin: 18px auto 18px; color: var(--sp-ink); max-width: 880px; }
.sp-aud .sp-contact-hero h1 em { font-style: italic; color: var(--sp-theme); }
.sp-aud .sp-contact-hero .sp-sub { font-size: 17px; line-height: 1.55; color: var(--sp-ink-2); max-width: 620px; margin: 0 auto 22px; }
.sp-aud .sp-contact-hero .sp-micro { display: inline-flex; gap: 22px; flex-wrap: wrap; justify-content: center; color: var(--sp-muted); font-size: 13px; }

.sp-aud .sp-contact-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 48px; align-items: start; }
@media (max-width: 900px) { .sp-aud .sp-contact-grid { grid-template-columns: 1fr; gap: 32px; } }

.sp-aud .sp-info-stack { display: flex; flex-direction: column; gap: 16px; }
.sp-aud .sp-info-card { background: var(--sp-card); border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px; display: flex; gap: 16px; align-items: flex-start; text-decoration: none; color: inherit; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.sp-aud a.sp-info-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px -16px rgba(10,15,30,0.18); border-color: var(--sp-theme-soft); }
.sp-aud .sp-info-card .sp-ico { width: 44px; height: 44px; border-radius: 12px; background: var(--sp-theme-soft); color: var(--sp-theme); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-aud .sp-info-card .sp-info-body { flex: 1; min-width: 0; }
.sp-aud .sp-info-card h4 { font-family: var(--sp-display); font-size: 19px; font-weight: 400; margin: 0 0 4px; color: var(--sp-ink); line-height: 1.2; }
.sp-aud .sp-info-card p { font-size: 13.5px; color: var(--sp-muted); margin: 0; line-height: 1.5; }
.sp-aud .sp-info-card .sp-info-link { color: var(--sp-theme); font-weight: 600; font-size: 13.5px; }

.sp-aud .sp-expect { background: var(--sp-paper-2); border: 1px solid var(--sp-line); border-radius: 16px; padding: 22px 24px; }
.sp-aud .sp-expect h5 { font-family: var(--sp-display); font-size: 18px; font-weight: 400; margin: 0 0 14px; }
.sp-aud .sp-expect ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.sp-aud .sp-expect li { display: flex; gap: 10px; font-size: 14px; color: var(--sp-ink-2); align-items: flex-start; }
.sp-aud .sp-expect .sp-tick { flex-shrink: 0; width: 20px; height: 20px; border-radius: 999px; background: var(--sp-theme-soft); color: var(--sp-theme); display: flex; align-items: center; justify-content: center; margin-top: 1px; }

.sp-aud .sp-form-card { background: white; border: 1px solid var(--sp-line); border-radius: 20px; padding: 32px; box-shadow: 0 24px 60px -28px rgba(10,15,30,0.18); }
.sp-aud .sp-form-card h3 { font-family: var(--sp-display); font-size: 26px; font-weight: 400; margin: 0 0 6px; }
.sp-aud .sp-form-card .sp-form-sub { font-size: 14px; color: var(--sp-muted); margin: 0 0 24px; }
.sp-aud .sp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.sp-aud .sp-field label { font-size: 13px; font-weight: 600; color: var(--sp-ink); }
.sp-aud .sp-field input,
.sp-aud .sp-field textarea {
  width: 100%;
  font-family: var(--sp-ui);
  font-size: 14.5px;
  padding: 12px 14px;
  border: 1px solid var(--sp-line);
  border-radius: 12px;
  background: white;
  color: var(--sp-ink);
  transition: border-color .15s ease, box-shadow .15s ease;
  outline: none;
}
.sp-aud .sp-field textarea { resize: vertical; min-height: 140px; line-height: 1.5; }
.sp-aud .sp-field input::placeholder,
.sp-aud .sp-field textarea::placeholder { color: #a8aebc; }
.sp-aud .sp-field input:focus,
.sp-aud .sp-field textarea:focus { border-color: var(--sp-theme); box-shadow: 0 0 0 3px var(--sp-theme-soft); }
.sp-aud .sp-field .sp-err { font-size: 12px; color: #d6336c; margin-top: 2px; }

.sp-aud .sp-form-card .sp-submit { width: 100%; justify-content: center; }
.sp-aud .sp-form-card .sp-submit:disabled { opacity: .65; cursor: not-allowed; transform: none; }

.sp-aud .sp-faq-teaser { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media (max-width: 900px) { .sp-aud .sp-faq-teaser { grid-template-columns: 1fr; } }
.sp-aud .sp-faq-card { background: white; border: 1px solid var(--sp-line); border-radius: 16px; padding: 24px; text-decoration: none; color: inherit; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; display: flex; flex-direction: column; gap: 8px; }
.sp-aud .sp-faq-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px -16px rgba(10,15,30,0.18); border-color: var(--sp-theme-soft); }
.sp-aud .sp-faq-card h4 { font-family: var(--sp-display); font-size: 20px; font-weight: 400; margin: 0; }
.sp-aud .sp-faq-card p { font-size: 13.5px; color: var(--sp-muted); margin: 0; line-height: 1.5; flex: 1; }
.sp-aud .sp-faq-card .sp-faq-arr { color: var(--sp-theme); font-weight: 600; font-size: 13.5px; margin-top: 6px; }

.sp-aud .sp-final-cta { padding: 96px 0; background: linear-gradient(135deg, #0A0F1E 0%, #1a2547 100%); color: white; text-align: center; }
.sp-aud .sp-final-cta h2 { font-family: var(--sp-display); font-weight: 400; font-size: clamp(34px, 4.4vw, 52px); line-height: 1.06; letter-spacing: -0.01em; margin: 18px 0 14px; color: white; }
.sp-aud .sp-final-cta h2 em { font-style: italic; color: #8ab4ff; }
.sp-aud .sp-final-cta .sp-sub { color: rgba(255,255,255,0.78); font-size: 16px; max-width: 620px; margin: 0 auto 28px; }
.sp-aud .sp-final-cta .sp-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
`;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const { data: submission, error: insertError } = await supabase
        .from("contact_submissions")
        .insert({
          name: data.name,
          email: data.email,
          subject: data.subject || null,
          message: data.message,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: emailError } = await supabase.functions.invoke(
        "send-contact-notification",
        {
          body: {
            submissionId: submission.id,
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
          },
        }
      );

      if (emailError) {
        console.error("Email notification error:", emailError);
      }

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24-48 hours.",
      });

      reset();
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Tick = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );

  return (
    <div className="sp-aud theme-blue">
      <SeoHead
        title="Contact Sponsorly — Talk to Our Fundraising Team"
        description="Get in touch with the Sponsorly team. We typically respond within 24-48 hours and are happy to help schools, non-profits, and supporters."
        path="/contact"
      />
      <style dangerouslySetInnerHTML={{ __html: AUDIENCE_SCOPED_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: CONTACT_PAGE_CSS }} />
      <MarketingHeader />

      {/* HERO */}
      <section className="sp-contact-hero">
        <div className="sp-wrap">
          <span className="sp-chip green">
            <span className="sp-chip-dot" /> We typically reply in 24 hours
          </span>
          <h1>
            Talk to the team behind <em>Sponsorly.</em>
          </h1>
          <p className="sp-sub">
            Whether you run a booster club, a PTO, a marching band, or a national nonprofit — we're here to help you launch, raise more, and look great doing it.
          </p>
          <div className="sp-micro">
            <span>✓ Free to start</span>
            <span>✓ No card required</span>
            <span>✓ Live human reply</span>
          </div>
        </div>
      </section>

      {/* MAIN — info + form */}
      <section className="alt">
        <div className="sp-wrap-wide">
          <div className="sp-contact-grid">
            {/* LEFT: Info */}
            <div>
              <span className="sp-eyebrow blue">Get in touch</span>
              <h2 style={{ fontFamily: "var(--sp-display)", fontWeight: 400, fontSize: "clamp(30px, 3.4vw, 40px)", lineHeight: 1.08, letterSpacing: "-0.01em", margin: "12px 0 22px" }}>
                A few <em style={{ fontStyle: "italic", color: "var(--sp-theme)" }}>quick ways</em> to reach us.
              </h2>

              <div className="sp-info-stack">
                <a href="mailto:support@sponsorly.io" className="sp-info-card">
                  <div className="sp-ico"><Mail size={20} /></div>
                  <div className="sp-info-body">
                    <h4>Email us</h4>
                    <p style={{ marginBottom: 4 }}>Best for support, billing, and product questions.</p>
                    <span className="sp-info-link">support@sponsorly.io →</span>
                  </div>
                </a>

                <Link to="/login" className="sp-info-card">
                  <div className="sp-ico"><LogIn size={20} /></div>
                  <div className="sp-info-body">
                    <h4>Already a customer?</h4>
                    <p style={{ marginBottom: 4 }}>Sign in for faster support through your dashboard.</p>
                    <span className="sp-info-link">Sign in →</span>
                  </div>
                </Link>

                <Link to="/faq" className="sp-info-card">
                  <div className="sp-ico"><HelpCircle size={20} /></div>
                  <div className="sp-info-body">
                    <h4>Looking for answers fast?</h4>
                    <p style={{ marginBottom: 4 }}>Browse the FAQ for setup, payments, and campaign help.</p>
                    <span className="sp-info-link">Visit the FAQ →</span>
                  </div>
                </Link>
              </div>

              <div className="sp-expect" style={{ marginTop: 20 }}>
                <h5>What to expect</h5>
                <ul>
                  <li><span className="sp-tick"><Tick /></span><span><b style={{ color: "var(--sp-ink)" }}>Quick response</b> from a real human on our team.</span></li>
                  <li><span className="sp-tick"><Tick /></span><span><b style={{ color: "var(--sp-ink)" }}>Personalized guidance</b> tailored to your organization.</span></li>
                  <li><span className="sp-tick"><Tick /></span><span><b style={{ color: "var(--sp-ink)" }}>Setup &amp; strategy</b> help to launch your first campaign.</span></li>
                  <li><span className="sp-tick"><Tick /></span><span><b style={{ color: "var(--sp-ink)" }}>Technical support</b> whenever you need a hand.</span></li>
                </ul>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="sp-form-card">
              <h3>Send us a message</h3>
              <p className="sp-form-sub">We typically reply within 24–48 hours.</p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="sp-field">
                  <label htmlFor="name">Name *</label>
                  <input id="name" {...register("name")} placeholder="Your full name" />
                  {errors.name && <span className="sp-err">{errors.name.message}</span>}
                </div>

                <div className="sp-field">
                  <label htmlFor="email">Email *</label>
                  <input id="email" type="email" {...register("email")} placeholder="you@example.com" />
                  {errors.email && <span className="sp-err">{errors.email.message}</span>}
                </div>

                <div className="sp-field">
                  <label htmlFor="subject">Subject</label>
                  <input id="subject" {...register("subject")} placeholder="What's this about?" />
                  {errors.subject && <span className="sp-err">{errors.subject.message}</span>}
                </div>

                <div className="sp-field">
                  <label htmlFor="message">Message *</label>
                  <textarea id="message" rows={6} {...register("message")} placeholder="Tell us how we can help..." />
                  {errors.message && <span className="sp-err">{errors.message.message}</span>}
                </div>

                <button
                  type="submit"
                  className="sp-btn sp-btn-primary sp-btn-lg sp-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : (<><Send size={16} /> Send message</>)}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ TEASER */}
      <section className="cream">
        <div className="sp-wrap">
          <div className="sp-sec-head">
            <span className="sp-eyebrow blue">Common questions</span>
            <h2>
              Maybe we've already <em>answered it.</em>
            </h2>
            <p>Quick links into the FAQ — most people find what they need in under a minute.</p>
          </div>
          <div className="sp-faq-teaser">
            <Link to="/faq" className="sp-faq-card">
              <h4>Account &amp; setup</h4>
              <p>Creating your organization, inviting teammates, and setting roles.</p>
              <span className="sp-faq-arr">Read more →</span>
            </Link>
            <Link to="/faq" className="sp-faq-card">
              <h4>Campaigns</h4>
              <p>Launching pledge, sponsorship, merchandise, and event campaigns.</p>
              <span className="sp-faq-arr">Read more →</span>
            </Link>
            <Link to="/faq" className="sp-faq-card">
              <h4>Payments &amp; payouts</h4>
              <p>Stripe Connect setup, fees, refunds, and how donors get receipts.</p>
              <span className="sp-faq-arr">Read more →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sp-final-cta">
        <div className="sp-wrap">
          <span className="sp-chip green">
            <span className="sp-chip-dot" /> Free forever. No card required.
          </span>
          <h2>
            Ready to start raising more?<br />
            <em>We'll help you launch in a day.</em>
          </h2>
          <p className="sp-sub">Join schools, boosters, PTOs, bands, and nonprofits already running better fundraisers on Sponsorly.</p>
          <div className="sp-ctas">
            <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">Start free</Link>
            <Link to="/platform" className="sp-btn sp-btn-on-dark sp-btn-lg">Browse the platform →</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
