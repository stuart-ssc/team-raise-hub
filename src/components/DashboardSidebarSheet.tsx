import { useEffect, useState } from "react";
import { Home, Users, Heart, Target, BarChart3, Building2, Settings, LogOut, Trophy, UserCircle, HelpCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { getLabel } from "@/lib/terminology";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationDropdown from "@/components/NotificationDropdown";
import { supabase } from "@/integrations/supabase/client";
import RoleSwitcher from "@/components/RoleSwitcher";

// Base items - Home URL will be dynamic based on user type
const getSidebarItems = (isParent: boolean) => [
  { title: "Home", icon: Home, url: isParent ? "/dashboard/family" : "/dashboard", end: true },
  { title: "My Fundraising", icon: Trophy, url: "/dashboard/my-fundraising", participantOnly: true },
  { title: "Groups", icon: Users, url: "/dashboard/groups" },
  { title: "Campaigns", icon: Target, url: "/dashboard/campaigns" },
  { title: "Donors", icon: Heart, url: "/dashboard/donors" },
  { title: "Businesses", icon: Building2, url: "/dashboard/businesses" },
  { title: "Users", icon: Users, url: "/dashboard/users" },
  { title: "Reports", icon: BarChart3, url: "/dashboard/reports" },
  { title: "Settings", icon: Settings, url: "/dashboard/settings", adminOnly: true },
];

interface DashboardSidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userInitials?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
  onProfileClick?: () => void;
}

const DashboardSidebarSheet = ({ 
  open, 
  onOpenChange, 
  userName = "User",
  userInitials = "U",
  avatarUrl,
  onLogout,
  onProfileClick
}: DashboardSidebarSheetProps) => {
  const location = useLocation();
  const { organizationUser, allRoles } = useOrganizationUser();
  const { donorProfiles } = useDonorPortal();
  const [pendingCount, setPendingCount] = useState(0);
  
  const hasDonorAccess = donorProfiles.length > 0;

  // Check if user has permission to see Users menu item
  const permissionLevel = organizationUser?.user_type?.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

  // Check if current role is a parent role
  const isParent = organizationUser?.linked_organization_user_id !== null && organizationUser?.linked_organization_user_id !== undefined;

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
      .channel('sidebar-sheet-membership-requests')
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0 md:hidden">
        <div className="bg-sidebar text-sidebar-foreground h-full flex flex-col">
          {/* Header */}
          <div className="p-4">
            <SponsorlyLogo variant="full" theme="dark" className="text-sidebar-foreground" />
          </div>

          {/* Role Switcher */}
          <div className="px-4">
            <RoleSwitcher compact={false} onSelect={() => onOpenChange(false)} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {getSidebarItems(isParent).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url, item.end);
                
                // Hide admin/manager items from participants
                if ((item.title === "Users" || item.title === "Campaigns" || item.title === "Groups" || item.title === "Reports") && !canSeeUsers) {
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
                      onClick={() => onOpenChange(false)}
                      className={`flex items-center justify-between gap-3 px-3 py-2 transition-colors rounded-md ${
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">
                          {organizationUser?.organization && item.title === 'Groups'
                            ? getLabel(organizationUser.organization.organization_type, 'programs')
                            : item.title}
                        </span>
                      </div>
                      {item.title === "Users" && pendingCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
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
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 px-3 py-2 transition-colors rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <UserCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Donor Portal</span>
                  </NavLink>
                </li>
              )}
              
              {/* Help & Support link at bottom */}
              <li className={hasDonorAccess ? "" : "pt-4 border-t border-sidebar-border mt-4"}>
                <NavLink
                  to="/dashboard/help"
                  onClick={() => onOpenChange(false)}
                  className={`flex items-center gap-3 px-3 py-2 transition-colors rounded-md ${
                    isActive("/dashboard/help")
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <HelpCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Help & Support</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Footer Section - Notifications & Profile */}
          <div className="border-t border-sidebar-border p-4 space-y-4">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-sidebar-foreground font-medium">Notifications</span>
              <NotificationDropdown />
            </div>

            <Separator className="bg-sidebar-border" />

            {/* Profile */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => {
                  onProfileClick?.();
                  onOpenChange(false);
                }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{userName}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => {
                  onLogout?.();
                  onOpenChange(false);
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashboardSidebarSheet;
