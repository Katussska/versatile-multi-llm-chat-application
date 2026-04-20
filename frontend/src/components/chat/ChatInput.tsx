import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { AlertTriangle, SendHorizontal, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  tokenLimitResetAt?: Date | null;
}

export default function ChatInput({ onSendMessage, onStop, isStreaming, tokenLimitResetAt }: ChatInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (isBlocked) return;
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
    <div className="flex w-full shrink-0 flex-col px-4">
      {tokenLimitResetAt && (
        <div className="mx-8 mt-3 flex max-w-3xl self-center items-start gap-2 rounded-md border border-yellow-600/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{t('chat.tokenLimitBanner', { date: tokenLimitResetAt.toLocaleDateString() })}</span>
        </div>
      )}
      <div className="flex flex-row items-center justify-center py-[21px]">
        <textarea
          ref={textareaRef}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mx-8 max-h-40 w-full max-w-3xl resize-none overflow-y-hidden rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={t('chat.inputPlaceholder')}
          rows={1}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming || isBlocked}
        />
        {isStreaming ? (
          <button onClick={onStop} className="self-end mb-[7px] cursor-pointer" title={t('chat.stopGenerating')} aria-label={t('chat.stopGenerating')}>
            <Square aria-hidden="true" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isBlocked}
            className="self-end mb-[7px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizontal />
          </button>
        )}
      </div>
    </div>
  );
}
