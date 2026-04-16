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
import { useNavigate } from 'react-router-dom';

const CHAT_TITLE_MAX_LENGTH = 34;

function truncateChatTitle(title: string): string {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length <= CHAT_TITLE_MAX_LENGTH) {
    return normalizedTitle;
  }

  return `${normalizedTitle.slice(0, CHAT_TITLE_MAX_LENGTH).trimEnd()}...`;
}

export function AppSidebar() {
  const { logOut } = useAuthContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    chats,
    isChatsPending,
    hasChatsError,
    selectedChatId,
    setSelectedChatId,
    startNewConversation,
    isNewConversation,
  } = useContext(TreeContext);

  return (
    <Sidebar>
      <SidebarHeader className="m-2.5">
        <Button onClick={startNewConversation}>
          <Plus />
        </Button>
      </SidebarHeader>
      <SidebarContent className="m-2.5">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.chats')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isChatsPending ? (
                <div className="text-muted-foreground px-2 py-1 text-sm">Načítám...</div>
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
                      isActive={!isNewConversation && selectedChatId === chat.id}
                      onClick={() => setSelectedChatId(chat.id)}>
                      <MessageSquare />
                      <span>{truncateChatTitle(chat.title)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
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
            navigate('/login');
          }}>
          <LogOut className="mr-3" size={16} />
          {t('sidebar.logout')}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
