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
  COMPLETED: 'text-success bg-success/10 border-success/30',
  FAILED: 'text-destructive-foreground bg-destructive/10 border-destructive/30',
  RUNNING: 'text-info bg-info/10 border-info/30',
  QUEUED: 'text-muted-foreground bg-muted/10 border-border',
  PLANNING: 'text-warning bg-warning/10 border-warning/30',
  CANCELLED: 'text-muted-foreground bg-muted/10 border-border',
  WAITING_APPROVAL: 'text-primary bg-primary/10 border-primary/30',
};

export default function ExecutionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, refetch } = useAgentExecutions(statusFilter ? { status: statusFilter } : undefined);

  const items = (data as any)?.items || [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Execution History</h1>
          <p className="text-sm text-muted-foreground">Track all agent and workflow executions</p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-border bg-popover/50 p-2 text-muted-foreground hover:bg-card hover:text-foreground"
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
                ? 'bg-primary text-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No executions found</p>
        )}
        {items.map((ex: any) => (
          <Link
            key={ex.id}
            href={`/agents/executions/${ex.id}`}
            className="block rounded-lg border border-border bg-popover/30 p-4 hover:border-border hover:bg-popover/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${statusColors[ex.status] || 'text-muted-foreground'}`}
                >
                  {ex.status}
                </span>
                <span className="text-sm font-medium text-foreground">{ex.type}</span>
                {ex.agentId && (
                  <span className="text-xs text-muted-foreground">{ex.agentId.slice(0, 8)}...</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(ex.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
              Input:{' '}
              {typeof ex.input === 'object'
                ? JSON.stringify(ex.input).slice(0, 200)
                : String(ex.input || '').slice(0, 200)}
            </p>
            {ex.error && (
              <p className="mt-1 text-xs text-destructive-foreground">Error: {ex.error}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
