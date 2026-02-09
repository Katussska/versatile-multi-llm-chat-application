import { ReactNode, createContext, useContext } from 'react';

interface AuthContextType {
  user: unknown;
  // session: unknown;
}

const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  // const [user, setUser] = useState<AuthUser | null>(null);
  // const [session, setSession] = useState<AuthSession | null>(null);

  // useEffect(() => {
  //   // const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  //   //   setSession(session);
  //   //   if (session?.user) setUser(session?.user);
  //   //   else setUser(null);
  //   // });
  //
  //   return () => {
  //     // authListener.subscription.unsubscribe();
  //   };
  // }, []);

  return (
    <AuthContext.Provider
      value={{
        user: {
          id: '433c4c22-9cd3-4203-97d8-56e7d387f44f',
          email: 'metr.pacinka@psp.cz',
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const { user } = useContext(AuthContext);
  // const navigate = useNavigate();

  const logOut = async () => {
    // const { error } = await supabase.auth.signOut({ scope: 'local' });
    // if (error) {
    //   throw Error(error.message);
    // }
    // navigate('/login');
  };

  return { user, logOut };
}
