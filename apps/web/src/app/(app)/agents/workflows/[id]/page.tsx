'use client';

import { useParams } from 'next/navigation';
import { useWorkflow, useRunWorkflow } from '@/lib/hooks/useAgents';
import { ArrowLeft, Play, Loader2, Activity } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: wf, isLoading } = useWorkflow(id);
  const run = useRunWorkflow();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!wf) return <div className="p-6 text-muted-foreground">Workflow not found</div>;

  const steps = (wf.steps as any[]) || [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/agents/workflows"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to workflows
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{wf.name}</h1>
            <p className="text-sm text-muted-foreground">{wf.description || 'No description'}</p>
          </div>
          <button
            onClick={() => run.mutate({ id: wf.id })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary-hover"
          >
            <Play size={12} /> Run
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {steps.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No steps defined for this workflow.
          </p>
        )}
        {steps.map((step: any, i: number) => (
          <div key={i} className="rounded-lg border border-border bg-popover/30 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-xs text-muted-foreground">
                {i + 1}
              </div>
              <span className="rounded bg-card px-1.5 py-0.5 text-xs text-foreground">
                {step.type || 'TOOL_CALL'}
              </span>
              {step.tool && <span className="text-xs text-primary">{step.tool}</span>}
            </div>
            {step.description && (
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            )}
            {step.input && (
              <pre className="mt-2 text-xs text-muted-foreground">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
