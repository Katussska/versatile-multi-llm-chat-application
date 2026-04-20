import TreeProvider from '@/components/TreeProvider.tsx';
import AdminSection from '@/components/admin/AdminSection.tsx';
import ChatSection from '@/components/chat/ChatSection.tsx';
import { Layout } from '@/components/layout.tsx';
import ProfileSection from '@/components/profile/ProfileSection.tsx';
import UserBadge from '@/components/userBadge/UserBadge.tsx';

import { ThemeProvider } from './components/userBadge/theme-provider.tsx';
import { AuthProvider } from './lib/authContext.tsx';
import Login from './routes/login.tsx';
import AdminRoute from './routes/admin-route.tsx';
import ProtectedRoute from './routes/protected-route.tsx';
import RouteError from './routes/route-error.tsx';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

const appShell = (
  <ProtectedRoute>
    <TreeProvider>
      <Layout className="flex flex-row">
        <UserBadge />
        <ChatSection />
      </Layout>
    </TreeProvider>
  </ProtectedRoute>
);

const profileShell = (
  <ProtectedRoute>
    <TreeProvider>
      <Layout className="flex flex-row">
        <UserBadge />
        <ProfileSection />
      </Layout>
    </TreeProvider>
  </ProtectedRoute>
);

const adminShell = (
  <AdminRoute>
    <TreeProvider>
      <Layout className="flex flex-row">
        <UserBadge />
        <AdminSection />
      </Layout>
    </TreeProvider>
  </AdminRoute>
);

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteError />,
    element: appShell,
  },
  {
    path: '/chat/:id',
    errorElement: <RouteError />,
    element: appShell,
  },
  {
    path: '/profile',
    errorElement: <RouteError />,
    element: profileShell,
  },
  {
    path: '/admin',
    errorElement: <RouteError />,
    element: adminShell,
  },
  {
    path: '/login',
    errorElement: <RouteError />,
    element: <Login />,
  },
]);

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" offset="96px" />
      </AuthProvider>
    </ThemeProvider>
  );
}
