'use client';

import { AiPageLayout } from '@/components/ai/AiLayout';
import { GenerateForm } from '@/components/ai/GenerateForm';
import { ContentList } from '@/components/ai/ContentCard';
import { useNotesList, useGenerateNotes } from '@/lib/hooks/useAi';
import { useState } from 'react';

export default function NotesPage() {
  const [params, setParams] = useState<{ documentId?: string; collectionId?: string }>({});
  const { data: items, refetch } = useNotesList(params.documentId, params.collectionId);
  const generate = useGenerateNotes();

  return (
    <AiPageLayout title="AI Notes" description="Transform content into well-structured study notes">
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
