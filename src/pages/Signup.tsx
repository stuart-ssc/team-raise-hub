import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus } from "lucide-react";

interface InvitationInfo {
  token: string;
  playerName: string;
  organizationName: string;
  relationship: string;
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
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithFacebook, user } = useAuth();
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center mb-8">
            <SponsorlyLogo variant="full" theme="light" className="h-16" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-2">Sign up</h1>
            <p className="text-muted-foreground">Create your account to get started</p>
          </div>

          {invitationInfo && (
            <Alert className="bg-primary/5 border-primary/20">
              <UserPlus className="h-4 w-4" />
              <AlertDescription>
                <strong>{invitationInfo.playerName}</strong> invited you to join{" "}
                <strong>{invitationInfo.organizationName}</strong> as their{" "}
                {invitationInfo.relationship.toLowerCase()}.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
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

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleFacebookSignup}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Blue gradient with testimonial (hidden on mobile) */}
      <div className="hidden md:flex w-full lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />
        
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
          {/* Headline and description */}
          <h2 className="text-4xl font-bold text-white mb-4">
            Join Thousands of Organizations
          </h2>
          <p className="text-white/90 text-lg leading-relaxed max-w-xl mb-8">
            Schools, clubs, and non-profits across the country are already using 
            Sponsorly to raise funds more effectively. Join them today!
          </p>
          
          {/* Testimonial card */}
          <Card className="max-w-sm bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg" alt="Sarah Mitchell" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    "We raised 40% more than last year with Sponsorly. 
                    The platform made it easy to engage our community and track donations."
                  </p>
                  <div className="font-medium text-gray-900">Sarah Mitchell</div>
                  <div className="text-xs text-gray-600">Executive Director, Local Food Bank</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;