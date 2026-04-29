import { type RefObject, useEffect, useRef } from 'react';

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
  scrollToMessageId?: string | null;
  onScrollComplete?: () => void;
  onActivateVersion?: (messageId: string) => void;
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
  scrollToMessageId,
  onScrollComplete,
  onActivateVersion,
}: ChatContentProps) {
  const { t } = useTranslation();
  const previousMessageCountRef = useRef(messages.length);

  useEffect(() => {
    if (!scrollToMessageId || !scrollContainerRef.current) return;
    requestAnimationFrame(() => {
      const el = scrollContainerRef.current?.querySelector(
        `[data-message-id="${scrollToMessageId}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onScrollComplete?.();
      }
    });
  }, [scrollToMessageId, scrollContainerRef, onScrollComplete]);

  useEffect(() => {
    const previousMessageCount = previousMessageCountRef.current;
    const shouldStickToBottom = isStreaming || messages.length > previousMessageCount;

    previousMessageCountRef.current = messages.length;

    if (scrollContainerRef.current && shouldStickToBottom) {
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
          messages.map((message, index) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} data-message-id={message.id}>
                  <UserMessage
                    message={message}
                    onEdit={
                      onEditMessage
                        ? (newContent) => onEditMessage(index, newContent)
                        : undefined
                    }
                  />
                </div>
              );
            }

            const versions = message.versions ?? [];
            let versionInfo:
              | { current: number; total: number; onPrev: () => void; onNext: () => void }
              | undefined;

            if (versions.length > 1) {
              const currentIdx = versions.findIndex((v) => v.id === message.id);
              const safeIdx = currentIdx === -1 ? versions.length - 1 : currentIdx;
              versionInfo = {
                current: safeIdx + 1,
                total: versions.length,
                onPrev: () => onActivateVersion?.(versions[safeIdx - 1].id),
                onNext: () => onActivateVersion?.(versions[safeIdx + 1].id),
              };
            }

            return (
              <div key={message.id} data-message-id={message.id}>
                <ModelMessage
                  message={message}
                  isStreaming={message.isStreaming}
                  versionInfo={versionInfo}
                  onRegenerate={
                    onRegenerateMessage && !message.isStreaming && !isRefetching
                      ? () => onRegenerateMessage(index)
                      : undefined
                  }
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
