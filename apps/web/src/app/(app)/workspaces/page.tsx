'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { workspacesApi } from '@/lib/api/workspaces';
import { Plus, Library, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Workspace } from '@second-brain/types';

export default function WorkspacesPage() {
  const router = useRouter();
  const { setCurrentWorkspace, currentWorkspace } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspacesApi
      .list()
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    router.push('/dashboard');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this workspace? This cannot be undone.')) return;
    await workspacesApi.delete(id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 mt-1">Select a workspace to continue</p>
        </div>
        <Link
          href="/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 inline-flex mb-4">
            <Library className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No workspaces yet</h2>
          <p className="text-slate-400 mb-6">Create your first workspace to get started.</p>
          <Link
            href="/workspaces/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => handleSelect(ws)}
              className={`glass-panel rounded-xl p-5 border cursor-pointer transition-all hover:border-purple-500/30 ${
                currentWorkspace?.id === ws.id
                  ? 'border-purple-500/40 bg-purple-500/5'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Library className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{ws.name}</h3>
                    <p className="text-xs text-slate-500">
                      {ws.memberCount ?? 0} members · {ws.documentCount ?? 0} documents
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentWorkspace?.id === ws.id && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-medium">
                      Active
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, ws.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
