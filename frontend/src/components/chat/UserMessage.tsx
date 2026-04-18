import { useState } from 'react';

import type { Message } from '@/components/chat/ChatSection.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Clipboard, ClipboardCheck, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UserMessage({
  message,
  onEdit,
}: {
  message: Message;
  onEdit?: (newContent: string) => void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="my-10 flex justify-end gap-4">
        <div className="flex w-full max-w-3xl flex-col gap-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] w-full resize-none rounded-3xl bg-sidebar-foreground p-4 text-primary-foreground focus:outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('chat.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('chat.saveAndSend')}
            </button>
          </div>
        </div>
        <Avatar className="ml-2 shrink-0">
          <AvatarImage src="/avatar.png" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="group my-10 flex justify-end">
      <div className="mr-5 flex flex-col items-end">
        <div className="w-max max-w-3xl rounded-3xl bg-sidebar-foreground p-4">
          <p className="text-primary-foreground">{message.content}</p>
        </div>
        <div className="mt-1 flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => {
                setEditContent(message.content);
                setIsEditing(true);
              }}
              title={t('chat.editMessage')}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={() => void handleCopy()}
            title={t('chat.copy')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}
          </button>
        </div>
      </div>
      <Avatar className="shrink-0">
        <AvatarImage src="/avatar.png" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
    </div>
  );
}
