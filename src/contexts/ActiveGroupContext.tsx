import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";

interface ActiveGroupContextType {
  activeGroup: { id: string; group_name: string } | null;
  groups: Array<{ id: string; group_name: string }>;
  handleGroupClick: (groupId: string | null) => void;
}

const ActiveGroupContext = createContext<ActiveGroupContextType | undefined>(undefined);

export const useActiveGroup = () => {
  const context = useContext(ActiveGroupContext);
  if (!context) {
    // Return a safe default when used outside the provider
    // This can happen during initial render before provider mounts
    return { activeGroup: null, groups: [], handleGroupClick: () => {} };
  }
  return context;
};

interface ActiveGroupProviderProps {
  children: ReactNode;
}

export const ActiveGroupProvider = ({ children }: ActiveGroupProviderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { organizationUser } = useOrganizationUser();
  const [activeGroup, setActiveGroup] = useState<{ id: string; group_name: string } | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; group_name: string }>>([]);

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
        
        const groupIdFromUrl = searchParams.get('group');
        if (groupIdFromUrl && data) {
          const group = data.find(g => g.id === groupIdFromUrl);
          if (group) {
            setActiveGroup(group);
          }
        }
      } else if (permissionLevel === 'program_manager' || permissionLevel === 'participant' || permissionLevel === 'supporter') {
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
    <ActiveGroupContext.Provider value={{ activeGroup, groups, handleGroupClick }}>
      {children}
    </ActiveGroupContext.Provider>
  );
};
