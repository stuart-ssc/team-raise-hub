import { NavLink, useLocation } from "react-router-dom";
import { Home, Building2, FileCheck, Mail, FlaskConical, Briefcase, BarChart3, MessageSquare, GraduationCap, FileText, TrendingUp, HelpCircle } from "lucide-react";
import SponsorlyLogo from "./SponsorlyLogo";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/system-admin",
    end: true,
  },
  {
    title: "Organizations",
    icon: Building2,
    url: "/system-admin/organizations",
  },
  {
    title: "Businesses",
    icon: Briefcase,
    url: "/system-admin/businesses",
  },
  {
    title: "Landing Pages",
    icon: FileText,
    url: "/system-admin/landing-pages",
  },
  {
    title: "School Import",
    icon: GraduationCap,
    url: "/system-admin/school-import",
  },
  {
    title: "Verification Queue",
    icon: FileCheck,
    url: "/system-admin/verification",
  },
  {
    title: "Email Management",
    icon: Mail,
    url: "/system-admin/emails",
  },
  {
    title: "A/B Testing",
    icon: FlaskConical,
    url: "/system-admin/ab-tests",
  },
  {
    title: "Reports",
    icon: BarChart3,
    url: "/system-admin/reports",
  },
  {
    title: "Marketing Analytics",
    icon: TrendingUp,
    url: "/system-admin/marketing-analytics",
  },
  {
    title: "Contact Submissions",
    icon: MessageSquare,
    url: "/system-admin/contact-submissions",
  },
  {
    title: "Help Submissions",
    icon: HelpCircle,
    url: "/system-admin/help-submissions",
  },
];

export const SystemAdminSidebar = () => {
  const location = useLocation();

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex md:w-16 lg:w-64 md:flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center justify-center lg:justify-start lg:px-6 border-b border-sidebar-border">
        <SponsorlyLogo theme="dark" className="h-8" />
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url, item.end);
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.end}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-md
                transition-colors duration-150
                ${active 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }
                lg:justify-start justify-center
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3 hidden lg:block">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
