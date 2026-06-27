'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t border-border bg-popover/30"
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your knowledge base..."
          rows={1}
          disabled={isStreaming || disabled}
          className="w-full bg-card/50 border border-border rounded-xl px-4 py-2.5 pr-12 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 resize-none disabled:opacity-50 transition-colors"
        />
      </div>

      <div className="flex gap-1">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground hover:bg-destructive/20 transition-colors text-sm"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        )}
      </div>
    </form>
  );
}
