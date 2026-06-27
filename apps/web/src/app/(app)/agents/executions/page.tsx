'use client';

import { useState } from 'react';
import { useAgentExecutions } from '@/lib/hooks/useAgents';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-900/30',
  FAILED: 'text-red-400 bg-red-500/10 border-red-900/30',
  RUNNING: 'text-blue-400 bg-blue-500/10 border-blue-900/30',
  QUEUED: 'text-zinc-400 bg-zinc-500/10 border-zinc-800',
  PLANNING: 'text-amber-400 bg-amber-500/10 border-amber-900/30',
  CANCELLED: 'text-zinc-500 bg-zinc-500/10 border-zinc-800',
  WAITING_APPROVAL: 'text-purple-400 bg-purple-500/10 border-purple-900/30',
};

export default function ExecutionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, refetch } = useAgentExecutions(statusFilter ? { status: statusFilter } : undefined);

  const items = (data as any)?.items || [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Execution History</h1>
          <p className="text-sm text-zinc-400">Track all agent and workflow executions</p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'COMPLETED', 'FAILED', 'RUNNING', 'QUEUED', 'WAITING_APPROVAL'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              (s === '' && !statusFilter) || s === statusFilter
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">No executions found</p>
        )}
        {items.map((ex: any) => (
          <Link
            key={ex.id}
            href={`/agents/executions/${ex.id}`}
            className="block rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${statusColors[ex.status] || 'text-zinc-400'}`}
                >
                  {ex.status}
                </span>
                <span className="text-sm font-medium text-zinc-200">{ex.type}</span>
                {ex.agentId && (
                  <span className="text-xs text-zinc-500">{ex.agentId.slice(0, 8)}...</span>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                {new Date(ex.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500 line-clamp-1">
              Input:{' '}
              {typeof ex.input === 'object'
                ? JSON.stringify(ex.input).slice(0, 200)
                : String(ex.input || '').slice(0, 200)}
            </p>
            {ex.error && <p className="mt-1 text-xs text-red-400">Error: {ex.error}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
