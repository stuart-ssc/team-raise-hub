import { useState } from "react";
import { Home, Users, DollarSign, Target, BarChart3, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import SchoolLogo from "@/components/SchoolLogo";
import { Button } from "@/components/ui/button";
import { useSchoolUser } from "@/hooks/useSchoolUser";

const sidebarItems = [
  { title: "Home", icon: Home, url: "/dashboard", end: true },
  { title: "Groups", icon: Users, url: "/dashboard/groups" },
  { title: "Campaigns", icon: Target, url: "/dashboard/campaigns" },
  { title: "Donors", icon: DollarSign, url: "/dashboard/donors" },
  { title: "Users", icon: Users, url: "/dashboard/users" },
  { title: "Reports", icon: BarChart3, url: "/dashboard/reports" },
];

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { schoolUser } = useSchoolUser();

  // Check if user has permission to see Users menu item
  const authorizedRoles = ["Principal", "Athletic Director", "Coach", "Club Sponsor", "Booster Leader"];
  const canSeeUsers = schoolUser?.user_type?.name && authorizedRoles.includes(schoolUser.user_type.name);

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-sidebar text-sidebar-foreground transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen`}>
      {/* Header */}
      <div className={`border-b border-sidebar-border ${isCollapsed ? 'p-1 flex flex-col items-center gap-2' : 'p-4'}`}>
        {isCollapsed && (
          <img 
            src="/lovable-uploads/18f62908-d8b7-4131-8934-c7e40541f122.png" 
            alt="School Logo" 
            className="h-8 w-auto"
          />
        )}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <SchoolLogo className="text-sidebar-foreground [&>div:first-child]:bg-sidebar-primary [&>div:first-child]:text-sidebar-primary-foreground" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
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
            
            // Hide Users and Campaigns menu items for unauthorized roles
            if ((item.title === "Users" || item.title === "Campaigns") && !canSeeUsers) {
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
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.title}</span>}
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