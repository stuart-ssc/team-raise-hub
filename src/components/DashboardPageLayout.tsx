import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "./DashboardSidebar";
import DashboardSidebarSheet from "./DashboardSidebarSheet";
import DashboardHeader from "./DashboardHeader";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";
import { Skeleton } from "./ui/skeleton";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { NoIndex } from "./seo/NoIndex";

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface DashboardPageLayoutProps {
  segments?: BreadcrumbSegment[];
  showBreadcrumbs?: boolean;
  loading?: boolean;
  showRosters?: boolean;
  hideGroupsFilter?: boolean;
  children: ReactNode;
}

const DashboardPageLayout = ({
  segments,
  showBreadcrumbs = true,
  loading = false,
  showRosters,
  hideGroupsFilter,
  children,
}: DashboardPageLayoutProps) => {
  const { activeGroup, handleGroupClick } = useActiveGroup();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user profile for sidebar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
        const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "U";
        setUserName(fullName);
        setUserInitials(initials);
        setAvatarUrl(profile.avatar_url);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    navigate("/dashboard/profile");
  };

  return (
    <div className="flex h-screen bg-background w-full">
      <NoIndex />
      <DashboardSidebar />
      <DashboardSidebarSheet 
        open={mobileMenuOpen} 
        onOpenChange={setMobileMenuOpen}
        userName={userName}
        userInitials={userInitials}
        avatarUrl={avatarUrl}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onGroupClick={handleGroupClick}
          activeGroup={activeGroup}
          showRosters={showRosters}
          hideGroupsFilter={hideGroupsFilter}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />
        {showBreadcrumbs && (
          loading ? (
            <div className="border-b border-primary/20 bg-primary/10 px-6 py-2 flex items-center gap-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
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
