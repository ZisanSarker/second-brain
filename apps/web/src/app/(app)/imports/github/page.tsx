'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, ArrowLeft, Loader2 } from 'lucide-react';
import { useGitHubImport } from '@/lib/hooks/useImports';

export default function GitHubImportPage() {
  const router = useRouter();
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [accessToken, setAccessToken] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const gitHubImport = useGitHubImport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repository.trim()) return;
    await gitHubImport.mutateAsync({
      repository: repository.trim(),
      branch: branch || 'main',
      accessToken: accessToken || undefined,
      collectionId: collectionId || undefined,
    });
    router.push('/documents');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center gap-3 bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-800/50">
          <ArrowLeft className="h-4 w-4 text-slate-400" />
        </button>
        <GitBranch className="h-5 w-5 text-slate-300" />
        <h1 className="text-sm font-semibold text-slate-200">Import GitHub Repository</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto mt-12">
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl border border-slate-800/60 p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Repository <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="owner/repo"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Collection ID
                </label>
                <input
                  type="text"
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Access Token (optional, for private repos)
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={gitHubImport.isPending || !repository.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-sm font-semibold text-white hover:from-slate-500 hover:to-slate-600 transition-all disabled:opacity-50"
            >
              {gitHubImport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {gitHubImport.isPending ? 'Importing...' : 'Import Repository'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
