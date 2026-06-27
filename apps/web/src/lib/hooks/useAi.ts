import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai';

// Summary
export function useSummaries(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'summaries', documentId, collectionId],
    queryFn: () => aiApi.listSummaries(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      documentId?: string;
      collectionId?: string;
      customPrompt?: string;
      language?: string;
    }) => aiApi.generateSummary(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'summaries'] });
    },
  });
}

// Flashcards
export function useFlashcards(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'flashcards', documentId, collectionId],
    queryFn: () => aiApi.listFlashcards(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateFlashcards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateFlashcards(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'flashcards'] });
    },
  });
}

// Quiz
export function useQuizzes(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'quizzes', documentId, collectionId],
    queryFn: () => aiApi.listQuizzes(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) => aiApi.generateQuiz(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'quizzes'] });
    },
  });
}

// Notes
export function useNotesList(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'notes', documentId, collectionId],
    queryFn: () => aiApi.listNotes(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) => aiApi.generateNotes(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'notes'] });
    },
  });
}

// Mind Map
export function useMindMaps(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'mindmaps', documentId, collectionId],
    queryFn: () => aiApi.listMindMaps(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateMindMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateMindMap(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'mindmaps'] });
    },
  });
}

// Comparison
export function useComparisons(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'comparisons', documentId, collectionId],
    queryFn: () => aiApi.listComparisons(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateComparison() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateComparison(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'comparisons'] });
    },
  });
}

// Translation
export function useTranslations(documentId?: string, collectionId?: string) {
  return useQuery({
    queryKey: ['ai', 'translations', documentId, collectionId],
    queryFn: () => aiApi.listTranslations(documentId, collectionId),
    enabled: !!(documentId || collectionId),
  });
}

export function useGenerateTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string; language?: string }) =>
      aiApi.generateTranslation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'translations'] });
    },
  });
}

// Learning tools
export function useGenerateTakeaways() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateTakeaways(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useGenerateGlossary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateGlossary(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useGenerateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) => aiApi.generateFAQ(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useGenerateStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateStudyPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useGenerateInterviewQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateInterviewQuestions(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useGenerateTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: string; collectionId?: string }) =>
      aiApi.generateTimeline(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

// Insights
export function useGenerateCrossDocumentInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentIds: string[]) => aiApi.generateCrossDocumentInsights(documentIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useGenerateWorkspaceTrends() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiApi.generateWorkspaceTrends(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

// Batch
export function useBatchGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, types }: { documentId: string; types: string[] }) =>
      aiApi.batchGenerate(documentId, types),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useBatchGenerateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, types }: { collectionId: string; types: string[] }) =>
      aiApi.batchGenerateCollection(collectionId, types),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

// Tasks
export function useTasks(status?: string) {
  return useQuery({
    queryKey: ['ai', 'tasks', status],
    queryFn: () => aiApi.listTasks(status),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['ai', 'tasks', id],
    queryFn: () => aiApi.getTask(id),
    enabled: !!id,
  });
}

export function useRetryTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.retryTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'tasks'] });
    },
  });
}

export function useCancelTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.cancelTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'tasks'] });
    },
  });
}

// Templates
export function useTemplates(type?: string) {
  return useQuery({
    queryKey: ['ai', 'templates', type],
    queryFn: () => aiApi.listTemplates(type),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['ai', 'templates', id],
    queryFn: () => aiApi.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; systemPrompt: string; userPrompt?: string }) =>
      aiApi.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => aiApi.updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'templates'] });
    },
  });
}

// Generated content
export function useContent(id: string) {
  return useQuery({
    queryKey: ['ai', 'content', id],
    queryFn: () => aiApi.getContent(id),
    enabled: !!id,
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteContent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}
