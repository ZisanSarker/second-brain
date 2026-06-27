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
      <header className="h-16 border-b border-border px-6 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <Globe className="h-5 w-5 text-info" />
        <h1 className="text-sm font-semibold text-foreground">Import Website</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto mt-12">
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl border border-border p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Website URL
              </label>
              <input
                suppressHydrationWarning
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                required
                className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-info/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Collection (optional)
              </label>
              <input
                suppressHydrationWarning
                type="text"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                placeholder="Collection ID"
                className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-info/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={websiteImport.isPending || !url.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary text-sm font-semibold text-foreground hover:from-primary-hover hover:to-primary-hover transition-all disabled:opacity-50"
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
