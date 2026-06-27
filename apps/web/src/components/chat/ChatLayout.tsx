'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/lib/store/chat-store';
import { chatApi } from '@/lib/api/chat';
import { useConversation, useConversationMessages } from '@/lib/hooks/useChat';
import { MessageSquare, Loader2 } from 'lucide-react';

interface ChatLayoutProps {
  conversationId?: string;
}

export function ChatLayout({ conversationId }: ChatLayoutProps) {
  const {
    activeConversationId,
    setActiveConversation,
    streamingTokens,
    fullContent,
    isStreaming,
    citations,
    setCitations,
    startStream,
    addToken,
    endStream,
    setStreamError,
    resetStream,
  } = useChatStore();

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const { data: conv, isLoading: convLoading } = useConversation(conversationId);
  const { data: msgData, isLoading: msgLoading } = useConversationMessages(conversationId);

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamingTokens, msgData]);

  const handleSend = useCallback(
    (message: string) => {
      startStream();
      const { xhr, controller } = chatApi.sendMessage(message, activeConversationId || undefined);
      xhrRef.current = xhr;

      let buffer = '';
      xhr.onprogress = () => {
        const newData = xhr.responseText.slice(buffer.length);
        buffer = xhr.responseText;

        const lines = newData.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'token') {
              addToken(parsed.token);
            } else if (parsed.type === 'citations') {
              setCitations(parsed.citations);
            } else if (parsed.type === 'error') {
              setStreamError(parsed.message);
            } else if (parsed.type === 'done') {
              endStream();
              queryClient.invalidateQueries({
                queryKey: ['chat', 'messages', activeConversationId],
              });
            }
          } catch {
            // Skip malformed lines
          }
        }
      };

      xhr.onerror = () => {
        setStreamError('Connection error. Please try again.');
      };

      xhr.onloadend = () => {
        if (xhr.status >= 400) {
          setStreamError(`Error: ${xhr.statusText || 'Request failed'}`);
        }
      };
    },
    [
      activeConversationId,
      startStream,
      addToken,
      setCitations,
      endStream,
      setStreamError,
      queryClient,
    ],
  );

  const handleStop = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    if (activeConversationId) {
      chatApi.stopGeneration(activeConversationId).catch(() => {});
    }
    endStream();
  }, [activeConversationId, endStream]);

  const handleRegenerate = useCallback(() => {
    if (!activeConversationId) return;
    resetStream();
    startStream();

    const xhr = chatApi.regenerate(activeConversationId);
    xhrRef.current = xhr;

    let buffer = '';
    xhr.onprogress = () => {
      const newData = xhr.responseText.slice(buffer.length);
      buffer = xhr.responseText;
      const lines = newData.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'token') addToken(parsed.token);
          else if (parsed.type === 'citations') setCitations(parsed.citations);
          else if (parsed.type === 'error') setStreamError(parsed.message);
          else if (parsed.type === 'done') {
            endStream();
            queryClient.invalidateQueries({ queryKey: ['chat', 'messages', activeConversationId] });
          }
        } catch {}
      }
    };
    xhr.onerror = () => setStreamError('Regeneration failed');
  }, [
    activeConversationId,
    startStream,
    addToken,
    setCitations,
    endStream,
    setStreamError,
    setStreamError,
    resetStream,
    queryClient,
  ]);

  const allMessages = msgData?.data || conv?.messages || [];
  const isLoading = convLoading || msgLoading;

  if (!conversationId) {
    return (
      <div className="flex h-full">
        <ChatSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <h2 className="text-lg font-medium text-slate-400 mb-2">Start a conversation</h2>
            <p className="text-sm text-slate-500 max-w-md">
              Ask questions about your knowledge base. Your AI assistant will search documents and
              provide answers with citations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ChatSidebar />
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-800/50">
          <h2 className="text-sm font-medium text-slate-200 truncate">{conv?.title || 'Chat'}</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          )}

          {!isLoading && allMessages.length === 0 && !isStreaming && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">
                  Send a message to start chatting with your knowledge base.
                </p>
              </div>
            </div>
          )}

          {allMessages.map((msg: any) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              citations={msg.citations?.map((c: any) => ({
                documentId: c.chunk?.version?.documentId,
                chunkIndex: c.chunk?.chunkIndex,
                pageNumber: c.chunk?.pageNumber,
                section: c.chunk?.section,
                documentTitle: c.documentTitle,
              }))}
              onRegenerate={
                msg.role === 'assistant' && msg === allMessages[allMessages.length - 1]
                  ? handleRegenerate
                  : undefined
              }
            />
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <ChatMessage
              role="assistant"
              content={fullContent || ''}
              citations={citations}
              isStreaming
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
