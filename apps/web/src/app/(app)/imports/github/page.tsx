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
      <header className="h-16 border-b border-border px-6 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <GitBranch className="h-5 w-5 text-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Import GitHub Repository</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto mt-12">
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl border border-border p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Repository <span className="text-destructive-foreground">*</span>
              </label>
              <input
                suppressHydrationWarning
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="owner/repo"
                required
                className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Branch
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Collection ID
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Access Token (optional, for private repos)
              </label>
              <input
                suppressHydrationWarning
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={gitHubImport.isPending || !repository.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary text-sm font-semibold text-foreground hover:from-primary-hover hover:to-primary-hover transition-all disabled:opacity-50"
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
