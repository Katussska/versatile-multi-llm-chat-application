import TreeProvider from '@/components/TreeProvider.tsx';
import AdminSection from '@/components/admin/AdminSection.tsx';
import ChatSection from '@/components/chat/ChatSection.tsx';
import { Layout } from '@/components/layout.tsx';
import ProfileSection from '@/components/profile/ProfileSection.tsx';
import UserBadge from '@/components/userBadge/UserBadge.tsx';

import { ThemeProvider } from './components/userBadge/theme-provider.tsx';
import { AuthProvider } from './lib/authContext.tsx';
import AdminRoute from './routes/admin-route.tsx';
import Login from './routes/login.tsx';
import ProtectedRoute from './routes/protected-route.tsx';
import RouteError from './routes/route-error.tsx';
import { Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// ChatSection stays mounted across chat/profile navigation so streaming isn't interrupted.
// Hidden via CSS when on profile; ProfileSection renders via Outlet.
function ChatProfileLayout() {
  const location = useLocation();
  const isProfileRoute = location.pathname === '/profile';

  return (
    <ProtectedRoute>
      <Layout className="flex flex-row">
        <UserBadge />
        <div className={isProfileRoute ? 'hidden' : 'contents'}>
          <ChatSection />
        </div>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}

const adminShell = (
  <AdminRoute>
    <Layout className="flex flex-row">
      <UserBadge />
      <AdminSection />
    </Layout>
  </AdminRoute>
);

const router = createBrowserRouter([
  {
    element: <ChatProfileLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: null },
      { path: 'chat/:id', element: null },
      { path: 'profile', element: <ProfileSection /> },
    ],
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
        <TreeProvider>
          <RouterProvider router={router} />
        </TreeProvider>
        <Toaster position="bottom-center" offset="96px" />
      </AuthProvider>
    </ThemeProvider>
  );
}
