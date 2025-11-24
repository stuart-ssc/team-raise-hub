import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardSidebarSheet from "./DashboardSidebarSheet";
import DashboardHeader from "./DashboardHeader";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";
import { Skeleton } from "./ui/skeleton";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface DashboardPageLayoutProps {
  segments?: BreadcrumbSegment[];
  showBreadcrumbs?: boolean;
  loading?: boolean;
  showRosters?: boolean;
  children: ReactNode;
}

const DashboardPageLayout = ({
  segments,
  showBreadcrumbs = true,
  loading = false,
  showRosters,
  children,
}: DashboardPageLayoutProps) => {
  const { activeGroup, handleGroupClick } = useActiveGroup();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background w-full">
      <DashboardSidebar />
      <DashboardSidebarSheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-16 lg:ml-64">
        <DashboardHeader
          onGroupClick={handleGroupClick}
          activeGroup={activeGroup}
          showRosters={showRosters}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />
        {showBreadcrumbs && (
          loading ? (
            <div className="border-b border-primary/20 bg-primary/10 px-6 py-2">
              <div className="max-w-7xl mx-auto flex items-center gap-2">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
          ) : (
            segments && <DashboardBreadcrumbs segments={segments} />
          )
        )}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardPageLayout;
