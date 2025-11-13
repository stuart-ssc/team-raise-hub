import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  activeGroup?: {
    id: string;
    group_name: string;
  } | null;
  onGroupClick?: (groupId: string | null) => void;
  showRosters?: boolean;
}

const DashboardHeader = ({ activeGroup, onGroupClick, showRosters }: DashboardHeaderProps) => {
  const { signOut, user } = useAuth();
  const { schoolUser } = useSchoolUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [groups, setGroups] = useState<Array<{id: string, group_name: string}>>([]);
  const [userInitials, setUserInitials] = useState("U");

  // Fetch user profile for initials
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "U";
        setUserInitials(initials);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch groups based on user role
  useEffect(() => {
    const fetchGroups = async () => {
      if (!schoolUser) return;

      const userRole = schoolUser.user_type.name;
      
      if (userRole === "Principal") {
        // Principal sees all groups for their school
        const { data } = await supabase
          .from("groups")
          .select("id, group_name")
          .eq("school_id", schoolUser.school_id);
        
        setGroups(data || []);
      } else if (userRole === "Athletic Director") {
        // Athletic Director sees all sports teams
        const { data } = await supabase
          .from("groups")
          .select("id, group_name, group_type!inner(name)")
          .eq("school_id", schoolUser.school_id)
          .eq("group_type.name", "Sports Team");
        
        setGroups(data || []);
      } else if (["Coach", "Club Sponsor", "Booster Leader", "Team Player", "Club Participant", "Family Member"].includes(userRole)) {
        // These roles only see groups they're connected to
        if (schoolUser.groups) {
          setGroups([schoolUser.groups]);
        }
      }
    };

    fetchGroups();
  }, [schoolUser]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="bg-background px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 id="school-name-title" className="text-xl md:text-3xl font-bold text-foreground">{schoolUser?.schools?.school_name || "School"}</h1>
         <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
           <span className="text-muted-foreground text-sm md:text-base">Teams/Groups:</span>
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
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 self-start md:self-auto">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;