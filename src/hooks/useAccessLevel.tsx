
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AccessLevel = 'trial' | 'pro' | 'free';

interface AccessLevelContextType {
  accessLevel: AccessLevel;
  loading: boolean;
  daysLeft: number | null;
  refreshAccessLevel: () => Promise<void>;
}

const AccessLevelContext = createContext<AccessLevelContextType | undefined>(undefined);

export const useAccessLevel = () => {
  const context = useContext(AccessLevelContext);
  if (context === undefined) {
    throw new Error("useAccessLevel must be used within an AccessLevelProvider");
  }
  return context;
};

interface AccessLevelProviderProps {
  children: ReactNode;
  user: User | null;
}

export const AccessLevelProvider = ({ children, user }: AccessLevelProviderProps) => {
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('free');
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const refreshAccessLevel = async () => {
    if (!user) {
      setAccessLevel('free');
      setDaysLeft(null);
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('get-user-access-level', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking access level:", error);
        setAccessLevel('free');
        setDaysLeft(null);
      } else {
        setAccessLevel(data.accessLevel);
        setDaysLeft(data.daysLeft);
      }
    } catch (error) {
      console.error("Error checking access level:", error);
      setAccessLevel('free');
      setDaysLeft(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccessLevel();
  }, [user]);

  return (
    <AccessLevelContext.Provider
      value={{
        accessLevel,
        loading,
        daysLeft,
        refreshAccessLevel,
      }}
    >
      {children}
    </AccessLevelContext.Provider>
  );
};
