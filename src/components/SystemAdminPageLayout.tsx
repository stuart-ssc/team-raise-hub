import { ReactNode, useEffect, useState } from "react";
import { SystemAdminSidebar } from "./SystemAdminSidebar";
import { SystemAdminSidebarSheet } from "./SystemAdminSidebarSheet";
import { SystemAdminHeader } from "./SystemAdminHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SystemAdminPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const SystemAdminPageLayout = ({ children, title, subtitle }: SystemAdminPageLayoutProps) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        setUserName(fullName || "System Admin");
        
        const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
        setUserInitials(initials || "SA");
        
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="min-h-screen flex w-full">
      <SystemAdminSidebar />
      <SystemAdminSidebarSheet 
        open={mobileMenuOpen} 
        onOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex flex-1 flex-col">
        <SystemAdminHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          userName={userName}
          userInitials={userInitials}
          avatarUrl={avatarUrl}
          title={title}
          subtitle={subtitle}
        />
        
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};
