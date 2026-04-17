import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { Paperclip, SendHorizontal, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export default function ChatInput({ onSendMessage, onStop, isStreaming }: ChatInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_TEXTAREA_HEIGHT = 160;

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-row items-end justify-center px-4 pb-5 pt-2">
      <Paperclip className="" />
      <textarea
        ref={textareaRef}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mx-8 max-h-40 w-full max-w-3xl resize-none overflow-y-hidden rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        placeholder={t('chat.inputPlaceholder')}
        rows={1}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
      />
      {isStreaming ? (
        <button onClick={onStop} className="cursor-pointer" title={t('chat.stopGenerating')}>
          <Square className="fill-current" />
        </button>
      ) : (
        <button onClick={handleSend} className="cursor-pointer">
          <SendHorizontal />
        </button>
      )}
    </div>
  );
}
