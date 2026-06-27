'use client';

import { AiPageLayout } from '@/components/ai/AiLayout';
import { GenerateForm } from '@/components/ai/GenerateForm';
import { ContentList } from '@/components/ai/ContentCard';
import { useFlashcards, useGenerateFlashcards } from '@/lib/hooks/useAi';
import { useState } from 'react';

export default function FlashcardsPage() {
  const [params, setParams] = useState<{ documentId?: string; collectionId?: string }>({});
  const { data: items, refetch } = useFlashcards(params.documentId, params.collectionId);
  const generate = useGenerateFlashcards();

  return (
    <AiPageLayout title="Flashcards" description="Create study flashcards from your documents">
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
