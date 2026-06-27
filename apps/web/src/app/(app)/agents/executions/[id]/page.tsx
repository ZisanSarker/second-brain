'use client';

import { useParams } from 'next/navigation';
import { useAgentExecution, useCancelExecution, useRetryExecution } from '@/lib/hooks/useAgents';
import { ArrowLeft, Loader2, XCircle, RotateCcw, Clock, CheckCircle, Activity } from 'lucide-react';
import Link from 'next/link';

const statusIcon: Record<string, any> = {
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  RUNNING: Loader2,
  QUEUED: Clock,
  CANCELLED: XCircle,
};

const statusColors: Record<string, string> = {
  COMPLETED: 'text-success',
  FAILED: 'text-destructive-foreground',
  RUNNING: 'text-info',
  QUEUED: 'text-muted-foreground',
  CANCELLED: 'text-muted-foreground',
};

export default function ExecutionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: ex, isLoading } = useAgentExecution(id);
  const cancel = useCancelExecution();
  const retry = useRetryExecution();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!ex) return <div className="p-6 text-muted-foreground">Execution not found</div>;

  const Icon = statusIcon[ex.status] || Activity;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/agents/executions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to executions
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Icon size={24} className={statusColors[ex.status]} />
          <div>
            <h1 className="text-xl font-bold text-foreground">{ex.type}</h1>
            <p className="text-sm text-muted-foreground">ID: {ex.id}</p>
          </div>
          <span
            className={`ml-auto rounded-lg border px-2 py-0.5 text-xs font-medium ${
              ex.status === 'COMPLETED'
                ? 'text-success border-success/30 bg-success/10'
                : ex.status === 'FAILED'
                  ? 'text-destructive-foreground border-destructive/30 bg-destructive/10'
                  : 'text-muted-foreground border-border bg-muted/10'
            }`}
          >
            {ex.status}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          {['RUNNING', 'QUEUED', 'WAITING_APPROVAL'].includes(ex.status) && (
            <button
              onClick={() => cancel.mutate(id)}
              className="flex items-center gap-1 rounded-lg bg-destructive/20 px-3 py-1.5 text-xs text-destructive-foreground hover:bg-destructive/30"
            >
              <XCircle size={12} /> Cancel
            </button>
          )}
          {ex.status === 'FAILED' && (
            <button
              onClick={() => retry.mutate(id)}
              className="flex items-center gap-1 rounded-lg bg-warning/20 px-3 py-1.5 text-xs text-warning hover:bg-warning/30"
            >
              <RotateCcw size={12} /> Retry
            </button>
          )}
        </div>
      </div>

      {ex.plan && Array.isArray(ex.plan) && (
        <div className="mb-6 rounded-xl border border-border bg-popover/50 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plan
          </h3>
          <div className="space-y-2">
            {(ex.plan as any[]).map((step: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-card/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground">
                  {step.type}
                </span>
                {step.tool && <span className="text-xs text-muted-foreground">{step.tool}</span>}
                <span className="text-xs text-muted-foreground">{step.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ex.steps && ex.steps.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-popover/50 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Steps
          </h3>
          <div className="space-y-3">
            {ex.steps.map((step: any) => (
              <div key={step.id} className="rounded-lg border border-border bg-popover/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{step.stepIndex}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        step.status === 'COMPLETED'
                          ? 'bg-success/10 text-success'
                          : step.status === 'FAILED'
                            ? 'bg-destructive/10 text-destructive-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.status}
                    </span>
                    <span className="text-xs text-foreground">{step.type}</span>
                    {step.toolName && <span className="text-xs text-primary">{step.toolName}</span>}
                  </div>
                </div>
                {step.toolOutput && (
                  <pre className="mt-2 text-xs text-muted-foreground line-clamp-3">
                    {JSON.stringify(step.toolOutput).slice(0, 300)}
                  </pre>
                )}
                {step.error && (
                  <p className="mt-1 text-xs text-destructive-foreground">{step.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {ex.output && (
        <div className="rounded-xl border border-border bg-popover/50 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Output
          </h3>
          <pre className="whitespace-pre-wrap text-sm text-foreground">
            {typeof ex.output === 'string' ? ex.output : JSON.stringify(ex.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
