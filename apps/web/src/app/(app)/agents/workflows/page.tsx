'use client';

import { useState } from 'react';
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
  useRunWorkflow,
} from '@/lib/hooks/useAgents';
import { Plus, Trash2, Play, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowsPage() {
  const { data: workflows } = useWorkflows();
  const create = useCreateWorkflow();
  const del = useDeleteWorkflow();
  const run = useRunWorkflow();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate(
      { name, description },
      {
        onSuccess: () => {
          setShowCreate(false);
          setName('');
          setDescription('');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground">Automate multi-step processes</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary-hover"
        >
          <Plus size={14} /> New Workflow
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-xl border border-border bg-popover/50 p-5">
          <h3 className="mb-3 font-semibold text-foreground">Create Workflow</h3>
          <input
            suppressHydrationWarning
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            className="mb-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={create.isPending || !name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {create.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
            Create
          </button>
        </div>
      )}

      <div className="space-y-3">
        {workflows?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No workflows yet. Create one to automate tasks.
          </p>
        )}
        {workflows?.map((wf) => (
          <div key={wf.id} className="rounded-lg border border-border bg-popover/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{wf.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {wf.description || 'No description'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Steps: {(wf.steps as any[])?.length || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Trigger: {wf.trigger?.type || 'MANUAL'}
                  </span>
                  <span
                    className={`text-xs ${wf.isActive ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    {wf.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => run.mutate({ id: wf.id })}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Run"
                >
                  <Play size={14} />
                </button>
                <Link
                  href={`/agents/workflows/${wf.id}`}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Edit"
                >
                  <Settings size={14} />
                </Link>
                <button
                  onClick={() => del.mutate(wf.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/30 hover:text-destructive-foreground"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
