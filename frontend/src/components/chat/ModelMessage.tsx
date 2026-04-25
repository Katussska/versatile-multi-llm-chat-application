import MessageFunctions from '@/components/chat/MessageFunctions.tsx';
import type { Message } from '@/components/chat/ChatSection.tsx';
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

export default function ModelMessage({
  message,
  isStreaming,
  onRegenerate,
  onFavourite,
}: {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onFavourite?: () => void;
}) {
  const icon = modelIcon(message.modelProvider);
  return (
    <div className="group my-10 flex flex-col">
      <div className="flex">
        <Avatar className="mr-6">
          {icon.src && <AvatarImage src={icon.src} />}
          <AvatarFallback>{icon.fallback}</AvatarFallback>
        </Avatar>
        <div className="mr-5 flex w-max max-w-3xl flex-col">
          <div className="bg-sidebar-accent rounded-3xl p-4">
            {isStreaming && !message.content && (
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            )}
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
                    <ol className="mb-2 list-inside list-decimal space-y-1">{children}</ol>
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
                    <a href={href} className="text-blue-500 underline hover:text-blue-400">
                      {children}
                    </a>
                  );
                },
              }}>
              {message.content}
            </ReactMarkdown>
          </div>
          <MessageFunctions
            messageId={message.id}
            content={message.content}
            isFavourite={message.favourite}
            onFavourite={onFavourite}
            onRegenerate={onRegenerate}
          />
        </div>
      </div>
    </div>
  );
}
