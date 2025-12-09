import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  CreditCard,
  Building2,
  RefreshCw,
  ArrowRight
} from "lucide-react";

interface PaymentSetupTabProps {
  organizationId: string;
  organizationName: string;
}

interface StripeAccountStatus {
  exists: boolean;
  accountId?: string;
  status?: 'pending' | 'incomplete' | 'pending_verification' | 'active';
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirements?: string[];
  pendingVerification?: string[];
  businessType?: string;
  payoutSchedule?: string;
  minimumPayoutAmount?: number;
}

export const PaymentSetupTab = ({ organizationId, organizationName }: PaymentSetupTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  const fetchAccountStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-stripe-account-status', {
        body: { organizationId }
      });

      if (error) throw error;
      setAccountStatus(data);
    } catch (error: any) {
      console.error('Error fetching account status:', error);
      setAccountStatus({ exists: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchAccountStatus();
    }
  }, [organizationId]);

  // Check URL for onboarding completion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_onboarding') === 'complete') {
      toast({
        title: "Onboarding Complete",
        description: "Refreshing your account status...",
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      fetchAccountStatus();
    }
  }, []);

  const handleCreateAccount = async () => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { organizationId, businessType: 'company' }
      });

      if (error) throw error;

      toast({
        title: "Account Created",
        description: "Your Stripe account has been created. Complete onboarding to start accepting payments.",
      });

      // Now get onboarding link
      await handleStartOnboarding();
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create Stripe account",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-stripe-onboarding-link', {
        body: { 
          organizationId,
          returnUrl: window.location.href + '?stripe_onboarding=complete',
          refreshUrl: window.location.href + '?stripe_onboarding=refresh',
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start onboarding",
        variant: "destructive",
      });
      setActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-stripe-express-dashboard-link', {
        body: { organizationId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening dashboard:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open dashboard",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!accountStatus?.exists) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }

    switch (accountStatus.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'pending_verification':
        return (
          <Badge variant="default" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending Verification
          </Badge>
        );
      case 'incomplete':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Incomplete
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getOnboardingProgress = () => {
    if (!accountStatus?.exists) return 0;
    let progress = 25;
    if (accountStatus.detailsSubmitted) progress += 25;
    if (accountStatus.chargesEnabled) progress += 25;
    if (accountStatus.payoutsEnabled) progress += 25;
    return progress;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Setup</CardTitle>
          <CardDescription>Loading payment account status...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No account connected
  if (!accountStatus?.exists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Setup</CardTitle>
          <CardDescription>Connect a Stripe account to accept donations and payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Stripe Connect</p>
                <p className="text-sm text-muted-foreground">Accept card and bank payments</p>
              </div>
            </div>
            <Badge variant="secondary">Not Connected</Badge>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">Why connect Stripe?</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Accept credit cards and ACH bank transfers
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Automatic payouts to your bank account
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Access your own Stripe Dashboard for reporting
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                100% of donations go to your organization (10% platform fee on top)
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleCreateAccount} 
            disabled={actionLoading}
            className="w-full"
            size="lg"
          >
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="mr-2 h-4 w-4" />
            )}
            Connect Stripe Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Account exists - show status
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Setup</CardTitle>
            <CardDescription>Manage your Stripe account and payments</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAccountStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Card */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Stripe Connect</p>
              <p className="text-sm text-muted-foreground">
                Account: {accountStatus.accountId?.slice(0, 15)}...
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Progress */}
        {accountStatus.status !== 'active' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Setup Progress</span>
              <span className="font-medium">{getOnboardingProgress()}%</span>
            </div>
            <Progress value={getOnboardingProgress()} className="h-2" />
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {accountStatus.exists ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Account Created</p>
              <p className="text-xs text-muted-foreground">Stripe Connect account linked</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {accountStatus.detailsSubmitted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Details Submitted</p>
              <p className="text-xs text-muted-foreground">Business information completed</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {accountStatus.chargesEnabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Charges Enabled</p>
              <p className="text-xs text-muted-foreground">Ready to accept payments</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {accountStatus.payoutsEnabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Payouts Enabled</p>
              <p className="text-xs text-muted-foreground">Can receive funds to bank</p>
            </div>
          </div>
        </div>

        {/* Requirements Alert */}
        {accountStatus.requirements && accountStatus.requirements.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Action Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Complete the following to activate your account:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                  {accountStatus.requirements.slice(0, 3).map((req, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      {req.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Active Account Info */}
        {accountStatus.status === 'active' && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Account Active</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your account is fully set up and ready to accept payments. Donations will be
                  automatically transferred to your linked bank account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {accountStatus.status !== 'active' && (
            <Button 
              onClick={handleStartOnboarding} 
              disabled={actionLoading}
              className="flex-1"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Continue Setup
            </Button>
          )}
          
          {accountStatus.detailsSubmitted && (
            <Button 
              variant={accountStatus.status === 'active' ? 'default' : 'outline'}
              onClick={handleOpenDashboard} 
              disabled={actionLoading}
              className={accountStatus.status === 'active' ? 'flex-1' : ''}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Stripe Dashboard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
