'use client';

import { useState } from 'react';
import { useSchedules, useCreateSchedule, useDeleteSchedule } from '@/lib/hooks/useAgents';
import { Plus, Trash2, Loader2, Clock } from 'lucide-react';

export default function SchedulesPage() {
  const { data: schedules } = useSchedules();
  const create = useCreateSchedule();
  const del = useDeleteSchedule();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 */6 * * *');
  const [agentType, setAgentType] = useState('KNOWLEDGE');

  const handleCreate = () => {
    if (!name.trim() || !cron.trim()) return;
    create.mutate(
      { name, cron, agentId: agentType },
      {
        onSuccess: () => {
          setShowCreate(false);
          setName('');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Schedules</h1>
          <p className="text-sm text-zinc-400">Schedule recurring agent executions</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
        >
          <Plus size={14} /> New Schedule
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 font-semibold text-zinc-100">Create Schedule</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Schedule name"
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
          <input
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            placeholder="Cron expression (e.g. 0 */6 * * *)"
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Agent:</span>
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
            >
              <option value="KNOWLEDGE">Knowledge Agent</option>
              <option value="RESEARCH">Research Agent</option>
              <option value="DOCUMENTATION">Documentation Agent</option>
              <option value="WRITING">Writing Assistant</option>
              <option value="CODE">Code Explanation Agent</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={create.isPending || !name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {create.isPending ? <Loader2 size={12} className="animate-spin" /> : null} Create
          </button>
        </div>
      )}

      <div className="space-y-3">
        {schedules?.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">No schedules configured.</p>
        )}
        {schedules?.map((s) => (
          <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-purple-400" />
                <div>
                  <h3 className="font-semibold text-zinc-100">{s.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{s.cron}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${s.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {s.isActive ? 'Active' : 'Paused'}
                </span>
                <button
                  onClick={() => del.mutate(s.id)}
                  className="rounded p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-[10px] text-zinc-600">
              <span>Agent: {s.agentId || '—'}</span>
              <span>
                Last run: {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}
              </span>
              {s.nextRunAt && <span>Next: {new Date(s.nextRunAt).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
