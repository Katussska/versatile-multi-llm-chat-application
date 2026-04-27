import { getBackendOrigin } from '@/lib/api-url.ts';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: getBackendOrigin(),
  fetchOptions: {
    credentials: 'include',
  },
});
