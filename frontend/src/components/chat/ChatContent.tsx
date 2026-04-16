import { useEffect } from 'react';

import type { Message } from '@/components/chat/ChatSection';
import ModelMessage from '@/components/chat/ModelMessage.tsx';
import UserMessage from '@/components/chat/UserMessage.tsx';

interface ChatContentProps {
  messages: Message[];
  isLoading?: boolean;
  errorMessage?: string | null;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export default function ChatContent({
  messages,
  isLoading = false,
  errorMessage = null,
  scrollContainerRef,
}: ChatContentProps) {
  useEffect(() => {
    if (scrollContainerRef.current) {
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current!.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [messages, scrollContainerRef]);

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-1 w-full max-w-5xl">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Načítám zprávy...
          </div>
        ) : errorMessage ? (
          <div className="flex h-full items-center justify-center text-red-400">
            {errorMessage}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Žádné zprávy. Začni psát!
          </div>
        ) : (
          messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message.content} />
            ) : (
              <ModelMessage key={message.id} message={message.content} />
            ),
          )
        )}
      </div>
    </div>
  );
}
