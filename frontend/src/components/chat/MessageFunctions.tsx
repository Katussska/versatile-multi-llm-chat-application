import { useState } from 'react';

import { Clipboard, ClipboardCheck, Heart, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface MessageFunctionsProps {
  messageId: string;
  content: string;
  isFavourite: boolean;
  onFavourite?: () => void;
  onRegenerate?: () => void;
}

export default function MessageFunctions({
  content,
  isFavourite,
  onFavourite,
  onRegenerate,
}: MessageFunctionsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is not available.');
      }
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(t('chat.copiedToClipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopied(false);
      console.error('Failed to copy message to clipboard.', error);
      toast.error(t('chat.copyFailed'));
    }
  };

  return (
    <div className="mt-1 flex items-center justify-start gap-3 opacity-0 transition-opacity group-hover:opacity-100">
      {onFavourite && (
        <button
          onClick={onFavourite}
          title={isFavourite ? t('chat.unfavourite') : t('chat.favourite')}
          aria-label={isFavourite ? t('chat.unfavourite') : t('chat.favourite')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Heart size={18} className={isFavourite ? 'fill-current' : ''} />
        </button>
      )}
      <button
        onClick={() => void handleCopy()}
        title={t('chat.copy')}
        aria-label={t('chat.copy')}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}
      </button>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          title={t('chat.regenerate')}
          aria-label={t('chat.regenerate')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
}
