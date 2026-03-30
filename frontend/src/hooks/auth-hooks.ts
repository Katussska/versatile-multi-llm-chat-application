import { authClient } from '@/lib/auth-client';
import { createAuthHooks } from '@daveyplate/better-auth-tanstack';

export const authHooks = createAuthHooks(authClient);

export const {
  useSession,
  useToken,
  useListAccounts,
  useListSessions,
  useUpdateUser,
  useUnlinkAccount,
  useRevokeOtherSessions,
  useRevokeSession,
  useRevokeSessions,
  useAuthQuery,
  useAuthMutation,
} = authHooks;
