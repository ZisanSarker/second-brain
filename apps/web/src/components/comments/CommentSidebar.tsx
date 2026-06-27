'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useResolveComment,
} from '@/lib/hooks/useComments';
import { MessageSquare, Trash2, Check, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { workspacesApi } from '@/lib/api/workspaces';

export function CommentSidebar({
  entityType,
  entityId,
  onClose,
}: {
  entityType: string;
  entityId: string;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: comments, refetch } = useComments(entityType, entityId);
  const create = useCreateComment();
  const del = useDeleteComment();
  const resolve = useResolveComment();
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);

  const loadMembers = useCallback(async () => {
    if (members.length > 0 || !currentWorkspace?.id) return;
    try {
      const m = await workspacesApi.getMembers(currentWorkspace.id);
      setMembers(m);
    } catch {}
  }, [currentWorkspace?.id, members.length]);

  const getMentionContext = (text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      return { search: match[1].toLowerCase(), start: match.index! };
    }
    return null;
  };

  const filteredMembers = mentionSearch
    ? members.filter((m) => (m.user?.name || '').toLowerCase().includes(mentionSearch))
    : [];

  const selectMention = (member: any) => {
    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const ctx = getMentionContext(content, cursorPos);
    if (!ctx) return;
    const name = member.user?.name || member.email || 'User';
    const before = content.slice(0, ctx.start);
    const after = content.slice(cursorPos);
    const newContent = `${before}@${name} ${after}`;
    setContent(newContent);
    setMentionSearch('');
    setMentionIndex(-1);
    setTimeout(() => {
      const newPos = ctx.start + name.length + 2;
      textareaRef.current?.setSelectionRange(newPos, newPos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);
    const ctx = getMentionContext(val, cursorPos);
    if (ctx) {
      setMentionSearch(ctx.search);
      if (mentionIndex < 0) setMentionIndex(0);
    } else {
      setMentionSearch('');
      setMentionIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionSearch && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && mentionIndex >= 0) {
        e.preventDefault();
        selectMention(filteredMembers[mentionIndex]);
      } else if (e.key === 'Escape') {
        setMentionSearch('');
        setMentionIndex(-1);
      }
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    const payload: any = { content };
    if (entityType === 'DOCUMENT') payload.documentId = entityId;
    else if (entityType === 'COLLECTION') payload.collectionId = entityId;
    else if (entityType === 'GENERATED_CONTENT') payload.generatedContentId = entityId;
    if (replyTo) payload.parentId = replyTo;

    create.mutate(payload, {
      onSuccess: () => {
        setContent('');
        setReplyTo(null);
        refetch();
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        <MessageSquare size={14} />
        Comments {comments?.length ? `(${comments.length})` : ''}
      </button>

      {open && (
        <div className="fixed inset-y-0 right-0 z-40 w-96 border-l border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-100">Comments</h3>
                <button
                  onClick={() => {
                    setOpen(false);
                    onClose?.();
                  }}
                  className="text-sm text-zinc-500 hover:text-zinc-300"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {comments?.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-500">No comments yet</p>
              )}
              {comments?.map((c: any) => (
                <div
                  key={c.id}
                  className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">
                      {c.user?.name || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-1">
                      {!c.resolvedAt && (
                        <button
                          onClick={() => resolve.mutate(c.id, { onSuccess: () => refetch() })}
                          className="rounded p-1 text-zinc-500 hover:text-emerald-400"
                          title="Resolve"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => del.mutate(c.id, { onSuccess: () => refetch() })}
                        className="rounded p-1 text-zinc-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300">{c.content}</p>
                  {c.editedAt && <span className="text-[10px] text-zinc-600">(edited)</span>}
                  {c.resolvedAt && (
                    <span className="ml-2 text-[10px] text-emerald-500">Resolved</span>
                  )}
                  <button
                    onClick={() => setReplyTo(c.id)}
                    className="mt-1 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Reply
                  </button>

                  {c.replies?.map((r: any) => (
                    <div key={r.id} className="ml-4 mt-2 border-l-2 border-zinc-700 pl-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400">{r.user?.name}</span>
                      </div>
                      <p className="text-sm text-zinc-400">{r.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 p-4">
              {replyTo && (
                <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Replying to comment</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-zinc-600 hover:text-zinc-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={loadMembers}
                    placeholder="Add a comment... (use @name to mention)"
                    rows={2}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                  />
                  {mentionSearch && filteredMembers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
                      {filteredMembers.map((m, i) => (
                        <button
                          key={m.id}
                          onClick={() => selectMention(m)}
                          onMouseEnter={() => setMentionIndex(i)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                            i === mentionIndex
                              ? 'bg-purple-600 text-white'
                              : 'text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-600 text-xs font-medium text-zinc-200">
                            {(m.user?.name || 'U')[0].toUpperCase()}
                          </div>
                          <span>{m.user?.name || m.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={create.isPending || !content.trim()}
                  className="self-end rounded-lg bg-purple-600 p-2 text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {create.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
