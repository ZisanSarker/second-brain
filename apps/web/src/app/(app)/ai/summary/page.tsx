'use client';

import { AiPageLayout } from '@/components/ai/AiLayout';
import { GenerateForm } from '@/components/ai/GenerateForm';
import { ContentList } from '@/components/ai/ContentCard';
import { useSummaries, useGenerateSummary } from '@/lib/hooks/useAi';
import { useState } from 'react';

export default function SummaryPage() {
  const [params, setParams] = useState<{ documentId?: string; collectionId?: string }>({});
  const { data: items, refetch } = useSummaries(params.documentId, params.collectionId);
  const generate = useGenerateSummary();

  return (
    <AiPageLayout
      title="Summary"
      description="Generate concise document summaries in multiple styles"
    >
      <div className="space-y-6">
        <GenerateForm
          onGenerate={(data) => {
            generate.mutate(data, { onSuccess: () => refetch() });
            setParams({ documentId: data.documentId, collectionId: data.collectionId });
          }}
          isLoading={generate.isPending}
          showCustomPrompt
        />
        <ContentList items={items} onDeleted={() => refetch()} />
      </div>
    </AiPageLayout>
  );
}
