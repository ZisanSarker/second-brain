'use client';

import { useState } from 'react';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/lib/hooks/useNotifications';
import { Check, CheckCheck } from 'lucide-react';

const typeColors: Record<string, string> = {
  COMMENT_ADDED: 'text-info bg-info/10',
  MENTIONED: 'text-primary bg-primary/10',
  DOCUMENT_SHARED: 'text-success bg-success/10',
  MEMBER_JOINED: 'text-warning bg-warning/10',
  AI_TASK_COMPLETED: 'text-info bg-info/10',
  DOCUMENT_READY: 'text-success bg-success/10',
};

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, refetch } = useNotifications({ unreadOnly, limit: 100 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              suppressHydrationWarning
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-border bg-card"
            />
            Unread only
          </label>
          <button
            onClick={() => markAllRead.mutate(undefined, { onSuccess: () => refetch() })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {data?.items?.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No notifications</p>
        )}
        {data?.items?.map((n: any) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
              n.readAt ? 'border-border bg-popover/20' : 'border-border bg-popover/60'
            }`}
          >
            <div
              className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[n.type] || 'text-muted-foreground bg-muted/10'}`}
            >
              {n.type}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.readAt && (
              <button
                onClick={() => markRead.mutate(n.id, { onSuccess: () => refetch() })}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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
