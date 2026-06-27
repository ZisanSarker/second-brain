'use client';

import { useApprovals, useApprove, useReject } from '@/lib/hooks/useAgents';
import { Check, X, Loader2, Shield, Clock } from 'lucide-react';

export default function ApprovalsPage() {
  const { data: approvals } = useApprovals();
  const approve = useApprove();
  const reject = useReject();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-zinc-400" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Approval Center</h1>
            <p className="text-sm text-zinc-400">
              Manage pending approval requests from agents and workflows
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {(!approvals || approvals.length === 0) && (
          <p className="py-12 text-center text-sm text-zinc-500">No pending approvals</p>
        )}
        {approvals?.map((a: any) => (
          <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-sm font-medium text-zinc-200">{a.action}</span>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                  {a.status}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Context: {JSON.stringify(a.context).slice(0, 200)}
            </p>
            {a.executionId && (
              <p className="text-xs text-zinc-600">Execution: {a.executionId.slice(0, 12)}...</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => approve.mutate(a.id)}
                disabled={approve.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50"
              >
                {approve.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Approve
              </button>
              <button
                onClick={() => reject.mutate(a.id)}
                disabled={reject.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 disabled:opacity-50"
              >
                {reject.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
