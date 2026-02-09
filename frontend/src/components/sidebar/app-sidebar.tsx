import { Button } from '@/components/ui/button.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

import { Bug, LogOut, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
  const { logOut } = useAuthContext();
  const { t } = useTranslation();

  return (
    <Sidebar>
      <SidebarHeader className="m-2.5">
        <Button>
          <Plus />
        </Button>
      </SidebarHeader>
      <SidebarContent className="m-2.5">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.chats')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>// chats</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.groupChats')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>// group chats</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="m-2.5">
        <div
          className="flex cursor-pointer flex-row items-center"
          onClick={() =>
            window.open('https://github.com/Katussska/Cognify/issues', '_blank')
          }>
          <Bug className="mr-3" size={16} />
          {t('sidebar.bugReport')}
        </div>
        <div
          className="my-2 flex cursor-pointer flex-row items-center"
          onClick={async () => {
            await logOut();
          }}>
          <LogOut className="mr-3" size={16} />
          {t('sidebar.logout')}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
