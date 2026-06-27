'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { useWebsiteImport } from '@/lib/hooks/useImports';

export default function WebsiteImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const websiteImport = useWebsiteImport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await websiteImport.mutateAsync({ url: url.trim(), collectionId: collectionId || undefined });
    router.push('/documents');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center gap-3 bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-800/50">
          <ArrowLeft className="h-4 w-4 text-slate-400" />
        </button>
        <Globe className="h-5 w-5 text-blue-400" />
        <h1 className="text-sm font-semibold text-slate-200">Import Website</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto mt-12">
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl border border-slate-800/60 p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-blue-500/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Collection (optional)
              </label>
              <input
                type="text"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                placeholder="Collection ID"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-blue-500/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={websiteImport.isPending || !url.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {websiteImport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {websiteImport.isPending ? 'Importing...' : 'Import Website'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
