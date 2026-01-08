import { useEffect, useState } from "react";
import { Home, Users, Heart, Target, BarChart3, Package, Building2, Settings, Trophy, MessageCircle, UserCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { getLabel } from "@/lib/terminology";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Base items - Home URL will be dynamic based on user type
const getSidebarItems = (isParent: boolean) => [
  { title: "Home", icon: Home, url: isParent ? "/dashboard/family" : "/dashboard", end: true },
  { title: "My Orders", icon: Package, url: "/dashboard/orders" },
  { title: "My Fundraising", icon: Trophy, url: "/dashboard/my-fundraising", participantOnly: true },
  { title: "Messages", icon: MessageCircle, url: "/dashboard/messages" },
  { title: "Groups", icon: Users, url: "/dashboard/groups" },
  { title: "Campaigns", icon: Target, url: "/dashboard/campaigns" },
  { title: "Donors", icon: Heart, url: "/dashboard/donors" },
  { title: "Businesses", icon: Building2, url: "/dashboard/businesses" },
  { title: "Users", icon: Users, url: "/dashboard/users" },
  { title: "Reports", icon: BarChart3, url: "/dashboard/reports" },
  { title: "Settings", icon: Settings, url: "/dashboard/settings", adminOnly: true },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const { organizationUser } = useOrganizationUser();
  const { donorProfiles } = useDonorPortal();
  const [pendingCount, setPendingCount] = useState(0);
  const [isParent, setIsParent] = useState(false);
  
  const hasDonorAccess = donorProfiles.length > 0;

  // Check if user has permission to see Users menu item
  const permissionLevel = organizationUser?.user_type?.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

  // Check if user is a parent (has linked children)
  useEffect(() => {
    const checkIfParent = async () => {
      if (!organizationUser?.user_id) return;
      
      const { data } = await supabase
        .from('organization_user')
        .select('id')
        .eq('user_id', organizationUser.user_id)
        .eq('active_user', true)
        .not('linked_organization_user_id', 'is', null)
        .limit(1);
      
      setIsParent(data && data.length > 0);
    };
    checkIfParent();
  }, [organizationUser?.user_id]);

  // Fetch pending membership requests count
  const fetchPendingCount = () => {
    if (organizationUser?.organization_id && canSeeUsers) {
      supabase
        .from('membership_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationUser.organization_id)
        .eq('status', 'pending')
        .then(({ count }) => setPendingCount(count || 0));
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [organizationUser?.organization_id, canSeeUsers]);

  // Real-time subscription for pending requests
  useEffect(() => {
    if (!organizationUser?.organization_id || !canSeeUsers) return;

    const channel = supabase
      .channel('sidebar-membership-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_requests',
          filter: `organization_id=eq.${organizationUser.organization_id}`,
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationUser?.organization_id, canSeeUsers]);

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }
    // Special handling for nested routes
    if (path === '/dashboard/businesses') {
      return location.pathname === '/dashboard/businesses' || 
             location.pathname.startsWith('/dashboard/businesses/');
    }
    if (path === '/dashboard/donors') {
      return location.pathname === '/dashboard/donors' || 
             location.pathname.startsWith('/dashboard/donors/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex md:w-16 lg:w-64 bg-sidebar text-sidebar-foreground transition-all duration-300 flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <SponsorlyLogo variant="mark" theme="dark" className="lg:hidden" />
        <SponsorlyLogo variant="full" theme="dark" className="hidden lg:block text-sidebar-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4">
        <ul className="space-y-2">
          {getSidebarItems(isParent).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url, item.end);
            
            // Hide admin/manager items from participants
            if ((item.title === "Users" || item.title === "Campaigns" || item.title === "Donors" || item.title === "Businesses" || item.title === "Groups" || item.title === "Reports") && !canSeeUsers) {
              return null;
            }
            
            // Show participant-only items only for participants/supporters
            if (item.participantOnly && canSeeUsers) {
              return null;
            }
            
            // Hide Settings menu item for non-admins
            if (item.adminOnly && permissionLevel !== 'organization_admin') {
              return null;
            }
            
            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  className={`flex items-center justify-between transition-colors rounded-md px-3 py-2 ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                  title={organizationUser?.organization && item.title === 'Groups' 
                    ? getLabel(organizationUser.organization.organization_type, 'programs')
                    : item.title}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium ml-3 hidden lg:inline">
                      {organizationUser?.organization && item.title === 'Groups'
                        ? getLabel(organizationUser.organization.organization_type, 'programs')
                        : item.title}
                    </span>
                  </div>
                  {item.title === "Users" && pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </NavLink>
              </li>
            );
          })}
          
          {/* Donor Portal link for dual-role users */}
          {hasDonorAccess && (
            <li className="pt-4 border-t border-sidebar-border mt-4">
              <NavLink
                to="/portal"
                className="flex items-center transition-colors rounded-md px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title="Donor Portal"
              >
                <UserCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 hidden lg:inline">Donor Portal</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;