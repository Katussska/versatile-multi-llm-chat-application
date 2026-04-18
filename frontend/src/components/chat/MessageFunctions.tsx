import { useState } from 'react';

import { Clipboard, ClipboardCheck, Heart, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-1 flex items-center justify-start gap-3 opacity-0 transition-opacity group-hover:opacity-100">
      {onFavourite && (
        <button
          onClick={onFavourite}
          title={isFavourite ? t('chat.unfavourite') : t('chat.favourite')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Heart size={18} className={isFavourite ? 'fill-current' : ''} />
        </button>
      )}
      <button
        onClick={() => void handleCopy()}
        title={t('chat.copy')}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}
      </button>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          title={t('chat.regenerate')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
}
