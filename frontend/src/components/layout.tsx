import { ReactNode } from 'react';

import { AppSidebar } from '@/components/sidebar/app-sidebar.tsx';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar.tsx';
import { cn } from '@/lib/utils.ts';

export function Layout({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className={cn('w-full', className)}>
        <SidebarTrigger className="absolute" />
        {children}
      </main>
    </SidebarProvider>
  );
}
