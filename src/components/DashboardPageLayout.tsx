import { ReactNode, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";
import { Skeleton } from "./ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface DashboardPageLayoutProps {
  segments?: BreadcrumbSegment[];
  showBreadcrumbs?: boolean;
  loading?: boolean;
  showRosters?: boolean;
  children: (activeGroup: { id: string; group_name: string } | null) => ReactNode;
}

const DashboardPageLayout = ({
  segments,
  showBreadcrumbs = true,
  loading = false,
  showRosters,
  children,
}: DashboardPageLayoutProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { organizationUser } = useOrganizationUser();
  const [activeGroup, setActiveGroup] = useState<{ id: string; group_name: string } | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; group_name: string }>>([]);

  // Fetch groups and set initial activeGroup from URL
  useEffect(() => {
    const fetchGroups = async () => {
      if (!organizationUser) return;

      const permissionLevel = organizationUser.user_type.permission_level;
      
      if (permissionLevel === 'organization_admin') {
        const { data } = await supabase
          .from("groups")
          .select("id, group_name")
          .eq("organization_id", organizationUser.organization_id);
        
        setGroups(data || []);
        
        // Check URL for group parameter
        const groupIdFromUrl = searchParams.get('group');
        if (groupIdFromUrl && data) {
          const group = data.find(g => g.id === groupIdFromUrl);
          if (group) {
            setActiveGroup(group);
          }
        }
      } else if (permissionLevel === 'program_manager') {
        // Program managers automatically see only their assigned group
        if (organizationUser.groups) {
          setGroups([organizationUser.groups]);
          setActiveGroup(organizationUser.groups);
        }
      }
    };

    fetchGroups();
  }, [organizationUser, searchParams]);

  const handleGroupClick = (groupId: string | null) => {
    if (groupId === null) {
      setActiveGroup(null);
      searchParams.delete('group');
      setSearchParams(searchParams);
    } else {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setActiveGroup(group);
        searchParams.set('group', groupId);
        setSearchParams(searchParams);
      }
    }
  };

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
        <main className="flex-1 overflow-y-auto p-6">{children(activeGroup)}</main>
      </div>
    </div>
  );
};

export default DashboardPageLayout;
