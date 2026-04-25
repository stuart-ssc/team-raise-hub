import { useState, useEffect } from "react";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Check, ArrowRight } from "lucide-react";
import { NoIndex } from "@/components/seo/NoIndex";

interface InvitationInfo {
  token: string;
  playerName: string;
  organizationName: string;
  relationship: string;
}

const SCOPED_CSS = `
.sp-signup {
  --sp-blue: #1F5FE0;
  --sp-blue-deep: #0B3FB0;
  --sp-green: #0E9F6E;
  --sp-accent: #FF6B35;
  --sp-ink: #0A0F1E;
  --sp-ink-2: #2B3345;
  --sp-muted: #6B7489;
  --sp-line: #E6E9F0;
  --sp-paper: #FAFAF7;
  --sp-paper-2: #F2F3EE;
  --sp-display: "Instrument Serif", "Cormorant Garamond", Georgia, serif;
  --sp-ui: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  background: var(--sp-paper);
  color: var(--sp-ink);
  font-family: var(--sp-ui);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
  min-height: 100vh;
}
.sp-signup .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }
.sp-signup .sp-italic { font-style: italic; }

/* Layout */
.sp-signup-shell { display: grid; grid-template-columns: 1fr; min-height: 100vh; }
@media (min-width: 1024px) { .sp-signup-shell { grid-template-columns: 1fr 1fr; } }

/* LEFT */
.sp-signup-left { display: flex; flex-direction: column; background: var(--sp-paper); }
.sp-signup-topbar { display: flex; align-items: center; justify-content: space-between; padding: 22px 32px; }
@media (min-width: 1024px) { .sp-signup-topbar { padding: 28px 56px; } }
.sp-signup-topbar .right { display: flex; align-items: center; gap: 14px; font-size: 14px; color: var(--sp-muted); }
.sp-signup-signin { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 999px; background: var(--sp-ink); color: white; font-size: 14px; font-weight: 600; transition: background .2s ease; }
.sp-signup-signin:hover { background: #1a2238; }

.sp-signup-form-wrap { flex: 1; display: flex; justify-content: center; padding: 8px 24px 56px; }
@media (min-width: 1024px) { .sp-signup-form-wrap { padding: 24px 56px 80px; } }
.sp-signup-form { width: 100%; max-width: 540px; }

.sp-signup-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: var(--sp-blue); font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
.sp-signup-eyebrow::before { content: ""; width: 22px; height: 2px; background: var(--sp-blue); border-radius: 2px; }

.sp-signup-headline { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.4vw, 68px); line-height: 1.02; letter-spacing: -0.02em; color: var(--sp-ink); margin: 18px 0 18px; }
.sp-signup-headline .accent { display: inline-block; color: var(--sp-blue); font-style: italic; position: relative; }
.sp-signup-headline .accent::after { content: ""; position: absolute; left: -2px; right: -2px; bottom: 4px; height: 14px; background: rgba(255,107,53,0.28); border-radius: 4px; z-index: -1; }
.sp-signup-headline .accent-wrap { position: relative; display: inline-block; z-index: 0; }

.sp-signup-sub { color: var(--sp-ink-2); font-size: 15.5px; line-height: 1.55; max-width: 460px; }
.sp-signup-sub a { color: var(--sp-blue); font-weight: 600; }
.sp-signup-sub a:hover { text-decoration: underline; }

.sp-signup-section { margin-top: 26px; }

/* OAuth */
.sp-signup-oauth-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sp-signup-oauth-btn { display: inline-flex; align-items: center; justify-content: center; height: 48px; border-radius: 14px; background: white; border: 1px solid var(--sp-line); color: var(--sp-ink); transition: border-color .15s ease, transform .15s ease, box-shadow .2s ease; cursor: pointer; padding: 0; }
.sp-signup-oauth-btn:hover:not(:disabled) { border-color: #c9cfdb; box-shadow: 0 2px 8px -4px rgba(10,15,30,0.18); transform: translateY(-1px); }
.sp-signup-oauth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.sp-signup-oauth-btn svg.brand { width: 22px; height: 22px; flex: 0 0 22px; }

/* Divider */
.sp-signup-divider { display: flex; align-items: center; gap: 14px; margin: 22px 0 18px; color: var(--sp-muted); font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }
.sp-signup-divider::before, .sp-signup-divider::after { content: ""; flex: 1; height: 1px; background: var(--sp-line); }

/* Labels and inputs */
.sp-signup-label { display: block; font-size: 13px; font-weight: 600; color: var(--sp-ink-2); margin-bottom: 8px; }
.sp-signup-input { width: 100%; padding: 12px 14px; border-radius: 12px; background: white; border: 1px solid var(--sp-line); font-size: 14.5px; color: var(--sp-ink); font-family: inherit; transition: border-color .15s ease, box-shadow .15s ease; outline: none; }
.sp-signup-input::placeholder { color: #9aa1b1; }
.sp-signup-input:focus { border-color: var(--sp-blue); box-shadow: 0 0 0 3px rgba(31,95,224,0.12); }

.sp-signup-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* Fundraiser-type cards */
.sp-signup-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
@media (max-width: 520px) { .sp-signup-cards { grid-template-columns: 1fr; } }
.sp-signup-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 10px; border-radius: 14px; background: var(--sp-paper-2); border: 1px solid var(--sp-line); cursor: pointer; transition: all .15s ease; }
.sp-signup-card:hover { border-color: #c9cfdb; }
.sp-signup-card-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: white; color: var(--sp-ink-2); margin-bottom: 8px; }
.sp-signup-card-title { font-size: 13.5px; font-weight: 600; color: var(--sp-ink); }
.sp-signup-card-sub { font-size: 11.5px; color: var(--sp-muted); margin-top: 2px; }
.sp-signup-card.is-selected { background: white; border-color: var(--sp-blue); border-width: 2px; padding: 13px 9px; box-shadow: 0 6px 18px -8px rgba(31,95,224,0.35); }
.sp-signup-card.is-selected .sp-signup-card-icon { background: var(--sp-blue); color: white; }

/* Helper text */
.sp-signup-helper { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12.5px; color: var(--sp-muted); }
.sp-signup-helper .ck { width: 14px; height: 14px; border-radius: 999px; background: rgba(14,159,110,0.15); color: var(--sp-green); display: grid; place-items: center; flex: 0 0 14px; }

/* Password */
.sp-signup-password { position: relative; }
.sp-signup-password .toggle { position: absolute; top: 50%; right: 12px; transform: translateY(-50%); background: none; border: none; color: var(--sp-muted); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 4px 6px; }
.sp-signup-password .toggle:hover { color: var(--sp-ink); }
.sp-signup-strength { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px; }
.sp-signup-strength span { height: 4px; border-radius: 999px; background: var(--sp-line); transition: background .2s ease; }
.sp-signup-strength span.is-on-1 { background: #ef4444; }
.sp-signup-strength span.is-on-2 { background: #f59e0b; }
.sp-signup-strength span.is-on-3 { background: #f59e0b; }
.sp-signup-strength span.is-on-4 { background: var(--sp-green); }

/* Checkbox row */
.sp-signup-checkbox { display: inline-flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--sp-ink-2); cursor: pointer; user-select: none; }
.sp-signup-checkbox input { width: 16px; height: 16px; accent-color: var(--sp-blue); }

/* Primary button */
.sp-signup-btn-primary { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px 20px; border-radius: 14px; background: var(--sp-blue); color: white; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: background .2s ease, transform .15s ease, box-shadow .2s ease; box-shadow: 0 10px 24px -10px rgba(31,95,224,0.55); }
.sp-signup-btn-primary:hover:not(:disabled) { background: var(--sp-blue-deep); transform: translateY(-1px); }
.sp-signup-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.sp-signup-fineprint { margin-top: 14px; font-size: 12.5px; color: var(--sp-muted); text-align: center; line-height: 1.55; }
.sp-signup-fineprint a { color: var(--sp-ink-2); font-weight: 600; }
.sp-signup-fineprint a:hover { color: var(--sp-blue); text-decoration: underline; }

/* Invitation alert */
.sp-signup-invite { display: flex; gap: 12px; padding: 14px 16px; border-radius: 14px; background: rgba(31,95,224,0.06); border: 1px solid rgba(31,95,224,0.2); color: var(--sp-ink-2); font-size: 13.5px; line-height: 1.5; margin-bottom: 18px; }
.sp-signup-invite svg { color: var(--sp-blue); flex: 0 0 18px; margin-top: 2px; }

/* RIGHT panel */
.sp-signup-right { display: none; position: relative; background: #0A0F1E; color: white; overflow: hidden; padding: 40px 56px 36px; }
@media (min-width: 1024px) { .sp-signup-right { display: flex; flex-direction: column; } }
.sp-signup-right::before { content: ""; position: absolute; inset: 0; background:
  radial-gradient(800px 400px at 0% 100%, rgba(14,159,110,0.18), transparent 60%),
  radial-gradient(700px 360px at 100% 0%, rgba(31,95,224,0.20), transparent 60%);
  pointer-events: none; }
.sp-signup-right > * { position: relative; }

.sp-signup-right-top { display: flex; align-items: center; justify-content: space-between; }
.sp-signup-livechip { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px; background: rgba(14,159,110,0.14); border: 1px solid rgba(14,159,110,0.32); color: rgba(255,255,255,0.92); font-size: 12.5px; font-weight: 500; }
.sp-signup-livechip .dot { width: 7px; height: 7px; border-radius: 999px; background: var(--sp-green); box-shadow: 0 0 0 4px rgba(14,159,110,0.18); }
.sp-signup-domain { font-size: 12px; color: rgba(255,255,255,0.5); }

.sp-signup-quote-block { margin-top: 72px; max-width: 560px; }
.sp-signup-quote-mark { font-family: var(--sp-display); font-style: italic; color: var(--sp-green); font-size: 64px; line-height: 0.5; letter-spacing: -0.04em; }
.sp-signup-quote { font-family: var(--sp-display); font-weight: 400; font-size: clamp(28px, 2.6vw, 38px); line-height: 1.18; letter-spacing: -0.01em; margin-top: 22px; color: white; }
.sp-signup-quote em { font-style: italic; color: var(--sp-green); }
.sp-signup-attr { display: flex; align-items: center; gap: 12px; margin-top: 28px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.12); }
.sp-signup-attr-avatar { width: 40px; height: 40px; border-radius: 999px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); display: grid; place-items: center; font-size: 13px; font-weight: 700; color: white; }
.sp-signup-attr-name { font-size: 14px; font-weight: 600; color: white; }
.sp-signup-attr-role { font-size: 12.5px; color: rgba(255,255,255,0.6); }

/* Leaderboard */
.sp-signup-leaderboard-wrap { margin-top: 56px; position: relative; }
.sp-signup-leaderboard { position: relative; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); border-radius: 20px; padding: 20px 22px; backdrop-filter: blur(8px); }
.sp-signup-leaderboard-title { font-size: 13.5px; color: rgba(255,255,255,0.7); margin-bottom: 14px; font-weight: 500; }
.sp-signup-row { display: grid; grid-template-columns: 18px 36px 1fr auto; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06); }
.sp-signup-row:first-of-type { border-top: none; }
.sp-signup-row-rank { font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 500; }
.sp-signup-row-avatar { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: white; }
.sp-signup-row-name { font-size: 14px; color: white; font-weight: 500; }
.sp-signup-row-meta { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.sp-signup-row-amount { font-size: 14px; color: white; font-weight: 600; }

/* Floating notif cards */
.sp-signup-notif { position: absolute; z-index: 2; background: white; color: var(--sp-ink); padding: 12px 14px; border-radius: 14px; box-shadow: 0 18px 40px -16px rgba(0,0,0,0.45); display: flex; gap: 10px; align-items: flex-start; min-width: 220px; max-width: 260px; }
.sp-signup-notif .icon { width: 26px; height: 26px; border-radius: 999px; display: grid; place-items: center; flex: 0 0 26px; }
.sp-signup-notif .icon.green { background: var(--sp-green); color: white; }
.sp-signup-notif .icon.blue { background: var(--sp-blue); color: white; }
.sp-signup-notif .label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); }
.sp-signup-notif .body { font-size: 13px; color: var(--sp-ink); font-weight: 600; margin-top: 2px; }
.sp-signup-notif .meta { font-size: 11.5px; color: var(--sp-muted); margin-top: 2px; }
.sp-signup-notif.top-right { top: -28px; right: -20px; }
.sp-signup-notif.bottom-left { bottom: -22px; left: -22px; }

/* Gentle floating motion for notification cards */
@keyframes sp-float-a {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(0, -8px, 0) rotate(-0.4deg); }
}
@keyframes sp-float-b {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(0, 6px, 0) rotate(0.5deg); }
}
.sp-signup-notif.top-right { animation: sp-float-a 5.5s ease-in-out infinite; will-change: transform; }
.sp-signup-notif.bottom-left { animation: sp-float-b 6.5s ease-in-out infinite; animation-delay: -1.8s; will-change: transform; }
@media (prefers-reduced-motion: reduce) {
  .sp-signup-notif.top-right, .sp-signup-notif.bottom-left { animation: none; }
}

/* Stats footer */
.sp-signup-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.10); }
.sp-signup-stat-amount { font-family: var(--sp-display); font-size: 30px; line-height: 1; color: white; }
.sp-signup-stat-label { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 6px; }
`;

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 10) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s = Math.max(s, 4);
  return Math.min(s, 4);
}

