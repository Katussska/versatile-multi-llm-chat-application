import { ReactNode, createContext, useContext, useMemo } from 'react';

import { useSession } from '@/hooks/auth-hooks';
import { authClient } from '@/lib/auth-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type AuthSessionData = NonNullable<ReturnType<typeof useSession>['data']>;

interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

type UserRole = 'USER' | 'ADMIN';
type AuthUser = AuthSessionData['user'] & { role?: UserRole };

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSessionData['session'] | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPending: boolean;
  loginError: string | null;
  logoutError: string | null;
  updateUserError: string | null;
  changePasswordError: string | null;
  logIn: (input: LoginInput) => Promise<void>;
  logOut: () => Promise<void>;
  updateUser: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending, isRefetching, refetch } = useSession();
  const queryClient = useQueryClient();

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

      queryClient.clear();
      await refetch();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await authClient.updateUser({ name });

      if (response.error) {
        throw new Error(response.error.message ?? 'Unable to update user.');
      }

      await refetch();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (response.error) {
        throw new Error(response.error.message ?? 'Unable to change password.');
      }
    },
  });

  const {
    isPending: signInPending,
    error: signInError,
    mutateAsync: signInMutateAsync,
  } = signInMutation;
  const {
    isPending: signOutPending,
    error: signOutError,
    mutateAsync: signOutMutateAsync,
  } = signOutMutation;
  const {
    isPending: updateUserPending,
    error: updateUserError,
    mutateAsync: updateUserMutateAsync,
  } = updateUserMutation;
  const {
    isPending: changePasswordPending,
    error: changePasswordError,
    mutateAsync: changePasswordMutateAsync,
  } = changePasswordMutation;

  const value = useMemo<AuthContextType>(
    () => ({
      user: (data?.user as AuthUser) ?? null,
      session: data?.session ?? null,
      isAuthenticated: Boolean(data?.session && data?.user),
      isAdmin: (data?.user as AuthUser | undefined)?.role === 'ADMIN',
      isPending:
        isPending ||
        isRefetching ||
        signInPending ||
        signOutPending ||
        updateUserPending ||
        changePasswordPending,
      loginError: signInError?.message ?? null,
      logoutError: signOutError?.message ?? null,
      updateUserError: updateUserError?.message ?? null,
      changePasswordError: changePasswordError?.message ?? null,
      logIn: async (input: LoginInput) => {
        await signInMutateAsync(input);
      },
      logOut: async () => {
        await signOutMutateAsync();
      },
      updateUser: async (name: string) => {
        await updateUserMutateAsync(name);
      },
      changePassword: async (currentPassword: string, newPassword: string) => {
        await changePasswordMutateAsync({ currentPassword, newPassword });
      },
    }),
    [
      data?.session,
      data?.user,
      isPending,
      isRefetching,
      signInPending,
      signInError,
      signInMutateAsync,
      signOutPending,
      signOutError,
      signOutMutateAsync,
      updateUserPending,
      updateUserError,
      updateUserMutateAsync,
      changePasswordPending,
      changePasswordError,
      changePasswordMutateAsync,
    ],
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
