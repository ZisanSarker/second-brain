'use client';

import { AiPageLayout } from '@/components/ai/AiLayout';
import { GenerateForm } from '@/components/ai/GenerateForm';
import { ContentList } from '@/components/ai/ContentCard';
import { useQuizzes, useGenerateQuiz } from '@/lib/hooks/useAi';
import { useState } from 'react';

export default function QuizPage() {
  const [params, setParams] = useState<{ documentId?: string; collectionId?: string }>({});
  const { data: items, refetch } = useQuizzes(params.documentId, params.collectionId);
  const generate = useGenerateQuiz();

  return (
    <AiPageLayout
      title="Quiz"
      description="Generate multiple choice quizzes to test your knowledge"
    >
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
