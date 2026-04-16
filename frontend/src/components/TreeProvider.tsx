import { createContext, Dispatch, SetStateAction, useEffect, useState, type ReactNode } from 'react';

import { $api } from '@/api/client.ts';

export interface ChatListItem {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

interface TreeContextType {
  showConversationTree: boolean;
  setShowConversationTree: Dispatch<SetStateAction<boolean>>;
  chats: ChatListItem[];
  isChatsPending: boolean;
  hasChatsError: boolean;
  selectedChatId: string;
  setSelectedChatId: Dispatch<SetStateAction<string>>;
  startNewConversation: () => void;
  isNewConversation: boolean;
}

export const TreeContext = createContext<TreeContextType>({
  showConversationTree: false,
  setShowConversationTree: () => {},
  chats: [],
  isChatsPending: false,
  hasChatsError: false,
  selectedChatId: '',
  setSelectedChatId: () => {},
  startNewConversation: () => {},
  isNewConversation: false,
});

export default function TreeProvider({ children }: { children: ReactNode }) {
  const [showConversationTree, setShowConversationTree] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [isNewConversation, setIsNewConversation] = useState(false);

  const {
    data: chatsData,
    isPending: isChatsPending,
    error: chatsError,
  } = $api.useQuery('get', '/chats');

  const chats = chatsData ?? [];

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
    setSelectedChatId('');
    setIsNewConversation(true);
  };

  const handleSetSelectedChatId: Dispatch<SetStateAction<string>> = (value) => {
    setIsNewConversation(false);
    setSelectedChatId(value);
  };

  return (
    <TreeContext.Provider
      value={{
        showConversationTree,
        setShowConversationTree,
        chats,
        isChatsPending,
        hasChatsError: Boolean(chatsError),
        selectedChatId,
        setSelectedChatId: handleSetSelectedChatId,
        startNewConversation,
        isNewConversation,
      }}>
      {children}
    </TreeContext.Provider>
  );
}
