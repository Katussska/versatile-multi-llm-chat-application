import TreeProvider from '@/components/TreeProvider.tsx';
import ChatSection from '@/components/chat/ChatSection.tsx';
import { Layout } from '@/components/layout.tsx';
import TreeSection from '@/components/tree/TreeSection.tsx';
import UserBadge from '@/components/userBadge/UserBadge.tsx';
import Profile from '@/routes/profile.tsx';

import { ThemeProvider } from './components/userBadge/theme-provider.tsx';
import { AuthProvider } from './lib/authContext.tsx';
import Login from './routes/login.tsx';
import ProtectedRoute from './routes/protected-route.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout className="flex flex-row">
          <TreeProvider>
            <UserBadge />
            <ChatSection />
            <TreeSection />
          </TreeProvider>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
    ),
  },
]);

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
