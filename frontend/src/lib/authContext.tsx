import { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from '@/supabase.ts';
import { AuthSession, AuthUser } from '@supabase/supabase-js';

import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) setUser(session?.user);
      else setUser(null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session }}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const { user, session } = useContext(AuthContext);
  const navigate = useNavigate();

  const logOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      throw Error(error.message);
    }
    navigate('/login');
  };

  return { user, session, logOut };
}
