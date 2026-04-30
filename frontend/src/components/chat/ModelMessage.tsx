import type { Message } from '@/components/chat/ChatSection.tsx';
import MessageFunctions from '@/components/chat/MessageFunctions.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';

import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const MODEL_ICONS: Record<string, { src: string; fallback: string }> = {
  gemini: { src: '/gemini.png', fallback: 'G' },
  anthropic: { src: '/claude.png', fallback: 'C' },
  openai: { src: '/chatGPT.png', fallback: 'GPT' },
};

function modelIcon(provider: string | null | undefined) {
  return MODEL_ICONS[provider ?? ''] ?? { src: '', fallback: 'AI' };
}

interface VersionInfo {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function ModelMessage({
  message,
  isStreaming,
  onRegenerate,
  versionInfo,
}: {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  versionInfo?: VersionInfo;
}) {
  const icon = modelIcon(message.modelProvider);
  const isError = message.isError ?? false;

  return (
    <div className="group my-10 flex flex-col">
      <div className="flex">
        <Avatar className="mr-3 shrink-0 sm:mr-6">
          {icon.src && <AvatarImage src={icon.src} />}
          <AvatarFallback>{icon.fallback}</AvatarFallback>
        </Avatar>
        <div className="mr-2 flex min-w-0 max-w-[85%] flex-col sm:mr-5 sm:max-w-3xl">
          <div
            className={`break-words rounded-3xl p-4 ${isError ? 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-sidebar-accent'}`}>
            {isStreaming && !message.content && (
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            )}
            {isError ? (
              <p className="font-semibold">{message.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = match;
                    return isBlock ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={oneDark}
                        className="rounded-lg text-sm">
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className={`bg-sidebar-foreground/20 rounded px-1.5 py-0.5 font-mono text-sm ${className || ''}`}>
                        {children}
                      </code>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return (
                      <ul className="mb-2 list-inside list-disc space-y-1">{children}</ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="mb-2 list-inside list-decimal space-y-1">
                        {children}
                      </ol>
                    );
                  },
                  h1({ children }) {
                    return <h1 className="mb-2 text-xl font-bold">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="mb-2 text-lg font-bold">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="mb-2 text-base font-bold">{children}</h3>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-sidebar-foreground/30 mb-2 border-l-4 pl-4 italic">
                        {children}
                      </blockquote>
                    );
                  },
                  a({ children, href }) {
                    return (
                      <a
                        href={href}
                        className="text-blue-500 underline hover:text-blue-400">
                        {children}
                      </a>
                    );
                  },
                }}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          <MessageFunctions
            messageId={message.id}
            content={message.content}
            onRegenerate={onRegenerate}
            versionInfo={versionInfo}
          />
        </div>
      </div>
    </div>
  );
}
