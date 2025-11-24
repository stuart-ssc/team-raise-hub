import { Home, Users, Heart, Target, BarChart3, Package, Building2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
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
    <aside className="hidden md:flex md:w-16 lg:w-64 bg-sidebar text-sidebar-foreground transition-all duration-300 flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="border-b border-sidebar-border p-4 flex items-center justify-between">
        <SponsorlyLogo variant="mark" theme="dark" className="lg:hidden" />
        <SponsorlyLogo variant="full" theme="dark" className="hidden lg:block text-sidebar-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4">
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
                  className={`flex items-center transition-colors rounded-md px-3 py-2 ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                  title={organizationUser?.organization && item.title === 'Groups' 
                    ? getLabel(organizationUser.organization.organization_type, 'programs')
                    : item.title}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium ml-3 hidden lg:inline">
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
    </aside>
  );
};

export default DashboardSidebar;