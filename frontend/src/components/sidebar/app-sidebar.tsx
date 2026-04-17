import { useContext } from 'react';

import { TreeContext } from '@/components/TreeProvider.tsx';
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
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

import { Bug, LogOut, MessageSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

export function AppSidebar() {
  const { logOut } = useAuthContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: routeChatId } = useParams<{ id: string }>();
  const {
    chats,
    isChatsPending,
    hasChatsError,
    selectedChatId,
    setSelectedChatId,
    startNewConversation,
    isNewConversation,
  } = useContext(TreeContext);

  const handleStartNewConversation = () => {
    startNewConversation();
    navigate('/');
  };

  return (
    <Sidebar>
      <SidebarHeader className="m-2.5">
        <Button
          onClick={handleStartNewConversation}
          variant="outline"
          className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
          <Plus />
          {t('sidebar.newChat')}
        </Button>
      </SidebarHeader>
      <SidebarContent className="mx-2.5 mt-2.5">
        <SidebarGroup className="flex-1 min-h-0">
          <SidebarGroupLabel>{t('sidebar.chats')}</SidebarGroupLabel>
          <SidebarGroupContent className="relative flex flex-1 flex-col min-h-0">
            <SidebarMenu className="flex-1 min-h-0 overflow-y-auto">
                {isChatsPending ? (
                  <div className="text-muted-foreground px-2 py-1 text-sm">
                    {t('sidebar.loading')}
                  </div>
                ) : hasChatsError ? (
                  <div className="text-destructive px-2 py-1 text-sm">
                    {t('sidebar.loadError')}
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1 text-sm">
                    {t('sidebar.empty')}
                  </div>
                ) : (
                  chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        isActive={
                          !isNewConversation &&
                          (routeChatId ?? selectedChatId) === chat.id
                        }
                        onClick={() => {
                          setSelectedChatId(chat.id);
                          navigate(`/chat/${chat.id}`);
                        }}>
                        <MessageSquare />
                        <span className="min-w-0 truncate">{chat.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
            </SidebarMenu>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-sidebar via-sidebar/60 to-transparent" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mx-2.5 h-[80px] justify-center gap-3 p-2">
        <div
          className="flex cursor-pointer flex-row items-center px-2"
          onClick={() =>
            window.open('https://github.com/Katussska/Cognify/issues', '_blank')
          }>
          <Bug className="mr-3" size={16} />
          {t('sidebar.bugReport')}
        </div>
        <div
          className="flex cursor-pointer flex-row items-center px-2"
          onClick={async () => {
            await logOut();
            navigate('/login');
          }}>
          <LogOut className="mr-3" size={16} />
          {t('sidebar.logout')}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
