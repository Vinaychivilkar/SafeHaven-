import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import { createMockUser, getMockUser, removeMockUser } from "@/lib/mockAuth";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the component as a named function declaration for better HMR support
const AuthProviderComponent = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get session from Supabase
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        // If user exists in Supabase, we don't need to do anything else
        if (data.session?.user) {
          console.log("User authenticated with Supabase", data.session.user);
        } else {
          // Check for mock user if no Supabase session
          const mockUser = getMockUser();
          if (mockUser) {
            console.log("Using mock user:", mockUser);
            setUser({
              id: mockUser.id,
              email: mockUser.email,
              created_at: mockUser.created_at,
            } as User);
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        // Fallback to mock user
        const mockUser = getMockUser();
        if (mockUser) {
          console.log("Using mock user (fallback):", mockUser);
          setUser({
            id: mockUser.id,
            email: mockUser.email,
            created_at: mockUser.created_at,
          } as User);
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up auth state change listener:", error);
      return () => {};
    }
  }, []);

  const signOut = async () => {
    try {
      // Try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out from Supabase:", error);
    }

    // Always remove mock user
    removeMockUser();
    setUser(null);
    setSession(null);
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the component with a consistent name
export const AuthProvider = AuthProviderComponent;

// Keep the hook as a separate named function for consistency
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
