import TreeProvider from '@/components/TreeProvider.tsx';
import ChatSection from '@/components/chat/ChatSection.tsx';
import { Layout } from '@/components/layout.tsx';
import TreeSection from '@/components/tree/TreeSection.tsx';
import UserBadge from '@/components/userBadge/UserBadge.tsx';

import { ThemeProvider } from './components/userBadge/theme-provider.tsx';
import { AuthProvider } from './lib/authContext.tsx';
import Login from './routes/login.tsx';
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
        <TreeSection />
      </Layout>
    </TreeProvider>
  </ProtectedRoute>
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
