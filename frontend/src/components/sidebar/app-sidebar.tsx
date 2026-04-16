import { useContext } from 'react';

import { TreeContext } from '@/components/TreeProvider.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
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
import { formatChatTitle } from '@/lib/chatTitle.ts';

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
      <SidebarContent className="m-2.5">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.chats')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="max-h-[calc(100svh-16rem)]">
              <SidebarMenu>
                {isChatsPending ? (
                  <div className="text-muted-foreground px-2 py-1 text-sm">
                    Načítám...
                  </div>
                ) : hasChatsError ? (
                  <div className="text-destructive px-2 py-1 text-sm">
                    Nepodařilo se načíst chaty.
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1 text-sm">
                    Zatím žádné chaty
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
                        <span>{formatChatTitle(chat.title)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
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
            navigate('/login');
          }}>
          <LogOut className="mr-3" size={16} />
          {t('sidebar.logout')}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
