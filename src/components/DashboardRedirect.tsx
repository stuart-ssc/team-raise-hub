import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDonorOnly, isLoading: donorLoading, hasOrgAccess } = useDonorPortal();
  const [isSystemAdmin, setIsSystemAdmin] = useState<boolean | null>(null);
  const [hasExistingOrders, setHasExistingOrders] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [checkingOrders, setCheckingOrders] = useState(true);

  // Check if user is system admin
  useEffect(() => {
    const checkSystemAdmin = async () => {
      if (!user?.id) {
        setCheckingAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('system_admin')
        .eq('id', user.id)
        .single();
      
      setIsSystemAdmin(data?.system_admin || false);
      setCheckingAdmin(false);
    };
    
    checkSystemAdmin();
  }, [user?.id]);

  // Check if user has existing orders by email (for donors who haven't set up yet)
  useEffect(() => {
    const checkExistingOrders = async () => {
      if (!user?.email || !user?.id) {
        setCheckingOrders(false);
        return;
      }
      
      // Check 1: Orders linked directly to user_id
      const { count: userIdCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (userIdCount && userIdCount > 0) {
        setHasExistingOrders(true);
        setCheckingOrders(false);
        return;
      }

      // Check 2: Orders by customer_email (catches orders placed without login)
      const { count: emailCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .ilike('customer_email', user.email)
        .is('user_id', null);
      
      if (emailCount && emailCount > 0) {
        // Auto-link orphaned orders to this user for faster future lookups
        await supabase
          .from('orders')
          .update({ user_id: user.id })
          .ilike('customer_email', user.email)
          .is('user_id', null);
        
        setHasExistingOrders(true);
        setCheckingOrders(false);
        return;
      }

      // Check 3: Donor profile exists (may have been created manually or via import)
      const { data: donorProfile } = await supabase
        .from('donor_profiles')
        .select('id')
        .ilike('email', user.email)
        .limit(1)
        .maybeSingle();

      setHasExistingOrders(!!donorProfile);
      setCheckingOrders(false);
    };
    
    checkExistingOrders();
  }, [user?.id, user?.email]);

  // Handle redirects based on user type
  useEffect(() => {
    if (donorLoading || checkingAdmin || checkingOrders) return;
    
    // Donor-only users go to portal
    if (isDonorOnly) {
      navigate('/portal', { replace: true });
      return;
    }
    
    // System admins without org access go to admin dashboard
    if (isSystemAdmin && !hasOrgAccess) {
      navigate('/system-admin', { replace: true });
      return;
    }

    // Users with existing orders but no org access - redirect to portal
    // This catches donors who made purchases but haven't set up
    if (hasExistingOrders && !hasOrgAccess && !isSystemAdmin) {
      navigate('/portal', { replace: true });
      return;
    }
  }, [isDonorOnly, isSystemAdmin, hasOrgAccess, hasExistingOrders, donorLoading, checkingAdmin, checkingOrders, navigate]);

  // Show loading state while determining user type
  if (donorLoading || checkingAdmin || checkingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user should be redirected, show loading (redirect is happening)
  if (isDonorOnly || (isSystemAdmin && !hasOrgAccess) || (hasExistingOrders && !hasOrgAccess && !isSystemAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Regular staff users - render the dashboard
  return <Dashboard />;
};

export default DashboardRedirect;
