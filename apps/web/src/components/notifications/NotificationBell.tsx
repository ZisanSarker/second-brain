'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount, useNotifications, useMarkRead } from '@/lib/hooks/useNotifications';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unread } = useUnreadCount();
  const { data: notifs, refetch } = useNotifications({ unreadOnly: true, limit: 10 });
  const markRead = useMarkRead();
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleClick = (notif: any) => {
    markRead.mutate(notif.id);
    setOpen(false);
    if (notif.data?.url) router.push(notif.data.url);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell size={18} />
        {(unread?.count ?? 0) > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-foreground">
            {unread.count > 99 ? '99+' : unread.count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <button
                onClick={() => router.push('/notifications')}
                className="text-xs text-primary hover:text-primary"
              >
                View all
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs?.items?.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No unread notifications
              </p>
            )}
            {notifs?.items?.map((n: any) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
