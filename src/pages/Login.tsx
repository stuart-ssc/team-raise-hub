import { useState, useEffect } from "react";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

const SCOPED_CSS = `
.sp-login {
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
.sp-login .sp-display { font-family: var(--sp-display); font-weight: 400; letter-spacing: -0.01em; }

/* ===== Layout ===== */
.sp-login-shell { display: grid; grid-template-columns: 1fr; min-height: 100vh; }
@media (min-width: 1024px) { .sp-login-shell { grid-template-columns: 1fr 1fr; } }

/* ===== Top bar ===== */
.sp-login-topbar { display: flex; align-items: center; justify-content: space-between; padding: 22px 32px; border-bottom: 1px solid transparent; }
@media (min-width: 1024px) { .sp-login-topbar { padding: 28px 56px; } }
.sp-login-topbar .right { display: flex; align-items: center; gap: 14px; font-size: 14px; color: var(--sp-muted); }
.sp-login-topbar a.cta { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 999px; background: var(--sp-ink); color: white; font-size: 14px; font-weight: 600; transition: background .2s ease; }
.sp-login-topbar a.cta:hover { background: #1a2238; }

/* ===== LEFT column ===== */
.sp-login-left { display: flex; flex-direction: column; background: var(--sp-paper); }
.sp-login-form-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 24px 64px; }
@media (min-width: 1024px) { .sp-login-form-wrap { padding: 24px 56px 80px; } }
.sp-login-form { width: 100%; max-width: 520px; }

.sp-login-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: var(--sp-blue); font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
.sp-login-eyebrow::before { content: ""; width: 22px; height: 2px; background: var(--sp-blue); border-radius: 2px; }

.sp-login-headline { font-family: var(--sp-display); font-weight: 400; font-size: clamp(44px, 5.4vw, 68px); line-height: 1.02; letter-spacing: -0.02em; color: var(--sp-ink); margin: 18px 0 18px; }
.sp-login-headline .accent-wrap { position: relative; display: inline-block; z-index: 0; }
.sp-login-headline .accent { display: inline-block; color: var(--sp-blue); font-style: italic; position: relative; }
.sp-login-headline .accent::after { content: ""; position: absolute; left: -2px; right: -2px; bottom: 4px; height: 14px; background: rgba(255,107,53,0.28); border-radius: 4px; z-index: -1; }

.sp-login-sub { color: var(--sp-ink-2); font-size: 15.5px; line-height: 1.55; max-width: 460px; }
.sp-login-sub a { color: var(--sp-blue); font-weight: 600; }
.sp-login-sub a:hover { text-decoration: underline; }
.sp-login-sub-link { display: inline-flex; align-items: center; gap: 4px; }

.sp-login-section { margin-top: 26px; }

/* OAuth */
.sp-login-oauth-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sp-login-oauth-icon { display: inline-flex; align-items: center; justify-content: center; height: 48px; border-radius: 14px; background: white; border: 1px solid var(--sp-line); color: var(--sp-ink); transition: border-color .15s ease, transform .15s ease, box-shadow .2s ease; cursor: pointer; padding: 0; }
.sp-login-oauth-icon:hover:not(:disabled) { border-color: #c9cfdb; box-shadow: 0 2px 8px -4px rgba(10,15,30,0.18); transform: translateY(-1px); }
.sp-login-oauth-icon:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.sp-login-oauth-icon svg.brand { width: 22px; height: 22px; flex: 0 0 22px; }

/* Divider */
.sp-login-divider { display: flex; align-items: center; gap: 14px; margin: 22px 0 18px; color: var(--sp-muted); font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }
.sp-login-divider::before, .sp-login-divider::after { content: ""; flex: 1; height: 1px; background: var(--sp-line); }

/* Inputs */
.sp-login-label { display: block; font-size: 13px; font-weight: 600; color: var(--sp-ink-2); margin-bottom: 8px; }
.sp-login-input { width: 100%; padding: 12px 14px; border-radius: 12px; background: white; border: 1px solid var(--sp-line); font-size: 14.5px; color: var(--sp-ink); font-family: inherit; transition: border-color .15s ease, box-shadow .15s ease; outline: none; }
.sp-login-input::placeholder { color: #9aa1b1; }
.sp-login-input:focus { border-color: var(--sp-blue); box-shadow: 0 0 0 3px rgba(31,95,224,0.12); }

.sp-login-password { position: relative; }
.sp-login-password .toggle { position: absolute; top: 50%; right: 12px; transform: translateY(-50%); background: none; border: none; color: var(--sp-muted); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 4px 6px; }
.sp-login-password .toggle:hover { color: var(--sp-ink); }

/* Row: remember + forgot */
.sp-login-row { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; }
.sp-login-checkbox { display: inline-flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--sp-ink-2); cursor: pointer; user-select: none; }
.sp-login-checkbox input { width: 16px; height: 16px; accent-color: var(--sp-blue); }
.sp-login-link { background: none; border: none; padding: 0; color: var(--sp-blue); font-size: 13.5px; font-weight: 600; cursor: pointer; }
.sp-login-link:hover { text-decoration: underline; }

/* Primary button */
.sp-login-btn-primary { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px 20px; border-radius: 14px; background: var(--sp-blue); color: white; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: background .2s ease, transform .15s ease, box-shadow .2s ease; box-shadow: 0 10px 24px -10px rgba(31,95,224,0.55); margin-top: 22px; }
.sp-login-btn-primary:hover:not(:disabled) { background: var(--sp-blue-deep); transform: translateY(-1px); }
.sp-login-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.sp-login-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--sp-muted); font-size: 13.5px; font-weight: 500; cursor: pointer; margin-top: 18px; padding: 4px 0; }
.sp-login-back:hover { color: var(--sp-ink); }

/* ===== RIGHT panel ===== */
.sp-login-right { display: none; position: relative; background: #0A0F1E; color: white; overflow: hidden; padding: 40px 56px 36px; }
@media (min-width: 1024px) { .sp-login-right { display: flex; flex-direction: column; } }
.sp-login-right::before { content: ""; position: absolute; inset: 0; background:
  radial-gradient(800px 400px at 0% 100%, rgba(14,159,110,0.18), transparent 60%),
  radial-gradient(700px 360px at 100% 0%, rgba(31,95,224,0.20), transparent 60%);
  pointer-events: none; }
.sp-login-right > * { position: relative; }

.sp-login-right-top { display: flex; align-items: center; justify-content: space-between; }
.sp-login-livechip { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px; background: rgba(14,159,110,0.14); border: 1px solid rgba(14,159,110,0.32); color: rgba(255,255,255,0.92); font-size: 12.5px; font-weight: 500; }
.sp-login-livechip .dot { width: 7px; height: 7px; border-radius: 999px; background: var(--sp-green); box-shadow: 0 0 0 4px rgba(14,159,110,0.18); }
.sp-login-domain { font-size: 12px; color: rgba(255,255,255,0.5); }

.sp-login-quote-block { margin-top: 56px; max-width: 620px; }
.sp-login-quote-mark { font-family: var(--sp-display); font-style: italic; color: var(--sp-green); font-size: 64px; line-height: 0.5; letter-spacing: -0.04em; }
.sp-login-quote { font-family: var(--sp-display); font-weight: 400; font-size: clamp(28px, 2.6vw, 38px); line-height: 1.18; letter-spacing: -0.01em; margin-top: 22px; color: white; }
.sp-login-quote em { font-style: italic; color: var(--sp-green); }
.sp-login-attr { display: flex; align-items: center; gap: 12px; margin-top: 24px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.12); }
.sp-login-attr-avatar { width: 40px; height: 40px; border-radius: 999px; background: linear-gradient(135deg, #1F5FE0, #0B3FB0); display: grid; place-items: center; font-size: 13px; font-weight: 700; color: white; }
.sp-login-attr-name { font-size: 14px; font-weight: 600; color: white; }
.sp-login-attr-role { font-size: 12.5px; color: rgba(255,255,255,0.6); }

/* Mock campaign card */
.sp-login-campaign-wrap { margin-top: 40px; position: relative; }
.sp-login-campaign { position: relative; background: white; color: var(--sp-ink); border-radius: 16px; overflow: hidden; box-shadow: 0 24px 60px -20px rgba(0,0,0,0.45); }
.sp-login-campaign-chrome { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #F4F5F7; border-bottom: 1px solid #E6E9F0; }
.sp-login-campaign-chrome .dots { display: flex; gap: 5px; }
.sp-login-campaign-chrome .dots span { width: 9px; height: 9px; border-radius: 999px; background: #D5D8E0; }
.sp-login-campaign-chrome .url { flex: 1; text-align: center; font-size: 11.5px; color: var(--sp-muted); font-family: ui-monospace, SFMono-Regular, monospace; }
.sp-login-campaign-hero { position: relative; height: 150px; background:
  radial-gradient(120% 120% at 30% 20%, rgba(31,95,224,0.85), transparent 60%),
  radial-gradient(100% 100% at 80% 80%, rgba(14,159,110,0.5), transparent 60%),
  linear-gradient(135deg, #1a2238, #0A0F1E);
}
.sp-login-campaign-chip { position: absolute; top: 14px; left: 14px; padding: 5px 11px; border-radius: 999px; background: var(--sp-accent); color: white; font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.sp-login-campaign-body { padding: 18px 20px 20px; }
.sp-login-campaign-title { font-family: var(--sp-display); font-weight: 400; font-size: 22px; line-height: 1.2; letter-spacing: -0.01em; }
.sp-login-campaign-sub { font-size: 13px; color: var(--sp-muted); margin-top: 6px; line-height: 1.45; }
.sp-login-campaign-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
.sp-login-campaign-stat-num { font-family: var(--sp-display); font-size: 22px; line-height: 1; color: var(--sp-ink); }
.sp-login-campaign-stat-label { font-size: 11px; color: var(--sp-muted); margin-top: 4px; }
.sp-login-campaign-progress-track { height: 6px; border-radius: 999px; background: var(--sp-line); margin-top: 14px; overflow: hidden; }
.sp-login-campaign-progress-fill { height: 100%; width: 74%; background: linear-gradient(90deg, var(--sp-green), #14b886); border-radius: 999px; }
.sp-login-campaign-progress-label { font-size: 11.5px; color: var(--sp-muted); margin-top: 6px; }
.sp-login-campaign-amounts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
.sp-login-campaign-amounts .amt { padding: 10px 8px; border-radius: 10px; background: var(--sp-paper-2); border: 1px solid var(--sp-line); font-size: 13px; font-weight: 600; color: var(--sp-ink); text-align: center; }
.sp-login-campaign-amounts .donate { background: var(--sp-blue); color: white; border-color: var(--sp-blue); }

/* Floating notif cards (shared with signup pattern) */
.sp-login-notif { position: absolute; z-index: 2; background: white; color: var(--sp-ink); padding: 12px 14px; border-radius: 14px; box-shadow: 0 18px 40px -16px rgba(0,0,0,0.45); display: flex; gap: 10px; align-items: flex-start; min-width: 220px; max-width: 260px; }
.sp-login-notif .icon { width: 26px; height: 26px; border-radius: 999px; display: grid; place-items: center; flex: 0 0 26px; }
.sp-login-notif .icon.green { background: var(--sp-green); color: white; }
.sp-login-notif .icon.blue { background: var(--sp-blue); color: white; }
.sp-login-notif .label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sp-muted); }
.sp-login-notif .body { font-size: 13px; color: var(--sp-ink); font-weight: 600; margin-top: 2px; }
.sp-login-notif .meta { font-size: 11.5px; color: var(--sp-muted); margin-top: 2px; }
.sp-login-notif.top-right { top: -28px; right: -20px; }
.sp-login-notif.bottom-left { bottom: -22px; left: -22px; }

@keyframes sp-login-float-a {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(0, -8px, 0) rotate(-0.4deg); }
}
@keyframes sp-login-float-b {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(0, 6px, 0) rotate(0.5deg); }
}
.sp-login-notif.top-right { animation: sp-login-float-a 5.5s ease-in-out infinite; will-change: transform; }
.sp-login-notif.bottom-left { animation: sp-login-float-b 6.5s ease-in-out infinite; animation-delay: -1.8s; will-change: transform; }
@media (prefers-reduced-motion: reduce) {
  .sp-login-notif.top-right, .sp-login-notif.bottom-left { animation: none; }
}

/* Stats footer */
.sp-login-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.10); }
.sp-login-stat-amount { font-family: var(--sp-display); font-size: 30px; line-height: 1; color: white; }
.sp-login-stat-label { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 6px; }
`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || "/dashboard";
  const { signIn, signInWithGoogle, signInWithFacebook, signInWithMicrosoft, resetPassword, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate(redirectTo);
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "You have been logged in successfully!" });
        navigate(redirectTo);
      }
    } catch {
      toast({ title: "Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast({ title: "Reset Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Reset Email Sent", description: "Please check your email for password reset instructions." });
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch {
      toast({ title: "Reset Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({ title: "Google Login Error", description: error.message, variant: "destructive" });
        setLoading(false);
      }
    } catch {
      toast({ title: "Google Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithMicrosoft();
      if (error) {
        toast({ title: "Microsoft Login Error", description: error.message, variant: "destructive" });
        setLoading(false);
      }
    } catch {
      toast({ title: "Microsoft Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithFacebook();
      if (error) {
        toast({ title: "Facebook Login Error", description: error.message, variant: "destructive" });
        setLoading(false);
      }
    } catch {
      toast({ title: "Facebook Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="sp-login">
      <style>{SCOPED_CSS}</style>

      <div className="sp-login-shell">
        {/* LEFT */}
        <section className="sp-login-left">
          <header className="sp-login-topbar">
            <Link to="/" aria-label="Sponsorly home">
              <SponsorlyLogo variant="full" theme="light" className="h-14 md:h-16 w-auto" />
            </Link>
            <div className="right">
              <span className="hidden sm:inline">New to Sponsorly?</span>
              <Link to="/signup" className="cta">Create account</Link>
            </div>
          </header>

          <div className="sp-login-form-wrap">
            <div className="sp-login-form">
            {showForgotPassword ? (
              <>
                <span className="sp-login-eyebrow">Reset access</span>
                <h1 className="sp-login-headline">
                  Reset{" "}
                  <span className="accent-wrap"><span className="accent">password</span></span>
                </h1>
                <p className="sp-login-sub">
                  Enter your email and we'll send you a link to choose a new password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="sp-login-section">
                    <label className="sp-login-label" htmlFor="resetEmail">Email</label>
                    <input
                      id="resetEmail"
                      type="email"
                      className="sp-login-input"
                      placeholder="coach@lincolnhs.edu"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="sp-login-btn-primary" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                    {!loading && <ArrowRight className="h-[16px] w-[16px]" />}
                  </button>

                  <button
                    type="button"
                    className="sp-login-back"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    <ArrowLeft className="h-[14px] w-[14px]" />
                    Back to sign in
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="sp-login-eyebrow">Welcome back</span>
                <h1 className="sp-login-headline">
                  Sign in to{" "}
                  <span className="accent-wrap"><span className="accent">Sponsorly</span></span>
                </h1>
                <p className="sp-login-sub">
                  Pick up where you left off. Check campaign progress, review donations, and send the next follow-up.
                </p>
                <p className="sp-login-sub" style={{ marginTop: 10 }}>
                  Don't have an account?{" "}
                  <Link to="/signup" className="sp-login-sub-link">
                    Start one free <ArrowRight className="h-[13px] w-[13px]" />
                  </Link>
                </p>

                {/* OAuth */}
                <div className="sp-login-section">
                  <div className="sp-login-oauth-row">
                    <button
                      type="button"
                      className="sp-login-oauth-icon"
                      onClick={handleGoogleLogin}
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
                      className="sp-login-oauth-icon"
                      onClick={handleMicrosoftLogin}
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
                      className="sp-login-oauth-icon"
                      onClick={handleFacebookLogin}
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

                <div className="sp-login-divider">Or with email</div>

                <form onSubmit={handleLogin}>
                  <div>
                    <label className="sp-login-label" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="sp-login-input"
                      placeholder="coach@lincolnhs.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sp-login-section">
                    <label className="sp-login-label" htmlFor="password">Password</label>
                    <div className="sp-login-password">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="sp-login-input"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  </div>

                  <div className="sp-login-row">
                    <label className="sp-login-checkbox">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Keep me signed in
                    </label>
                    <button
                      type="button"
                      className="sp-login-link"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="sp-login-btn-primary" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                    {!loading && <ArrowRight className="h-[16px] w-[16px]" />}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        {/* RIGHT — social proof panel */}
        <aside className="sp-login-right">
          <div className="sp-login-right-top">
            <span className="sp-login-livechip">
              <span className="dot" />
              847 fundraisers raising right now
            </span>
            <span className="sp-login-domain">sponsorly.io</span>
          </div>

          <div className="sp-login-quote-block">
            <div className="sp-login-quote-mark">,,</div>
            <p className="sp-login-quote">
              Payouts hit our account the <em>same day</em>. Our band is already on the bus.
            </p>
            <div className="sp-login-attr">
              <div className="sp-login-attr-avatar">JY</div>
              <div>
                <div className="sp-login-attr-name">Dir. Young</div>
                <div className="sp-login-attr-role">Evergreen MS Band Director</div>
              </div>
            </div>
          </div>

          <div className="sp-login-campaign-wrap">
            <div className="sp-login-campaign">
              <div className="sp-login-notif top-right">
                <div className="icon green"><Check className="h-[14px] w-[14px]" strokeWidth={3} /></div>
                <div>
                  <div className="label">New donation</div>
                  <div className="body">$250 from the Chen family</div>
                  <div className="meta">Go Lincoln! 🏆 · 2s ago</div>
                </div>
              </div>
              <div className="sp-login-notif bottom-left">
                <div className="icon blue"><Check className="h-[14px] w-[14px]" strokeWidth={3} /></div>
                <div>
                  <div className="label">Payout</div>
                  <div className="body">$4,120 → Lincoln HS</div>
                  <div className="meta">Arrived 11:42 AM today</div>
                </div>
              </div>

              <div className="sp-login-campaign-chrome">
                <div className="dots"><span /><span /><span /></div>
                <div className="url">sponsorly.com/c/hawks-basketball-2026</div>
              </div>
              <div className="sp-login-campaign-hero">
                <span className="sp-login-campaign-chip">Hawks × PTO</span>
              </div>
              <div className="sp-login-campaign-body">
                <div className="sp-login-campaign-title">Hawks Basketball — New Uniforms &amp; Travel</div>
                <div className="sp-login-campaign-sub">
                  Help us send all 18 players to State. Every dollar goes to the team.
                </div>
                <div className="sp-login-campaign-stats">
                  <div>
                    <div className="sp-login-campaign-stat-num">$18,420</div>
                    <div className="sp-login-campaign-stat-label">raised</div>
                  </div>
                  <div>
                    <div className="sp-login-campaign-stat-num">204</div>
                    <div className="sp-login-campaign-stat-label">donors</div>
                  </div>
                  <div>
                    <div className="sp-login-campaign-stat-num">11</div>
                    <div className="sp-login-campaign-stat-label">days left</div>
                  </div>
                </div>
                <div className="sp-login-campaign-progress-track">
                  <div className="sp-login-campaign-progress-fill" />
                </div>
                <div className="sp-login-campaign-progress-label">74% of $25,000 goal</div>
                <div className="sp-login-campaign-amounts">
                  <div className="amt">$25</div>
                  <div className="amt">$50</div>
                  <div className="amt">$100</div>
                  <div className="amt donate">Donate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sp-login-stats">
            <div>
              <div className="sp-login-stat-amount">$12.4M</div>
              <div className="sp-login-stat-label">Raised this year</div>
            </div>
            <div>
              <div className="sp-login-stat-amount">500+</div>
              <div className="sp-login-stat-label">Schools &amp; programs</div>
            </div>
            <div>
              <div className="sp-login-stat-amount">$0</div>
              <div className="sp-login-stat-label">Platform fees</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Login;
