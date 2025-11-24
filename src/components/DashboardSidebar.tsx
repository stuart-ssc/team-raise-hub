import { useState } from "react";
import { Home, Users, Heart, Target, BarChart3, Menu, Package, Building2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { Button } from "@/components/ui/button";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLabel } from "@/lib/terminology";

const sidebarItems = [
  { title: "Home", icon: Home, url: "/dashboard", end: true },
  { title: "My Orders", icon: Package, url: "/dashboard/orders" },
  { title: "Groups", icon: Users, url: "/dashboard/groups" },
  { title: "Campaigns", icon: Target, url: "/dashboard/campaigns" },
  { title: "Donors", icon: Heart, url: "/dashboard/donors" },
  { title: "Businesses", icon: Building2, url: "/dashboard/businesses" },
  { title: "Users", icon: Users, url: "/dashboard/users" },
  { title: "Reports", icon: BarChart3, url: "/dashboard/reports" },
];

const DashboardSidebar = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : isMobile;
  });
  const location = useLocation();
  const { organizationUser } = useOrganizationUser();

  // Check if user has permission to see Users menu item
  const permissionLevel = organizationUser?.user_type.permission_level;
  const canSeeUsers = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-sidebar text-sidebar-foreground transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${isMobile ? 'fixed inset-y-0 left-0 z-50' : ''} flex flex-col`}>
      {/* Header */}
      <div className={`border-b border-sidebar-border ${isCollapsed ? 'p-1 flex flex-col items-center gap-2' : 'p-4'}`}>
        {isCollapsed && (
          <SponsorlyLogo variant="mark" theme="dark" />
        )}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <SponsorlyLogo variant="full" theme="dark" className="text-sidebar-foreground" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !isCollapsed;
              setIsCollapsed(newState);
              localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
            }}
            className="text-sidebar-foreground hover:bg-sidebar-accent p-2"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-1' : 'p-4'}`}>
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url, item.end);
            
            // Hide Users, Campaigns, Donors, and Businesses menu items for unauthorized roles
            if ((item.title === "Users" || item.title === "Campaigns" || item.title === "Donors" || item.title === "Businesses") && !canSeeUsers) {
              return null;
            }
            
            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  className={`flex items-center transition-colors rounded-md ${
                    isCollapsed 
                      ? 'justify-center p-1' 
                      : 'gap-3 px-3 py-2'
                  } ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                  title={organizationUser?.organization && item.title === 'Groups' 
                    ? getLabel(organizationUser.organization.organization_type, 'programs')
                    : item.title}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">
                      {organizationUser?.organization && item.title === 'Groups'
                        ? getLabel(organizationUser.organization.organization_type, 'programs')
                        : item.title}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default DashboardSidebar;