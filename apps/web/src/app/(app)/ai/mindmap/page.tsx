'use client';

import { AiPageLayout } from '@/components/ai/AiLayout';
import { GenerateForm } from '@/components/ai/GenerateForm';
import { ContentList } from '@/components/ai/ContentCard';
import { useMindMaps, useGenerateMindMap } from '@/lib/hooks/useAi';
import { useState } from 'react';

export default function MindMapPage() {
  const [params, setParams] = useState<{ documentId?: string; collectionId?: string }>({});
  const { data: items, refetch } = useMindMaps(params.documentId, params.collectionId);
  const generate = useGenerateMindMap();

  return (
    <AiPageLayout title="Mind Map" description="Visualize content hierarchy and relationships">
      <div className="space-y-6">
        <GenerateForm
          onGenerate={(data) => {
            generate.mutate(data, { onSuccess: () => refetch() });
            setParams({ documentId: data.documentId, collectionId: data.collectionId });
          }}
          isLoading={generate.isPending}
        />
        <ContentList items={items} onDeleted={() => refetch()} />
      </div>
    </AiPageLayout>
  );
}
