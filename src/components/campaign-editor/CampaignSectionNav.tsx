import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText,
  Calendar,
  Package,
  Heart,
  Users,
  ListPlus,
  Megaphone,
  ShoppingCart,
  ImageIcon,
  DollarSign,
  HandCoins,
  ClipboardCheck,
  CalendarClock,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type SectionKey =
  | "details"
  | "schedule"
  | "items"
  | "experience"
  | "fees"
  | "team"
  | "fields"
  | "pitch"
  | "orders"
  | "assets"
  | "pledgeSettings"
  | "pledgeResults"
  | "eventDetails"
  | "eventLocation"
  | "eventAgenda"
  | "merchFulfillment";

interface NavItem {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface CampaignSectionNavProps {
  active: SectionKey;
  onChange: (section: SectionKey) => void;
  counts: {
    items: number;
    fields: number;
    orders: number;
    assets: number;
  };
  showManage: boolean;
  showPitch: boolean;
  showItems: boolean;
  isPledge?: boolean;
  showPledgeResults?: boolean;
  isEvent?: boolean;
  isMerchandise?: boolean;
}

export function CampaignSectionNav({
  active,
  onChange,
  counts,
  showManage,
  showPitch,
  showItems,
  isPledge,
  showPledgeResults,
  isEvent,
  isMerchandise,
}: CampaignSectionNavProps) {
  const setupItems: NavItem[] = [
    { key: "details", label: "Details", icon: FileText },
    { key: "schedule", label: "Schedule", icon: Calendar },
    { key: "fees", label: "Fees", icon: DollarSign },
    ...(isEvent
      ? [
          { key: "eventLocation" as const, label: "Location", icon: CalendarClock },
          { key: "eventAgenda" as const, label: "Agenda", icon: Calendar },
        ]
      : []),
    ...(isMerchandise
      ? [{ key: "merchFulfillment" as const, label: "Fulfillment", icon: Truck }]
      : []),
    ...(isPledge
      ? [{ key: "pledgeSettings" as const, label: "Pledge Setup", icon: HandCoins }]
      : []),
    ...(showItems && !isPledge
      ? [{ key: "items" as const, label: "Items", icon: Package, count: counts.items }]
      : []),
    { key: "experience", label: "Experience", icon: Heart },
    { key: "team", label: "Team", icon: Users },
    { key: "fields", label: "Fields", icon: ListPlus, count: counts.fields },
    ...(showPitch
      ? [{ key: "pitch" as const, label: "Pitch", icon: Megaphone }]
      : []),
  ];

  const manageItems: NavItem[] = [
    { key: "orders", label: "Orders", icon: ShoppingCart, count: counts.orders },
    ...(showPledgeResults
      ? [{ key: "pledgeResults" as const, label: "Results", icon: ClipboardCheck }]
      : []),
    { key: "assets", label: "Assets", icon: ImageIcon, count: counts.assets },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = active === item.key;
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onChange(item.key)}
        className={cn(
          "group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </span>
        {typeof item.count === "number" && (
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="space-y-6">
      <div>
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Setup
        </p>
        <div className="space-y-1">{setupItems.map(renderItem)}</div>
      </div>
      {showManage && (
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Manage
          </p>
          <div className="space-y-1">{manageItems.map(renderItem)}</div>
        </div>
      )}
    </nav>
  );
}
