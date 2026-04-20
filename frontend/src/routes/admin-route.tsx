import { ReactNode } from 'react';

import { useAuthContext } from '@/lib/authContext.tsx';

import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isPending } = useAuthContext();

  if (isPending) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
