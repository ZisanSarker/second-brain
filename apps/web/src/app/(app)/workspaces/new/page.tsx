'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { workspacesApi } from '@/lib/api/workspaces';
import { Brain, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewWorkspacePage() {
  const router = useRouter();
  const { setCurrentWorkspace, fetchWorkspaces } = useAuthStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ws = await workspacesApi.create({ name, slug: slug || undefined });
      setCurrentWorkspace(ws as any);
      await fetchWorkspaces();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Workspace</h1>
          <p className="text-slate-400 mt-2">A workspace is your knowledge hub</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Workspace Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="My Knowledge Base"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-300 mb-2">
              URL Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  setAutoSlug(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="my-knowledge-base"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Used in URLs. Must be unique across all workspaces.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>

          <p className="text-center">
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to workspaces
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
