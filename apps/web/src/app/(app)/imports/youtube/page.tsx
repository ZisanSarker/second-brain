'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ArrowLeft, Loader2 } from 'lucide-react';
import { useYouTubeImport } from '@/lib/hooks/useImports';

export default function YouTubeImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const youTubeImport = useYouTubeImport();

  const extractVideoId = (input: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const match = input.match(p);
      if (match) return match[1];
    }
    return input;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url.trim());
    if (!videoId) return;
    await youTubeImport.mutateAsync({ videoId, collectionId: collectionId || undefined });
    router.push('/documents');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-border px-6 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <Video className="h-5 w-5 text-destructive-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Import YouTube Video</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto mt-12">
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl border border-border p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                YouTube URL or Video ID
              </label>
              <input
                suppressHydrationWarning
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or video_id"
                required
                className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-destructive/30 transition-colors"
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
                className="w-full px-3 py-2 rounded-xl bg-popover/50 border border-border text-sm text-foreground focus:outline-none focus:border-destructive/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={youTubeImport.isPending || !url.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-destructive to-destructive text-sm font-semibold text-foreground hover:from-destructive hover:to-destructive transition-all disabled:opacity-50"
            >
              {youTubeImport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {youTubeImport.isPending ? 'Importing...' : 'Import YouTube Video'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
