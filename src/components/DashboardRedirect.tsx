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
  const [checkingAdmin, setCheckingAdmin] = useState(true);

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

  // Handle redirects based on user type
  useEffect(() => {
    if (donorLoading || checkingAdmin) return;
    
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
  }, [isDonorOnly, isSystemAdmin, hasOrgAccess, donorLoading, checkingAdmin, navigate]);

  // Show loading state while determining user type
  if (donorLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user should be redirected, show loading (redirect is happening)
  if (isDonorOnly || (isSystemAdmin && !hasOrgAccess)) {
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
