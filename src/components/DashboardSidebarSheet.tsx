import { useEffect, useState } from "react";
import { Home, Heart, Target, BarChart3, Building2, Settings, LogOut, Trophy, UserCircle, HelpCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationDropdown from "@/components/NotificationDropdown";
import { supabase } from "@/integrations/supabase/client";
import RoleSwitcher from "@/components/RoleSwitcher";

const getSidebarItems = (isParent: boolean) => [
  { title: "Home", icon: Home, url: isParent ? "/dashboard/family" : "/dashboard", end: true },
  { title: "My Fundraising", icon: Trophy, url: "/dashboard/my-fundraising", participantOnly: true },
  { title: "Fundraisers", icon: Target, url: "/dashboard/fundraisers", managerOnly: true },
  { title: "Donors", icon: Heart, url: "/dashboard/donors" },
  { title: "Businesses", icon: Building2, url: "/dashboard/businesses" },
  { title: "Reports", icon: BarChart3, url: "/dashboard/reports", managerOnly: true },
  { title: "Settings", icon: Settings, url: "/dashboard/settings", settingsAccess: true },
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
  const { organizationUser } = useOrganizationUser();
  const { donorProfiles } = useDonorPortal();
  const [pendingCount, setPendingCount] = useState(0);

  const hasDonorAccess = donorProfiles.length > 0;

  const permissionLevel = organizationUser?.user_type?.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';
  const canAccessSettings = canSeeUsers;

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
          <nav className="flex-1 p-4 flex flex-col">
            <ul className="space-y-2">
              {getSidebarItems(isParent).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url, item.end);

                if (item.managerOnly && !canSeeUsers) {
                  return null;
                }

                if (item.participantOnly && canSeeUsers) {
                  return null;
                }

                if (item.settingsAccess && !canAccessSettings) {
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
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {item.title === "Settings" && pendingCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                          {pendingCount}
                        </Badge>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            {/* Bottom group - Donor Portal + Help & Support */}
            <ul className="space-y-2 mt-auto pt-4">
              {hasDonorAccess && (
                <li className="border-t border-sidebar-border pt-4">
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

              <li className={hasDonorAccess ? "" : "border-t border-sidebar-border pt-4"}>
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-sidebar-foreground font-medium">Notifications</span>
              <NotificationDropdown />
            </div>

            <Separator className="bg-sidebar-border" />

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
