import { NavLink, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Building2, MessageSquare, Receipt, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import SponsorlyLogo from "@/components/SponsorlyLogo";

interface DonorPortalSidebarProps {
  hasBusinesses?: boolean;
  onLogout: () => void;
}

const sidebarItems = [
  { title: "Home", icon: Home, url: "/portal" },
  { title: "My Purchases", icon: ShoppingBag, url: "/portal/purchases" },
  { title: "My Businesses", icon: Building2, url: "/portal/businesses", requiresBusiness: true },
  { title: "Messages", icon: MessageSquare, url: "/portal/messages" },
  { title: "Tax Receipts", icon: Receipt, url: "/portal/receipts" },
  { title: "Profile", icon: User, url: "/portal/profile" },
];

export function DonorPortalSidebar({ hasBusinesses = false, onLogout }: DonorPortalSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/portal") {
      return location.pathname === "/portal";
    }
    return location.pathname.startsWith(path);
  };

  const filteredItems = sidebarItems.filter(item => {
    if (item.requiresBusiness && !hasBusinesses) return false;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r min-h-screen">
      <div className="p-6 border-b">
        <NavLink to="/portal">
          <SponsorlyLogo className="h-8" />
        </NavLink>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
