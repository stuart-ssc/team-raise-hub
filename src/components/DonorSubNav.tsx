import { NavLink } from "react-router-dom";
import { Users, TrendingUp, Zap, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const subNavItems = [
  { label: "Overview", path: "/dashboard/donors", icon: Users, end: true },
  { label: "Segmentation", path: "/dashboard/donors/segmentation", icon: TrendingUp },
  { label: "Nurture", path: "/dashboard/donors/nurture", icon: Zap },
  { label: "Templates", path: "/dashboard/donors/templates", icon: Mail },
];

const DonorSubNav = () => {
  return (
    <div className="border-b bg-background px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Donor navigation">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DonorSubNav;
