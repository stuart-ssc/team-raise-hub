import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithFacebook, signInWithMicrosoft, resetPassword, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "You have been logged in successfully!",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Reset Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Reset Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Google Login Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      toast({
        title: "Google Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    
    try {
      const { error } = await signInWithMicrosoft();
      
      if (error) {
        toast({
          title: "Microsoft Login Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      toast({
        title: "Microsoft Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center mb-8">
            <SponsorlyLogo variant="full" theme="light" className="h-16" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-2">
              {showForgotPassword ? "Reset Password" : "Log in"}
            </h1>
            {showForgotPassword && (
              <p className="text-muted-foreground mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            )}
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-14 p-0"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-14 p-0"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await signInWithFacebook();
                      if (error) {
                        toast({
                          title: "Facebook Login Error",
                          description: error.message,
                          variant: "destructive",
                        });
                        setLoading(false);
                      }
                    } catch (error) {
                      toast({
                        title: "Facebook Login Error",
                        description: "An unexpected error occurred. Please try again.",
                        variant: "destructive",
                      });
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-14 p-0"
                  onClick={handleMicrosoftLogin}
                  disabled={loading}
                >
                  <svg className="h-6 w-6" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
                    <rect x="1" y="11" width="9" height="9" fill="#7fba00"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                </Button>
              </div>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => navigate('/signup')}
              >
                Sign up
              </button>
            </div>
            </form>
          )}
        </div>
      </div>

      {/* Right side - Blue gradient with testimonial (hidden on mobile) */}
      <div className="hidden md:flex w-full lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
          {/* Headline and description */}
          <h2 className="text-4xl font-bold text-white mb-4">
            Empowering Organizations to Raise More
          </h2>
          <p className="text-white/90 text-lg leading-relaxed max-w-xl mb-8">
            Whether you're a school, club, or non-profit, Sponsorly makes 
            fundraising simple, effective, and free to use.
          </p>
          
          {/* Testimonial card */}
          <Card className="max-w-sm bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg" alt="John Peterson" />
                  <AvatarFallback>JP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    "Sponsorly has revolutionized how we manage fundraising. 
                    The platform is intuitive and our teams love it!"
                  </p>
                  <div className="font-medium text-gray-900">John Peterson</div>
                  <div className="text-xs text-gray-600">Athletic Director</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;