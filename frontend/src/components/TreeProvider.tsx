import {
  Dispatch,
  type ReactNode,
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from 'react';

import { $api } from '@/api/client.ts';
import { useQueryClient } from '@tanstack/react-query';

export interface ChatListItem {
  id: string;
  title: string;
  modelId: string;
  favourite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TreeContextType {
  chats: ChatListItem[];
  isChatsPending: boolean;
  hasChatsError: boolean;
  selectedChatId: string;
  setSelectedChatId: Dispatch<SetStateAction<string>>;
  startNewConversation: () => void;
  isNewConversation: boolean;
  toggleFavorite: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  getChatTitle: (chat: ChatListItem) => string;
  deleteChat: (id: string) => Promise<void>;
  deleteNonFavoriteChats: () => Promise<void>;
  deleteAllChats: () => Promise<void>;
  isDeletingChat: boolean;
  isDeletingNonFavoriteChats: boolean;
  isDeletingAllChats: boolean;
}

export const TreeContext = createContext<TreeContextType>({
  chats: [],
  isChatsPending: false,
  hasChatsError: false,
  selectedChatId: '',
  setSelectedChatId: () => {},
  startNewConversation: () => {},
  isNewConversation: false,
  toggleFavorite: async () => {},
  renameChat: async () => {},
  getChatTitle: (chat) => chat.title,
  deleteChat: async () => {},
  deleteNonFavoriteChats: async () => {},
  deleteAllChats: async () => {},
  isDeletingChat: false,
  isDeletingNonFavoriteChats: false,
  isDeletingAllChats: false,
});

export default function TreeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState('');
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [isDeletingNonFavoriteChats, setIsDeletingNonFavoriteChats] = useState(false);
  const [isDeletingAllChats, setIsDeletingAllChats] = useState(false);

  const {
    data: chatsData,
    isPending: isChatsPending,
    error: chatsError,
  } = $api.useQuery('get', '/chats');

  const chats = chatsData ?? [];

  const deleteChatMutation = $api.useMutation('delete', '/chats/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats').queryKey,
      });
    },
  });

  const patchChatMutation = $api.useMutation('patch', '/chats/{id}');

  useEffect(() => {
    if (isNewConversation) {
      return;
    }

    if (chats.length === 0) {
      return;
    }

    const hasSelectedChat = chats.some((chat) => chat.id === selectedChatId);
    if (!selectedChatId || !hasSelectedChat) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, isNewConversation, selectedChatId]);

  const startNewConversation = () => {
    setIsNewConversation(true);
    setSelectedChatId('');
  };

  const handleSetSelectedChatId: Dispatch<SetStateAction<string>> = (value) => {
    setIsNewConversation(false);
    setSelectedChatId(value);
  };

  const invalidateChats = () =>
    queryClient.invalidateQueries({
      queryKey: $api.queryOptions('get', '/chats').queryKey,
    });

  const toggleFavorite = async (id: string) => {
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    const newValue = !chat.favourite;
    // Optimistic update
    queryClient.setQueryData(
      $api.queryOptions('get', '/chats').queryKey,
      (prev: ChatListItem[] | undefined) =>
        prev?.map((c) => (c.id === id ? { ...c, favourite: newValue } : c)),
    );
    try {
      await patchChatMutation.mutateAsync({
        params: { path: { id } },
        body: { favourite: newValue },
      });
    } catch {
      await invalidateChats();
    }
  };

  const renameChat = async (id: string, title: string) => {
    // Optimistic update
    queryClient.setQueryData(
      $api.queryOptions('get', '/chats').queryKey,
      (prev: ChatListItem[] | undefined) =>
        prev?.map((c) => (c.id === id ? { ...c, title } : c)),
    );
    try {
      await patchChatMutation.mutateAsync({
        params: { path: { id } },
        body: { title },
      });
    } catch {
      await invalidateChats();
    }
  };

  const getChatTitle = (chat: ChatListItem) => chat.title;

  const deleteChat = async (id: string) => {
    await deleteChatMutation.mutateAsync({ params: { path: { id } } });
  };

  const finalizeBulkDelete = (deletedIds: Set<string>) => {
    const remainingChats = chats.filter((chat) => !deletedIds.has(chat.id));
    if (remainingChats.length === 0) {
      setSelectedChatId('');
      setIsNewConversation(true);
      return;
    }

    const selectedChatDeleted = selectedChatId !== '' && deletedIds.has(selectedChatId);
    if (selectedChatDeleted) {
      setSelectedChatId(remainingChats[0].id);
      setIsNewConversation(false);
    }
  };

  const bulkDeleteChats = async (targetChats: ChatListItem[]) => {
    if (targetChats.length === 0) {
      return;
    }

    const deletedIds = new Set(targetChats.map((chat) => chat.id));
    for (const chat of targetChats) {
      await deleteChatMutation.mutateAsync({
        params: { path: { id: chat.id } },
      });
    }

    finalizeBulkDelete(deletedIds);
    await invalidateChats();
  };

  const deleteNonFavoriteChats = async () => {
    const nonFavoriteChats = chats.filter((chat) => !chat.favourite);
    if (nonFavoriteChats.length === 0) {
      return;
    }

    setIsDeletingNonFavoriteChats(true);
    try {
      await bulkDeleteChats(nonFavoriteChats);
    } finally {
      setIsDeletingNonFavoriteChats(false);
    }
  };

  const deleteAllChats = async () => {
    setIsDeletingAllChats(true);
    try {
      await bulkDeleteChats(chats);
    } finally {
      setIsDeletingAllChats(false);
    }
  };

  return (
    <TreeContext.Provider
      value={{
        chats,
        isChatsPending,
        hasChatsError: Boolean(chatsError),
        selectedChatId,
        setSelectedChatId: handleSetSelectedChatId,
        startNewConversation,
        isNewConversation,
        toggleFavorite,
        renameChat,
        getChatTitle,
        deleteChat,
        deleteNonFavoriteChats,
        deleteAllChats,
        isDeletingChat: deleteChatMutation.isPending,
        isDeletingNonFavoriteChats,
        isDeletingAllChats,
      }}>
      {children}
    </TreeContext.Provider>
  );
}
