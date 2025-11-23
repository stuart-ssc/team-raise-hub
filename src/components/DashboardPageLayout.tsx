import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";
import { Skeleton } from "./ui/skeleton";
import { ActiveGroupProvider, useActiveGroup } from "@/contexts/ActiveGroupContext";

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

const DashboardPageLayoutContent = ({
  segments,
  showBreadcrumbs = true,
  loading = false,
  showRosters,
  children,
}: DashboardPageLayoutProps) => {
  const { activeGroup, handleGroupClick } = useActiveGroup();

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onGroupClick={handleGroupClick}
          activeGroup={activeGroup}
          showRosters={showRosters}
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

const DashboardPageLayout = (props: DashboardPageLayoutProps) => {
  return (
    <ActiveGroupProvider>
      <DashboardPageLayoutContent {...props} />
    </ActiveGroupProvider>
  );
};

export default DashboardPageLayout;
