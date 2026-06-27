'use client';

import { useState } from 'react';
import { useAuditLog } from '@/lib/hooks/useAudit';
import { Shield } from 'lucide-react';

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data } = useAuditLog({
    action: actionFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 100,
  });

  const items = (data as any)?.items || [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-zinc-400" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Audit Log</h1>
            <p className="text-sm text-zinc-400">
              Immutable record of security and administrative events
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={actionFilter || ''}
          onChange={(e) => setActionFilter(e.target.value || undefined)}
          placeholder="Filter by action..."
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 font-medium text-zinc-300">Action</th>
              <th className="px-4 py-3 font-medium text-zinc-300">User</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Details</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: any) => (
              <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="px-4 py-3">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                    {a.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {a.userId ? `${a.userId.slice(0, 8)}...` : 'System'}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 max-w-xs truncate">
                  {JSON.stringify(a.details)}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(a.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No audit logs found</p>
        )}
      </div>
    </div>
  );
}
