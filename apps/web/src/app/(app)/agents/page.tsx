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
  KNOWLEDGE: 'from-blue-600 to-indigo-600',
  RESEARCH: 'from-purple-600 to-pink-600',
  DOCUMENTATION: 'from-emerald-600 to-teal-600',
  WRITING: 'from-amber-600 to-orange-600',
  CODE: 'from-rose-600 to-red-600',
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
        <h1 className="text-2xl font-bold text-zinc-100">AI Agents</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Execute intelligent agents that can search, research, write, and more
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map((agent) => {
          const Icon = iconMap[agent.type] || Bot;
          const color = colorMap[agent.type] || 'from-zinc-600 to-zinc-700';
          const isSelected = selectedType === agent.type;
          return (
            <button
              key={agent.type}
              onClick={() => setSelectedType(agent.type)}
              className={`rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${color} shadow-lg`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-zinc-100">{agent.name}</h3>
              <p className="mt-1 text-xs text-zinc-500">{agent.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {agent.tools?.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 font-semibold text-zinc-100">Run Agent</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {agents?.map((a) => (
            <button
              key={a.type}
              onClick={() => setSelectedType(a.type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                selectedType === a.type
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
              className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleRun}
                disabled={runAgent.isPending || !input.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {runAgent.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {runAgent.isPending ? 'Running...' : 'Run Agent'}
              </button>
              <Link
                href="/agents/executions"
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                View execution history →
              </Link>
            </div>
          </>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {result && (
          <div className="mt-4 rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-emerald-800/50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                COMPLETED
              </span>
              <span className="text-[10px] text-zinc-500">
                Execution: {result.executionId?.slice(0, 8)}...
              </span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
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
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Execution History
        </Link>
        <Link
          href="/agents/workflows"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Workflows
        </Link>
        <Link
          href="/agents/approvals"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Approvals
        </Link>
        <Link
          href="/agents/schedules"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Schedules
        </Link>
        <Link
          href="/agents/tools"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Tool Inspector
        </Link>
      </div>
    </div>
  );
}
