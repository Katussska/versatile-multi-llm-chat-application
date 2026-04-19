import { type RefObject, useEffect } from 'react';

import type { Message } from '@/components/chat/ChatSection';
import ModelMessage from '@/components/chat/ModelMessage.tsx';
import UserMessage from '@/components/chat/UserMessage.tsx';

import { useTranslation } from 'react-i18next';

interface ChatContentProps {
  messages: Message[];
  isLoading?: boolean;
  errorMessage?: string | null;
  isStreaming?: boolean;
  isRefetching?: boolean;
  scrollContainerRef: RefObject<HTMLDivElement>;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
  onRegenerateMessage?: (messageIndex: number) => void;
  onToggleFavourite?: (messageId: string, currentValue: boolean) => void;
}

export default function ChatContent({
  messages,
  isLoading = false,
  errorMessage = null,
  isStreaming = false,
  isRefetching = false,
  scrollContainerRef,
  onEditMessage,
  onRegenerateMessage,
  onToggleFavourite,
}: ChatContentProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (scrollContainerRef.current) {
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current!.scrollHeight,
          behavior: isStreaming ? 'smooth' : 'auto',
        });
      });
    }
  }, [messages, isStreaming, scrollContainerRef]);

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-1 w-full max-w-5xl">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            {t('chat.loadingMessages')}
          </div>
        ) : errorMessage ? (
          <div className="flex h-full items-center justify-center text-red-400">
            {errorMessage}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            {t('chat.noMessages')}
          </div>
        ) : (
          messages.map((message, index) =>
            message.role === 'user' ? (
              <UserMessage
                key={message.id}
                message={message}
                onEdit={
                  onEditMessage
                    ? (newContent) => onEditMessage(index, newContent)
                    : undefined
                }
              />
            ) : (
              <ModelMessage
                key={message.id}
                message={message}
                isStreaming={message.isStreaming}
                onRegenerate={
                  onRegenerateMessage && !message.isStreaming && !isRefetching
                    ? () => onRegenerateMessage(index)
                    : undefined
                }
                onFavourite={
                  onToggleFavourite && !message.isStreaming && !isRefetching
                    ? () => onToggleFavourite(message.id, message.favourite)
                    : undefined
                }
              />
            ),
          )
        )}
      </div>
    </div>
  );
}
