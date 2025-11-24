import { ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useNavigate } from "react-router-dom";
import { getLabel } from "@/lib/terminology";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotificationDropdown from "@/components/NotificationDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  activeGroup?: {
    id: string;
    group_name: string;
  } | null;
  onGroupClick?: (groupId: string | null) => void;
  showRosters?: boolean;
  onMobileMenuClick?: () => void;
}

const DashboardHeader = ({ activeGroup, onGroupClick, showRosters, onMobileMenuClick }: DashboardHeaderProps) => {
  const { signOut, user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Array<{id: string, group_name: string}>>([]);
  const [userInitials, setUserInitials] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user profile for initials and avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "U";
        setUserInitials(initials);
        setAvatarUrl(profile.avatar_url);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch groups based on user permission level
  useEffect(() => {
    const fetchGroups = async () => {
      if (!organizationUser) return;

      const permissionLevel = organizationUser.user_type.permission_level;
      
      if (permissionLevel === 'organization_admin') {
        // Organization admins see all groups in their organization
        const { data } = await supabase
          .from("groups")
          .select("id, group_name")
          .eq("organization_id", organizationUser.organization_id);
        
        setGroups(data || []);
      } else if (permissionLevel === 'program_manager' || permissionLevel === 'participant' || permissionLevel === 'supporter') {
        // These roles only see groups they're connected to
        if (organizationUser.groups) {
          setGroups([organizationUser.groups]);
        }
      }
    };

    fetchGroups();
  }, [organizationUser]);

  const handleLogout = async () => {
    await signOut();
  };

  const isMobile = useIsMobile();
  const shouldUseDropdown = isMobile || groups.length >= 4;

  const selectedGroupName = activeGroup 
    ? groups.find(g => g.id === activeGroup.id)?.group_name 
    : "All";

  return (
    <header className="bg-background px-4 md:px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col gap-1 flex-1">
          <h1 id="school-name-title" className="text-xl md:text-3xl font-bold text-foreground">
            {organizationUser?.organization?.name || "Organization"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-1">
            <span className="text-muted-foreground text-sm md:text-base">
              {organizationUser?.organization ? getLabel(organizationUser.organization.organization_type, 'programs') : 'Programs'}:
            </span>
            
            {shouldUseDropdown ? (
              <Select
                value={activeGroup?.id || "all"}
                onValueChange={(value) => onGroupClick && onGroupClick(value === "all" ? null : value)}
                disabled={showRosters}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs md:text-sm">
                  <SelectValue>{selectedGroupName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {groups
                    .sort((a, b) => a.group_name.localeCompare(b.group_name))
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.group_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Badge 
                  variant={!activeGroup ? "default" : "secondary"}
                  className={`text-xs md:text-sm ${showRosters ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!showRosters && onGroupClick) {
                      onGroupClick(null);
                    }
                  }}
                >
                  All
                </Badge>
                {groups
                  .sort((a, b) => a.group_name.localeCompare(b.group_name))
                  .map((group) => (
                    <Badge 
                      key={group.id} 
                      variant={activeGroup?.id === group.id ? "default" : "secondary"}
                      className="cursor-pointer text-xs md:text-sm"
                      onClick={() => onGroupClick && onGroupClick(group.id)}
                    >
                      {group.group_name}
                    </Badge>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-2 md:gap-4">
        <NotificationDropdown />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;