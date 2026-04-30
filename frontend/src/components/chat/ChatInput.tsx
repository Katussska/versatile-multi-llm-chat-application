import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { AlertTriangle, SendHorizontal, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  tokenLimitResetAt?: Date | null;
  variantSelector?: ReactNode;
  focusKey?: string | null;
}

export default function ChatInput({
  onSendMessage,
  onStop,
  isStreaming,
  tokenLimitResetAt,
  variantSelector,
  focusKey,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusKey != null) textareaRef.current?.focus();
  }, [focusKey]);

  const MAX_TEXTAREA_HEIGHT = 160;
  const isBlocked = Boolean(tokenLimitResetAt);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  };

  const handleSend = () => {
    if (isBlocked || isStreaming) return;
    onSendMessage(inputValue);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
      textareaRef.current.focus();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    resizeTextarea();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming && !isBlocked) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-col px-2 sm:px-4">
      {tokenLimitResetAt && (
        <div className="mx-2 mt-3 flex items-start gap-2 self-center rounded-md border border-yellow-600/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 sm:mx-8 sm:max-w-3xl dark:text-yellow-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            {t('chat.tokenLimitBanner', { date: tokenLimitResetAt.toLocaleDateString() })}
          </span>
        </div>
      )}
      <div className="flex flex-row items-end justify-center py-[21px]">
        <div className="mx-2 flex w-full items-end gap-2 sm:mx-8 sm:max-w-3xl">
          {variantSelector}
          <textarea
            ref={textareaRef}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring max-h-40 min-h-10 w-full flex-1 resize-none overflow-y-hidden rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('chat.inputPlaceholder')}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isBlocked}
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="mb-[7px] shrink-0 cursor-pointer self-end"
              title={t('chat.stopGenerating')}
              aria-label={t('chat.stopGenerating')}>
              <Square aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={isBlocked || isStreaming}
              className="mb-[7px] shrink-0 cursor-pointer self-end disabled:cursor-not-allowed disabled:opacity-50">
              <SendHorizontal />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
