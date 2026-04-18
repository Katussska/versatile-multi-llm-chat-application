import { useContext, useEffect, useRef, useState } from 'react';

import { TreeContext } from '@/components/TreeProvider.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

import {
  Bug,
  ChevronDown,
  Heart,
  HeartOff,
  LogOut,
  MessageSquare,
  MessageSquareHeart,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

interface ChatMenuItemProps {
  chatId: string;
  title: string;
  isActive: boolean;
  isFavorite: boolean;
  icon?: 'chat' | 'heart' | 'message-heart';
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onRename: (newTitle: string) => void;
}

function ChatMenuItem({
  chatId,
  title,
  isActive,
  isFavorite,
  icon = 'chat',
  onSelect,
  onDelete,
  onToggleFavorite,
  onRename,
}: ChatMenuItemProps) {
  const { t } = useTranslation();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setIsRenaming(false);
  };

  const startRename = () => {
    setRenameValue(title);
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  return (
    <SidebarMenuItem key={chatId}>
      {isRenaming ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            ref={inputRef}
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            placeholder={t('sidebar.chatMenu.renamePlaceholder')}
            className="w-full rounded border border-sidebar-border bg-sidebar px-2 py-1 text-sm text-sidebar-foreground outline-none focus:border-sidebar-ring"
          />
        </div>
      ) : (
        <>
          <SidebarMenuButton isActive={isActive} onClick={onSelect}>
            {icon === 'heart' ? <Heart /> : icon === 'message-heart' ? <MessageSquareHeart /> : <MessageSquare />}
            <span className="min-w-0 truncate">{title}</span>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={startRename}>
                <Pencil className="mr-2 size-4" />
                {t('sidebar.chatMenu.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite}>
                {isFavorite ? (
                  <>
                    <HeartOff className="mr-2 size-4" />
                    {t('sidebar.chatMenu.removeFavorite')}
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 size-4" />
                    {t('sidebar.chatMenu.addFavorite')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 size-4" />
                {t('sidebar.chatMenu.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </SidebarMenuItem>
  );
}

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
    toggleFavorite,
    renameChat,
    getChatTitle,
    deleteChat,
  } = useContext(TreeContext);

  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [favoritesOverflows, setFavoritesOverflows] = useState(false);
  const favoritesMenuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = favoritesMenuRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setFavoritesOverflows(el.scrollHeight > el.clientHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [favoritesOpen]);

  const handleStartNewConversation = () => {
    startNewConversation();
    navigate('/');
  };

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    navigate(`/chat/${id}`);
  };

  const handleDeleteChat = async (id: string) => {
    await deleteChat(id);
    if ((routeChatId ?? selectedChatId) === id) {
      const remaining = chats.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        handleSelectChat(remaining[0].id);
      } else {
        startNewConversation();
        navigate('/');
      }
    }
  };

  const isActiveChatId = (id: string) =>
    !isNewConversation && (routeChatId ?? selectedChatId) === id;

  const favoriteChats = chats.filter((c) => c.favourite);

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
      <SidebarContent className="mx-2.5 mt-2.5 flex flex-col gap-0 overflow-hidden">
        {/* Oblíbené */}
        <SidebarGroup className="flex-shrink-0" style={{ minHeight: 0 }}>
          <SidebarGroupLabel
            className="cursor-pointer select-none"
            onClick={() => setFavoritesOpen((v) => !v)}>
            <span className="flex flex-1 items-center">
              {t('sidebar.favorites')}
            </span>
            <ChevronDown
              className="size-4 transition-transform duration-200"
              style={{ transform: favoritesOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </SidebarGroupLabel>
          {favoritesOpen && (
            <SidebarGroupContent className="relative flex flex-col" style={{ maxHeight: '400px' }}>
              <SidebarMenu ref={favoritesMenuRef} className="overflow-y-auto">
                {isChatsPending ? (
                  <div className="text-muted-foreground px-2 py-1 text-sm">
                    {t('sidebar.loading')}
                  </div>
                ) : favoriteChats.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1 text-sm">
                    {t('sidebar.emptyFavorites')}
                  </div>
                ) : (
                  favoriteChats.map((chat) => (
                    <ChatMenuItem
                      key={chat.id}
                      chatId={chat.id}
                      title={getChatTitle(chat)}
                      isActive={isActiveChatId(chat.id)}
                      isFavorite={true}
                      icon="heart"
                      onSelect={() => handleSelectChat(chat.id)}
                      onDelete={() => handleDeleteChat(chat.id)}
                      onToggleFavorite={() => void toggleFavorite(chat.id)}
                      onRename={(title) => void renameChat(chat.id, title)}
                    />
                  ))
                )}
              </SidebarMenu>
              {favoritesOverflows && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sidebar via-sidebar/60 to-transparent" />
              )}
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Všechny konverzace */}
        <SidebarGroup className="flex min-h-0 flex-1 flex-col">
          <SidebarGroupLabel
            className="cursor-pointer select-none"
            onClick={() => setChatsOpen((v) => !v)}>
            <span className="flex flex-1 items-center">
              {t('sidebar.chats')}
            </span>
            <ChevronDown
              className="size-4 transition-transform duration-200"
              style={{ transform: chatsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </SidebarGroupLabel>
          {chatsOpen && (
            <SidebarGroupContent className="relative flex min-h-0 flex-1 flex-col">
              <SidebarMenu className="flex-1 overflow-y-auto">
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
                    <ChatMenuItem
                      key={chat.id}
                      chatId={chat.id}
                      title={getChatTitle(chat)}
                      isActive={isActiveChatId(chat.id)}
                      isFavorite={chat.favourite}
                      icon={chat.favourite ? 'message-heart' : 'chat'}
                      onSelect={() => handleSelectChat(chat.id)}
                      onDelete={() => handleDeleteChat(chat.id)}
                      onToggleFavorite={() => void toggleFavorite(chat.id)}
                      onRename={(title) => void renameChat(chat.id, title)}
                    />
                  ))
                )}
              </SidebarMenu>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-sidebar via-sidebar/60 to-transparent" />
            </SidebarGroupContent>
          )}
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
