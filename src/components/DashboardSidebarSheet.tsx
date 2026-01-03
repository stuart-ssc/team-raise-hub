import { Home, Users, Heart, Target, BarChart3, Package, Building2, Settings, LogOut, User, Trophy, MessageCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { getLabel } from "@/lib/terminology";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/NotificationDropdown";

const sidebarItems = [
  { title: "Home", icon: Home, url: "/dashboard", end: true },
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

  // Check if user has permission to see Users menu item
  const permissionLevel = organizationUser?.user_type.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

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

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
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
                      onClick={() => onOpenChange(false)}
                      className={`flex items-center gap-3 px-3 py-2 transition-colors rounded-md ${
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">
                        {organizationUser?.organization && item.title === 'Groups'
                          ? getLabel(organizationUser.organization.organization_type, 'programs')
                          : item.title}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
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
