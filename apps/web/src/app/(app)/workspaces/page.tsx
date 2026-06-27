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
        <p className="text-muted-foreground">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspaces</h1>
          <p className="text-muted-foreground mt-1">Select a workspace to continue</p>
        </div>
        <Link
          href="/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-foreground text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 inline-flex mb-4">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No workspaces yet</h2>
          <p className="text-muted-foreground mb-6">Create your first workspace to get started.</p>
          <Link
            href="/workspaces/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-foreground text-sm font-medium transition-all"
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
              className={`glass-panel rounded-xl p-5 border cursor-pointer transition-all hover:border-primary/30 ${
                currentWorkspace?.id === ws.id ? 'border-primary/40 bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center">
                    <Library className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{ws.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {ws.memberCount ?? 0} members · {ws.documentCount ?? 0} documents
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentWorkspace?.id === ws.id && (
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
                      Active
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, ws.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
