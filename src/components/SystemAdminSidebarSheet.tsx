import { NavLink } from "react-router-dom";
import { Home, Building2, FileCheck, Mail, FlaskConical } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SponsorlyLogo from "./SponsorlyLogo";

interface SystemAdminSidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
];

export const SystemAdminSidebarSheet = ({ open, onOpenChange }: SystemAdminSidebarSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        <div className="flex h-16 items-center justify-start px-6 border-b border-sidebar-border">
          <SponsorlyLogo theme="dark" className="h-8" />
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.end}
                onClick={() => onOpenChange(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