const Signup = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(!!inviteToken);
  const [showPassword, setShowPassword] = useState(false);
  const [tipsOptIn, setTipsOptIn] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithFacebook, signInWithMicrosoft, user } = useAuth();
  const { toast } = useToast();

  // Fetch invitation details if token is present
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!inviteToken) return;

      try {
        const { data: invitation, error } = await supabase
          .from("parent_invitations")
          .select(`
            token,
            email,
            first_name,
            last_name,
            relationship,
            status,
            expires_at,
            inviter:organization_user!inviter_organization_user_id(
              user_id,
              organization:organizations(name)
            )
          `)
          .eq("token", inviteToken)
          .single();

        if (error || !invitation) {
          toast({
            title: "Invalid Invitation",
            description: "This invitation link is invalid or has expired.",
            variant: "destructive",
          });
          return;
        }

        if (invitation.status !== "pending") {
          toast({
            title: "Invitation Already Used",
            description: "This invitation has already been accepted.",
            variant: "destructive",
          });
          return;
        }

        if (new Date(invitation.expires_at) < new Date()) {
          toast({
            title: "Invitation Expired",
            description: "This invitation has expired. Please ask for a new one.",
            variant: "destructive",
          });
          return;
        }

        // Get the player's name
        const inviterData = invitation.inviter as any;
        const { data: playerProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", inviterData?.user_id)
          .single();

        setInvitationInfo({
          token: invitation.token,
          playerName: playerProfile
            ? `${playerProfile.first_name || ""} ${playerProfile.last_name || ""}`.trim()
            : "A student",
          organizationName: inviterData?.organization?.name || "the organization",
          relationship: invitation.relationship || "Guardian",
        });

        // Pre-fill form with invitation data
        if (invitation.first_name || invitation.last_name || invitation.email) {
          setFormData((prev) => ({
            ...prev,
            firstName: invitation.first_name || "",
            lastName: invitation.last_name || "",
            email: invitation.email || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching invitation:", error);
      } finally {
        setLoadingInvitation(false);
      }
    };

    fetchInvitation();
  }, [inviteToken, toast]);

  // Handle post-signup invitation acceptance
  useEffect(() => {
    const acceptInvitationIfNeeded = async () => {
      if (user && inviteToken) {
        try {
          const { error } = await supabase.functions.invoke("accept-parent-invitation", {
            body: { token: inviteToken },
          });

          if (error) {
            console.error("Error accepting invitation:", error);
            toast({
              title: "Note",
              description: "Account created, but there was an issue linking to the student. Please contact support.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Welcome!",
              description: "Your account has been created and linked successfully.",
            });
          }
        } catch (error) {
          console.error("Error accepting invitation:", error);
        }
        navigate("/dashboard");
      } else if (user) {
        navigate("/dashboard");
      }
    };

    acceptInvitationIfNeeded();
  }, [user, inviteToken, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      
      if (error) {
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account.",
        });
        navigate('/login');
      }
    } catch (error) {
      toast({
        title: "Signup Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Google Signup Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      toast({
        title: "Google Signup Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setLoading(true);
    
    try {
      const { error } = await signInWithFacebook();
      
      if (error) {
        toast({
          title: "Facebook Signup Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      toast({
        title: "Facebook Signup Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleMicrosoftSignup = async () => {
    setLoading(true);
    
    try {
      const { error } = await signInWithMicrosoft();
      
      if (error) {
        toast({
          title: "Microsoft Signup Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      toast({
        title: "Microsoft Signup Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const strength = passwordStrength(formData.password);

  const leaderboard = [
    { rank: 1, initials: "WL", color: "#FF6B35", name: "Westlake Wildcats · Soccer", meta: "314 donors · 11 days", amount: "$48k" },
    { rank: 2, initials: "EV", color: "#1F5FE0", name: "Evergreen MS Band", meta: "267 donors · 8 days", amount: "$38k" },
    { rank: 3, initials: "PC", color: "#0E9F6E", name: "Pinecrest Robotics", meta: "189 donors · 14 days", amount: "$32k" },
    { rank: 4, initials: "RP", color: "#8b5cf6", name: "Riverside PTO", meta: "142 donors · 6 days", amount: "$28k" },
  ];

  return (
    <div className="sp-signup">
      <NoIndex />
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="sp-signup-shell">
        {/* LEFT — form */}
        <div className="sp-signup-left">
          <div className="sp-signup-topbar">
            <Link to="/" aria-label="Sponsorly home">
              <SponsorlyLogo variant="full" theme="light" className="h-14 md:h-16 w-auto" />
            </Link>
            <div className="right">
              <span className="hidden sm:inline">Already a member?</span>
              <Link to="/login" className="sp-signup-signin">Sign in</Link>
            </div>
          </div>

          <div className="sp-signup-form-wrap">
            <div className="sp-signup-form">
              <span className="sp-signup-eyebrow">Get started</span>
              <h1 className="sp-signup-headline">
                Start raising in
                <br />
                <span className="accent-wrap"><span className="accent">minutes.</span></span>
              </h1>
              <p className="sp-signup-sub">
                Create your free account — no card required, no platform fees, no monthly minimum.
                Your first fundraiser can be live in under 5 minutes.
                <br />
                Already have an account?{" "}
                <Link to="/login">Sign in →</Link>
              </p>

              {invitationInfo && (
                <div className="sp-signup-invite" style={{ marginTop: 22 }}>
                  <UserPlus className="h-[18px] w-[18px]" />
                  <div>
                    <strong>{invitationInfo.playerName}</strong> invited you to join{" "}
                    <strong>{invitationInfo.organizationName}</strong> as their{" "}
                    {invitationInfo.relationship.toLowerCase()}.
                  </div>
                </div>
              )}

              {/* OAuth row */}
              <div className="sp-signup-section">
                <div className="sp-signup-oauth-row">
                  <button
                    type="button"
                    className="sp-signup-oauth-btn"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    aria-label="Continue with Google"
                    title="Continue with Google"
                  >
                    <svg className="brand" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="sp-signup-oauth-btn"
                    onClick={handleMicrosoftSignup}
                    disabled={loading}
                    aria-label="Continue with Microsoft"
                    title="Continue with Microsoft"
                  >
                    <svg className="brand" viewBox="0 0 21 21" aria-hidden="true">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
                      <rect x="1" y="11" width="9" height="9" fill="#7fba00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="sp-signup-oauth-btn"
                    onClick={handleFacebookSignup}
                    disabled={loading}
                    aria-label="Continue with Facebook"
                    title="Continue with Facebook"
                  >
                    <svg className="brand" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="sp-signup-divider">Or with email</div>

              <form onSubmit={handleSignup}>
                {/* Names */}
                <div>
                  <div className="sp-signup-grid-2">
                    <div>
                      <label className="sp-signup-label" htmlFor="firstName">First name</label>
                      <input
                        id="firstName"
                        name="firstName"
                        className="sp-signup-input"
                        placeholder="Jamie"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="sp-signup-label" htmlFor="lastName">Last name</label>
                      <input
                        id="lastName"
                        name="lastName"
                        className="sp-signup-input"
                        placeholder="Rivera"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="sp-signup-section">
                  <label className="sp-signup-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="sp-signup-input"
                    placeholder="coach@lincolnhs.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className="sp-signup-section">
                  <label className="sp-signup-label" htmlFor="password">Password</label>
                  <div className="sp-signup-password">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="sp-signup-input"
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{ paddingRight: 64 }}
                    />
                    <button
                      type="button"
                      className="toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="sp-signup-strength" aria-hidden="true">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={strength >= i ? `is-on-${strength}` : ""} />
                    ))}
                  </div>
                  {/* Hidden confirm-password mirror so existing validation passes */}
                  <input
                    type="hidden"
                    name="confirmPassword"
                    value={formData.password}
                    onChange={() => {}}
                    readOnly
                  />
                </div>

                {/* Tips opt-in */}
                <div className="sp-signup-section" style={{ marginTop: 18 }}>
                  <label className="sp-signup-checkbox">
                    <input
                      type="checkbox"
                      checked={tipsOptIn}
                      onChange={(e) => setTipsOptIn(e.target.checked)}
                    />
                    Send me fundraising tips (optional)
                  </label>
                </div>

                {/* Submit */}
                <div className="sp-signup-section" style={{ marginTop: 18 }}>
                  <button type="submit" className="sp-signup-btn-primary" disabled={loading}>
                    {loading ? "Creating account…" : "Create free account"}
                    {!loading && <ArrowRight className="h-[16px] w-[16px]" />}
                  </button>
                </div>

                <p className="sp-signup-fineprint">
                  By creating an account you agree to our{" "}
                  <Link to="/terms">Terms of Service</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>. Sponsorly never shares donor data.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT — social proof panel */}
        <aside className="sp-signup-right">
          <div className="sp-signup-right-top">
            <span className="sp-signup-livechip">
              <span className="dot" />
              847 fundraisers raising right now
            </span>
            <span className="sp-signup-domain">sponsorly.io</span>
          </div>

          <div className="sp-signup-quote-block">
            <div className="sp-signup-quote-mark">,,</div>
            <p className="sp-signup-quote">
              Our PTO brought in <em>3× more donors</em> than last year, with half the effort.
            </p>
            <div className="sp-signup-attr">
              <div className="sp-signup-attr-avatar">AP</div>
              <div>
                <div className="sp-signup-attr-name">Mrs. Patel</div>
                <div className="sp-signup-attr-role">Riverside PTO · President</div>
              </div>
            </div>
          </div>

          <div className="sp-signup-leaderboard-wrap">
            <div className="sp-signup-leaderboard">
              <div className="sp-signup-notif top-right">
                <div className="icon green"><Check className="h-[14px] w-[14px]" strokeWidth={3} /></div>
                <div>
                  <div className="label">New donation</div>
                  <div className="body">$250 from the Chen family</div>
                  <div className="meta">Go Lincoln! 🏆 · 2s ago</div>
                </div>
              </div>
              <div className="sp-signup-notif bottom-left">
                <div className="icon blue"><Check className="h-[14px] w-[14px]" strokeWidth={3} /></div>
                <div>
                  <div className="label">Payout</div>
                  <div className="body">$4,120 → Lincoln HS</div>
                  <div className="meta">Arrived 11:42 AM today</div>
                </div>
              </div>

              <div className="sp-signup-leaderboard-title">Top fundraisers · live</div>
              {leaderboard.map((r) => (
                <div className="sp-signup-row" key={r.rank}>
                  <div className="sp-signup-row-rank">{r.rank}</div>
                  <div className="sp-signup-row-avatar" style={{ background: r.color }}>{r.initials}</div>
                  <div>
                    <div className="sp-signup-row-name">{r.name}</div>
                    <div className="sp-signup-row-meta">{r.meta}</div>
                  </div>
                  <div className="sp-signup-row-amount">{r.amount}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sp-signup-stats">
            <div>
              <div className="sp-signup-stat-amount">$12.4M</div>
              <div className="sp-signup-stat-label">Raised this year</div>
            </div>
            <div>
              <div className="sp-signup-stat-amount">500+</div>
              <div className="sp-signup-stat-label">Schools & programs</div>
            </div>
            <div>
              <div className="sp-signup-stat-amount">$0</div>
              <div className="sp-signup-stat-label">Platform fees</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Signup;