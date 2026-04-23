import { useEffect, useState } from "react";
import { Home, Heart, Target, BarChart3, Building2, Settings, Trophy, UserCircle, HelpCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import RoleSwitcher from "@/components/RoleSwitcher";

// Base items - Home URL is dynamic based on user type
const getSidebarItems = (isParent: boolean) => [
  { title: "Home", icon: Home, url: isParent ? "/dashboard/family" : "/dashboard", end: true },
  { title: "My Fundraising", icon: Trophy, url: "/dashboard/my-fundraising", participantOnly: true },
  { title: "Fundraisers", icon: Target, url: "/dashboard/fundraisers", managerOnly: true },
  { title: "Donors", icon: Heart, url: "/dashboard/donors" },
  { title: "Businesses", icon: Building2, url: "/dashboard/businesses" },
  { title: "Reports", icon: BarChart3, url: "/dashboard/reports", managerOnly: true },
  { title: "Settings", icon: Settings, url: "/dashboard/settings", settingsAccess: true },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const { organizationUser } = useOrganizationUser();
  const { donorProfiles } = useDonorPortal();
  const [pendingCount, setPendingCount] = useState(0);

  const hasDonorAccess = donorProfiles.length > 0;

  const permissionLevel = organizationUser?.user_type?.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';
  const canAccessSettings = canSeeUsers; // admins + program managers

  // Check if current role is a parent role (linked to a child)
  const isParent = organizationUser?.linked_organization_user_id !== null && organizationUser?.linked_organization_user_id !== undefined;

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
    if (path === '/dashboard/businesses') {
      return location.pathname === '/dashboard/businesses' ||
             location.pathname.startsWith('/dashboard/businesses/');
    }
    if (path === '/dashboard/donors') {
      return location.pathname === '/dashboard/donors' ||
             location.pathname.startsWith('/dashboard/donors/');
    }
    if (path === '/dashboard/fundraisers') {
      return location.pathname === '/dashboard/fundraisers' ||
             location.pathname.startsWith('/dashboard/fundraisers/');
    }
    if (path === '/dashboard/settings') {
      return location.pathname === '/dashboard/settings' ||
             location.pathname.startsWith('/dashboard/settings') ||
             location.pathname.startsWith('/dashboard/users') ||
             location.pathname.startsWith('/dashboard/groups');
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

      {/* Role Switcher */}
      <div className="px-2 lg:px-4">
        <RoleSwitcher compact={false} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 flex flex-col">
        <ul className="space-y-2">
          {getSidebarItems(isParent).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url, item.end);

            // Hide manager-only items from participants
            if (item.managerOnly && !canSeeUsers) {
              return null;
            }

            // Show participant-only items only for participants/supporters
            if (item.participantOnly && canSeeUsers) {
              return null;
            }

            // Settings visible only to admins + program managers
            if (item.settingsAccess && !canAccessSettings) {
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
                  title={item.title}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium ml-3 hidden lg:inline">
                      {item.title}
                    </span>
                  </div>
                  {item.title === "Settings" && pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Bottom group - Donor Portal + Help & Support pinned to bottom */}
        <ul className="space-y-2 mt-auto pt-4">
          {hasDonorAccess && (
            <li className="border-t border-sidebar-border pt-4">
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

          <li className={hasDonorAccess ? "" : "border-t border-sidebar-border pt-4"}>
            <NavLink
              to="/dashboard/help"
              className={`flex items-center transition-colors rounded-md px-3 py-2 ${
                isActive("/dashboard/help")
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              title="Help & Support"
            >
              <HelpCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium ml-3 hidden lg:inline">Help & Support</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
