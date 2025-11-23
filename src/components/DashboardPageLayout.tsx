import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface DashboardPageLayoutProps {
  segments?: BreadcrumbSegment[];
  showBreadcrumbs?: boolean;
  activeGroup?: { id: string; group_name: string } | null;
  onGroupClick?: (groupId: string | null) => void;
  showRosters?: boolean;
  children: ReactNode;
}

const DashboardPageLayout = ({
  segments,
  showBreadcrumbs = true,
  activeGroup,
  onGroupClick,
  showRosters,
  children,
}: DashboardPageLayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onGroupClick={onGroupClick || (() => {})}
          activeGroup={activeGroup}
          showRosters={showRosters}
        />
        {showBreadcrumbs && segments && <DashboardBreadcrumbs segments={segments} />}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardPageLayout;
