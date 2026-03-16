import { useEffect } from 'react';

import { useSession } from '@/hooks/auth-hooks';

export default function Profile() {
  const { user, isPending, error, refetch } = useSession();

  useEffect(() => {
    console.log('[profile] session state', {
      isPending,
      error,
      user,
    });
  }, [error, isPending, user]);

  return (
    <div>
      <h1>Profile Page</h1>
      <p>Better Auth + React Query smoke test:</p>
      {isPending ? <p>Loading session...</p> : null}
      {error ? <p>Session error: {error.message}</p> : null}
      {user ? (
        <p>User: {user.email ?? user.name ?? user.id}</p>
      ) : (
        <p>No active session.</p>
      )}
      <button type="button" onClick={() => void refetch()}>
        Refetch session
      </button>
    </div>
  );
}
