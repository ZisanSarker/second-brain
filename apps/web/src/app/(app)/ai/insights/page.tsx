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
        <div className="rounded-xl border border-border bg-popover/50 p-5">
          <h3 className="mb-3 font-semibold text-foreground">Cross-Document Insights</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Analyze multiple documents together to find themes, contradictions, and synthesis.
          </p>
          <textarea
            value={documentIds}
            onChange={(e) => setDocumentIds(e.target.value)}
            placeholder="Enter document IDs, one per line..."
            rows={4}
            className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
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
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {crossDoc.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {crossDoc.isPending ? 'Analyzing...' : 'Analyze Documents'}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-popover/50 p-5">
          <h3 className="mb-3 font-semibold text-foreground">Workspace Trends</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Analyze your recent documents to identify patterns, topics, and knowledge gaps.
          </p>
          <button
            onClick={() => trends.mutate(undefined, { onSuccess: (res: any) => setResult(res) })}
            disabled={trends.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover disabled:opacity-50"
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
