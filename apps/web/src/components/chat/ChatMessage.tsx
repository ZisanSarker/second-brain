'use client';

import { useState } from 'react';
import { User, Bot, Copy, Check, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { CitationData } from '@/lib/store/chat-store';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationData[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function ChatMessage({
  role,
  content,
  citations,
  isStreaming,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          role === 'user' ? 'bg-primary/20' : 'bg-card'
        }`}
      >
        {role === 'user' ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      <div className={`flex-1 max-w-[85%] ${role === 'user' ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            role === 'user'
              ? 'bg-primary/10 border border-primary/20 text-foreground'
              : 'bg-popover/50 border border-border text-foreground'
          }`}
        >
          {content ? (
            <MarkdownRenderer content={content} />
          ) : isStreaming ? (
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          ) : null}
        </div>

        {/* Citations */}
        {citations && citations.length > 0 && !isStreaming && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {citations.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-[10px] text-muted-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {c.documentTitle ? c.documentTitle.slice(0, 30) : `Doc ${c.documentId.slice(0, 8)}`}
                {c.pageNumber ? ` p.${c.pageNumber}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {role === 'assistant' && content && !isStreaming && (
          <div className="flex items-center gap-1 mt-1.5 px-1">
            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
