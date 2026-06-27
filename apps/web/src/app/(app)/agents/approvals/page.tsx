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
          <Shield size={24} className="text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Approval Center</h1>
            <p className="text-sm text-muted-foreground">
              Manage pending approval requests from agents and workflows
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {(!approvals || approvals.length === 0) && (
          <p className="py-12 text-center text-sm text-muted-foreground">No pending approvals</p>
        )}
        {approvals?.map((a: any) => (
          <div key={a.id} className="rounded-lg border border-border bg-popover/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-warning" />
                <span className="text-sm font-medium text-foreground">{a.action}</span>
                <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                  {a.status}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Context: {JSON.stringify(a.context).slice(0, 200)}
            </p>
            {a.executionId && (
              <p className="text-xs text-muted-foreground">
                Execution: {a.executionId.slice(0, 12)}...
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => approve.mutate(a.id)}
                disabled={approve.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-success/20 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/30 disabled:opacity-50"
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
                className="inline-flex items-center gap-1 rounded-lg bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/30 disabled:opacity-50"
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
