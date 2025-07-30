import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, CreditCard, AlertCircle } from "lucide-react";

interface StripeConnectManagerProps {
  groupId: string;
  groupName: string;
  stripeAccountId?: string;
  stripeAccountEnabled?: boolean;
}

export const StripeConnectManager = ({ 
  groupId, 
  groupName, 
  stripeAccountId, 
  stripeAccountEnabled 
}: StripeConnectManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    connected: boolean;
    charges_enabled: boolean;
    details_submitted: boolean;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (stripeAccountId) {
      checkAccountStatus();
    }
  }, [stripeAccountId]);

  const checkAccountStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { 
          groupId,
          action: 'check_status'
        }
      });

      if (error) throw error;
      setAccountStatus(data);
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      console.log('Attempting to create Stripe Connect account for group:', groupId);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { 
          groupId,
          action: 'create'
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Unknown error occurred');
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      if (data?.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast({
          title: "Stripe Connect Setup",
          description: "Complete the setup in the new tab, then refresh this page.",
        });
      } else {
        throw new Error('No onboarding URL received from server');
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start Stripe Connect setup";
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { 
          groupId,
          action: 'dashboard'
        }
      });

      if (error) throw error;

      if (data.dashboardUrl) {
        window.open(data.dashboardUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      toast({
        title: "Dashboard Error",
        description: error instanceof Error ? error.message : "Failed to open Stripe dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (!stripeAccountId) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Not Connected</Badge>
          <Button 
            size="sm" 
            onClick={handleCreateAccount}
            disabled={loading}
          >
            Setup Payments
          </Button>
        </div>
      );
    }

    if (!accountStatus) {
      return <Badge variant="outline">Checking...</Badge>;
    }

    if (accountStatus.charges_enabled) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CreditCard className="w-3 h-3 mr-1" />
            Active
          </Badge>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleOpenDashboard}
            disabled={loading}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Dashboard
          </Button>
        </div>
      );
    }

    if (accountStatus.details_submitted) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleOpenDashboard}
            disabled={loading}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Dashboard
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Setup Incomplete</Badge>
        <Button 
          size="sm" 
          onClick={handleCreateAccount}
          disabled={loading}
        >
          Complete Setup
        </Button>
      </div>
    );
  };

  return renderStatus();
};