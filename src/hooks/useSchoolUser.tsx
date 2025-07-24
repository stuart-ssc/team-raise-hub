import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SchoolUserData {
  id: string;
  school_id: string;
  group_id: string | null;
  user_type_id: string;
  schools: {
    id: string;
    school_name: string;
    city: string;
    state: string;
  };
  groups: {
    id: string;
    group_name: string;
  } | null;
  user_type: {
    id: string;
    name: string;
  };
}

interface SchoolUserContextType {
  schoolUser: SchoolUserData | null;
  loading: boolean;
  setSchoolUser: (data: SchoolUserData | null) => void;
  refreshSchoolUser: () => Promise<void>;
}

const SchoolUserContext = createContext<SchoolUserContextType | undefined>(undefined);

export const SchoolUserProvider = ({ children }: { children: ReactNode }) => {
  const [schoolUser, setSchoolUser] = useState<SchoolUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSchoolUser = async () => {
    if (!user) {
      console.log("No user found, setting schoolUser to null");
      setSchoolUser(null);
      setLoading(false);
      return;
    }

    console.log("Fetching school user for user:", user.id);
    
    try {
      const { data, error } = await supabase
        .from("school_user")
        .select(`
          *,
          schools!inner(id, school_name, city, state),
          groups(id, group_name),
          user_type!inner(id, name)
        `)
        .eq("user_id", user.id)
        .single();

      console.log("School user query result:", { data, error });

      if (error && error.code !== "PGRST116") { // PGRST116 means no rows returned
        console.error("Error fetching school user:", error);
        return;
      }

      console.log("Setting schoolUser to:", data || null);
      setSchoolUser(data || null);
    } catch (error) {
      console.error("Error fetching school user:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSchoolUser = async () => {
    setLoading(true);
    await fetchSchoolUser();
  };

  useEffect(() => {
    fetchSchoolUser();
  }, [user]);

  return (
    <SchoolUserContext.Provider 
      value={{
        schoolUser,
        loading,
        setSchoolUser,
        refreshSchoolUser,
      }}
    >
      {children}
    </SchoolUserContext.Provider>
  );
};

export const useSchoolUser = () => {
  const context = useContext(SchoolUserContext);
  if (context === undefined) {
    throw new Error("useSchoolUser must be used within a SchoolUserProvider");
  }
  return context;
};