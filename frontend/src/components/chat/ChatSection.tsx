import { startTransition, useContext, useEffect, useRef, useState } from 'react';

import { $api } from '@/api/client.ts';
import { TreeContext } from '@/components/TreeProvider.tsx';
import ChatContent from '@/components/chat/ChatContent.tsx';
import ChatInput from '@/components/chat/ChatInput.tsx';
import ModelSelector from '@/components/chat/ModelSelector.tsx';
import { formatChatTitle } from '@/lib/chatTitle.ts';
import { useQueryClient } from '@tanstack/react-query';

import { useNavigate, useParams } from 'react-router-dom';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'model';
  createdAt: Date;
}

export default function ChatSection() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: routeChatId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { chats, selectedChatId, setSelectedChatId, isChatsPending, hasChatsError } =
    useContext(TreeContext);
  const activeChatId = routeChatId ?? selectedChatId;

  useEffect(() => {
    if (!routeChatId || routeChatId === selectedChatId || isChatsPending) {
      return;
    }

    const routeChatExists = chats.some((chat) => chat.id === routeChatId);
    if (routeChatExists) {
      setSelectedChatId(routeChatId);
      return;
    }

    if (!hasChatsError) {
      navigate('/', { replace: true });
    }
  }, [
    chats,
    hasChatsError,
    isChatsPending,
    navigate,
    routeChatId,
    selectedChatId,
    setSelectedChatId,
  ]);

  const {
    data: chatMessages,
    isPending: isMessagesPending,
    error: messagesError,
  } = $api.useQuery(
    'get',
    '/chats/{id}/messages',
    {
      params: {
        path: {
          id: activeChatId,
        },
      },
    },
    {
      enabled: Boolean(activeChatId),
    },
  );

  useEffect(() => {
    if (!activeChatId && !isCreatingConversation) {
      setMessages([]);
      return;
    }

    if (chatMessages) {
      setMessages(
        chatMessages.map((message) => ({
          id: message.id,
          content: message.content,
          role: message.path === 'user' ? 'user' : 'model',
          createdAt: new Date(message.createdAt),
        })),
      );
    }
  }, [chatMessages, activeChatId, isCreatingConversation]);

  const createChatMutation = $api.useMutation('post', '/chats', {
    onSuccess: async (createdChat) => {
      queryClient.setQueryData($api.queryOptions('get', '/chats').queryKey, (current) => {
        const currentChats = Array.isArray(current) ? current : [];
        return [
          createdChat,
          ...currentChats.filter((chat) => chat.id !== createdChat.id),
        ];
      });

      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats').queryKey,
      });
    },
  });

  const addMessageMutation = $api.useMutation('post', '/chats/{id}/messages');

  const isInitialMessagesLoading =
    isChatsPending ||
    (Boolean(activeChatId) && isMessagesPending && messages.length === 0);
  const fetchErrorMessage =
    hasChatsError || messagesError ? 'Nepodařilo se načíst zprávy.' : null;
  const errorMessage = localErrorMessage ?? fetchErrorMessage;

  const handleSendMessage = async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setLocalErrorMessage(null);
    setIsCreatingConversation(true);

    const optimisticMessageId = Date.now().toString();

    const userMessage: Message = {
      id: optimisticMessageId,
      content: trimmedContent,
      role: 'user',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    let chatId = activeChatId;

    try {
      if (!chatId) {
        const fallbackModelId = chats[0]?.modelId;
        const createdChat = await createChatMutation.mutateAsync({
          body: {
            title: formatChatTitle(trimmedContent),
            modelId: fallbackModelId,
          },
        });

        chatId = createdChat.id;
        startTransition(() => {
          setSelectedChatId(chatId!);
        });
        navigate(`/chat/${chatId}`);
      }

      await addMessageMutation.mutateAsync({
        params: {
          path: {
            id: chatId,
          },
        },
        body: {
          content: trimmedContent,
          path: 'user',
        },
      });

      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats').queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats/{id}/messages', {
          params: {
            path: {
              id: chatId,
            },
          },
        }).queryKey,
      });
    } catch {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessageId));
      setLocalErrorMessage('Nepodařilo se odeslat zprávu.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <ModelSelector />
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        <ChatContent
          messages={messages}
          isLoading={isInitialMessagesLoading}
          errorMessage={errorMessage}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
      <ChatInput onSendMessage={(message) => void handleSendMessage(message)} />
    </div>
  );
}
