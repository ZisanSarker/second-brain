'use client';

import { useState } from 'react';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/lib/hooks/useNotifications';
import { Check, CheckCheck } from 'lucide-react';

const typeColors: Record<string, string> = {
  COMMENT_ADDED: 'text-blue-400 bg-blue-500/10',
  MENTIONED: 'text-purple-400 bg-purple-500/10',
  DOCUMENT_SHARED: 'text-emerald-400 bg-emerald-500/10',
  MEMBER_JOINED: 'text-amber-400 bg-amber-500/10',
  AI_TASK_COMPLETED: 'text-cyan-400 bg-cyan-500/10',
  DOCUMENT_READY: 'text-green-400 bg-green-500/10',
};

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, refetch } = useNotifications({ unreadOnly, limit: 100 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Notifications</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800"
            />
            Unread only
          </label>
          <button
            onClick={() => markAllRead.mutate(undefined, { onSuccess: () => refetch() })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {data?.items?.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">No notifications</p>
        )}
        {data?.items?.map((n: any) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
              n.readAt ? 'border-zinc-800/50 bg-zinc-900/20' : 'border-zinc-700 bg-zinc-900/60'
            }`}
          >
            <div
              className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[n.type] || 'text-zinc-400 bg-zinc-500/10'}`}
            >
              {n.type}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-zinc-500">{n.body}</p>}
              <p className="mt-1 text-[10px] text-zinc-600">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.readAt && (
              <button
                onClick={() => markRead.mutate(n.id, { onSuccess: () => refetch() })}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
