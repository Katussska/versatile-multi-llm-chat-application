import { useState } from 'react';

import { ChevronLeft, ChevronRight, Clipboard, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface VersionInfo {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

interface MessageFunctionsProps {
  messageId: string;
  content: string;
  onRegenerate?: () => void;
  versionInfo?: VersionInfo;
}

export default function MessageFunctions({
  content,
  onRegenerate,
  versionInfo,
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

  const hasNavigation = versionInfo && versionInfo.total > 1;

  return (
    <div className="mt-1 flex items-center gap-3">
      {hasNavigation && (
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <button
            onClick={versionInfo.onPrev}
            disabled={versionInfo.current === 1}
            title={t('chat.previousResponse')}
            aria-label={t('chat.previousResponse')}
            className="cursor-pointer rounded p-0.5 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[2.5rem] cursor-default select-none text-center tabular-nums">
            {versionInfo.current}/{versionInfo.total}
          </span>
          <button
            onClick={versionInfo.onNext}
            disabled={versionInfo.current === versionInfo.total}
            title={t('chat.nextResponse')}
            aria-label={t('chat.nextResponse')}
            className="cursor-pointer rounded p-0.5 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
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
        <button
          onClick={() => void handleCopy()}
          title={t('chat.copy')}
          aria-label={t('chat.copy')}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}
        </button>
      </div>
    </div>
  );
}
