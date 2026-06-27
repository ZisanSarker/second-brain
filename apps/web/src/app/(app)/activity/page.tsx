'use client';

import { useState } from 'react';
import { useActivity } from '@/lib/hooks/useActivity';
import {
  Activity,
  Clock,
  FileText,
  MessageSquare,
  UserPlus,
  Settings,
  Sparkles,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  DOCUMENT_CREATED: FileText,
  DOCUMENT_UPDATED: FileText,
  DOCUMENT_DELETED: FileText,
  COMMENT_ADDED: MessageSquare,
  MEMBER_JOINED: UserPlus,
  MEMBER_LEFT: UserPlus,
  WORKSPACE_UPDATED: Settings,
  AI_TASK_COMPLETED: Sparkles,
};

const colorMap: Record<string, string> = {
  DOCUMENT_CREATED: 'text-info bg-info/10',
  DOCUMENT_UPDATED: 'text-warning bg-warning/10',
  COMMENT_ADDED: 'text-success bg-success/10',
  MEMBER_JOINED: 'text-success bg-success/10',
  AI_TASK_COMPLETED: 'text-primary bg-primary/10',
};

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const { data } = useActivity({ type: typeFilter, limit: 50 } as any);

  const items = (data as any)?.items || [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Activity Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chronological timeline of workspace activity
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'DOCUMENT_CREATED', 'COMMENT_ADDED', 'MEMBER_JOINED', 'AI_TASK_COMPLETED'].map(
          (t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t || undefined)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                (t === '' && !typeFilter) || t === typeFilter
                  ? 'bg-primary text-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {t || 'All'}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No activity yet</p>
        )}
        {items.map((a: any) => {
          const Icon = iconMap[a.type] || Activity;
          const color = colorMap[a.type] || 'text-muted-foreground bg-muted/10';
          return (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-popover/30 p-4"
            >
              <div className={`rounded-full p-2 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {a.user?.name || 'System'}
                  </span>
                  <span className="rounded bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {a.type}
                  </span>
                </div>
                {a.metadata?.text && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.metadata.text}</p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
