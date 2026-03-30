import { ReactNode } from 'react';

import { useAuthContext } from '@/lib/authContext.tsx';

import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isPending } = useAuthContext();

  if (isPending) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
