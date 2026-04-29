import { startTransition, useContext, useEffect, useRef, useState } from 'react';

import { $api } from '@/api/client.ts';
import { TreeContext } from '@/components/TreeProvider.tsx';
import ChatContent from '@/components/chat/ChatContent.tsx';
import ChatInput from '@/components/chat/ChatInput.tsx';
import ModelSelector from '@/components/chat/ModelSelector.tsx';
import ModelVariantSelector from '@/components/chat/ModelVariantSelector.tsx';
import { getApiBaseUrl } from '@/lib/api-url.ts';
import { formatChatTitle } from '@/lib/chatTitle.ts';
import { useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export interface MessageVersion {
  id: string;
  content: string;
  modelProvider: string | null;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'model';
  createdAt: Date;
  isStreaming?: boolean;
  isError?: boolean;
  modelProvider?: string | null;
  versionGroupId?: string | null;
  versions?: MessageVersion[];
}

const API_BASE = getApiBaseUrl();

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
  const { pathname } = useLocation();
  const { id: routeChatId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [tokenLimitResetAt, setTokenLimitResetAt] = useState<Date | null>(null);
  const [globalBudget, setGlobalBudget] = useState<{
    dollarLimit: number | null;
    usedDollars: number;
    resetAt: string;
  } | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wordQueueRef = useRef<string[]>([]);
  const drainTimerRef = useRef<number | null>(null);
  const drainResolveRef = useRef<(() => void) | null>(null);
  const wasAbortedRef = useRef(false);
  const streamedContentRef = useRef('');
  const streamedMessageIdRef = useRef<string | null>(null);
  const streamingPlaceholderIdRef = useRef<string>('streaming-assistant-message');

  const { chats, selectedChatId, setSelectedChatId, isChatsPending, hasChatsError } =
    useContext(TreeContext);
  const activeChatId = routeChatId ?? selectedChatId;

  const { data: availableModels, isPending: isModelsPending } = $api.useQuery(
    'get',
    '/models',
  );
  const [selectedModelId, setSelectedModelId] = useState('');

  const defaultModelId =
    availableModels?.find((m) => m.provider === 'gemini')?.id ??
    availableModels?.[0]?.id ??
    '';

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
    if (!availableModels?.length) return;
    if (!activeChatId) {
      setSelectedModelId(defaultModelId);
      return;
    }
    const activeChat = chats.find((c) => c.id === activeChatId);
    if (activeChat?.modelId && availableModels.some((m) => m.id === activeChat.modelId)) {
      setSelectedModelId(activeChat.modelId);
      return;
    }
    // Fallback: use provider from last model message (handles old chats without modelId)
    if (chatMessages?.length) {
      const lastModelMsg = [...chatMessages].reverse().find((m) => m.path !== 'user');
      if (lastModelMsg?.modelProvider) {
        const fallback = availableModels.find(
          (m) => m.provider === lastModelMsg.modelProvider,
        );
        if (fallback) {
          setSelectedModelId(fallback.id);
          return;
        }
      }
    }
    setSelectedModelId(defaultModelId);
  }, [activeChatId, availableModels, chats, defaultModelId, chatMessages]);

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
        cancelAnimationFrame(drainTimerRef.current);
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
    fetch(`${API_BASE}/users/me/tokens`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.resolve([])))
      .then(
        (data: { dollarLimit: number | null; usedDollars: number; resetAt: string }[]) =>
          setGlobalBudget(data[0] ?? null),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (
      globalBudget &&
      globalBudget.dollarLimit !== null &&
      globalBudget.usedDollars >= globalBudget.dollarLimit
    ) {
      setTokenLimitResetAt(new Date(globalBudget.resetAt));
    } else {
      setTokenLimitResetAt(null);
    }
  }, [globalBudget]);

  useEffect(() => {
    setTokenLimitResetAt(null);
  }, [activeChatId]);

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
          modelProvider: message.modelProvider ?? null,
          versionGroupId: message.versionGroupId ?? null,
          versions: (message.versions ?? []).map((v) => ({
            id: v.id,
            content: v.content,
            modelProvider: v.modelProvider,
            createdAt: new Date(v.createdAt),
          })),
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
      // Display multiple characters per frame for smooth animation
      // This gives us ~60fps at 16ms per frame with more chars displayed
      let fragment = '';
      for (let i = 0; i < 5; i++) {
        const char = wordQueueRef.current.shift();
        if (!char) break;
        fragment += char;
      }

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

      // Use requestAnimationFrame for smooth 60fps animation
      drainTimerRef.current = requestAnimationFrame(step);
    };
    if (drainTimerRef.current === null) step();
  };

  const enqueueWords = (text: string) => {
    for (const char of text) {
      wordQueueRef.current.push(char);
    }
    drainQueue();
  };

  const clearQueue = () => {
    wordQueueRef.current = [];
    if (drainTimerRef.current !== null) {
      cancelAnimationFrame(drainTimerRef.current);
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
      fetch(`${API_BASE}/users/me/tokens`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.resolve([])))
        .then(
          (
            data: { dollarLimit: number | null; usedDollars: number; resetAt: string }[],
          ) => setGlobalBudget(data[0] ?? null),
        )
        .catch(() => {}),
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
          ? t('chat.tokenLimitBanner', { date: dateStr })
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
    };

    const assistantPlaceholder: Message = {
      id: streamingPlaceholderIdRef.current,
      content: '',
      role: 'model',
      createdAt: new Date(),
      isStreaming: true,
      modelProvider:
        availableModels?.find((m) => m.id === selectedModelId)?.provider ?? null,
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
        const errorMessage = err instanceof Error ? err.message : t('chat.sendError');

        if (!handleTokenLimitError(err)) {
          // Display error message in chat as assistant response
          if (streamedMessageIdRef.current) {
            // Message was created on server
            await patchModelMessage(chatId!, errorMessage);
            const realId = streamedMessageIdRef.current;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingPlaceholderIdRef.current
                  ? {
                      ...msg,
                      id: realId,
                      content: errorMessage,
                      isStreaming: false,
                      isError: true,
                    }
                  : msg,
              ),
            );
          } else {
            // Message not created, replace placeholder with error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingPlaceholderIdRef.current
                  ? {
                      ...msg,
                      content: errorMessage,
                      isStreaming: false,
                      isError: true,
                    }
                  : msg,
              ),
            );
          }
        } else {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== streamingPlaceholderIdRef.current),
          );
        }
      }
    } finally {
      setIsStreaming(false);
      setIsCreatingConversation(false);
      abortControllerRef.current = null;
    }
  };

  const handleActivateVersion = async (messageId: string) => {
    if (!activeChatId) return;
    await fetch(`${API_BASE}/chats/${activeChatId}/messages/${messageId}/activate`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch(() => {});
    await queryClient.refetchQueries({
      queryKey: $api.queryOptions('get', '/chats/{id}/messages', {
        params: { path: { id: activeChatId } },
      }).queryKey,
    });
  };

  const handleRegenerateMessage = async (messageIndex: number) => {
    if (isStreaming || !activeChatId) return;

    const modelMsg = messages[messageIndex];
    if (!modelMsg || modelMsg.role !== 'model') return;

    const userMsg = messages[messageIndex - 1];
    if (!userMsg || userMsg.role !== 'user') return;

    const selectedProvider =
      availableModels?.find((m) => m.id === selectedModelId)?.provider ?? null;

    const savedMessages = messages;
    const truncated = messages.slice(0, messageIndex);
    streamingPlaceholderIdRef.current = `streaming-assistant-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: streamingPlaceholderIdRef.current,
      content: '',
      role: 'model',
      createdAt: new Date(),
      isStreaming: true,
      modelProvider: selectedProvider,
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
        const errorMessage = err instanceof Error ? err.message : t('chat.sendError');

        if (!handleTokenLimitError(err)) {
          // Display error message in chat as assistant response
          if (streamedMessageIdRef.current) {
            // Message was created on server
            await patchModelMessage(activeChatId, errorMessage);
            const realId = streamedMessageIdRef.current;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingPlaceholderIdRef.current
                  ? {
                      ...msg,
                      id: realId,
                      content: errorMessage,
                      isStreaming: false,
                      isError: true,
                    }
                  : msg,
              ),
            );
          } else {
            // Message not created, replace placeholder with error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingPlaceholderIdRef.current
                  ? {
                      ...msg,
                      content: errorMessage,
                      isStreaming: false,
                      isError: true,
                    }
                  : msg,
              ),
            );
          }
        } else {
          setMessages(savedMessages);
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
    };
    const assistantPlaceholder: Message = {
      id: streamingPlaceholderIdRef.current,
      content: '',
      role: 'model',
      createdAt: new Date(),
      isStreaming: true,
      modelProvider:
        availableModels?.find((m) => m.id === selectedModelId)?.provider ?? null,
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
        const errorMessage = err instanceof Error ? err.message : t('chat.sendError');

        if (!handleTokenLimitError(err)) {
          // Display error message in chat as assistant response
          if (streamedMessageIdRef.current) {
            // Message was created on server
            await patchModelMessage(activeChatId, errorMessage);
            const realId = streamedMessageIdRef.current;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingPlaceholderIdRef.current
                  ? {
                      ...msg,
                      id: realId,
                      content: errorMessage,
                      isStreaming: false,
                      isError: true,
                    }
                  : msg,
              ),
            );
          } else {
            // Message not created, replace placeholder with error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingPlaceholderIdRef.current
                  ? {
                      ...msg,
                      content: errorMessage,
                      isStreaming: false,
                      isError: true,
                    }
                  : msg,
              ),
            );
          }
        } else {
          setMessages(savedMessages);
        }
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleProviderChange = (provider: string) => {
    if (!availableModels) return;
    const defaultModel = availableModels.find((m) => m.provider === provider);
    if (!defaultModel) return;
    void handleModelChange(defaultModel.id);
  };

  const handleModelChange = async (newModelId: string) => {
    setSelectedModelId(newModelId);
    if (!activeChatId) return;
    try {
      const response = await fetch(`${API_BASE}/chats/${activeChatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ modelId: newModelId }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/chats').queryKey,
      });
    } catch {
      toast.error(t('chat.sendError'));
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <ModelSelector
        models={availableModels ?? []}
        selectedModelId={selectedModelId}
        onProviderChange={handleProviderChange}
        isPending={isModelsPending}
      />
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
          scrollToMessageId={scrollToMessageId}
          onScrollComplete={() => setScrollToMessageId(null)}
          onActivateVersion={handleActivateVersion}
        />
      </div>
      <ChatInput
        onSendMessage={(message) => void handleSendMessage(message)}
        onStop={handleStopStreaming}
        isStreaming={isStreaming}
        tokenLimitResetAt={tokenLimitResetAt}
        focusKey={pathname === '/profile' ? null : (activeChatId ?? 'new')}
        variantSelector={
          <ModelVariantSelector
            models={availableModels ?? []}
            selectedModelId={selectedModelId}
            onModelChange={(id) => void handleModelChange(id)}
            disabled={isStreaming}
          />
        }
      />
    </div>
  );
}
