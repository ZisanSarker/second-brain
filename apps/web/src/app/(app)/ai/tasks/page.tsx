'use client';

import { useState } from 'react';
import { AiPageLayout } from '@/components/ai/AiLayout';
import { useTasks, useRetryTask, useCancelTask } from '@/lib/hooks/useAi';
import { Loader2, RotateCcw, XCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  QUEUED: 'text-warning bg-warning/10',
  RUNNING: 'text-info bg-info/10',
  COMPLETED: 'text-success bg-success/10',
  FAILED: 'text-destructive-foreground bg-destructive/10',
  CANCELLED: 'text-muted-foreground bg-muted/10',
};

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data: tasks, refetch } = useTasks(statusFilter);
  const retry = useRetryTask();
  const cancel = useCancelTask();

  return (
    <AiPageLayout title="Tasks" description="Monitor background AI generation jobs">
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s || undefined)}
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

      <div className="space-y-2">
        {tasks?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No tasks found.</p>
        )}
        {tasks?.map((task: any) => (
          <div
            key={task.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-popover/30 p-4"
          >
            <div
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status] || 'text-muted-foreground bg-muted/10'}`}
            >
              {task.status}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{task.type}</div>
              <div className="text-xs text-muted-foreground">
                {task.documentId && (
                  <span className="mr-3">Doc: {task.documentId.slice(0, 8)}...</span>
                )}
                {new Date(task.createdAt).toLocaleString()}
              </div>
              {task.errorMessage && (
                <div className="mt-1 text-xs text-destructive-foreground">{task.errorMessage}</div>
              )}
              {task.status === 'RUNNING' && task.progress != null && (
                <div className="mt-1 h-1.5 w-full max-w-xs rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {task.status === 'FAILED' && (
                <button
                  onClick={() => retry.mutate(task.id, { onSuccess: () => refetch() })}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-success"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              {['QUEUED', 'RUNNING'].includes(task.status) && (
                <button
                  onClick={() => cancel.mutate(task.id, { onSuccess: () => refetch() })}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive-foreground"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AiPageLayout>
  );
}
