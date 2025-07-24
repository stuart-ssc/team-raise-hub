import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SchoolLogo from "@/components/SchoolLogo";
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
  const { signIn, resetPassword, user } = useAuth();
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div>
            <SchoolLogo className="mb-8" />
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

      {/* Right side - Blue gradient with testimonial */}
      <div className="flex-1 bg-gradient-primary relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        
        <div className="relative h-full flex items-center justify-center p-8">
          <Card className="max-w-sm bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg" alt="Canvas Developer" />
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    Canvas is an incredible set of templates that makes building apps 
                    at least twice as fast. With the new browser plugin that accompanies it, 
                    Canvas is even faster and easier to work with. Amazing work by AirDev.
                  </p>
                  <div className="font-medium text-gray-900">Canvas Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="absolute bottom-8 left-8 right-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Raising Money Has Never Been Easier!
          </h2>
          <p className="text-white/90 text-lg leading-relaxed max-w-2xl mx-auto">
            With School Sponsor Connect, raise and collect money easier than ever before. 
            Get the funds you need for your school PTO, club, or team to succeed. 
            And it's free for you to use!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;