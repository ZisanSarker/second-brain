'use client';

import { useState } from 'react';
import { AiPageLayout } from '@/components/ai/AiLayout';
import { ContentList } from '@/components/ai/ContentCard';
import { useGenerateCrossDocumentInsights, useGenerateWorkspaceTrends } from '@/lib/hooks/useAi';
import { Loader2, Sparkles } from 'lucide-react';

export default function InsightsPage() {
  const [documentIds, setDocumentIds] = useState('');
  const crossDoc = useGenerateCrossDocumentInsights();
  const trends = useGenerateWorkspaceTrends();
  const [result, setResult] = useState<any>(null);

  return (
    <AiPageLayout title="Insights" description="Cross-document analysis and workspace intelligence">
      <div className="space-y-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 font-semibold text-zinc-100">Cross-Document Insights</h3>
          <p className="mb-3 text-sm text-zinc-500">
            Analyze multiple documents together to find themes, contradictions, and synthesis.
          </p>
          <textarea
            value={documentIds}
            onChange={(e) => setDocumentIds(e.target.value)}
            placeholder="Enter document IDs, one per line..."
            rows={4}
            className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => {
              const ids = documentIds
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
              if (ids.length >= 2) {
                crossDoc.mutate(ids, { onSuccess: (res: any) => setResult(res) });
              }
            }}
            disabled={crossDoc.isPending || documentIds.split('\n').filter(Boolean).length < 2}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {crossDoc.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {crossDoc.isPending ? 'Analyzing...' : 'Analyze Documents'}
          </button>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 font-semibold text-zinc-100">Workspace Trends</h3>
          <p className="mb-3 text-sm text-zinc-500">
            Analyze your recent documents to identify patterns, topics, and knowledge gaps.
          </p>
          <button
            onClick={() => trends.mutate(undefined, { onSuccess: (res: any) => setResult(res) })}
            disabled={trends.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {trends.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {trends.isPending ? 'Analyzing...' : 'Analyze Workspace Trends'}
          </button>
        </div>

        {result && <ContentList items={[result]} onDeleted={() => setResult(null)} />}
      </div>
    </AiPageLayout>
  );
}
