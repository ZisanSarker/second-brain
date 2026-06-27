'use client';

import { useState } from 'react';
import { useAgents, useRunAgent } from '@/lib/hooks/useAgents';
import {
  Bot,
  Search,
  BookOpen,
  PenLine,
  Code,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const iconMap: Record<string, any> = {
  KNOWLEDGE: Search,
  RESEARCH: BookOpen,
  DOCUMENTATION: FileText,
  WRITING: PenLine,
  CODE: Code,
};

const colorMap: Record<string, string> = {
  KNOWLEDGE: 'from-primary to-primary',
  RESEARCH: 'from-primary to-primary',
  DOCUMENTATION: 'from-success to-success',
  WRITING: 'from-warning to-warning',
  CODE: 'from-destructive to-destructive',
};

export default function AgentsPage() {
  const { data: agents } = useAgents();
  const runAgent = useRunAgent();
  const [input, setInput] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleRun = () => {
    if (!selectedType || !input.trim()) return;
    setResult(null);
    setError('');
    runAgent.mutate(
      { type: selectedType, input },
      {
        onSuccess: (res) => setResult(res),
        onError: (e: any) => setError(e.message || 'Execution failed'),
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Execute intelligent agents that can search, research, write, and more
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map((agent) => {
          const Icon = iconMap[agent.type] || Bot;
          const color = colorMap[agent.type] || 'from-primary to-primary';
          const isSelected = selectedType === agent.type;
          return (
            <button
              key={agent.type}
              onClick={() => setSelectedType(agent.type)}
              className={`rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-popover/50 hover:border-border hover:bg-popover'
              }`}
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${color} shadow-lg`}
              >
                <Icon size={20} className="text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{agent.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {agent.tools?.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-popover/50 p-5">
        <h3 className="mb-3 font-semibold text-foreground">Run Agent</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {agents?.map((a) => (
            <button
              key={a.type}
              onClick={() => setSelectedType(a.type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                selectedType === a.type
                  ? 'bg-primary text-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
        {selectedType && (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What would you like me to do?"
              rows={3}
              className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleRun}
                disabled={runAgent.isPending || !input.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {runAgent.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {runAgent.isPending ? 'Running...' : 'Run Agent'}
              </button>
              <Link href="/agents/executions" className="text-xs text-primary hover:text-primary">
                View execution history →
              </Link>
            </div>
          </>
        )}
        {error && <p className="mt-3 text-sm text-destructive-foreground">{error}</p>}
        {result && (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/20 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-success/50 px-1.5 py-0.5 text-[10px] font-medium text-success">
                COMPLETED
              </span>
              <span className="text-[10px] text-muted-foreground">
                Execution: {result.executionId?.slice(0, 8)}...
              </span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {typeof result.output === 'string'
                ? result.output
                : JSON.stringify(result.output, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/agents/executions"
          className="rounded-lg border border-border bg-popover/50 px-4 py-2 text-sm text-foreground hover:bg-popover"
        >
          Execution History
        </Link>
        <Link
          href="/agents/workflows"
          className="rounded-lg border border-border bg-popover/50 px-4 py-2 text-sm text-foreground hover:bg-popover"
        >
          Workflows
        </Link>
        <Link
          href="/agents/approvals"
          className="rounded-lg border border-border bg-popover/50 px-4 py-2 text-sm text-foreground hover:bg-popover"
        >
          Approvals
        </Link>
        <Link
          href="/agents/schedules"
          className="rounded-lg border border-border bg-popover/50 px-4 py-2 text-sm text-foreground hover:bg-popover"
        >
          Schedules
        </Link>
        <Link
          href="/agents/tools"
          className="rounded-lg border border-border bg-popover/50 px-4 py-2 text-sm text-foreground hover:bg-popover"
        >
          Tool Inspector
        </Link>
      </div>
    </div>
  );
}
