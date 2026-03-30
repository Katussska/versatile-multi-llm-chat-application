import { ReactNode, createContext, useContext, useMemo } from 'react';

import { useSession } from '@/hooks/auth-hooks';
import { authClient } from '@/lib/auth-client';
import { useMutation } from '@tanstack/react-query';

type AuthSessionData = NonNullable<ReturnType<typeof useSession>['data']>;

interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: AuthSessionData['user'] | null;
  session: AuthSessionData['session'] | null;
  isAuthenticated: boolean;
  isPending: boolean;
  loginError: string | null;
  logoutError: string | null;
  logIn: (input: LoginInput) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending, isRefetching, refetch } = useSession();

  const signInMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await authClient.signIn.email({
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe ?? true,
      });

      if (response.error) {
        throw new Error(response.error.message ?? 'Unable to sign in.');
      }

      await refetch();
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.signOut();

      if (response.error) {
        throw new Error(response.error.message ?? 'Unable to sign out.');
      }

      await refetch();
    },
  });

  const value = useMemo<AuthContextType>(
    () => ({
      user: data?.user ?? null,
      session: data?.session ?? null,
      isAuthenticated: Boolean(data?.session && data?.user),
      isPending:
        isPending ||
        isRefetching ||
        signInMutation.isPending ||
        signOutMutation.isPending,
      loginError: signInMutation.error?.message ?? null,
      logoutError: signOutMutation.error?.message ?? null,
      logIn: async (input: LoginInput) => {
        await signInMutation.mutateAsync(input);
      },
      logOut: async () => {
        await signOutMutation.mutateAsync();
      },
    }),
    [data?.session, data?.user, isPending, isRefetching, signInMutation, signOutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider.');
  }

  return context;
}
