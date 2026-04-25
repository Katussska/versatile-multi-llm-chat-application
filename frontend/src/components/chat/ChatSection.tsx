import { startTransition, useContext, useEffect, useRef, useState } from 'react';

import { $api } from '@/api/client.ts';
import { TreeContext } from '@/components/TreeProvider.tsx';
import ChatContent from '@/components/chat/ChatContent.tsx';
import ChatInput from '@/components/chat/ChatInput.tsx';
import ModelSelector from '@/components/chat/ModelSelector.tsx';
import { formatChatTitle } from '@/lib/chatTitle.ts';
import { useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'model';
  createdAt: Date;
  isStreaming?: boolean;
  favourite: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

class TokenLimitError extends Error {
  constructor(public readonly resetAt: Date | null) {
    super('TOKEN_LIMIT_EXCEEDED');
    this.name = 'TokenLimitError';
  }
}

export default function ChatSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: routeChatId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [tokenLimitResetAt, setTokenLimitResetAt] = useState<Date | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wordQueueRef = useRef<string[]>([]);
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainResolveRef = useRef<(() => void) | null>(null);
  const wasAbortedRef = useRef(false);
  const streamedContentRef = useRef('');
  const streamedMessageIdRef = useRef<string | null>(null);
  const streamingPlaceholderIdRef = useRef<string>('streaming-assistant-message');

  const { chats, selectedChatId, setSelectedChatId, isChatsPending, hasChatsError } =
    useContext(TreeContext);
  const activeChatId = routeChatId ?? selectedChatId;

  const { data: availableModels } = $api.useQuery('get', '/models');
  const [selectedModelId, setSelectedModelId] = useState('');

  const geminiDefaultId =
    availableModels?.find((m) => m.provider === 'gemini')?.id ??
    availableModels?.[0]?.id ??
    '';

  useEffect(() => {
    if (!availableModels?.length) return;
    if (!activeChatId) {
      setSelectedModelId(geminiDefaultId);
      return;
    }
    const activeChat = chats.find((c) => c.id === activeChatId);
    if (activeChat?.modelId) {
      setSelectedModelId(activeChat.modelId);
    } else {
      setSelectedModelId(geminiDefaultId);
    }
  }, [activeChatId, availableModels, chats, geminiDefaultId]);

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

  useEffect(() => {
    return () => {
      if (drainTimerRef.current) {
        clearTimeout(drainTimerRef.current);
        drainTimerRef.current = null;
      }
      wordQueueRef.current = [];
      if (drainResolveRef.current) {
        drainResolveRef.current();
        drainResolveRef.current = null;
      }
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    setTokenLimitResetAt(null);
  }, [activeChatId]);

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
    if (isStreaming) return;

    if (wasAbortedRef.current) {
      wasAbortedRef.current = false;
      return;
    }

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
          favourite: message.favourite,
        })),
      );
    } else if (activeChatId && !isCreatingConversation) {
      setMessages([]);
    }
  }, [chatMessages, activeChatId, isCreatingConversation, isStreaming]);

  const createChatMutation = $api.useMutation('post', '/chats', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats').queryKey,
      });
    },
  });

  const isInitialMessagesLoading =
    isChatsPending ||
    (Boolean(activeChatId) && isMessagesPending && messages.length === 0);
  const fetchErrorMessage = hasChatsError || messagesError ? t('chat.loadError') : null;

  const drainQueue = () => {
    const step = () => {
      const fragment = wordQueueRef.current.shift();
      if (!fragment) {
        drainTimerRef.current = null;
        drainResolveRef.current?.();
        drainResolveRef.current = null;
        return;
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingPlaceholderIdRef.current
            ? { ...msg, content: msg.content + fragment }
            : msg,
        ),
      );
      drainTimerRef.current = setTimeout(step, 35);
    };
    if (drainTimerRef.current === null) step();
  };

  const enqueueWords = (text: string) => {
    const words = text.match(/\S+\s*/g) ?? [];
    wordQueueRef.current.push(...words);
    drainQueue();
  };

  const clearQueue = () => {
    wordQueueRef.current = [];
    if (drainTimerRef.current !== null) {
      clearTimeout(drainTimerRef.current);
      drainTimerRef.current = null;
    }
    drainResolveRef.current?.();
    drainResolveRef.current = null;
  };

  const waitForDrain = (): Promise<void> => {
    if (wordQueueRef.current.length === 0 && drainTimerRef.current === null) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      drainResolveRef.current = resolve;
    });
  };

  const patchModelMessage = async (chatId: string, content: string) => {
    const messageId = streamedMessageIdRef.current;
    if (!messageId) return;
    await fetch(`${API_BASE}/chats/${chatId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    }).catch(() => {});
  };

  const handleAbort = async (chatId: string) => {
    wasAbortedRef.current = true;
    if (!streamedMessageIdRef.current) {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== streamingPlaceholderIdRef.current),
      );
      return;
    }
    await patchModelMessage(chatId, streamedContentRef.current + '...');
    const realId = streamedMessageIdRef.current;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingPlaceholderIdRef.current
          ? {
              ...msg,
              id: realId,
              content: streamedContentRef.current + '...',
              isStreaming: false,
            }
          : msg,
      ),
    );
  };

  const handleStopStreaming = () => {
    clearQueue();
    abortControllerRef.current?.abort();
  };

  const refetchAfterStream = async (chatId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats').queryKey,
      }),
      queryClient.refetchQueries({
        queryKey: $api.queryOptions('get', '/chats/{id}/messages', {
          params: { path: { id: chatId } },
        }).queryKey,
      }),
    ]);
  };

  const executeStream = async (
    chatId: string,
    content: string,
    options?: {
      parentMessageId?: string;
      regenerate?: boolean;
      truncateFromMessageId?: string;
    },
  ) => {
    streamedContentRef.current = '';
    streamedMessageIdRef.current = null;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const response = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content,
        parentMessageId: options?.parentMessageId,
        regenerate: options?.regenerate,
        truncateFromMessageId: options?.truncateFromMessageId,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402 || response.status === 403) {
        const body = (await response.json().catch(() => ({}))) as { resetAt?: string };
        throw new TokenLimitError(body.resetAt ? new Date(body.resetAt) : null);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6)) as {
          messageId?: string;
          chunk?: string;
          done?: boolean;
          error?: string;
        };
        if (data.messageId) {
          streamedMessageIdRef.current = data.messageId;
        } else if (data.chunk) {
          streamedContentRef.current += data.chunk;
          enqueueWords(data.chunk);
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
    }

    await waitForDrain();
  };

  const handleTokenLimitError = (err: unknown) => {
    if (err instanceof TokenLimitError) {
      setTokenLimitResetAt(err.resetAt);
      const dateStr = err.resetAt
        ? err.resetAt.toLocaleDateString(undefined, { timeZone: 'UTC' })
        : '';
      toast.error(
        dateStr
          ? t('chat.tokenLimitError', { date: dateStr })
          : t('chat.tokenLimitErrorNoDate'),
      );
      return true;
    }
    return false;
  };

  const handleSendMessage = async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isStreaming) {
      return;
    }

    setIsCreatingConversation(true);
    setIsStreaming(true);

    streamingPlaceholderIdRef.current = `streaming-assistant-${Date.now()}`;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: trimmedContent,
      role: 'user',
      createdAt: new Date(),
      favourite: false,
    };

    const assistantPlaceholder: Message = {
      id: streamingPlaceholderIdRef.current,
      content: '',
      role: 'model',
      createdAt: new Date(),
      isStreaming: true,
      favourite: false,
    };

    const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : undefined;
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

    let chatId = activeChatId;

    try {
      if (!chatId) {
        const createdChat = await createChatMutation.mutateAsync({
          body: {
            title: formatChatTitle(trimmedContent),
            modelId: selectedModelId || undefined,
          },
        });

        chatId = createdChat.id;
        startTransition(() => {
          setSelectedChatId(chatId!);
        });
        navigate(`/chat/${chatId}`);
      }

      await executeStream(chatId, trimmedContent, { parentMessageId: lastMsgId });

      if (abortControllerRef.current?.signal.aborted) {
        await handleAbort(chatId!);
      } else {
        setIsRefetching(true);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingPlaceholderIdRef.current
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
        await refetchAfterStream(chatId!);
        setIsRefetching(false);
      }
    } catch (err) {
      clearQueue();
      if (err instanceof Error && err.name === 'AbortError') {
        await handleAbort(chatId!);
      } else {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== streamingPlaceholderIdRef.current),
        );
        if (!handleTokenLimitError(err)) {
          toast.error(t('chat.sendError'));
        }
      }
    } finally {
      setIsStreaming(false);
      setIsCreatingConversation(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerateMessage = async (messageIndex: number) => {
    if (isStreaming || !activeChatId) return;

    const modelMsg = messages[messageIndex];
    if (!modelMsg || modelMsg.role !== 'model') return;

    const userMsg = messages[messageIndex - 1];
    if (!userMsg || userMsg.role !== 'user') return;

    const savedMessages = messages;
    const truncated = messages.slice(0, messageIndex);
    streamingPlaceholderIdRef.current = `streaming-assistant-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: streamingPlaceholderIdRef.current,
      content: '',
      role: 'model',
      createdAt: new Date(),
      isStreaming: true,
      favourite: false,
    };
    setMessages([...truncated, assistantPlaceholder]);
    setIsStreaming(true);

    try {
      await executeStream(activeChatId, userMsg.content, {
        parentMessageId: userMsg.id,
        regenerate: true,
        truncateFromMessageId: modelMsg.id,
      });

      if (abortControllerRef.current?.signal.aborted) {
        await handleAbort(activeChatId);
      } else {
        setIsRefetching(true);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingPlaceholderIdRef.current
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
        await refetchAfterStream(activeChatId);
        setIsRefetching(false);
      }
    } catch (err) {
      clearQueue();
      if (err instanceof Error && err.name === 'AbortError') {
        await handleAbort(activeChatId);
      } else {
        setMessages(savedMessages);
        if (!handleTokenLimitError(err)) {
          toast.error(t('chat.sendError'));
        }
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleEditMessage = async (messageIndex: number, newContent: string) => {
    if (isStreaming || !activeChatId) return;

    const editedMessage = messages[messageIndex];
    if (!editedMessage || editedMessage.role !== 'user') return;

    const precedingMsg = messageIndex > 0 ? messages[messageIndex - 1] : null;
    const savedMessages = messages;
    const truncated = messages.slice(0, messageIndex);
    streamingPlaceholderIdRef.current = `streaming-assistant-${Date.now()}`;
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: newContent,
      role: 'user',
      createdAt: new Date(),
      favourite: false,
    };
    const assistantPlaceholder: Message = {
      id: streamingPlaceholderIdRef.current,
      content: '',
      role: 'model',
      createdAt: new Date(),
      isStreaming: true,
      favourite: false,
    };
    setMessages([...truncated, newUserMessage, assistantPlaceholder]);
    setIsStreaming(true);

    try {
      await executeStream(activeChatId, newContent, {
        parentMessageId: precedingMsg?.id,
        truncateFromMessageId: editedMessage.id,
      });

      if (abortControllerRef.current?.signal.aborted) {
        await handleAbort(activeChatId);
      } else {
        setIsRefetching(true);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingPlaceholderIdRef.current
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
        await refetchAfterStream(activeChatId);
        setIsRefetching(false);
      }
    } catch (err) {
      clearQueue();
      if (err instanceof Error && err.name === 'AbortError') {
        await handleAbort(activeChatId);
      } else {
        setMessages(savedMessages);
        if (!handleTokenLimitError(err)) {
          toast.error(t('chat.sendError'));
        }
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleToggleFavourite = async (messageId: string, currentValue: boolean) => {
    if (!activeChatId) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, favourite: !currentValue } : msg,
      ),
    );
    try {
      const response = await fetch(
        `${API_BASE}/chats/${activeChatId}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ favourite: !currentValue }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to toggle favourite: ${response.status}`);
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, favourite: currentValue } : msg,
        ),
      );
      toast.error(t('chat.sendError'));
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <ModelSelector value={selectedModelId} onValueChange={setSelectedModelId} />
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto p-4 [mask-image:linear-gradient(to_top,transparent_0%,black_50px)]">
        <ChatContent
          messages={messages}
          isLoading={isInitialMessagesLoading}
          errorMessage={fetchErrorMessage}
          isStreaming={isStreaming}
          isRefetching={isRefetching}
          scrollContainerRef={scrollContainerRef}
          onEditMessage={handleEditMessage}
          onRegenerateMessage={handleRegenerateMessage}
          onToggleFavourite={handleToggleFavourite}
        />
      </div>
      <ChatInput
        onSendMessage={(message) => void handleSendMessage(message)}
        onStop={handleStopStreaming}
        isStreaming={isStreaming}
        tokenLimitResetAt={tokenLimitResetAt}
      />
    </div>
  );
}
