'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Pin,
  PinOff,
  Archive,
  MoreHorizontal,
  Copy,
  Loader2,
} from 'lucide-react';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation,
  useDuplicateConversation,
} from '@/lib/hooks/useChat';
import { useChatStore } from '@/lib/store/chat-store';

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: conversations, isLoading } = useConversations(search || undefined);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  const duplicateConversation = useDuplicateConversation();
  const { activeConversationId, setActiveConversation, resetStream } = useChatStore();

  const handleNewChat = async () => {
    const conv = await createConversation.mutateAsync({});
    setActiveConversation(conv.id);
    resetStream();
    router.push(`/chat/${conv.id}`);
  };

  return (
    <div className="w-72 border-r border-slate-800/50 flex flex-col bg-slate-900/20 h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/50">
        <button
          onClick={handleNewChat}
          disabled={createConversation.isPending}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm"
        >
          {createConversation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          </div>
        )}

        {conversations?.map((conv: any) => {
          const isActive = conv.id === activeConversationId || pathname === `/chat/${conv.id}`;
          return (
            <div key={conv.id} className="relative group">
              <button
                onClick={() => {
                  setActiveConversation(conv.id);
                  resetStream();
                  router.push(`/chat/${conv.id}`);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  {conv._count?.messages > 0 && (
                    <span className="text-[10px] text-slate-600">{conv._count.messages}</span>
                  )}
                </div>
              </button>

              {/* Actions */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateConversation.mutate({ id: conv.id, data: { pin: !conv.pinnedAt } });
                  }}
                  className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800"
                  title={conv.pinnedAt ? 'Unpin' : 'Pin'}
                >
                  {conv.pinnedAt ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === conv.id ? null : conv.id);
                  }}
                  className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </div>

              {/* Dropdown menu */}
              {menuOpen === conv.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-40 glass-panel rounded-xl border border-slate-700/50 py-1 shadow-xl">
                    <button
                      onClick={() => {
                        duplicateConversation.mutate(conv.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        updateConversation.mutate({ id: conv.id, data: { archive: true } });
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                    <div className="border-t border-slate-700/50 my-1" />
                    <button
                      onClick={() => {
                        deleteConversation.mutate(conv.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {!isLoading && conversations?.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            {search ? 'No conversations found' : 'No conversations yet'}
          </div>
        )}
      </div>
    </div>
  );
}
