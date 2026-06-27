'use client';

import { useAgentTools } from '@/lib/hooks/useAgents';
import { Wrench, Loader2 } from 'lucide-react';

export default function ToolsPage() {
  const { data: tools } = useAgentTools();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Wrench size={24} className="text-zinc-400" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Tool Inspector</h1>
            <p className="text-sm text-zinc-400">
              Explore available tools, their schemas, and permissions
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tools?.map((tool: any) => (
          <div key={tool.name} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-100">{tool.name}</h3>
                <p className="text-sm text-zinc-500">{tool.description}</p>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                Min Role: {tool.minRole}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Input Schema
                </h4>
                <pre className="rounded bg-zinc-950 p-2 text-xs text-zinc-400 overflow-auto max-h-32">
                  {JSON.stringify(tool.inputSchema, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Output Schema
                </h4>
                <pre className="rounded bg-zinc-950 p-2 text-xs text-zinc-400 overflow-auto max-h-32">
                  {JSON.stringify(tool.outputSchema, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
        {(!tools || tools.length === 0) && (
          <p className="py-8 text-center text-sm text-zinc-500">No tools available.</p>
        )}
      </div>
    </div>
  );
}
