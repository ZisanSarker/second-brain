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
  DOCUMENT_CREATED: 'text-blue-400 bg-blue-500/10',
  DOCUMENT_UPDATED: 'text-amber-400 bg-amber-500/10',
  COMMENT_ADDED: 'text-emerald-400 bg-emerald-500/10',
  MEMBER_JOINED: 'text-green-400 bg-green-500/10',
  AI_TASK_COMPLETED: 'text-purple-400 bg-purple-500/10',
};

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const { data } = useActivity({ type: typeFilter, limit: 50 } as any);

  const items = (data as any)?.items || [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Activity Feed</h1>
        <p className="mt-1 text-sm text-zinc-400">Chronological timeline of workspace activity</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'DOCUMENT_CREATED', 'COMMENT_ADDED', 'MEMBER_JOINED', 'AI_TASK_COMPLETED'].map(
          (t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t || undefined)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                (t === '' && !typeFilter) || t === typeFilter
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t || 'All'}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">No activity yet</p>
        )}
        {items.map((a: any) => {
          const Icon = iconMap[a.type] || Activity;
          const color = colorMap[a.type] || 'text-zinc-400 bg-zinc-500/10';
          return (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4"
            >
              <div className={`rounded-full p-2 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {a.user?.name || 'System'}
                  </span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {a.type}
                  </span>
                </div>
                {a.metadata?.text && (
                  <p className="mt-0.5 text-sm text-zinc-400">{a.metadata.text}</p>
                )}
                <p className="mt-1 text-[10px] text-zinc-600">
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
