import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Dashboard from "@/pages/Dashboard";

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDonorOnly, isLoading: donorLoading, hasOrgAccess } = useDonorPortal();
  const { refreshRoles } = useOrganizationUser();
  const [isSystemAdmin, setIsSystemAdmin] = useState<boolean | null>(null);
  const [hasExistingOrders, setHasExistingOrders] = useState<boolean | null>(null);
  const [isParentOnly, setIsParentOnly] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [checkingOrders, setCheckingOrders] = useState(true);
  const [checkingParent, setCheckingParent] = useState(true);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

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

  // Check if user is a parent-only user (has linked children but is not an admin)
  useEffect(() => {
    const checkIfParentOnly = async () => {
      if (!user?.id) {
        setCheckingParent(false);
        return;
      }
      
      // Get all organization_user records for this user
      const { data: orgUsers } = await supabase
        .from('organization_user')
        .select('id, linked_organization_user_id, user_type:user_type_id(permission_level)')
        .eq('user_id', user.id)
        .eq('active_user', true);
      
      if (!orgUsers || orgUsers.length === 0) {
        setIsParentOnly(false);
        setCheckingParent(false);
        return;
      }
      
      // Check if user has any parent links (linked_organization_user_id is set)
      const hasParentLinks = orgUsers.some(ou => ou.linked_organization_user_id !== null);
      
      // Check if user has admin/manager permissions
      const hasAdminAccess = orgUsers.some(ou => {
        const permLevel = (ou.user_type as any)?.permission_level;
        return permLevel === 'organization_admin' || permLevel === 'program_manager';
      });
      
      // Parent-only means: has parent links AND no admin access
      setIsParentOnly(hasParentLinks && !hasAdminAccess);
      setCheckingParent(false);
    };
    
    checkIfParentOnly();
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

  // Handle accept-invite query param
  useEffect(() => {
    const inviteToken = searchParams.get("accept-invite");
    if (!inviteToken || !user?.id || acceptingInvite) return;

    setAcceptingInvite(true);
    const acceptInvite = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("accept-parent-invitation", {
          body: { token: inviteToken },
        });

        if (error) throw error;

        toast({
          title: "Invitation Accepted!",
          description: "You've been linked as a parent/guardian. Use the role switcher to view their dashboard.",
        });

        // Refresh roles so the new Family Member role appears
        await refreshRoles();

        // Clear the query param
        searchParams.delete("accept-invite");
        setSearchParams(searchParams, { replace: true });
      } catch (err: any) {
        console.error("Error accepting invitation:", err);
        toast({
          title: "Invitation Error",
          description: err.message || "Failed to accept invitation",
          variant: "destructive",
        });
      } finally {
        setAcceptingInvite(false);
      }
    };

    acceptInvite();
  }, [user?.id, searchParams]);

  // Show loading state while determining user type
  if (donorLoading || checkingAdmin || checkingOrders || checkingParent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Perform redirects SYNCHRONOUSLY - check conditions and navigate immediately
  // Donor-only users go to portal
  if (isDonorOnly) {
    navigate('/portal', { replace: true });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // System admins without org access go to admin dashboard
  if (isSystemAdmin && !hasOrgAccess) {
    navigate('/system-admin', { replace: true });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Parent-only users go to family dashboard
  if (isParentOnly) {
    navigate('/dashboard/family', { replace: true });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Users with existing orders but no org access - redirect to portal
  if (hasExistingOrders && !hasOrgAccess && !isSystemAdmin) {
    navigate('/portal', { replace: true, state: { ordersLinked: true } });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render Dashboard after confirming no redirect is needed
  return <Dashboard />;
};

export default DashboardRedirect;
