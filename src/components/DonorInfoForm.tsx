import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { LogIn, User, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const donorInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().max(20).optional(),
  createAccount: z.boolean(),
  password: z.union([
    z.string().length(0),
    z.string().min(8, "Password must be at least 8 characters")
  ]).optional(),
  confirmPassword: z.union([
    z.string().length(0),
    z.string()
  ]).optional(),
}).refine((data) => {
  if (data.createAccount && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Password is required when creating an account",
  path: ["password"],
}).refine((data) => {
  if (data.createAccount && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userId?: string;
}

interface DonorInfoFormProps {
  onComplete: (donorInfo: DonorInfo) => void;
  onBack: () => void;
  organizationId?: string;
}

export function DonorInfoForm({ onComplete, onBack, organizationId }: DonorInfoFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    createAccount: false,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setLoggedInUserId(session.user.id);
        await populateFormFromUser(session.user.id, session.user.email || "");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoggedIn(true);
        setLoggedInUserId(session.user.id);
        setShowLoginForm(false);
        // Use setTimeout to defer the async call
        setTimeout(() => {
          populateFormFromUser(session.user.id, session.user.email || "");
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setLoggedInUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const populateFormFromUser = async (userId: string, email: string) => {
    try {
      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      // Get donor profile for phone if organization is known
      let phone = "";
      if (organizationId) {
        const { data: donorProfile } = await supabase
          .from('donor_profiles')
          .select('phone')
          .eq('organization_id', organizationId)
          .eq('email', email)
          .single();
        phone = donorProfile?.phone || "";
      }

      setFormData(prev => ({
        ...prev,
        firstName: profile?.first_name || prev.firstName,
        lastName: profile?.last_name || prev.lastName,
        email: email,
        phone: phone || prev.phone,
        createAccount: false,
        password: "",
        confirmPassword: "",
      }));

      toast({
        title: "Welcome back!",
        description: "Your information has been filled in.",
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Still set the email even if profile fetch fails
      setFormData(prev => ({
        ...prev,
        email: email,
        createAccount: false,
      }));
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLoginError("Invalid email or password. Please try again.");
        } else {
          setLoginError(error.message);
        }
        return;
      }

      if (data.user) {
        // Auth state change listener will handle the rest
        setLoginEmail("");
        setLoginPassword("");
      }
    } catch (error: any) {
      setLoginError(error.message || "Failed to login. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      createAccount: false,
      password: "",
      confirmPassword: "",
    });
    setIsLoggedIn(false);
    setLoggedInUserId(null);
  };

  const validateForm = () => {
    try {
      donorInfoSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          title: "Please complete the form",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called with formData:', formData);
    console.log('isLoggedIn:', isLoggedIn, 'loggedInUserId:', loggedInUserId);
    
    if (!validateForm()) {
      console.log('Validation failed, errors:', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let userId: string | undefined = loggedInUserId || undefined;

      // Create account if requested (only if not already logged in)
      if (!isLoggedIn && formData.createAccount && formData.password) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            }
          }
        });

        if (signUpError) {
          // Handle specific error cases
          if (signUpError.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. You can continue as a guest or login separately.",
              variant: "destructive"
            });
            // Allow them to continue without account
          } else {
            throw signUpError;
          }
        } else if (signUpData.user) {
          userId = signUpData.user.id;
          toast({
            title: "Account created",
            description: "Check your email to verify your account.",
          });
        }
      }

      onComplete({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        userId,
      });
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Login Section */}
      {!isLoggedIn ? (
        <div className="bg-muted/50 rounded-lg p-4 border">
          <Collapsible open={showLoginForm} onOpenChange={setShowLoginForm}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Already have an account?</span>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {showLoginForm ? "Hide" : "Login to autofill"}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your password"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
              
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              
              <Button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="w-full sm:w-auto"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : (
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              <span>Logged in as <strong>{formData.email}</strong></span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Use different account
            </Button>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            disabled={isLoggedIn}
            className={isLoggedIn ? "bg-muted" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
          {isLoggedIn && (
            <p className="text-xs text-muted-foreground">Email is locked to your logged-in account</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">Phone Number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Create Account Section - only show if not logged in */}
      {!isLoggedIn && (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createAccount"
              checked={formData.createAccount}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, createAccount: checked as boolean })
              }
            />
            <Label htmlFor="createAccount" className="text-sm font-normal cursor-pointer">
              Create an account to track your donations and get tax receipts
            </Label>
          </div>

          {formData.createAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Back to Cart
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Processing..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
